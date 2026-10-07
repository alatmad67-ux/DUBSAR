
/**
 * @fileOverview Interface for Database operations.
 * Allows switching between Tauri (Production) and Mock (Browser Preview).
 */
export interface DatabaseAdapter {
  execute(command: string, args?: any): Promise<any>;
  query(command: string, args?: any): Promise<any[]>;
}

export const DB_COMMANDS = {
  LOGIN: 'login_user',
  GET_SETUP_STATUS: 'get_setup_status',
  CREATE_FIRST_ADMIN: 'create_first_admin',
  GET_APP_SETTINGS: 'get_app_settings',
  SAVE_APP_SETTINGS: 'save_app_settings',
  GET_PRODUCTS: 'get_products',
  GET_WAREHOUSES: 'get_warehouses',
  CREATE_WAREHOUSE: 'create_warehouse',
  UPDATE_WAREHOUSE: 'update_warehouse',
  GET_WAREHOUSE_STOCK: 'get_warehouse_stock',
  GET_STOCK_MOVEMENTS: 'get_stock_movements',
  GET_PRODUCT_DETAILS: 'get_product_details',
  ADJUST_STOCK: 'adjust_stock',
  TRANSFER_STOCK: 'transfer_stock',
  COUNT_STOCK: 'count_stock',
  GET_CUSTOMERS: 'get_customers',
  CREATE_CUSTOMER: 'create_customer',
  UPDATE_CUSTOMER: 'update_customer',
  GET_SUPPLIERS: 'get_suppliers',
  CREATE_SUPPLIER: 'create_supplier',
  UPDATE_SUPPLIER: 'update_supplier',
  GET_PURCHASES: 'get_purchases',
  CREATE_PURCHASE: 'create_purchase',
  CREATE_PRODUCT: 'create_product',
  UPDATE_PRODUCT: 'update_product',
  SAVE_PRODUCT: 'create_product',
  DELETE_PRODUCT: 'delete_product',
  GET_CATEGORIES: 'get_categories',
  CREATE_CATEGORY: 'create_category',
  UPDATE_CATEGORY: 'update_category',
  DELETE_CATEGORY: 'delete_category',
  SAVE_CATEGORY: 'create_category',
  PROCESS_SALE: 'process_sale',
  UPDATE_SALE: 'update_sale',
  GET_SYSTEM_PRINTERS: 'get_system_printers',
  PRINT_TEST_PAGE: 'print_test_page',
  LOG_AUDIT: 'log_audit',
  GET_AUDIT_LOGS: 'get_audit_logs',
  GET_SALES: 'get_sales',
  GET_USERS: 'get_users',
  CREATE_USER: 'create_user',
  DELETE_USER: 'delete_user',
  GET_TASKS: 'get_tasks',
  CREATE_TASK: 'create_task',
  UPDATE_TASK: 'update_task',
  DELETE_TASK: 'delete_task',
  BACKUP_DATABASE: 'backup_database',
  RESTORE_DATABASE: 'restore_database'
};
