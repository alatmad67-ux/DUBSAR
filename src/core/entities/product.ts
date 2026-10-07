
/**
 * @fileOverview Domain entity for Product in DUBSAR 2.0.
 */

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  purchasePrice: number;
  retailPrice: number;
  wholesalePrice: number;
  agentPrice: number;
  unit?: string;
  stockQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  status: 'available' | 'out_of_stock' | 'discontinued';
  createdAt: number;
  updatedAt: number;
}
