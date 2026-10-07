'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { InventoryService } from '@/services/inventory-service';

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const productId = params?.id;
    if (!productId) return;

    InventoryService.getProductDetails(productId)
      .then(setData)
      .catch((reason) => setError(String(reason)));
  }, [params?.id]);

  if (error) return <div className="p-8 text-red-700 font-bold">{error}</div>;
  if (!data) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

  const product = data.product;
  const total = data.warehouses.reduce((sum: number, row: any) => sum + Number(row.quantity || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-black">تفاصيل المادة</h1>
        <p className="text-sm font-bold text-muted-foreground">
          {product.name} | {product.brand || 'بدون ماركة'} | {product.barcode || 'بدون باركود'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['المفرد', product.retailPrice],
          ['الجملة', product.wholesalePrice],
          ['الوكيل', product.agentPrice],
          ['سعر الشراء', product.purchasePrice],
          ['الإجمالي', total],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-white p-4">
            <p className="text-xs font-bold text-muted-foreground">{label}</p>
            <p className="text-xl font-black">{Number(value || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-black mb-4">المخزون حسب المستودع</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-right">المستودع</th>
              <th className="p-3 text-right">الكمية</th>
            </tr>
          </thead>
          <tbody>
            {data.warehouses.map((row: any) => (
              <tr key={row.warehouseName} className="border-b">
                <td className="p-3">{row.warehouseName}</td>
                <td className="p-3 font-black">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-black mb-4">آخر الحركات</h2>
          {data.movements.map((row: any) => (
            <div key={row.id} className="border-b py-3 text-sm">
              <b>{row.movementType}</b> | {row.quantity} | {row.warehouseName}
              <span className="block text-xs text-muted-foreground">
                {row.userName || '-'} - {new Date(row.createdAt).toLocaleString('ar-IQ')}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-black mb-4">آخر عمليات البيع</h2>
          {data.sales.map((row: any) => (
            <div key={`${row.invoiceNo}-${row.createdAt}`} className="border-b py-3 text-sm">
              <b>{row.invoiceNo}</b> | {row.quantity} × {Number(row.unitPrice).toLocaleString()}
              <span className="block text-xs text-muted-foreground">
                {row.customerName || '-'} - {new Date(row.createdAt).toLocaleString('ar-IQ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
