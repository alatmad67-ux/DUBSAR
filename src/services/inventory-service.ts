
'use client';

import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

/**
 * @fileOverview Inventory Management Service.
 */
export class InventoryService {
  private static adapter = AdapterFactory.getAdapter();

  static async getProducts() {
    return await this.adapter.query(DB_COMMANDS.GET_PRODUCTS);
  }

  static async getWarehouses() { return await this.adapter.query(DB_COMMANDS.GET_WAREHOUSES); }
  static async createWarehouse(data: { name: string; description?: string }, user: any) { return await this.adapter.execute(DB_COMMANDS.CREATE_WAREHOUSE, { warehouse: data, user }); }
  static async updateWarehouse(id: string, data: { name?: string; description?: string; active?: boolean }, user: any) { return await this.adapter.execute(DB_COMMANDS.UPDATE_WAREHOUSE, { id, warehouse: data, user }); }
  static async getWarehouseStock(warehouseId?: string) { return await this.adapter.query(DB_COMMANDS.GET_WAREHOUSE_STOCK, { warehouseId }); }
  static async getStockMovements(productId?: string, warehouseId?: string, limit = 100) { return await this.adapter.query(DB_COMMANDS.GET_STOCK_MOVEMENTS, { productId, warehouseId, limit }); }
  static async getProductDetails(productId: string) { return await this.adapter.execute(DB_COMMANDS.GET_PRODUCT_DETAILS, { productId }); }
  static async adjustStock(warehouseId: string, productId: string, delta: number, movementType: string, user: any, notes?: string) { return await this.adapter.execute(DB_COMMANDS.ADJUST_STOCK, { warehouseId, productId, delta, movementType, user, notes }); }
  static async transferStock(sourceId: string, targetId: string, productId: string, quantity: number, user: any, notes?: string) { return await this.adapter.execute(DB_COMMANDS.TRANSFER_STOCK, { sourceId, targetId, productId, quantity, user, notes }); }
  static async countStock(warehouseId: string, productId: string, actualQuantity: number, user: any, notes?: string) { return await this.adapter.execute(DB_COMMANDS.COUNT_STOCK, { warehouseId, productId, actualQuantity, user, notes }); }

  static async getCustomers() {
    return await this.adapter.query(DB_COMMANDS.GET_CUSTOMERS);
  }
  static async createCustomer(data: any, user: any) { return await this.adapter.execute(DB_COMMANDS.CREATE_CUSTOMER, { customer: data, user }); }
  static async updateCustomer(id: string, data: any, user: any) { return await this.adapter.execute(DB_COMMANDS.UPDATE_CUSTOMER, { id, customer: data, user }); }
  static async getSuppliers() { return await this.adapter.query(DB_COMMANDS.GET_SUPPLIERS); }
  static async createSupplier(data: any, user: any) { return await this.adapter.execute(DB_COMMANDS.CREATE_SUPPLIER, { supplier: data, user }); }
  static async updateSupplier(id: string, data: any, user: any) { return await this.adapter.execute(DB_COMMANDS.UPDATE_SUPPLIER, { id, supplier: data, user }); }
  static async getPurchases() { return await this.adapter.query(DB_COMMANDS.GET_PURCHASES); }
  static async createPurchase(data: any, user: any) { return await this.adapter.execute(DB_COMMANDS.CREATE_PURCHASE, { purchase: data, user }); }

  static async saveProduct(data: any) {
    return await this.adapter.execute(DB_COMMANDS.CREATE_PRODUCT, { product: data });
  }

  static async updateProduct(id: string, data: any) {
    return await this.adapter.execute(DB_COMMANDS.UPDATE_PRODUCT, { id, product: data });
  }

  static async deleteProduct(id: string) {
    return await this.adapter.execute(DB_COMMANDS.DELETE_PRODUCT, { id });
  }

  static async getCategories() {
    return await this.adapter.query(DB_COMMANDS.GET_CATEGORIES);
  }

  static async saveCategory(name: string, image?: string) {
    return await this.adapter.execute(DB_COMMANDS.CREATE_CATEGORY, { category: { name, image } });
  }

  static async updateCategory(id: string, data: { name?: string; image?: string; active?: boolean }) {
    return await this.adapter.execute(DB_COMMANDS.UPDATE_CATEGORY, { id, category: data });
  }

  static async deleteCategory(id: string) {
    return await this.adapter.execute(DB_COMMANDS.DELETE_CATEGORY, { id });
  }
}
