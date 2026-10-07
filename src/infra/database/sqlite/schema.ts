
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * @fileOverview المخطط الشامل لقاعدة بيانات DUBSAR 2.0 المحلية المحدثة.
 */

// 1. الأقسام والمنتجات
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  active: integer('active', { mode: 'boolean' }).default(1),
  createdAt: integer('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => categories.id),
  name: text('name').notNull(),
  sku: text('sku'),
  barcode: text('barcode'),
  description: text('description'),
  purchasePrice: real('purchase_price').default(0),
  retailPrice: real('retail_price').default(0),
  wholesalePrice: real('wholesale_price').default(0),
  agentPrice: real('agent_price').default(0),
  unit: text('unit'),
  brand: text('brand'),
  stockQuantity: integer('stock_quantity').default(0),
  minStockLevel: integer('min_stock_level').default(5),
  storageLocation: text('storage_location'),
  imageUrl: text('image_url'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(0),
  status: text('status').default('available'),
  active: integer('active', { mode: 'boolean' }).default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 2. الزبائن والموردين
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  balance: real('balance').default(0),
  createdAt: integer('created_at').notNull(),
});

export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  balance: real('balance').default(0),
  createdAt: integer('created_at').notNull(),
});

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  purchaseNo: text('purchase_no').unique().notNull(),
  supplierId: text('supplier_id').references(() => suppliers.id).notNull(),
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').default(0),
  createdAt: integer('created_at').notNull(),
});

// 3. المبيعات والمشتريات
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(),
  invoiceNo: text('invoice_no').unique().notNull(),
  customerId: text('customer_id').references(() => customers.id),
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').default(0),
  paymentMethod: text('payment_method'), // cash, credit
  createdBy: text('created_by'), // local user id
  createdAt: integer('created_at').notNull(),
  priceType: text('price_type').default('retail'),
  paymentStatus: text('payment_status').default('paid'),
  discountAmount: real('discount_amount').default(0),
});

export const saleItems = sqliteTable('sale_items', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').references(() => sales.id),
  productId: text('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  totalPrice: real('total_price').notNull(),
  priceType: text('price_type').default('retail'),
});

// 4. المستخدمين والصلاحيات (Local Auth)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').unique().notNull(),
  displayName: text('display_name').notNull(),
  pinHash: text('pin_hash').notNull(), // SHA-256
  role: text('role').notNull(), // 'owner' | 'manager' | 'staff'
  permissions: text('permissions'), // JSON array string
  active: integer('active', { mode: 'boolean' }).default(1),
  lastLogin: integer('last_login'),
  createdAt: integer('created_at').notNull(),
});

// 5. سجل التدقيق المحلي (Local Audit Log)
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(),
  module: text('module'), // 'inventory' | 'sales' | 'users'
  details: text('details'),
  timestamp: integer('timestamp').notNull(),
});

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  businessName: text('business_name'),
  logo: text('logo'),
  phone: text('phone'),
  address: text('address'),
  businessType: text('business_type'),
  invoiceHeaderImage: text('invoice_header_image'),
});
