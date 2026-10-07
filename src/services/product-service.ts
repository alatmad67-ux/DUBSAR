
import { Product } from '@/core/entities/product';
import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

/**
 * @fileOverview Product Service Layer v2.0 (Adapted for Tauri Desktop).
 */

export class ProductService {
  private static adapter = AdapterFactory.getAdapter();

  static async getAllProducts(_tenantId?: string): Promise<Product[]> {
    return await this.adapter.query(DB_COMMANDS.GET_PRODUCTS) as Product[];
  }

  static async createProduct(data: any) {
    const result = await this.adapter.execute(DB_COMMANDS.CREATE_PRODUCT, { product: data });
    return result.id;
  }

  static async updateProduct(id: string, data: Partial<Product>) {
    return await this.adapter.execute(DB_COMMANDS.UPDATE_PRODUCT, { id, product: data });
  }

  static async deleteProduct(id: string) {
    return await this.adapter.execute(DB_COMMANDS.DELETE_PRODUCT, { id });
  }

  static async updateStock(productId: string, quantity: number) {
    // Tauri specific stock update would be invoked here
    console.log(`[ProductService] Mock updating stock for ${productId} by ${quantity}`);
  }
}
