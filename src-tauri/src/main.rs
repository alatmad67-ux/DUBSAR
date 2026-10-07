
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;

use database::Database;
use serde_json::{json, Value};
use tauri::{command, Manager, State};

#[command]
fn login_user(database: State<'_, Database>, username: String, pin: String) -> Result<Value, String> {
    database.login_user(&username, &pin)
}

#[command]
fn get_setup_status(database: State<'_, Database>) -> Result<Value, String> {
    database.setup_status()
}

#[command(rename_all = "camelCase")]
fn create_first_admin(database: State<'_, Database>, username: String, display_name: String, pin: String) -> Result<Value, String> {
    database.create_first_admin(&username, &display_name, &pin)
}

#[command]
fn get_app_settings(database: State<'_, Database>) -> Result<Value, String> {
    database.app_settings()
}

#[command]
fn save_app_settings(database: State<'_, Database>, settings: Value) -> Result<Value, String> {
    database.save_app_settings(&settings)
}

#[command]
fn get_users(database: State<'_, Database>) -> Result<Vec<Value>, String> {
    database.users()
}

#[command]
fn create_user(database: State<'_, Database>, user: Value) -> Result<Value, String> {
    database.create_user(&user)
}

#[command]
fn delete_user(database: State<'_, Database>, id: String) -> Result<Value, String> {
    database.delete_user(&id)
}

#[command]
fn get_products(database: State<'_, Database>) -> Result<Vec<Value>, String> {
    database.products()
}

#[command]
fn get_warehouses(database: State<'_, Database>) -> Result<Vec<Value>, String> { database.warehouses() }

#[command]
fn create_warehouse(database: State<'_, Database>, warehouse: Value, user: Value) -> Result<Value, String> { database.create_warehouse(&warehouse, &user) }

#[command]
fn update_warehouse(database: State<'_, Database>, id: String, warehouse: Value, user: Value) -> Result<Value, String> { database.update_warehouse(&id, &warehouse, &user) }

#[command]
fn get_warehouse_stock(database: State<'_, Database>, warehouse_id: Option<String>) -> Result<Vec<Value>, String> { database.warehouse_stock(warehouse_id.as_deref()) }

#[command]
fn get_stock_movements(database: State<'_, Database>, product_id: Option<String>, warehouse_id: Option<String>, limit: Option<i64>) -> Result<Vec<Value>, String> { database.stock_movements(product_id.as_deref(), warehouse_id.as_deref(), limit.unwrap_or(100)) }

#[command(rename_all = "camelCase")]
fn get_product_details(database: State<'_, Database>, product_id: String) -> Result<Value, String> { database.product_details(&product_id) }

#[command(rename_all = "camelCase")]
fn adjust_stock(database: State<'_, Database>, warehouse_id: String, product_id: String, delta: i64, movement_type: String, user: Value, notes: Option<String>) -> Result<Value, String> { database.adjust_stock(&warehouse_id, &product_id, delta, &movement_type, &user, notes.as_deref()) }

#[command(rename_all = "camelCase")]
fn transfer_stock(database: State<'_, Database>, source_id: String, target_id: String, product_id: String, quantity: i64, user: Value, notes: Option<String>) -> Result<Value, String> { database.transfer_stock(&source_id, &target_id, &product_id, quantity, &user, notes.as_deref()) }

#[command(rename_all = "camelCase")]
fn count_stock(database: State<'_, Database>, warehouse_id: String, product_id: String, actual_quantity: i64, user: Value, notes: Option<String>) -> Result<Value, String> { database.count_stock(&warehouse_id, &product_id, actual_quantity, &user, notes.as_deref()) }

#[command]
fn get_customers(database: State<'_, Database>) -> Result<Vec<Value>, String> {
    database.customers()
}

#[command]
fn create_customer(database: State<'_, Database>, customer: Value, user: Value) -> Result<Value, String> {
    database.create_customer(&customer, &user)
}

#[command]
fn update_customer(database: State<'_, Database>, id: String, customer: Value, user: Value) -> Result<Value, String> {
    database.update_customer(&id, &customer, &user)
}

#[command]
fn get_system_printers() -> Result<Vec<Value>, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", "Get-CimInstance Win32_Printer | Select-Object Name, Default, PortName | ConvertTo-Json -Compress"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("تعذر الاستعلام عن الطابعات: {e}"))?;

        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout.is_empty() {
            return Ok(vec![]);
        }

        if let Ok(parsed) = serde_json::from_str::<Value>(&stdout) {
            if let Some(arr) = parsed.as_array() {
                return Ok(arr.clone());
            } else if parsed.is_object() {
                return Ok(vec![parsed]);
            }
        }
    }
    Ok(vec![json!({ "Name": "Microsoft Print to PDF", "Default": true, "PortName": "PORTPROMPT:" })])
}

#[command(rename_all = "camelCase")]
fn print_test_page(printer_name: Option<String>) -> Result<Value, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let script = match printer_name {
            Some(ref name) if !name.trim().is_empty() => {
                let escaped = name.replace("'", "''");
                format!("(Get-CimInstance Win32_Printer -Filter \"Name = '{escaped}'\").PrintTestPage()")
            }
            _ => "(Get-CimInstance Win32_Printer | Where-Object { $_.Default -eq $true }).PrintTestPage()".to_string(),
        };

        let output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", &script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("فشل تنفيذ طباعة الاختبار: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("خطأ في طباعة الاختبار: {stderr}"));
        }
    }
    Ok(json!({ "success": true, "message": "تم إرسال صفحة الاختبار بنجاح" }))
}

#[command]
fn get_suppliers(database: State<'_, Database>) -> Result<Vec<Value>, String> { database.suppliers() }

#[command]
fn create_supplier(database: State<'_, Database>, supplier: Value, user: Value) -> Result<Value, String> { database.create_supplier(&supplier, &user) }

#[command]
fn update_supplier(database: State<'_, Database>, id: String, supplier: Value, user: Value) -> Result<Value, String> { database.update_supplier(&id, &supplier, &user) }

#[command]
fn get_purchases(database: State<'_, Database>) -> Result<Vec<Value>, String> { database.purchases() }

#[command(rename_all = "camelCase")]
fn create_purchase(database: State<'_, Database>, purchase: Value, user: Value) -> Result<Value, String> { database.create_purchase(&purchase, &user) }

#[command]
fn create_product(database: State<'_, Database>, product: Value) -> Result<Value, String> {
    database.create_product(&product)
}

#[command]
fn update_product(database: State<'_, Database>, id: String, product: Value) -> Result<Value, String> {
    database.update_product(&id, &product)
}

#[command]
fn delete_product(database: State<'_, Database>, id: String) -> Result<Value, String> {
    database.delete_product(&id)
}

#[command]
fn save_product(database: State<'_, Database>, product: Value) -> Result<Value, String> {
    database.create_product(&product)
}

#[command]
fn get_categories(database: State<'_, Database>) -> Result<Vec<Value>, String> {
    database.categories()
}

#[command]
fn create_category(database: State<'_, Database>, category: Value) -> Result<Value, String> {
    database.create_category(&category)
}

#[command]
fn update_category(database: State<'_, Database>, id: String, category: Value) -> Result<Value, String> {
    database.update_category(&id, &category)
}

#[command]
fn delete_category(database: State<'_, Database>, id: String) -> Result<Value, String> {
    database.delete_category(&id)
}

#[command]
fn save_category(database: State<'_, Database>, name: String, image: Option<String>) -> Result<Value, String> {
    database.create_category(&json!({ "name": name, "image": image }))
}

#[command]
fn get_sales(database: State<'_, Database>) -> Result<Vec<Value>, String> {
    database.sales()
}

#[command]
fn process_sale(database: State<'_, Database>, cart: Value, customer: Value, payment: Value, user: Value) -> Result<Value, String> {
    database.process_sale(&cart, &customer, &payment, &user)
}

#[command]
fn update_sale(database: State<'_, Database>, id: String, cart: Value, customer: Value, payment: Value, user: Value) -> Result<Value, String> {
    database.update_sale(&id, &cart, &customer, &payment, &user)
}

#[command]
fn log_audit(database: State<'_, Database>, action: String, details: String, user: String, module: Option<String>) -> Result<Value, String> {
    database.log_audit(&action, module.as_deref(), &details, &user)
}

#[command]
fn get_audit_logs(database: State<'_, Database>, count: Option<i64>) -> Result<Vec<Value>, String> {
    database.audit_logs(count.unwrap_or(50))
}

#[command]
fn get_tasks(database: State<'_, Database>) -> Result<Vec<Value>, String> {
    database.tasks()
}

#[command]
fn create_task(database: State<'_, Database>, task: Value, user: Option<Value>) -> Result<Value, String> {
    let u = user.unwrap_or_else(|| json!({"displayName": "مدير النظام"}));
    database.create_task(&task, &u)
}

#[command]
fn update_task(database: State<'_, Database>, id: String, task: Value, user: Option<Value>) -> Result<Value, String> {
    let u = user.unwrap_or_else(|| json!({"displayName": "مدير النظام"}));
    database.update_task(&id, &task, &u)
}

#[command]
fn delete_task(database: State<'_, Database>, id: String, user: Option<Value>) -> Result<Value, String> {
    let u = user.unwrap_or_else(|| json!({"displayName": "مدير النظام"}));
    database.delete_task(&id, &u)
}

#[command(rename_all = "camelCase")]
fn backup_database(database: State<'_, Database>, dest_path: String) -> Result<Value, String> {
    database.backup_database(&dest_path)
}

#[command(rename_all = "camelCase")]
fn restore_database(database: State<'_, Database>, src_path: String) -> Result<Value, String> {
    database.restore_database(&src_path)
}

#[command]
fn app_minimize(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[command]
fn app_toggle_maximize(window: tauri::Window) -> Result<(), String> {
    let is_max = window.is_maximized().map_err(|e| e.to_string())?;
    if is_max {
        window.unmaximize().map_err(|e| e.to_string())?;
    } else {
        window.maximize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[command]
fn app_close(window: tauri::Window) -> Result<(), String> {
    window.destroy().map_err(|e| e.to_string())
}

#[command]
fn set_login_window(window: tauri::Window) -> Result<(), String> {
    let _ = window.unmaximize();
    window.set_resizable(false).map_err(|e| e.to_string())?;
    window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 440.0, height: 620.0 })).map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
fn set_main_window(window: tauri::Window) -> Result<(), String> {
    window.set_resizable(true).map_err(|e| e.to_string())?;
    window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 1280.0, height: 800.0 })).map_err(|e| e.to_string())?;
    window.center().map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
fn app_relaunch(app: tauri::AppHandle) {
    app.restart();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().map_err(|error| std::io::Error::other(format!("Cannot resolve app data directory: {error}")))?;
            let database_path = app_data_dir.join("dubsar.sqlite3");
            app.manage(Database::open(database_path).map_err(std::io::Error::other)?);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            login_user,
            get_setup_status,
            create_first_admin,
            get_app_settings,
            save_app_settings,
            get_users,
            create_user,
            delete_user,
            get_products,
            get_warehouses,
            create_warehouse,
            update_warehouse,
            get_warehouse_stock,
            get_stock_movements,
            get_product_details,
            adjust_stock,
            transfer_stock,
            count_stock,
            get_customers,
            create_customer,
            update_customer,
            get_suppliers,
            create_supplier,
            update_supplier,
            get_purchases,
            create_purchase,
            create_product,
            update_product,
            save_product,
            delete_product,
            get_categories,
            create_category,
            update_category,
            delete_category,
            save_category,
            get_sales,
            process_sale,
            update_sale,
            get_system_printers,
            print_test_page,
            log_audit,
            get_audit_logs,
            get_tasks,
            create_task,
            update_task,
            delete_task,
            backup_database,
            restore_database,
            app_minimize,
            app_toggle_maximize,
            app_close,
            set_login_window,
            set_main_window,
            app_relaunch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
