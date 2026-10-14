
import { db } from '../database/sqlite/client';
import { sales, saleItems, products, auditLogs } from '../database/sqlite/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class SqliteSaleRepository {
  async getAll() {
    return await db.select().from(sales).orderBy(sql`${sales.createdAt} desc`);
  }

  async getById(id: string) {
    const sale = await db.select().from(sales).where(eq(sales.id, id)).get();
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    return { ...sale, items };
  }

  async create(data: {
    customerId?: string;
    customerName: string;
    items: any[];
    totalAmount: number;
    paidAmount: number;
    paymentMethod: string;
    userName: string;
  }) {
    const saleId = uuidv4();
    return await db.transaction(async (tx) => {
      const countRes = await tx.select({ count: sql`count(*)` }).from(sales);
      const invoiceNo = String(Number((countRes[0] as any)?.count || 0) + 1).padStart(4, '0');

      // 1. Create Sale Header
      await tx.insert(sales).values({
        id: saleId,
        invoiceNo,
        customerId: data.customerId,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        paymentMethod: data.paymentMethod,
        createdAt: Date.now(),
      });

      // 2. Create Sale Items & Update Stock
      for (const item of data.items) {
        await tx.insert(saleItems).values({
          id: uuidv4(),
          saleId,
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        });

        // Deduct from Stock
        await tx.update(products)
          .set({ 
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
            updatedAt: Date.now() 
          })
          .where(eq(products.id, item.id));
      }

      // 3. Log the Action
      await tx.insert(auditLogs).values({
        action: 'عملية بيع جديدة',
        details: `فاتورة رقم ${invoiceNo} بقيمة ${data.totalAmount}`,
        userName: data.userName,
        timestamp: Date.now(),
      });

      return { saleId, invoiceNo };
    });
  }
}
