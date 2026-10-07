use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde_json::{json, Value};
use std::{fs, path::PathBuf};
use uuid::Uuid;

const SCHEMA_VERSION: i32 = 8;

const MIGRATION_8: &str = r#"
CREATE TABLE IF NOT EXISTS tasks (
 id TEXT PRIMARY KEY NOT NULL,
 title TEXT NOT NULL,
 description TEXT,
 assigned_to TEXT,
 due_date INTEGER,
 priority TEXT NOT NULL DEFAULT 'medium',
 status TEXT NOT NULL DEFAULT 'pending',
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
"#;

const MIGRATION_1: &str = r#"
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, image_url TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY NOT NULL, category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, name TEXT NOT NULL,
 sku TEXT, barcode TEXT, description TEXT, purchase_price REAL NOT NULL DEFAULT 0, retail_price REAL NOT NULL DEFAULT 0,
 wholesale_price REAL NOT NULL DEFAULT 0, stock_quantity INTEGER NOT NULL DEFAULT 0, min_stock_level INTEGER NOT NULL DEFAULT 5,
 storage_location TEXT, image_url TEXT, is_featured INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'available',
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT, address TEXT, balance REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT, address TEXT, balance REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY NOT NULL, invoice_no TEXT NOT NULL UNIQUE, customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL, total_amount REAL NOT NULL, paid_amount REAL NOT NULL DEFAULT 0, payment_method TEXT, created_by TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sale_items (id TEXT PRIMARY KEY NOT NULL, sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL, unit_price REAL NOT NULL, total_price REAL NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, username TEXT NOT NULL UNIQUE COLLATE NOCASE, display_name TEXT NOT NULL, pin_hash TEXT NOT NULL, role TEXT NOT NULL, permissions TEXT NOT NULL DEFAULT '[]', active INTEGER NOT NULL DEFAULT 1, last_login INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, user_name TEXT, action TEXT NOT NULL, module TEXT, details TEXT, timestamp INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY NOT NULL, business_name TEXT, logo TEXT, phone TEXT, address TEXT);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
"#;

const MIGRATION_2: &str = r#"
CREATE TABLE IF NOT EXISTS purchases (
 id TEXT PRIMARY KEY NOT NULL,
 purchase_no TEXT NOT NULL UNIQUE,
 supplier_id TEXT NOT NULL REFERENCES suppliers(id),
 total_amount REAL NOT NULL,
 paid_amount REAL NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);
"#;

const MIGRATION_3: &str = r#"
ALTER TABLE app_settings ADD COLUMN business_type TEXT;
ALTER TABLE app_settings ADD COLUMN invoice_header_image TEXT;
"#;

const MIGRATION_4: &str = r#"
ALTER TABLE products ADD COLUMN agent_price REAL NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN unit TEXT;
ALTER TABLE sales ADD COLUMN price_type TEXT NOT NULL DEFAULT 'retail';
ALTER TABLE sales ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE sales ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN price_type TEXT NOT NULL DEFAULT 'retail';
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
"#;

const MIGRATION_6: &str = r#"
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE categories ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS warehouses (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL UNIQUE COLLATE NOCASE,
 description TEXT,
 active INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS warehouse_stock (
 warehouse_id TEXT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
 updated_at INTEGER NOT NULL,
 PRIMARY KEY (warehouse_id, product_id)
);
CREATE TABLE IF NOT EXISTS stock_movements (
 id TEXT PRIMARY KEY NOT NULL,
 product_id TEXT NOT NULL REFERENCES products(id),
 warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
 movement_type TEXT NOT NULL,
 quantity INTEGER NOT NULL,
 before_quantity INTEGER NOT NULL,
 after_quantity INTEGER NOT NULL,
 reference_type TEXT,
 reference_id TEXT,
 user_id TEXT,
 user_name TEXT,
 notes TEXT,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_counts (
 id TEXT PRIMARY KEY NOT NULL,
 warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
 status TEXT NOT NULL DEFAULT 'draft',
 user_id TEXT,
 user_name TEXT,
 notes TEXT,
 created_at INTEGER NOT NULL,
 approved_at INTEGER
);
CREATE TABLE IF NOT EXISTS stock_count_items (
 id TEXT PRIMARY KEY NOT NULL,
 count_id TEXT NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES products(id),
 system_quantity INTEGER NOT NULL,
 actual_quantity INTEGER NOT NULL,
 difference INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_product ON warehouse_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_time ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_time ON stock_movements(warehouse_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_counts_warehouse ON stock_counts(warehouse_id, created_at);
INSERT OR IGNORE INTO warehouses (id, name, description, active, created_at, updated_at) VALUES ('default-warehouse', 'المستودع الرئيسي', 'المخزون المرحّل من النظام السابق', 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000);
INSERT OR IGNORE INTO warehouse_stock (warehouse_id, product_id, quantity, updated_at) SELECT 'default-warehouse', id, stock_quantity, strftime('%s','now') * 1000 FROM products;
"#;

const MIGRATION_7: &str = r#"
ALTER TABLE purchases ADD COLUMN warehouse_id TEXT REFERENCES warehouses(id);
ALTER TABLE purchases ADD COLUMN discount_amount REAL NOT NULL DEFAULT 0;
ALTER TABLE purchases ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE purchases ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE purchases ADD COLUMN created_by TEXT;
ALTER TABLE purchases ADD COLUMN notes TEXT;
CREATE TABLE IF NOT EXISTS purchase_items (
 id TEXT PRIMARY KEY NOT NULL,
 purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES products(id),
 quantity INTEGER NOT NULL CHECK(quantity > 0),
 unit_cost REAL NOT NULL CHECK(unit_cost >= 0),
 total_cost REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_time ON purchases(supplier_id, created_at DESC);
"#;

pub struct Database {
    path: PathBuf,
}

impl Database {
    pub fn open(path: PathBuf) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| format!("Cannot create database directory: {error}"))?;
        }
        let database = Self { path };
        let connection = database.connection()?;
        migrate(&connection)?;
        Ok(database)
    }

    fn connection(&self) -> Result<Connection, String> {
        let connection = Connection::open(&self.path).map_err(|error| format!("Cannot open SQLite database: {error}"))?;
        connection.execute_batch("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;").map_err(db_error)?;
        Ok(connection)
    }

    pub fn login_user(&self, username: &str, pin: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        let user = connection.query_row(
            "SELECT id, username, display_name, pin_hash, role, permissions, active FROM users WHERE username = ?1",
            [username.trim()],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, String>(5)?, row.get::<_, bool>(6)?)),
        ).optional().map_err(db_error)?.ok_or_else(|| "اسم المستخدم أو رمز PIN غير صحيح".to_string())?;
        if !user.6 || !verify_pin(pin, &user.3) {
            return Err("اسم المستخدم أو رمز PIN غير صحيح".to_string());
        }
        let permissions: Value = serde_json::from_str(&user.5).unwrap_or_else(|_| json!([]));
        connection.execute("UPDATE users SET last_login = ?1 WHERE id = ?2", params![now(), user.0]).map_err(db_error)?;
        Ok(json!({"id": user.0, "username": user.1, "displayName": user.2, "role": user.4, "permissions": permissions}))
    }

    pub fn users(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, username, display_name, role, permissions, active, last_login, created_at FROM users ORDER BY created_at").map_err(db_error)?;
        let rows = statement.query_map([], user_value).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_user(&self, user: &Value) -> Result<Value, String> {
        let username = required_string(user, &["username"])?;
        let display_name = required_string(user, &["displayName", "display_name"])?;
        let pin = required_string(user, &["pin"])?;
        let role = optional_string(user, &["role"]).unwrap_or_else(|| "staff".to_string());
        let permissions = serde_json::to_string(user.get("permissions").unwrap_or(&json!([]))).map_err(|error| format!("Invalid permissions: {error}"))?;
        let id = Uuid::new_v4().to_string();
        let connection = self.connection()?;
        connection.execute("INSERT INTO users (id, username, display_name, pin_hash, role, permissions, active, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7)", params![id, username, display_name, hash_pin(&pin)?, role, permissions, now()]).map_err(unique_or_db_error)?;
        self.user_by_id(&id)
    }

    pub fn create_first_admin(&self, username: &str, display_name: &str, pin: &str) -> Result<Value, String> {
        if username.trim().is_empty() || display_name.trim().is_empty() || pin.len() < 4 {
            return Err("بيانات المدير الأول غير صالحة".to_string());
        }
        let connection = self.connection()?;
        let count: i64 = connection.query_row("SELECT COUNT(*) FROM users WHERE role IN ('owner', 'manager', 'admin') AND active = 1", [], |row| row.get(0)).map_err(db_error)?;
        if count > 0 {
            return Err("تم إنشاء مستخدم من قبل، لا يمكن إنشاء مدير أول جديد".to_string());
        }
        let id = Uuid::new_v4().to_string();
        connection.execute("INSERT INTO users (id, username, display_name, pin_hash, role, permissions, active, created_at) VALUES (?1, ?2, ?3, ?4, 'owner', '[\"*\"]', 1, ?5)", params![id, username.trim(), display_name.trim(), hash_pin(pin)?, now()]).map_err(unique_or_db_error)?;
        self.user_by_id(&id)
    }

    pub fn delete_user(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        if connection.execute("DELETE FROM users WHERE id = ?1", [id]).map_err(db_error)? == 0 {
            return Err("المستخدم المطلوب غير موجود".to_string());
        }
        Ok(json!({"success": true, "id": id}))
    }

    pub fn setup_status(&self) -> Result<Value, String> {
        let connection = self.connection()?;
        let count: i64 = connection.query_row("SELECT COUNT(*) FROM users WHERE role IN ('owner', 'manager', 'admin') AND active = 1", [], |row| row.get(0)).map_err(db_error)?;
        Ok(json!({"needsSetup": count == 0, "userCount": count}))
    }

    pub fn app_settings(&self) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row(
            "SELECT id, business_name, phone, address, business_type, logo, invoice_header_image FROM app_settings WHERE id = 'default'",
            [],
            |row| Ok(json!({
                "id": row.get::<_, String>(0)?,
                "businessName": row.get::<_, Option<String>>(1)?,
                "phone": row.get::<_, Option<String>>(2)?,
                "address": row.get::<_, Option<String>>(3)?,
                "businessType": row.get::<_, Option<String>>(4)?,
                "logo": row.get::<_, Option<String>>(5)?,
                "invoiceHeaderImage": row.get::<_, Option<String>>(6)?
            })),
        ).optional().map_err(db_error)?.ok_or_else(|| "لم يتم العثور على إعدادات النشاط".to_string())
    }

    pub fn save_app_settings(&self, settings: &Value) -> Result<Value, String> {
        let business_name = required_string(settings, &["businessName", "business_name"])?;
        let phone = required_string(settings, &["phone"])?;
        let address = required_string(settings, &["address"])?;
        let business_type = required_string(settings, &["businessType", "business_type"])?;
        let logo = required_string(settings, &["logo"])?;
        let invoice_header_image = required_string(settings, &["invoiceHeaderImage", "invoice_header_image"])?;
        let connection = self.connection()?;
        connection.execute(
            "INSERT INTO app_settings (id, business_name, phone, address, business_type, logo, invoice_header_image) VALUES ('default', ?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(id) DO UPDATE SET business_name = excluded.business_name, phone = excluded.phone, address = excluded.address, business_type = excluded.business_type, logo = excluded.logo, invoice_header_image = excluded.invoice_header_image",
            params![business_name, phone, address, business_type, logo, invoice_header_image],
        ).map_err(db_error)?;
        self.app_settings()
    }

    pub fn products(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, category_id, name, sku, barcode, description, purchase_price, retail_price, wholesale_price, agent_price, unit, brand, stock_quantity, min_stock_level, storage_location, image_url, is_featured, status, active, created_at, updated_at FROM products ORDER BY created_at DESC").map_err(db_error)?;
        let rows = statement.query_map([], product_value).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_product(&self, product: &Value) -> Result<Value, String> {
        let id = Uuid::new_v4().to_string();
        let name = required_string(product, &["name"])?;
        let barcode = optional_string(product, &["barcode"]);
        let timestamp = now();
        let connection = self.connection()?;
        ensure_barcode_available(&connection, barcode.as_deref(), None)?;
        connection.execute("INSERT INTO products (id, category_id, name, sku, barcode, description, purchase_price, retail_price, wholesale_price, agent_price, unit, brand, stock_quantity, min_stock_level, storage_location, image_url, is_featured, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?19)", params![id, optional_string(product, &["categoryId", "category_id"]), name, optional_string(product, &["sku"]), barcode, optional_string(product, &["description"]), number(product, &["purchasePrice", "purchase_price"], 0.0), number(product, &["retailPrice", "retail_price"], 0.0), number(product, &["wholesalePrice", "wholesale_price"], 0.0), number(product, &["agentPrice", "agent_price"], 0.0), optional_string(product, &["unit"]), optional_string(product, &["brand"]), integer(product, &["stockQuantity", "stock_quantity"], 0), integer(product, &["minStockLevel", "min_stock_level"], 5), optional_string(product, &["storageLocation", "storage_location"]), optional_string(product, &["imageUrl", "image_url"]), bool_value(product, &["isFeatured", "is_featured"]), optional_string(product, &["status"]).unwrap_or_else(|| "available".to_string()), timestamp]).map_err(unique_or_db_error)?;
        let init_stock = integer(product, &["stockQuantity", "stock_quantity"], 0);
        connection.execute("INSERT OR IGNORE INTO warehouse_stock (warehouse_id, product_id, quantity, updated_at) VALUES ('default-warehouse', ?1, ?2, ?3)", params![id, init_stock, timestamp]).ok();
        self.product_by_id(&id)
    }

    pub fn update_product(&self, id: &str, product: &Value) -> Result<Value, String> {
        let connection = self.connection()?;
        ensure_barcode_available(&connection, optional_string(product, &["barcode"]).as_deref(), Some(id))?;
        let changed = connection.execute("UPDATE products SET category_id = COALESCE(?1, category_id), name = COALESCE(?2, name), sku = COALESCE(?3, sku), barcode = COALESCE(?4, barcode), description = COALESCE(?5, description), purchase_price = COALESCE(?6, purchase_price), retail_price = COALESCE(?7, retail_price), wholesale_price = COALESCE(?8, wholesale_price), agent_price = COALESCE(?9, agent_price), unit = COALESCE(?10, unit), brand = COALESCE(?11, brand), stock_quantity = COALESCE(?12, stock_quantity), min_stock_level = COALESCE(?13, min_stock_level), storage_location = COALESCE(?14, storage_location), image_url = COALESCE(?15, image_url), is_featured = COALESCE(?16, is_featured), status = COALESCE(?17, status), active = COALESCE(?18, active), updated_at = ?19 WHERE id = ?20", params![optional_string(product, &["categoryId", "category_id"]), optional_string(product, &["name"]), optional_string(product, &["sku"]), optional_string(product, &["barcode"]), optional_string(product, &["description"]), optional_number(product, &["purchasePrice", "purchase_price"]), optional_number(product, &["retailPrice", "retail_price"]), optional_number(product, &["wholesalePrice", "wholesale_price"]), optional_number(product, &["agentPrice", "agent_price"]), optional_string(product, &["unit"]), optional_string(product, &["brand"]), optional_integer(product, &["stockQuantity", "stock_quantity"]), optional_integer(product, &["minStockLevel", "min_stock_level"]), optional_string(product, &["storageLocation", "storage_location"]), optional_string(product, &["imageUrl", "image_url"]), optional_bool(product, &["isFeatured", "is_featured"]), optional_string(product, &["status"]), optional_bool(product, &["active"]), now(), id]).map_err(unique_or_db_error)?;
        if changed == 0 { return Err("المادة المطلوبة غير موجودة".to_string()); }
        self.product_by_id(id)
    }

    pub fn delete_product(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        if connection.execute("DELETE FROM products WHERE id = ?1", [id]).map_err(db_error)? == 0 { return Err("المادة المطلوبة غير موجودة".to_string()); }
        Ok(json!({"success": true, "id": id}))
    }

    pub fn categories(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT c.id, c.name, c.image_url, c.active, c.created_at, COUNT(p.id) FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.created_at DESC").map_err(db_error)?;
        let rows = statement.query_map([], category_value).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn customers(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, name, phone, address, balance FROM customers ORDER BY name").map_err(db_error)?;
        let rows = statement.query_map([], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "phone": row.get::<_, Option<String>>(2)?, "address": row.get::<_, Option<String>>(3)?, "balance": row.get::<_, f64>(4)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_customer(&self, customer: &Value, _user: &Value) -> Result<Value, String> {
        let name = required_string(customer, &["name"])?;
        let id = Uuid::new_v4().to_string();
        let connection = self.connection()?;
        connection.execute("INSERT INTO customers (id, name, phone, address, balance, created_at) VALUES (?1, ?2, ?3, ?4, 0, ?5)", params![id, name, optional_string(customer, &["phone"]), optional_string(customer, &["address"]), now()]).map_err(unique_or_db_error)?;
        self.customer_by_id(&id)
    }

    pub fn update_customer(&self, id: &str, customer: &Value, _user: &Value) -> Result<Value, String> {
        let connection = self.connection()?;
        let changed = connection.execute("UPDATE customers SET name = COALESCE(?1, name), phone = COALESCE(?2, phone), address = COALESCE(?3, address) WHERE id = ?4", params![optional_string(customer, &["name"]), optional_string(customer, &["phone"]), optional_string(customer, &["address"]), id]).map_err(unique_or_db_error)?;
        if changed == 0 { return Err("الزبون غير موجود".to_string()); }
        self.customer_by_id(id)
    }

    pub fn customer_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row("SELECT id, name, phone, address, balance FROM customers WHERE id = ?1", [id], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "phone": row.get::<_, Option<String>>(2)?, "address": row.get::<_, Option<String>>(3)?, "balance": row.get::<_, f64>(4)?}))).map_err(db_error)
    }

    pub fn suppliers(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, name, phone, address, balance, created_at FROM suppliers ORDER BY name").map_err(db_error)?;
        let rows = statement.query_map([], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "phone": row.get::<_, Option<String>>(2)?, "address": row.get::<_, Option<String>>(3)?, "balance": row.get::<_, f64>(4)?, "createdAt": row.get::<_, i64>(5)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_supplier(&self, supplier: &Value, user: &Value) -> Result<Value, String> {
        require_permission(user, "purchases.create")?;
        let name = required_string(supplier, &["name"])?;
        let id = Uuid::new_v4().to_string();
        let connection = self.connection()?;
        connection.execute("INSERT INTO suppliers (id, name, phone, address, balance, created_at) VALUES (?1, ?2, ?3, ?4, 0, ?5)", params![id, name, optional_string(supplier, &["phone"]), optional_string(supplier, &["address"]), now()]).map_err(unique_or_db_error)?;
        self.supplier_by_id(&id)
    }

    pub fn update_supplier(&self, id: &str, supplier: &Value, user: &Value) -> Result<Value, String> {
        require_permission(user, "purchases.edit")?;
        let connection = self.connection()?;
        let changed = connection.execute("UPDATE suppliers SET name = COALESCE(?1, name), phone = COALESCE(?2, phone), address = COALESCE(?3, address) WHERE id = ?4", params![optional_string(supplier, &["name"]), optional_string(supplier, &["phone"]), optional_string(supplier, &["address"]), id]).map_err(unique_or_db_error)?;
        if changed == 0 { return Err("المورد غير موجود".to_string()); }
        self.supplier_by_id(id)
    }

    pub fn purchases(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT p.id, p.purchase_no, p.supplier_id, s.name, p.warehouse_id, COALESCE(w.name, ''), p.total_amount, p.paid_amount, p.payment_method, p.payment_status, p.discount_amount, p.created_at FROM purchases p JOIN suppliers s ON s.id = p.supplier_id LEFT JOIN warehouses w ON w.id = p.warehouse_id ORDER BY p.created_at DESC").map_err(db_error)?;
        let rows = statement.query_map([], |row| Ok(json!({"id": row.get::<_, String>(0)?, "purchaseNo": row.get::<_, String>(1)?, "supplierId": row.get::<_, String>(2)?, "supplierName": row.get::<_, String>(3)?, "warehouseId": row.get::<_, Option<String>>(4)?, "warehouseName": row.get::<_, String>(5)?, "totalAmount": row.get::<_, f64>(6)?, "paidAmount": row.get::<_, f64>(7)?, "paymentMethod": row.get::<_, String>(8)?, "paymentStatus": row.get::<_, String>(9)?, "discountAmount": row.get::<_, f64>(10)?, "createdAt": row.get::<_, i64>(11)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_purchase(&self, purchase: &Value, user: &Value) -> Result<Value, String> {
        require_permission(user, "purchases.create")?;
        let supplier_id = required_string(purchase, &["supplierId"])?;
        let warehouse_id = required_string(purchase, &["warehouseId"])?;
        let items = purchase.get("items").and_then(Value::as_array).ok_or_else(|| "أصناف فاتورة الشراء غير صالحة".to_string())?;
        if items.is_empty() { return Err("لا يمكن اعتماد فاتورة شراء فارغة".to_string()); }
        let payment_method = optional_string(purchase, &["paymentMethod"]).unwrap_or_else(|| "cash".to_string());
        let discount = purchase.get("discountAmount").and_then(Value::as_f64).unwrap_or(0.0);
        let paid = purchase.get("paidAmount").and_then(Value::as_f64).unwrap_or(0.0);
        let connection = self.connection()?;
        let transaction = connection.unchecked_transaction().map_err(db_error)?;
        let supplier_exists: bool = transaction.query_row("SELECT EXISTS(SELECT 1 FROM suppliers WHERE id = ?1)", [&supplier_id], |row| row.get(0)).map_err(db_error)?;
        if !supplier_exists { return Err("المورد غير موجود".to_string()); }
        let warehouse_exists: bool = transaction.query_row("SELECT EXISTS(SELECT 1 FROM warehouses WHERE id = ?1 AND active = 1)", [&warehouse_id], |row| row.get(0)).map_err(db_error)?;
        if !warehouse_exists { return Err("المستودع غير موجود أو غير فعال".to_string()); }
        let purchase_id = Uuid::new_v4().to_string();
        let purchase_no = optional_string(purchase, &["purchaseNo"]).unwrap_or_else(|| format!("PUR-{}", now()));

        struct PreparedPurchaseItem {
            product_id: String,
            quantity: i64,
            unit_cost: f64,
            total_cost: f64,
            before: i64,
        }

        let mut prepared_items = Vec::new();
        let mut subtotal = 0.0;

        for item in items {
            let product_id = required_string(item, &["productId", "id"])?;
            let quantity = item.get("quantity").and_then(Value::as_i64).unwrap_or(0);
            let unit_cost = item.get("unitCost").or_else(|| item.get("cost")).and_then(Value::as_f64).unwrap_or(0.0);
            if quantity <= 0 || unit_cost < 0.0 { return Err("كمية أو سعر شراء غير صالح".to_string()); }
            ensure_warehouse_and_product(&transaction, &warehouse_id, &product_id)?;
            let before: i64 = transaction.query_row("SELECT quantity FROM warehouse_stock WHERE warehouse_id = ?1 AND product_id = ?2", params![warehouse_id, product_id], |row| row.get(0)).map_err(db_error)?;
            let total_cost = unit_cost * quantity as f64;
            subtotal += total_cost;
            prepared_items.push(PreparedPurchaseItem { product_id, quantity, unit_cost, total_cost, before });
        }

        let total = (subtotal - discount).max(0.0);
        if paid < 0.0 || paid > total { return Err("قيمة الدفع غير صالحة".to_string()); }
        if payment_method == "cash" && (paid - total).abs() > 0.01 { return Err("الشراء النقدي يجب أن يكون مدفوعاً بالكامل".to_string()); }
        let status = if paid < total { "pending" } else { "paid" };

        transaction.execute("INSERT INTO purchases (id, purchase_no, supplier_id, warehouse_id, total_amount, paid_amount, discount_amount, payment_method, payment_status, created_by, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)", params![purchase_id, purchase_no, supplier_id, warehouse_id, total, paid, discount, payment_method, status, user.get("id").and_then(Value::as_str), optional_string(purchase, &["notes"]), now()]).map_err(unique_or_db_error)?;

        for item in prepared_items {
            transaction.execute("INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_cost, total_cost) VALUES (?1, ?2, ?3, ?4, ?5, ?6)", params![Uuid::new_v4().to_string(), purchase_id, item.product_id, item.quantity, item.unit_cost, item.total_cost]).map_err(db_error)?;
            transaction.execute("UPDATE warehouse_stock SET quantity = quantity + ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4", params![item.quantity, now(), warehouse_id, item.product_id]).map_err(db_error)?;
            sync_total_stock(&transaction, &item.product_id)?;
            insert_stock_movement(&transaction, &item.product_id, &warehouse_id, "purchase", item.quantity, item.before, item.before + item.quantity, user, Some("فاتورة شراء"))?;
        }

        if total > paid { transaction.execute("UPDATE suppliers SET balance = COALESCE(balance, 0) + ?1 WHERE id = ?2", params![total - paid, supplier_id]).map_err(db_error)?; }
        transaction.execute("INSERT INTO audit_logs (user_id, user_name, action, module, details, timestamp) VALUES (?1, ?2, 'اعتماد فاتورة شراء', 'purchases', ?3, ?4)", params![user.get("id").and_then(Value::as_str), user.get("displayName").and_then(Value::as_str), format!("فاتورة {purchase_no} بقيمة {total}"), now()]).map_err(db_error)?;
        transaction.commit().map_err(db_error)?;
        Ok(json!({"success": true, "purchaseId": purchase_id, "purchaseNo": purchase_no, "totalAmount": total, "paymentStatus": status}))
    }

    pub fn warehouses(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, name, description, active, created_at, updated_at FROM warehouses ORDER BY name").map_err(db_error)?;
        let rows = statement.query_map([], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "description": row.get::<_, Option<String>>(2)?, "active": row.get::<_, bool>(3)?, "createdAt": row.get::<_, i64>(4)?, "updatedAt": row.get::<_, i64>(5)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_warehouse(&self, warehouse: &Value, user: &Value) -> Result<Value, String> {
        require_permission(user, "warehouse.manage")?;
        let name = required_string(warehouse, &["name"])?;
        let id = Uuid::new_v4().to_string();
        let timestamp = now();
        let connection = self.connection()?;
        connection.execute("INSERT INTO warehouses (id, name, description, active, created_at, updated_at) VALUES (?1, ?2, ?3, 1, ?4, ?4)", params![id, name, optional_string(warehouse, &["description"]), timestamp]).map_err(unique_or_db_error)?;
        self.warehouse_by_id(&id)
    }

    pub fn update_warehouse(&self, id: &str, warehouse: &Value, user: &Value) -> Result<Value, String> {
        require_permission(user, "warehouse.manage")?;
        let connection = self.connection()?;
        let changed = connection.execute("UPDATE warehouses SET name = COALESCE(?1, name), description = COALESCE(?2, description), active = COALESCE(?3, active), updated_at = ?4 WHERE id = ?5", params![optional_string(warehouse, &["name"]), optional_string(warehouse, &["description"]), optional_bool(warehouse, &["active"]), now(), id]).map_err(unique_or_db_error)?;
        if changed == 0 { return Err("المستودع المطلوب غير موجود".to_string()); }
        self.warehouse_by_id(id)
    }

    pub fn warehouse_stock(&self, warehouse_id: Option<&str>) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let sql = "SELECT p.id, p.name, p.barcode, p.brand, p.unit, p.purchase_price, p.retail_price, p.wholesale_price, p.agent_price, p.min_stock_level, COALESCE(ws.quantity, 0), COALESCE(w.name, 'غير موزع') FROM products p LEFT JOIN warehouse_stock ws ON ws.product_id = p.id LEFT JOIN warehouses w ON w.id = ws.warehouse_id WHERE (?1 IS NULL OR ws.warehouse_id = ?1) ORDER BY p.name";
        let mut statement = connection.prepare(sql).map_err(db_error)?;
        let rows = statement.query_map([warehouse_id], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "barcode": row.get::<_, Option<String>>(2)?, "brand": row.get::<_, Option<String>>(3)?, "unit": row.get::<_, Option<String>>(4)?, "purchasePrice": row.get::<_, f64>(5)?, "retailPrice": row.get::<_, f64>(6)?, "wholesalePrice": row.get::<_, f64>(7)?, "agentPrice": row.get::<_, f64>(8)?, "minStockLevel": row.get::<_, i64>(9)?, "quantity": row.get::<_, i64>(10)?, "warehouseName": row.get::<_, String>(11)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn stock_movements(&self, product_id: Option<&str>, warehouse_id: Option<&str>, limit: i64) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT sm.id, sm.product_id, p.name, sm.warehouse_id, w.name, sm.movement_type, sm.quantity, sm.before_quantity, sm.after_quantity, sm.reference_type, sm.reference_id, sm.user_id, sm.user_name, sm.notes, sm.created_at FROM stock_movements sm JOIN products p ON p.id = sm.product_id JOIN warehouses w ON w.id = sm.warehouse_id WHERE (?1 IS NULL OR sm.product_id = ?1) AND (?2 IS NULL OR sm.warehouse_id = ?2) ORDER BY sm.created_at DESC LIMIT ?3").map_err(db_error)?;
        let rows = statement.query_map(params![product_id, warehouse_id, limit.clamp(1, 1000)], |row| Ok(json!({"id": row.get::<_, String>(0)?, "productId": row.get::<_, String>(1)?, "productName": row.get::<_, String>(2)?, "warehouseId": row.get::<_, String>(3)?, "warehouseName": row.get::<_, String>(4)?, "movementType": row.get::<_, String>(5)?, "quantity": row.get::<_, i64>(6)?, "beforeQuantity": row.get::<_, i64>(7)?, "afterQuantity": row.get::<_, i64>(8)?, "referenceType": row.get::<_, Option<String>>(9)?, "referenceId": row.get::<_, Option<String>>(10)?, "userId": row.get::<_, Option<String>>(11)?, "userName": row.get::<_, Option<String>>(12)?, "notes": row.get::<_, Option<String>>(13)?, "createdAt": row.get::<_, i64>(14)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn product_details(&self, product_id: &str) -> Result<Value, String> {
        let product = self.product_by_id(product_id)?;
        let warehouses = self.warehouse_stock(None)?.into_iter().filter(|row| row["id"] == product_id).collect::<Vec<_>>();
        let movements = self.stock_movements(Some(product_id), None, 50)?;
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT s.invoice_no, s.created_at, si.quantity, si.unit_price, s.payment_method FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE si.product_id = ?1 ORDER BY s.created_at DESC LIMIT 50").map_err(db_error)?;
        let sales = statement.query_map([product_id], |row| Ok(json!({"invoiceNo": row.get::<_, String>(0)?, "createdAt": row.get::<_, i64>(1)?, "quantity": row.get::<_, i64>(2)?, "unitPrice": row.get::<_, f64>(3)?, "paymentMethod": row.get::<_, Option<String>>(4)?}))).map_err(db_error)?.map(|row| row.map_err(db_error)).collect::<Result<Vec<_>, _>>()?;
        let mut purchase_statement = connection.prepare("SELECT p.purchase_no, p.created_at, pi.quantity, pi.unit_cost, s.name FROM purchase_items pi JOIN purchases p ON p.id = pi.purchase_id JOIN suppliers s ON s.id = p.supplier_id WHERE pi.product_id = ?1 ORDER BY p.created_at DESC LIMIT 50").map_err(db_error)?;
        let purchases = purchase_statement.query_map([product_id], |row| Ok(json!({"purchaseNo": row.get::<_, String>(0)?, "createdAt": row.get::<_, i64>(1)?, "quantity": row.get::<_, i64>(2)?, "unitCost": row.get::<_, f64>(3)?, "supplierName": row.get::<_, String>(4)?}))).map_err(db_error)?.map(|row| row.map_err(db_error)).collect::<Result<Vec<_>, _>>()?;
        Ok(json!({"product": product, "warehouses": warehouses, "movements": movements, "sales": sales, "purchases": purchases}))
    }

    pub fn create_category(&self, category: &Value) -> Result<Value, String> {
        let name = required_string(category, &["name"])?;
        let id = Uuid::new_v4().to_string();
        let connection = self.connection()?;
        connection.execute("INSERT INTO categories (id, name, image_url, created_at) VALUES (?1, ?2, ?3, ?4)", params![id, name, optional_string(category, &["image", "imageUrl", "image_url"]), now()]).map_err(unique_or_db_error)?;
        self.category_by_id(&id)
    }

    pub fn update_category(&self, id: &str, category: &Value) -> Result<Value, String> {
        let connection = self.connection()?;
        let changed = connection.execute("UPDATE categories SET name = COALESCE(?1, name), image_url = COALESCE(?2, image_url), active = COALESCE(?3, active) WHERE id = ?4", params![optional_string(category, &["name"]), optional_string(category, &["image", "imageUrl", "image_url"]), optional_bool(category, &["active"]), id]).map_err(unique_or_db_error)?;
        if changed == 0 { return Err("التصنيف المطلوب غير موجود".to_string()); }
        self.category_by_id(id)
    }

    pub fn delete_category(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        if connection.execute("DELETE FROM categories WHERE id = ?1", [id]).map_err(db_error)? == 0 { return Err("التصنيف المطلوب غير موجود".to_string()); }
        Ok(json!({"success": true, "id": id}))
    }

    pub fn log_audit(&self, action: &str, module: Option<&str>, details: &str, user: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.execute("INSERT INTO audit_logs (user_name, action, module, details, timestamp) VALUES (?1, ?2, ?3, ?4, ?5)", params![user, action, module, details, now()]).map_err(db_error)?;
        Ok(json!({"success": true, "id": connection.last_insert_rowid()}))
    }

    pub fn audit_logs(&self, count: i64) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, user_id, user_name, action, module, details, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT ?1").map_err(db_error)?;
        let rows = statement.query_map([count.clamp(1, 500)], |row| Ok(json!({"id": row.get::<_, i64>(0)?, "userId": row.get::<_, Option<String>>(1)?, "userName": row.get::<_, Option<String>>(2)?, "action": row.get::<_, String>(3)?, "module": row.get::<_, Option<String>>(4)?, "details": row.get::<_, Option<String>>(5)?, "timestamp": row.get::<_, i64>(6)?}))).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn sales(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare(
            "SELECT s.id, s.invoice_no, s.customer_id, c.name, c.phone, s.total_amount, s.paid_amount, s.payment_method, s.created_by, s.created_at, s.price_type, s.payment_status, s.discount_amount 
             FROM sales s 
             LEFT JOIN customers c ON c.id = s.customer_id 
             ORDER BY s.created_at DESC"
        ).map_err(db_error)?;

        let sales_rows = statement.query_map([], |row| {
            let sale_id: String = row.get(0)?;
            Ok((
                sale_id,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, f64>(5)?,
                row.get::<_, f64>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<String>>(8)?,
                row.get::<_, i64>(9)?,
                row.get::<_, String>(10)?,
                row.get::<_, String>(11)?,
                row.get::<_, f64>(12)?,
            ))
        }).map_err(db_error)?.collect::<Result<Vec<_>, _>>().map_err(db_error)?;

        let mut items_stmt = connection.prepare(
            "SELECT si.id, si.product_id, p.name, p.barcode, si.quantity, si.unit_price, si.total_price, si.price_type 
             FROM sale_items si 
             LEFT JOIN products p ON p.id = si.product_id 
             WHERE si.sale_id = ?1"
        ).map_err(db_error)?;

        let mut result = Vec::new();
        for (sale_id, invoice_no, customer_id, customer_name, customer_phone, total_amount, paid_amount, payment_method, created_by, created_at, price_type, payment_status, discount_amount) in sales_rows {
            let items = items_stmt.query_map([&sale_id], |i_row| {
                Ok(json!({
                    "id": i_row.get::<_, String>(1)?,
                    "productId": i_row.get::<_, String>(1)?,
                    "name": i_row.get::<_, Option<String>>(2)?.unwrap_or_else(|| "مادة غير معروفة".to_string()),
                    "barcode": i_row.get::<_, Option<String>>(3)?,
                    "quantity": i_row.get::<_, i64>(4)?,
                    "price": i_row.get::<_, f64>(5)?,
                    "unitPrice": i_row.get::<_, f64>(5)?,
                    "total": i_row.get::<_, f64>(6)?,
                    "totalPrice": i_row.get::<_, f64>(6)?,
                    "priceType": i_row.get::<_, String>(7)?,
                }))
            }).map_err(db_error)?.collect::<Result<Vec<_>, _>>().map_err(db_error)?;

            result.push(json!({
                "id": sale_id,
                "invoiceNo": invoice_no,
                "customerId": customer_id,
                "customerName": customer_name.unwrap_or_else(|| "زبون نقدي".to_string()),
                "customerPhone": customer_phone.unwrap_or_default(),
                "totalAmount": total_amount,
                "paidAmount": paid_amount,
                "paymentMethod": payment_method,
                "createdBy": created_by,
                "createdAt": created_at,
                "priceType": price_type,
                "paymentStatus": payment_status,
                "discountAmount": discount_amount,
                "items": items,
                "cart": items
            }));
        }
        Ok(result)
    }

    pub fn process_sale(&self, cart: &Value, customer: &Value, payment: &Value, user: &Value) -> Result<Value, String> {
        let items = cart.as_array().ok_or_else(|| "بيانات سلة البيع غير صالحة".to_string())?;
        if items.is_empty() {
            return Err("لا يمكن حفظ فاتورة فارغة".to_string());
        }

        let price_type = normalize_price_type(
            payment.get("priceType").and_then(Value::as_str)
                .or_else(|| cart.get("priceType").and_then(Value::as_str))
                .unwrap_or("retail"),
        )?;
        let payment_method = payment.get("method").and_then(Value::as_str).unwrap_or("cash").to_string();
        let warehouse_id = payment.get("warehouseId").and_then(Value::as_str).unwrap_or("default-warehouse").to_string();
        let discount = optional_number(payment, &["discount"]).unwrap_or(0.0);
        if discount < 0.0 { return Err("الخصم لا يمكن أن يكون سالباً".to_string()); }
        let user_id = user.get("id").and_then(Value::as_str).map(str::to_string);
        let user_name = user.get("displayName").and_then(Value::as_str)
            .or_else(|| user.get("userName").and_then(Value::as_str))
            .unwrap_or("النظام").to_string();
        let role = user.get("role").and_then(Value::as_str).unwrap_or("");
        let permissions = user.get("permissions").and_then(Value::as_array);
        let can_sell = role == "owner" || role == "admin" || permissions.is_some_and(|items| items.iter().any(|item| matches!(item.as_str(), Some("*") | Some("all") | Some("manage_pos") | Some("sales.create"))));
        if !can_sell { return Err("لا يملك المستخدم صلاحية إنشاء فواتير البيع".to_string()); }
        let mut customer_id = customer.get("id").and_then(Value::as_str).filter(|s| !s.trim().is_empty()).map(str::to_string);
        let customer_name = customer.get("name").and_then(Value::as_str).unwrap_or("").trim();
        let paid_amount = optional_number(payment, &["paidAmount", "paid"]).unwrap_or(0.0);
        let sale_id = Uuid::new_v4().to_string();
        let invoice_no = optional_string(payment, &["invoiceNo", "invoice_no"]).filter(|s| !s.trim().is_empty()).unwrap_or_else(|| format!("INV-{}", now()));
        let connection = self.connection()?;
        let transaction = connection.unchecked_transaction().map_err(db_error)?;

        if customer_id.is_none() && !customer_name.is_empty() && customer_name != "زبون نقدي" {
            let existing_id: Option<String> = transaction.query_row(
                "SELECT id FROM customers WHERE name = ?1 LIMIT 1",
                [customer_name],
                |row| row.get(0)
            ).optional().map_err(db_error)?;

            if let Some(id) = existing_id {
                customer_id = Some(id);
            } else {
                let new_id = Uuid::new_v4().to_string();
                let phone = optional_string(customer, &["phone"]);
                let address = optional_string(customer, &["address"]);
                transaction.execute(
                    "INSERT INTO customers (id, name, phone, address, balance, created_at) VALUES (?1, ?2, ?3, ?4, 0, ?5)",
                    params![new_id, customer_name, phone, address, now()],
                ).map_err(unique_or_db_error)?;
                customer_id = Some(new_id);
            }
        }

        struct PreparedSaleItem {
            product_id: String,
            quantity: i64,
            unit_price: f64,
            line_total: f64,
            warehouse_before: i64,
            product_name: String,
        }

        let mut prepared_items = Vec::new();
        let mut total = 0.0;

        for item in items {
            let product_id = required_string(item, &["id", "productId"])?;
            let quantity = optional_integer(item, &["quantity", "qty", "count"]).unwrap_or(0);
            if quantity <= 0 { return Err("كمية البيع يجب أن تكون أكبر من صفر".to_string()); }
            ensure_warehouse_and_product(&transaction, &warehouse_id, &product_id)?;
            let row = transaction.query_row(
                "SELECT name, retail_price, wholesale_price, agent_price, stock_quantity FROM products WHERE id = ?1",
                [&product_id],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?, row.get::<_, f64>(2)?, row.get::<_, f64>(3)?, row.get::<_, i64>(4)?)),
            ).optional().map_err(db_error)?.ok_or_else(|| format!("المادة غير موجودة: {product_id}"))?;
            if row.4 < quantity {
                return Err(format!("المخزون غير كاف للمادة {}: المتاح {} والمطلوب {}", row.0, row.4, quantity));
            }
            let unit_price = match price_type.as_str() {
                "wholesale" => row.2,
                "agent" => row.3,
                _ => row.1,
            };
            if unit_price < 0.0 { return Err(format!("سعر المادة غير صالح: {}", row.0)); }
            let warehouse_before: i64 = transaction.query_row("SELECT quantity FROM warehouse_stock WHERE warehouse_id = ?1 AND product_id = ?2", params![warehouse_id, product_id], |row| row.get(0)).map_err(db_error)?;
            if warehouse_before < quantity { return Err(format!("المخزون غير كاف للمادة {} في المستودع المحدد", row.0)); }
            let line_total = unit_price * quantity as f64;
            total += line_total;

            prepared_items.push(PreparedSaleItem {
                product_id,
                quantity,
                unit_price,
                line_total,
                warehouse_before,
                product_name: row.0,
            });
        }

        let final_total = (total - discount).max(0.0);
        if paid_amount < 0.0 || paid_amount > final_total + 0.01 {
            return Err("قيمة الدفع غير صالحة".to_string());
        }
        if payment_method == "cash" && (paid_amount - final_total).abs() > 0.01 {
            return Err("البيع النقدي يجب أن يكون مدفوعاً بالكامل".to_string());
        }
        let payment_status = if payment_method == "credit" || paid_amount < final_total { "pending" } else { "paid" };
        if payment_method == "credit" && customer_id.is_none() {
            return Err("البيع الآجل يتطلب اختيار أو إدخال بيانات الزبون".to_string());
        }
        if let Some(customer_id_ref) = customer_id.as_deref() {
            let customer_exists: bool = transaction.query_row("SELECT EXISTS(SELECT 1 FROM customers WHERE id = ?1)", [customer_id_ref], |row| row.get(0)).map_err(db_error)?;
            if !customer_exists { return Err("الزبون المحدد غير موجود".to_string()); }
        }

        // 1. إدراج الفاتورة الأساسية أولاً في جدول sales حتى يتم تلبية متطلبات المفتاح الأجنبي (Foreign Key)
        transaction.execute(
            "INSERT INTO sales (id, invoice_no, customer_id, total_amount, paid_amount, payment_method, created_by, created_at, price_type, payment_status, discount_amount) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![sale_id, invoice_no, customer_id, final_total, paid_amount, payment_method, user_id, now(), price_type, payment_status, discount],
        ).map_err(unique_or_db_error)?;

        // 2. إدراج بنود الفاتورة وتحديث المخزون
        for item in prepared_items {
            transaction.execute(
                "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price, price_type) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![Uuid::new_v4().to_string(), sale_id, item.product_id, item.quantity, item.unit_price, item.line_total, price_type],
            ).map_err(db_error)?;
            let changed = transaction.execute(
                "UPDATE products SET stock_quantity = stock_quantity - ?1, updated_at = ?2 WHERE id = ?3 AND stock_quantity >= ?1",
                params![item.quantity, now(), item.product_id],
            ).map_err(db_error)?;
            if changed != 1 { return Err(format!("تعذر تحديث مخزون المادة {}", item.product_name)); }
            transaction.execute("UPDATE warehouse_stock SET quantity = quantity - ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4", params![item.quantity, now(), warehouse_id, item.product_id]).map_err(db_error)?;
            insert_stock_movement(&transaction, &item.product_id, &warehouse_id, "sale", -item.quantity, item.warehouse_before, item.warehouse_before - item.quantity, user, Some("فاتورة بيع"))?;
        }

        if let Some(ref customer_id) = customer_id {
            if payment_method == "credit" || paid_amount < final_total {
                transaction.execute("UPDATE customers SET balance = COALESCE(balance, 0) + ?1 WHERE id = ?2", params![final_total - paid_amount, customer_id]).map_err(db_error)?;
            }
        }
        transaction.execute(
            "INSERT INTO audit_logs (user_id, user_name, action, module, details, timestamp) VALUES (?1, ?2, ?3, 'sales', ?4, ?5)",
            params![user_id, user_name, "عملية بيع", format!("فاتورة {invoice_no} بقيمة {final_total}"), now()],
        ).map_err(db_error)?;
        transaction.commit().map_err(db_error)?;
        Ok(json!({ "success": true, "saleId": sale_id, "invoiceNo": invoice_no, "totalAmount": final_total, "paidAmount": paid_amount, "paymentStatus": payment_status, "customerId": customer_id }))
    }

    pub fn update_sale(&self, id: &str, cart: &Value, customer: &Value, payment: &Value, user: &Value) -> Result<Value, String> {
        let items = cart.as_array().ok_or_else(|| "بيانات سلة البيع غير صالحة".to_string())?;
        if items.is_empty() {
            return Err("لا يمكن حفظ فاتورة فارغة".to_string());
        }

        let price_type = normalize_price_type(
            payment.get("priceType").and_then(Value::as_str)
                .or_else(|| cart.get("priceType").and_then(Value::as_str))
                .unwrap_or("retail"),
        )?;
        let payment_method = payment.get("method").and_then(Value::as_str).unwrap_or("cash").to_string();
        let warehouse_id = payment.get("warehouseId").and_then(Value::as_str).unwrap_or("default-warehouse").to_string();
        let discount = optional_number(payment, &["discount", "discountAmount"]).unwrap_or(0.0);
        if discount < 0.0 { return Err("الخصم لا يمكن أن يكون سالباً".to_string()); }

        let user_id = user.get("id").and_then(Value::as_str).map(str::to_string);
        let user_name = user.get("displayName").and_then(Value::as_str)
            .or_else(|| user.get("userName").and_then(Value::as_str))
            .unwrap_or("النظام").to_string();

        let mut customer_id = customer.get("id").and_then(Value::as_str).filter(|s| !s.trim().is_empty()).map(str::to_string);
        let customer_name = customer.get("name").and_then(Value::as_str).unwrap_or("").trim();
        let paid_amount = optional_number(payment, &["paidAmount", "paid"]).unwrap_or(0.0);

        let connection = self.connection()?;
        let transaction = connection.unchecked_transaction().map_err(db_error)?;

        // 1. Verify existing sale
        let (old_customer_id, old_total, old_paid, old_method, invoice_no): (Option<String>, f64, f64, Option<String>, String) = transaction.query_row(
            "SELECT customer_id, total_amount, paid_amount, payment_method, invoice_no FROM sales WHERE id = ?1",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?))
        ).optional().map_err(db_error)?.ok_or_else(|| format!("الفاتورة غير موجودة: {id}"))?;

        // 2. Revert previous customer balance if it was credit
        if let Some(old_cid) = old_customer_id {
            let old_unpaid = (old_total - old_paid).max(0.0);
            if old_unpaid > 0.0 || old_method.as_deref() == Some("credit") {
                transaction.execute(
                    "UPDATE customers SET balance = COALESCE(balance, 0) - ?1 WHERE id = ?2",
                    params![old_unpaid, old_cid]
                ).map_err(db_error)?;
            }
        }

        // 3. Revert stock of previous sale_items
        {
            let mut old_items_stmt = transaction.prepare(
                "SELECT product_id, quantity FROM sale_items WHERE sale_id = ?1"
            ).map_err(db_error)?;
            let old_items = old_items_stmt.query_map([id], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            }).map_err(db_error)?.collect::<Result<Vec<_>, _>>().map_err(db_error)?;

            for (p_id, qty) in old_items {
                transaction.execute(
                    "UPDATE products SET stock_quantity = stock_quantity + ?1, updated_at = ?2 WHERE id = ?3",
                    params![qty, now(), p_id]
                ).map_err(db_error)?;
                transaction.execute(
                    "UPDATE warehouse_stock SET quantity = quantity + ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4",
                    params![qty, now(), warehouse_id, p_id]
                ).map_err(db_error)?;
            }
        }

        // 4. Delete old sale_items
        transaction.execute("DELETE FROM sale_items WHERE sale_id = ?1", [id]).map_err(db_error)?;

        // 5. Handle customer
        if customer_id.is_none() && !customer_name.is_empty() && customer_name != "زبون نقدي" {
            let existing_id: Option<String> = transaction.query_row(
                "SELECT id FROM customers WHERE name = ?1 LIMIT 1",
                [customer_name],
                |row| row.get(0)
            ).optional().map_err(db_error)?;

            if let Some(c_id) = existing_id {
                customer_id = Some(c_id);
            } else {
                let new_id = Uuid::new_v4().to_string();
                let phone = optional_string(customer, &["phone"]);
                let address = optional_string(customer, &["address"]);
                transaction.execute(
                    "INSERT INTO customers (id, name, phone, address, balance, created_at) VALUES (?1, ?2, ?3, ?4, 0, ?5)",
                    params![new_id, customer_name, phone, address, now()],
                ).map_err(unique_or_db_error)?;
                customer_id = Some(new_id);
            }
        }

        // 6. Validate and apply new items
        struct PreparedItem {
            product_id: String,
            quantity: i64,
            unit_price: f64,
            line_total: f64,
            product_name: String,
        }

        let mut prepared_items = Vec::new();
        let mut total = 0.0;

        for item in items {
            let product_id = required_string(item, &["id", "productId"])?;
            let quantity = optional_integer(item, &["quantity", "qty", "count"]).unwrap_or(0);
            if quantity <= 0 { return Err("كمية البيع يجب أن تكون أكبر من صفر".to_string()); }
            ensure_warehouse_and_product(&transaction, &warehouse_id, &product_id)?;
            let row = transaction.query_row(
                "SELECT name, retail_price, wholesale_price, agent_price, stock_quantity FROM products WHERE id = ?1",
                [&product_id],
                |r| Ok((r.get::<_, String>(0)?, r.get::<_, f64>(1)?, r.get::<_, f64>(2)?, r.get::<_, f64>(3)?, r.get::<_, i64>(4)?)),
            ).optional().map_err(db_error)?.ok_or_else(|| format!("المادة غير موجودة: {product_id}"))?;

            if row.4 < quantity {
                return Err(format!("المخزون غير كاف للمادة {}: المتاح {} والمطلوب {}", row.0, row.4, quantity));
            }
            let unit_price = match price_type.as_str() {
                "wholesale" => row.2,
                "agent" => row.3,
                _ => row.1,
            };
            let line_total = unit_price * quantity as f64;
            total += line_total;

            prepared_items.push(PreparedItem {
                product_id,
                quantity,
                unit_price,
                line_total,
                product_name: row.0,
            });
        }

        let final_total = (total - discount).max(0.0);
        let payment_status = if payment_method == "credit" || paid_amount < final_total { "pending" } else { "paid" };

        // 7. Update sales table
        transaction.execute(
            "UPDATE sales SET customer_id = ?1, total_amount = ?2, paid_amount = ?3, payment_method = ?4, price_type = ?5, payment_status = ?6, discount_amount = ?7 WHERE id = ?8",
            params![customer_id, final_total, paid_amount, payment_method, price_type, payment_status, discount, id],
        ).map_err(db_error)?;

        // 8. Insert new sale_items and deduct stock
        for item in prepared_items {
            transaction.execute(
                "INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, total_price, price_type) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![Uuid::new_v4().to_string(), id, item.product_id, item.quantity, item.unit_price, item.line_total, price_type],
            ).map_err(db_error)?;

            transaction.execute(
                "UPDATE products SET stock_quantity = stock_quantity - ?1, updated_at = ?2 WHERE id = ?3 AND stock_quantity >= ?1",
                params![item.quantity, now(), item.product_id],
            ).map_err(db_error)?;

            transaction.execute(
                "UPDATE warehouse_stock SET quantity = quantity - ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4",
                params![item.quantity, now(), warehouse_id, item.product_id]
            ).map_err(db_error)?;
        }

        // 9. Update new customer balance if credit
        if let Some(ref cid) = customer_id {
            if payment_method == "credit" || paid_amount < final_total {
                transaction.execute(
                    "UPDATE customers SET balance = COALESCE(balance, 0) + ?1 WHERE id = ?2",
                    params![final_total - paid_amount, cid]
                ).map_err(db_error)?;
            }
        }

        // 10. Audit log
        transaction.execute(
            "INSERT INTO audit_logs (user_id, user_name, action, module, details, timestamp) VALUES (?1, ?2, ?3, 'sales', ?4, ?5)",
            params![user_id, user_name, "تعديل فاتورة", format!("تعديل فاتورة {invoice_no} لتصبح بقيمة {final_total}"), now()],
        ).map_err(db_error)?;

        transaction.commit().map_err(db_error)?;

        Ok(json!({
            "success": true,
            "saleId": id,
            "invoiceNo": invoice_no,
            "totalAmount": final_total,
            "paidAmount": paid_amount,
            "paymentStatus": payment_status,
            "customerId": customer_id
        }))
    }

    fn user_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row("SELECT id, username, display_name, role, permissions, active, last_login, created_at FROM users WHERE id = ?1", [id], user_value).map_err(db_error)
    }
    fn supplier_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row("SELECT id, name, phone, address, balance, created_at FROM suppliers WHERE id = ?1", [id], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "phone": row.get::<_, Option<String>>(2)?, "address": row.get::<_, Option<String>>(3)?, "balance": row.get::<_, f64>(4)?, "createdAt": row.get::<_, i64>(5)?}))).map_err(db_error)
    }
    fn product_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row("SELECT id, category_id, name, sku, barcode, description, purchase_price, retail_price, wholesale_price, agent_price, unit, brand, stock_quantity, min_stock_level, storage_location, image_url, is_featured, status, active, created_at, updated_at FROM products WHERE id = ?1", [id], product_value).map_err(db_error)
    }
    fn category_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row("SELECT c.id, c.name, c.image_url, c.active, c.created_at, COUNT(p.id) FROM categories c LEFT JOIN products p ON p.category_id = c.id WHERE c.id = ?1 GROUP BY c.id", [id], category_value).map_err(db_error)
    }
    fn warehouse_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row("SELECT id, name, description, active, created_at, updated_at FROM warehouses WHERE id = ?1", [id], |row| Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "description": row.get::<_, Option<String>>(2)?, "active": row.get::<_, bool>(3)?, "createdAt": row.get::<_, i64>(4)?, "updatedAt": row.get::<_, i64>(5)?}))).map_err(db_error)
    }

    pub fn adjust_stock(&self, warehouse_id: &str, product_id: &str, delta: i64, movement_type: &str, user: &Value, notes: Option<&str>) -> Result<Value, String> {
        require_permission(user, "inventory.adjust")?;
        if delta == 0 { return Err("كمية التسوية لا يمكن أن تكون صفراً".to_string()); }
        validate_movement_type(movement_type)?;
        let connection = self.connection()?;
        let transaction = connection.unchecked_transaction().map_err(db_error)?;
        ensure_warehouse_and_product(&transaction, warehouse_id, product_id)?;
        let before: i64 = transaction.query_row("SELECT quantity FROM warehouse_stock WHERE warehouse_id = ?1 AND product_id = ?2", params![warehouse_id, product_id], |row| row.get(0)).optional().map_err(db_error)?.unwrap_or(0);
        let after = before + delta;
        if after < 0 { return Err("لا يمكن أن يصبح مخزون المستودع سالباً".to_string()); }
        transaction.execute("INSERT INTO warehouse_stock (warehouse_id, product_id, quantity, updated_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(warehouse_id, product_id) DO UPDATE SET quantity = excluded.quantity, updated_at = excluded.updated_at", params![warehouse_id, product_id, after, now()]).map_err(db_error)?;
        sync_total_stock(&transaction, product_id)?;
        insert_stock_movement(&transaction, product_id, warehouse_id, movement_type, delta, before, after, user, notes)?;
        transaction.commit().map_err(db_error)?;
        self.product_by_id(product_id)
    }

    pub fn transfer_stock(&self, source_id: &str, target_id: &str, product_id: &str, quantity: i64, user: &Value, notes: Option<&str>) -> Result<Value, String> {
        require_permission(user, "inventory.transfer")?;
        if source_id == target_id { return Err("لا يمكن النقل إلى نفس المستودع".to_string()); }
        if quantity <= 0 { return Err("كمية النقل يجب أن تكون أكبر من صفر".to_string()); }
        let connection = self.connection()?;
        let transaction = connection.unchecked_transaction().map_err(db_error)?;
        ensure_warehouse_and_product(&transaction, source_id, product_id)?;
        ensure_warehouse_and_product(&transaction, target_id, product_id)?;
        let source_before: i64 = transaction.query_row("SELECT quantity FROM warehouse_stock WHERE warehouse_id = ?1 AND product_id = ?2", params![source_id, product_id], |row| row.get(0)).optional().map_err(db_error)?.unwrap_or(0);
        if source_before < quantity { return Err("المخزون غير كافٍ للنقل".to_string()); }
        let target_before: i64 = transaction.query_row("SELECT quantity FROM warehouse_stock WHERE warehouse_id = ?1 AND product_id = ?2", params![target_id, product_id], |row| row.get(0)).optional().map_err(db_error)?.unwrap_or(0);
        let timestamp = now();
        transaction.execute("UPDATE warehouse_stock SET quantity = quantity - ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4", params![quantity, timestamp, source_id, product_id]).map_err(db_error)?;
        transaction.execute("UPDATE warehouse_stock SET quantity = quantity + ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4", params![quantity, timestamp, target_id, product_id]).map_err(db_error)?;
        sync_total_stock(&transaction, product_id)?;
        insert_stock_movement(&transaction, product_id, source_id, "transfer_out", -quantity, source_before, source_before - quantity, user, notes)?;
        insert_stock_movement(&transaction, product_id, target_id, "transfer_in", quantity, target_before, target_before + quantity, user, notes)?;
        transaction.commit().map_err(db_error)?;
        Ok(json!({"success": true, "productId": product_id, "quantity": quantity}))
    }

    pub fn count_stock(&self, warehouse_id: &str, product_id: &str, actual: i64, user: &Value, notes: Option<&str>) -> Result<Value, String> {
        require_permission(user, "inventory.count")?;
        if actual < 0 { return Err("الكمية الفعلية لا يمكن أن تكون سالبة".to_string()); }
        let connection = self.connection()?;
        let transaction = connection.unchecked_transaction().map_err(db_error)?;
        ensure_warehouse_and_product(&transaction, warehouse_id, product_id)?;
        let system: i64 = transaction.query_row("SELECT quantity FROM warehouse_stock WHERE warehouse_id = ?1 AND product_id = ?2", params![warehouse_id, product_id], |row| row.get(0)).optional().map_err(db_error)?.unwrap_or(0);
        let difference = actual - system;
        if difference != 0 {
            transaction.execute("UPDATE warehouse_stock SET quantity = ?1, updated_at = ?2 WHERE warehouse_id = ?3 AND product_id = ?4", params![actual, now(), warehouse_id, product_id]).map_err(db_error)?;
            sync_total_stock(&transaction, product_id)?;
            insert_stock_movement(&transaction, product_id, warehouse_id, "count", difference, system, actual, user, notes)?;
        }
        let count_id = Uuid::new_v4().to_string();
        transaction.execute("INSERT INTO stock_counts (id, warehouse_id, status, user_id, user_name, notes, created_at, approved_at) VALUES (?1, ?2, 'approved', ?3, ?4, ?5, ?6, ?6)", params![count_id, warehouse_id, user.get("id").and_then(Value::as_str), user.get("displayName").and_then(Value::as_str), notes, now()]).map_err(db_error)?;
        transaction.execute("INSERT INTO stock_count_items (id, count_id, product_id, system_quantity, actual_quantity, difference) VALUES (?1, ?2, ?3, ?4, ?5, ?6)", params![Uuid::new_v4().to_string(), count_id, product_id, system, actual, difference]).map_err(db_error)?;
        transaction.commit().map_err(db_error)?;
        Ok(json!({"success": true, "systemQuantity": system, "actualQuantity": actual, "difference": difference}))
    }

    pub fn tasks(&self) -> Result<Vec<Value>, String> {
        let connection = self.connection()?;
        let mut statement = connection.prepare("SELECT id, title, description, assigned_to, due_date, priority, status, created_at, updated_at FROM tasks ORDER BY created_at DESC").map_err(db_error)?;
        let rows = statement.query_map([], task_value).map_err(db_error)?;
        rows.map(|row| row.map_err(db_error)).collect()
    }

    pub fn create_task(&self, task: &Value, user: &Value) -> Result<Value, String> {
        let title = required_string(task, &["title"])?;
        let description = optional_string(task, &["description"]);
        let assigned_to = optional_string(task, &["assignedTo", "assigned_to"]);
        let due_date = optional_integer(task, &["dueDate", "due_date"]);
        let priority = optional_string(task, &["priority"]).unwrap_or_else(|| "medium".to_string());
        let status = optional_string(task, &["status"]).unwrap_or_else(|| "pending".to_string());
        let id = Uuid::new_v4().to_string();
        let timestamp = now();
        let connection = self.connection()?;
        connection.execute(
            "INSERT INTO tasks (id, title, description, assigned_to, due_date, priority, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, title, description, assigned_to, due_date, priority, status, timestamp, timestamp],
        ).map_err(db_error)?;
        let user_name = optional_string(user, &["displayName", "username"]).unwrap_or_else(|| "نظام".to_string());
        let _ = self.log_audit("task_create", Some("tasks"), &format!("تم إنشاء مهمة: {title}"), &user_name);
        self.task_by_id(&id)
    }

    pub fn update_task(&self, id: &str, task: &Value, user: &Value) -> Result<Value, String> {
        let title = required_string(task, &["title"])?;
        let description = optional_string(task, &["description"]);
        let assigned_to = optional_string(task, &["assignedTo", "assigned_to"]);
        let due_date = optional_integer(task, &["dueDate", "due_date"]);
        let priority = optional_string(task, &["priority"]).unwrap_or_else(|| "medium".to_string());
        let status = optional_string(task, &["status"]).unwrap_or_else(|| "pending".to_string());
        let timestamp = now();
        let connection = self.connection()?;
        let updated = connection.execute(
            "UPDATE tasks SET title = ?1, description = ?2, assigned_to = ?3, due_date = ?4, priority = ?5, status = ?6, updated_at = ?7 WHERE id = ?8",
            params![title, description, assigned_to, due_date, priority, status, timestamp, id],
        ).map_err(db_error)?;
        if updated == 0 {
            return Err("المهمة غير موجودة".to_string());
        }
        let user_name = optional_string(user, &["displayName", "username"]).unwrap_or_else(|| "نظام".to_string());
        let _ = self.log_audit("task_update", Some("tasks"), &format!("تم تحديث مهمة: {title} (الحالة: {status})"), &user_name);
        self.task_by_id(id)
    }

    pub fn delete_task(&self, id: &str, user: &Value) -> Result<Value, String> {
        let connection = self.connection()?;
        let count = connection.execute("DELETE FROM tasks WHERE id = ?1", [id]).map_err(db_error)?;
        if count == 0 {
            return Err("المهمة غير موجودة".to_string());
        }
        let user_name = optional_string(user, &["displayName", "username"]).unwrap_or_else(|| "نظام".to_string());
        let _ = self.log_audit("task_delete", Some("tasks"), &format!("تم حذف المهمة: {id}"), &user_name);
        Ok(json!({"success": true, "id": id}))
    }

    pub fn task_by_id(&self, id: &str) -> Result<Value, String> {
        let connection = self.connection()?;
        connection.query_row(
            "SELECT id, title, description, assigned_to, due_date, priority, status, created_at, updated_at FROM tasks WHERE id = ?1",
            [id],
            task_value,
        ).map_err(db_error)
    }

    pub fn backup_database(&self, dest_path: &str) -> Result<Value, String> {
        let dest = PathBuf::from(dest_path);
        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("فشل إنشاء مجلد النسخة الاحتياطية: {e}"))?;
        }
        fs::copy(&self.path, &dest).map_err(|e| format!("فشل نسخ ملف قاعدة البيانات: {e}"))?;
        Ok(json!({"success": true, "path": dest_path}))
    }

    pub fn restore_database(&self, src_path: &str) -> Result<Value, String> {
        let src = PathBuf::from(src_path);
        if !src.exists() {
            return Err("ملف النسخة الاحتياطية غير موجود".to_string());
        }
        let test_conn = Connection::open(&src).map_err(|e| format!("الملف المحدد ليس ملف قاعدة بيانات SQLite صالحة: {e}"))?;
        let _: i32 = test_conn.query_row("SELECT 1", [], |r| r.get(0)).map_err(|_| "الملف غير صالح أو تالف".to_string())?;
        drop(test_conn);

        fs::copy(&src, &self.path).map_err(|e| format!("فشل استعادة قاعدة البيانات: {e}"))?;
        Ok(json!({"success": true, "path": src_path}))
    }
}

fn migrate(connection: &Connection) -> Result<(), String> {
    let current: i32 = connection.pragma_query_value(None, "user_version", |row| row.get(0)).map_err(db_error)?;
    if current >= SCHEMA_VERSION { return Ok(()); }
    let transaction = connection.unchecked_transaction().map_err(db_error)?;
    if current < 1 {
        transaction.execute_batch(MIGRATION_1).map_err(db_error)?;
        transaction.pragma_update(None, "user_version", 1).map_err(db_error)?;
    }
    if current < 2 {
        transaction.execute_batch(MIGRATION_2).map_err(db_error)?;
        transaction.pragma_update(None, "user_version", 2).map_err(db_error)?;
    }
    if current < 3 {
        transaction.execute_batch(MIGRATION_3).map_err(db_error)?;
        transaction.pragma_update(None, "user_version", 3).map_err(db_error)?;
    }
    if current < 4 {
        transaction.execute_batch(MIGRATION_4).map_err(db_error)?;
        transaction.pragma_update(None, "user_version", 4).map_err(db_error)?;
    }
    if current < 5 {
        backfill_manager_sales_permission(&transaction)?;
        transaction.pragma_update(None, "user_version", 5).map_err(db_error)?;
    }
    if current < 6 {
        transaction.execute_batch(MIGRATION_6).map_err(db_error)?;
        backfill_manager_inventory_permissions(&transaction)?;
        transaction.pragma_update(None, "user_version", 6).map_err(db_error)?;
    }
    if current < 7 {
        transaction.execute_batch(MIGRATION_7).map_err(db_error)?;
        transaction.pragma_update(None, "user_version", 7).map_err(db_error)?;
    }
    if current < 8 {
        transaction.execute_batch(MIGRATION_8).map_err(db_error)?;
        transaction.pragma_update(None, "user_version", 8).map_err(db_error)?;
    }
    transaction.commit().map_err(db_error)
}

fn backfill_manager_sales_permission(transaction: &rusqlite::Transaction<'_>) -> Result<(), String> {
    let mut statement = transaction.prepare("SELECT id, permissions FROM users WHERE role = 'manager' AND active = 1").map_err(db_error)?;
    let rows: Vec<(String, String)> = statement.query_map([], |row| Ok((row.get(0)?, row.get(1)?))).map_err(db_error)?.collect::<Result<_, _>>().map_err(db_error)?;
    drop(statement);
    for (id, permissions_json) in rows {
        let mut permissions: Vec<String> = serde_json::from_str(&permissions_json).unwrap_or_default();
        if !permissions.iter().any(|permission| permission == "*" || permission == "all" || permission == "sales.create") {
            permissions.push("sales.create".to_string());
            let serialized = serde_json::to_string(&permissions).map_err(|error| format!("Invalid permissions: {error}"))?;
            transaction.execute("UPDATE users SET permissions = ?1 WHERE id = ?2", params![serialized, id]).map_err(db_error)?;
        }
    }
    Ok(())
}

fn user_value(row: &Row<'_>) -> rusqlite::Result<Value> {
    let permissions: Value = serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_else(|_| json!([]));
    Ok(json!({"id": row.get::<_, String>(0)?, "username": row.get::<_, String>(1)?, "displayName": row.get::<_, String>(2)?, "role": row.get::<_, String>(3)?, "permissions": permissions, "active": row.get::<_, bool>(5)?, "lastLogin": row.get::<_, Option<i64>>(6)?, "createdAt": row.get::<_, i64>(7)?}))
}
fn product_value(row: &Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({"id": row.get::<_, String>(0)?, "categoryId": row.get::<_, Option<String>>(1)?, "name": row.get::<_, String>(2)?, "sku": row.get::<_, Option<String>>(3)?, "barcode": row.get::<_, Option<String>>(4)?, "description": row.get::<_, Option<String>>(5)?, "purchasePrice": row.get::<_, f64>(6)?, "retailPrice": row.get::<_, f64>(7)?, "wholesalePrice": row.get::<_, f64>(8)?, "agentPrice": row.get::<_, f64>(9)?, "unit": row.get::<_, Option<String>>(10)?, "brand": row.get::<_, Option<String>>(11)?, "stockQuantity": row.get::<_, i64>(12)?, "minStockLevel": row.get::<_, i64>(13)?, "storageLocation": row.get::<_, Option<String>>(14)?, "imageUrl": row.get::<_, Option<String>>(15)?, "isFeatured": row.get::<_, bool>(16)?, "status": row.get::<_, String>(17)?, "active": row.get::<_, bool>(18)?, "createdAt": row.get::<_, i64>(19)?, "updatedAt": row.get::<_, i64>(20)?}))
}
fn category_value(row: &Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({"id": row.get::<_, String>(0)?, "name": row.get::<_, String>(1)?, "imageUrl": row.get::<_, Option<String>>(2)?, "active": row.get::<_, bool>(3)?, "createdAt": row.get::<_, i64>(4)?, "productCount": row.get::<_, i64>(5).unwrap_or(0)}))
}
fn task_value(row: &Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({"id": row.get::<_, String>(0)?, "title": row.get::<_, String>(1)?, "description": row.get::<_, Option<String>>(2)?, "assignedTo": row.get::<_, Option<String>>(3)?, "dueDate": row.get::<_, Option<i64>>(4)?, "priority": row.get::<_, String>(5)?, "status": row.get::<_, String>(6)?, "createdAt": row.get::<_, i64>(7)?, "updatedAt": row.get::<_, i64>(8)?}))
}

fn required_string(value: &Value, keys: &[&str]) -> Result<String, String> { optional_string(value, keys).filter(|text| !text.trim().is_empty()).ok_or_else(|| format!("الحقل المطلوب مفقود: {}", keys[0])) }
fn optional_string(value: &Value, keys: &[&str]) -> Option<String> { keys.iter().find_map(|key| value.get(*key).and_then(Value::as_str).map(ToString::to_string)) }
fn optional_number(value: &Value, keys: &[&str]) -> Option<f64> {
    keys.iter().find_map(|key| {
        value.get(*key).and_then(|v| {
            v.as_f64()
                .or_else(|| v.as_i64().map(|i| i as f64))
                .or_else(|| v.as_str().and_then(|s| s.trim().parse::<f64>().ok()))
        })
    })
}
fn number(value: &Value, keys: &[&str], default: f64) -> f64 { optional_number(value, keys).unwrap_or(default) }
fn optional_integer(value: &Value, keys: &[&str]) -> Option<i64> {
    keys.iter().find_map(|key| {
        value.get(*key).and_then(|v| {
            v.as_i64()
                .or_else(|| v.as_f64().map(|f| f as i64))
                .or_else(|| v.as_str().and_then(|s| s.trim().parse::<i64>().ok()))
        })
    })
}
fn integer(value: &Value, keys: &[&str], default: i64) -> i64 { optional_integer(value, keys).unwrap_or(default) }
fn optional_bool(value: &Value, keys: &[&str]) -> Option<bool> { keys.iter().find_map(|key| value.get(*key).and_then(Value::as_bool)) }
fn bool_value(value: &Value, keys: &[&str]) -> bool { optional_bool(value, keys).unwrap_or(false) }
fn ensure_barcode_available(connection: &Connection, barcode: Option<&str>, current_id: Option<&str>) -> Result<(), String> {
    let Some(barcode) = barcode.map(str::trim).filter(|value| !value.is_empty()) else { return Ok(()); };
    let existing: Option<String> = connection.query_row("SELECT id FROM products WHERE barcode = ?1", [barcode], |row| row.get(0)).optional().map_err(db_error)?;
    if existing.as_deref().is_some_and(|id| Some(id) != current_id) {
        return Err("الباركود مستخدم لمادة أخرى".to_string());
    }
    Ok(())
}
fn normalize_price_type(value: &str) -> Result<String, String> {
    match value.to_lowercase().as_str() {
        "retail" | "single" | "مفرد" => Ok("retail".to_string()),
        "wholesale" | "جملة" => Ok("wholesale".to_string()),
        "agent" | "وكيل" => Ok("agent".to_string()),
        other => Err(format!("نوع السعر غير مدعوم: {other}")),
    }
}
fn hash_pin(pin: &str) -> Result<String, String> { if pin.len() < 4 { return Err("رمز PIN يجب أن يتكون من 4 محارف على الأقل".to_string()); } let salt = SaltString::generate(&mut OsRng); Argon2::default().hash_password(pin.as_bytes(), &salt).map(|hash| hash.to_string()).map_err(|error| format!("Cannot hash PIN: {error}")) }
fn verify_pin(pin: &str, hash: &str) -> bool { PasswordHash::new(hash).map(|parsed| Argon2::default().verify_password(pin.as_bytes(), &parsed).is_ok()).unwrap_or(false) }
fn now() -> i64 { chrono::Utc::now().timestamp_millis() }
fn db_error(error: rusqlite::Error) -> String { format!("SQLite error: {error}") }
fn unique_or_db_error(error: rusqlite::Error) -> String { match error { rusqlite::Error::SqliteFailure(_, Some(message)) if message.contains("UNIQUE") => "القيمة موجودة مسبقاً".to_string(), other => db_error(other) } }

#[cfg(test)]
mod tests {
    use super::*;

    fn test_database() -> Database {
        let path = std::env::temp_dir().join(format!("dubsar-sales-{}.sqlite3", Uuid::new_v4()));
        Database::open(path).expect("database should initialize")
    }

    #[test]
    fn sale_transaction_decreases_stock_and_persists_sale() {
        let database = test_database();
        let product = database.create_product(&json!({"name": "Test", "barcode": "T-1", "retailPrice": 1000.0, "wholesalePrice": 800.0, "agentPrice": 700.0, "stockQuantity": 3})).expect("product should be created");
        let result = database.process_sale(&json!([{"id": product["id"], "quantity": 2}]), &json!({"name": "زبون نقدي"}), &json!({"method": "cash", "paidAmount": 2000.0, "priceType": "retail"}), &json!({"id": "u1", "displayName": "Owner", "role": "owner", "permissions": ["*"]})).expect("sale should commit");
        assert_eq!(result["success"], true);
        assert_eq!(database.products().expect("products should load")[0]["stockQuantity"], 1);
        assert_eq!(database.sales().expect("sales should load").len(), 1);
    }

    #[test]
    fn insufficient_stock_rolls_back_sale() {
        let database = test_database();
        let product = database.create_product(&json!({"name": "Test", "retailPrice": 1000.0, "stockQuantity": 1})).expect("product should be created");
        assert!(database.process_sale(&json!([{"id": product["id"], "quantity": 2}]), &json!({"name": "زبون نقدي"}), &json!({"method": "cash", "paidAmount": 2000.0}), &json!({"id": "u1", "displayName": "Owner", "role": "owner", "permissions": ["*"]})).is_err());
        assert_eq!(database.sales().expect("sales should load").len(), 0);
        assert_eq!(database.products().expect("products should load")[0]["stockQuantity"], 1);
    }

    #[test]
    fn manager_with_sales_create_permission_can_sell() {
        let database = test_database();
        let product = database.create_product(&json!({"name": "Manager test", "retailPrice": 500.0, "stockQuantity": 1})).expect("product should be created");
        let result = database.process_sale(&json!([{"id": product["id"], "quantity": 1}]), &json!({"name": "زبون نقدي"}), &json!({"method": "cash", "paidAmount": 500.0}), &json!({"id": "u1", "displayName": "Manager", "role": "manager", "permissions": ["sales.view", "sales.create"]}));
        assert!(result.is_ok());
    }

    #[test]
    fn inventory_transfer_is_atomic_and_logged() {
        let database = test_database();
        let user = json!({"id": "u1", "displayName": "Owner", "role": "owner", "permissions": ["*"]});
        let product = database.create_product(&json!({"name": "Transfer test", "stockQuantity": 10})).expect("product should be created");
        database.create_warehouse(&json!({"name": "Branch test"}), &user).expect("warehouse should be created");
        database.adjust_stock("default-warehouse", &product["id"].as_str().unwrap(), 10, "manual_add", &user, None).expect("stock should be adjusted");
        let branch = database.warehouses().expect("warehouses should load").into_iter().find(|row| row["name"] == "Branch test").expect("branch should exist");
        database.transfer_stock("default-warehouse", branch["id"].as_str().unwrap(), product["id"].as_str().unwrap(), 4, &user, None).expect("transfer should commit");
        let movements = database.stock_movements(Some(product["id"].as_str().unwrap()), None, 20).expect("movements should load");
        assert!(movements.iter().any(|row| row["movementType"] == "transfer_out"));
        assert!(movements.iter().any(|row| row["movementType"] == "transfer_in"));
    }
}

fn validate_movement_type(value: &str) -> Result<(), String> {
    match value { "purchase" | "sale" | "sale_return" | "purchase_return" | "manual_add" | "adjustment" | "transfer_in" | "transfer_out" | "count" => Ok(()), _ => Err(format!("نوع حركة المخزون غير مدعوم: {value}")) }
}

fn ensure_warehouse_and_product(transaction: &rusqlite::Transaction<'_>, warehouse_id: &str, product_id: &str) -> Result<(), String> {
    let warehouse_exists: bool = transaction.query_row("SELECT EXISTS(SELECT 1 FROM warehouses WHERE id = ?1 AND active = 1)", [warehouse_id], |row| row.get(0)).map_err(db_error)?;
    if !warehouse_exists { return Err("المستودع غير موجود أو غير فعال".to_string()); }
    let product_stock: Option<i64> = transaction.query_row(
        "SELECT stock_quantity FROM products WHERE id = ?1 AND active = 1",
        [product_id],
        |row| row.get(0),
    ).optional().map_err(db_error)?;
    let initial_stock = match product_stock {
        Some(s) => s,
        None => return Err("المادة غير موجودة أو غير فعالة".to_string()),
    };
    transaction.execute(
        "INSERT OR IGNORE INTO warehouse_stock (warehouse_id, product_id, quantity, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![warehouse_id, product_id, initial_stock, now()],
    ).map_err(db_error)?;
    Ok(())
}

fn sync_total_stock(transaction: &rusqlite::Transaction<'_>, product_id: &str) -> Result<(), String> {
    transaction.execute("UPDATE products SET stock_quantity = (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_stock WHERE product_id = ?1), updated_at = ?2 WHERE id = ?1", params![product_id, now()]).map_err(db_error)?;
    Ok(())
}

fn insert_stock_movement(transaction: &rusqlite::Transaction<'_>, product_id: &str, warehouse_id: &str, movement_type: &str, quantity: i64, before: i64, after: i64, user: &Value, notes: Option<&str>) -> Result<(), String> {
    transaction.execute("INSERT INTO stock_movements (id, product_id, warehouse_id, movement_type, quantity, before_quantity, after_quantity, user_id, user_name, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)", params![Uuid::new_v4().to_string(), product_id, warehouse_id, movement_type, quantity, before, after, user.get("id").and_then(Value::as_str), user.get("displayName").and_then(Value::as_str), notes, now()]).map_err(db_error)?;
    Ok(())
}

fn backfill_manager_inventory_permissions(transaction: &rusqlite::Transaction<'_>) -> Result<(), String> {
    let mut statement = transaction.prepare("SELECT id, permissions FROM users WHERE role = 'manager' AND active = 1").map_err(db_error)?;
    let rows: Vec<(String, String)> = statement.query_map([], |row| Ok((row.get(0)?, row.get(1)?))).map_err(db_error)?.collect::<Result<_, _>>().map_err(db_error)?;
    drop(statement);
    for (id, permissions_json) in rows {
        let mut permissions: Vec<String> = serde_json::from_str(&permissions_json).unwrap_or_default();
        for permission in ["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.count", "warehouse.view", "warehouse.manage"] {
            if !permissions.iter().any(|current| current == "*" || current == "all" || current == permission) {
                permissions.push(permission.to_string());
            }
        }
        let serialized = serde_json::to_string(&permissions).map_err(|error| format!("Invalid permissions: {error}"))?;
        transaction.execute("UPDATE users SET permissions = ?1 WHERE id = ?2", params![serialized, id]).map_err(db_error)?;
    }
    Ok(())
}

fn require_permission(user: &Value, permission: &str) -> Result<(), String> {
    let role = user.get("role").and_then(Value::as_str).unwrap_or("");
    let permissions = user.get("permissions").and_then(Value::as_array);
    if role == "owner" || role == "admin" || permissions.is_some_and(|items| items.iter().any(|item| item.as_str().is_some_and(|value| value == "*" || value == "all" || value == permission))) {
        Ok(())
    } else {
        Err(format!("لا يملك المستخدم صلاحية {permission}"))
    }
}