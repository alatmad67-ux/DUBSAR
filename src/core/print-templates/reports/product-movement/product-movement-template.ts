/**
 * @fileOverview Product Movement & Inventory Tracking Template (A4 Multi-page).
 * Detailed breakdown of a specific product's in/out flow, purchases, sales, adjustments, and balance.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface ProductMovementRow {
  date: string;
  type: 'sale' | 'purchase' | 'return_sale' | 'return_purchase' | 'adjustment';
  docNumber?: string;
  partyName?: string;
  qtyIn: number;
  qtyOut: number;
  unitPrice: number;
  runningQty: number;
  notes?: string;
}

export interface ProductMovementReportInputData extends DocumentRenderData {
  productInfo?: {
    barcode?: string;
    name: string;
    unit?: string;
    category?: string;
    currentStock: number;
    initialStock?: number;
    totalIn: number;
    totalOut: number;
  };
  movements?: ProductMovementRow[];
}

export function renderProductMovementReportTemplate(template: DocumentTemplate, data: ProductMovementReportInputData): string {
  const p = data.productInfo || {
    name: 'مادة غير محددة',
    currentStock: 0,
    totalIn: 0,
    totalOut: 0,
  };
  const moves = data.movements || [];

  const kpis: ReportKpiCard[] = [
    { label: 'اسم المادة', value: p.name },
    { label: 'الباركود', value: p.barcode || '-' },
    { label: 'إجمالي الوارد (شراء/إرجاع)', value: `${formatNumber(p.totalIn)} ${p.unit || 'قطعة'}`, highlightColor: '#15803d' },
    { label: 'إجمالي الصادر (بيع/تلف)', value: `${formatNumber(p.totalOut)} ${p.unit || 'قطعة'}`, highlightColor: '#dc2626' },
    { label: 'الرصيد الحالي بالمخزن', value: `${formatNumber(p.currentStock)} ${p.unit || 'قطعة'}`, highlightColor: '#006494' },
  ];

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'التاريخ', width: '85px', align: 'center' },
    { header: 'نوع الحركة', width: '100px', align: 'center' },
    { header: 'رقم المستند', width: '90px', align: 'center' },
    { header: 'الجهة / الحساب', width: '130px', align: 'right' },
    { header: 'وارد (+)', width: '70px', align: 'center' },
    { header: 'صادر (-)', width: '70px', align: 'center' },
    { header: 'السعر', width: '80px', align: 'left' },
    { header: 'الرصيد المخزني', width: '90px', align: 'center' },
  ];

  const typeNames: Record<string, string> = {
    sale: 'فاتورة بيع',
    purchase: 'فاتورة شراء',
    return_sale: 'مرتجع مبيعات',
    return_purchase: 'مرتجع مشتريات',
    adjustment: 'تسوية جردية',
  };

  const rows = moves.map((m, idx) => [
    idx + 1,
    m.date,
    typeNames[m.type] || m.type,
    m.docNumber || '-',
    m.partyName || '-',
    m.qtyIn > 0 ? `<span style="color: #15803d; font-weight: bold;">+${formatNumber(m.qtyIn)}</span>` : '-',
    m.qtyOut > 0 ? `<span style="color: #dc2626; font-weight: bold;">-${formatNumber(m.qtyOut)}</span>` : '-',
    formatCurrency(m.unitPrice),
    `<strong>${formatNumber(m.runningQty)}</strong>`,
  ]);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || `كشف حركة مادة: ${p.name}`,
      periodText: data.reportData?.startDate ? `الفترة من: ${data.reportData.startDate} إلى: ${data.reportData.endDate || data.reportData.startDate}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي الكميات الداخلة للمخزن:', value: `${formatNumber(p.totalIn)} ${p.unit || 'قطعة'}`, color: '#15803d' },
        { label: 'إجمالي الكميات الخارجة من المخزن:', value: `${formatNumber(p.totalOut)} ${p.unit || 'قطعة'}`, color: '#dc2626' },
        { label: 'الرصيد النهائي المتبقي في المخازن:', value: `${formatNumber(p.currentStock)} ${p.unit || 'قطعة'}`, color: '#006494' },
      ],
      organizerSignatureText: 'مراقب حركة المواد',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
