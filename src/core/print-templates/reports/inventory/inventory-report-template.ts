/**
 * @fileOverview Inventory Valuation & Stock Report Template (A4 Multi-page).
 * Detailed breakdown of stock levels, categories, purchase prices, sell prices, and valuation.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface InventoryItemRow {
  code?: string;
  name: string;
  category?: string;
  unit?: string;
  quantity: number;
  costPrice?: number;
  sellPrice: number;
  totalCost?: number;
  totalValue: number;
}

export interface InventoryReportInputData extends DocumentRenderData {
  inventoryStats?: {
    totalItemsCount: number;
    totalQuantity: number;
    totalCostValuation?: number;
    totalSellValuation: number;
    expectedProfitValuation?: number;
  };
  inventoryItems?: InventoryItemRow[];
}

export function renderInventoryReportTemplate(template: DocumentTemplate, data: InventoryReportInputData): string {
  const items = data.inventoryItems || [];
  const stats = data.inventoryStats || {
    totalItemsCount: items.length,
    totalQuantity: items.reduce((s, i) => s + (i.quantity || 0), 0),
    totalSellValuation: items.reduce((s, i) => s + (i.totalValue || 0), 0),
  };

  const kpis: ReportKpiCard[] = [
    { label: 'عدد الأصناف', value: formatNumber(stats.totalItemsCount) },
    { label: 'إجمالي الكميات بالمخزن', value: formatNumber(stats.totalQuantity) },
    { label: 'إجمالي قيمة البيع', value: `${formatCurrency(stats.totalSellValuation)} د.ع`, highlightColor: '#006494' },
  ];

  if (stats.totalCostValuation !== undefined) {
    kpis.push({ label: 'إجمالي التكلفة (رأس المال)', value: `${formatCurrency(stats.totalCostValuation)} د.ع`, highlightColor: '#13293d' });
  }
  if (stats.expectedProfitValuation !== undefined) {
    kpis.push({ label: 'الربح المتوقع للمخزون', value: `${formatCurrency(stats.expectedProfitValuation)} د.ع`, highlightColor: '#15803d' });
  }

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'الباركود / الكود', width: '90px', align: 'center' },
    { header: 'اسم المادة / الصنف', width: '160px', align: 'right' },
    { header: 'التصنيف', width: '90px', align: 'center' },
    { header: 'الوحدة', width: '60px', align: 'center' },
    { header: 'الكمية', width: '65px', align: 'center' },
    { header: 'سعر المفرد', width: '80px', align: 'left' },
    { header: 'إجمالي القيمة', width: '90px', align: 'left' },
  ];

  const rows = items.map((it, idx) => [
    idx + 1,
    it.code || '-',
    it.name,
    it.category || '-',
    it.unit || 'قطعة',
    formatNumber(it.quantity),
    formatCurrency(it.sellPrice),
    formatCurrency(it.totalValue || (it.quantity * it.sellPrice)),
  ]);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || 'تقرير جرد المخزون وتقييم البضاعة',
      periodText: data.document?.date ? `تاريخ الجرد: ${data.document.date}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي عدد الأصناف المعروضة:', value: `${formatNumber(items.length)} مادة` },
        { label: 'إجمالي القيمة التقديرية للبيع:', value: `${formatCurrency(stats.totalSellValuation)} د.ع`, color: '#006494' },
      ],
      organizerSignatureText: 'أمين المستودع / الجرد',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
