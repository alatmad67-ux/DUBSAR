/**
 * @fileOverview Purchases Report Template (A4 Multi-page).
 * Standardized corporate report for purchase transactions, suppliers, and costs.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface PurchasesReportInputData extends DocumentRenderData {
  purchasesStats?: {
    totalPurchases: number;
    cashPurchases?: number;
    creditPurchases?: number;
    invoicesCount: number;
    totalDiscount?: number;
  };
  transactions?: Array<{
    invoiceNo: string;
    date: string;
    supplierName: string;
    paymentType: string;
    subtotal: number;
    discount?: number;
    netTotal: number;
    paidAmount?: number;
    remainingAmount?: number;
  }>;
}

export function renderPurchasesReportTemplate(template: DocumentTemplate, data: PurchasesReportInputData): string {
  const stats = data.purchasesStats || {
    totalPurchases: data.totals?.netTotal || 0,
    invoicesCount: data.items?.length || 0,
  };

  const kpis: ReportKpiCard[] = [
    { label: 'إجمالي المشتريات', value: `${formatCurrency(stats.totalPurchases)} د.ع`, highlightColor: '#13293d' },
    { label: 'عدد فواتير الشراء', value: formatNumber(stats.invoicesCount) },
  ];

  if (stats.cashPurchases !== undefined) {
    kpis.push({ label: 'مشتريات نقدية', value: `${formatCurrency(stats.cashPurchases)} د.ع` });
  }
  if (stats.creditPurchases !== undefined) {
    kpis.push({ label: 'مشتريات آجلة', value: `${formatCurrency(stats.creditPurchases)} د.ع`, highlightColor: '#c2410c' });
  }

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'رقم القائمة', width: '80px', align: 'center' },
    { header: 'التاريخ', width: '80px', align: 'center' },
    { header: 'المجهز / المورد', width: '130px', align: 'right' },
    { header: 'طريقة الدفع', width: '70px', align: 'center' },
    { header: 'الإجمالي', width: '80px', align: 'left' },
    { header: 'المدفوع', width: '80px', align: 'left' },
    { header: 'المتبقي', width: '80px', align: 'left' },
  ];

  const txs = data.transactions || [];
  const rows = txs.map((t, idx) => [
    idx + 1,
    t.invoiceNo,
    t.date,
    t.supplierName || 'مورد عام',
    t.paymentType || 'نقداً',
    formatCurrency(t.netTotal),
    formatCurrency(t.paidAmount ?? t.netTotal),
    formatCurrency(t.remainingAmount ?? 0),
  ]);

  const totalRemaining = txs.reduce((sum, t) => sum + (t.remainingAmount || 0), 0);
  const totalPaid = txs.reduce((sum, t) => sum + (t.paidAmount ?? t.netTotal), 0);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || 'تقرير المشتريات وفواتير الموردين',
      periodText: data.reportData?.startDate ? `الفترة من: ${data.reportData.startDate} إلى: ${data.reportData.endDate || data.reportData.startDate}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي المبالغ المدفوعة:', value: `${formatCurrency(totalPaid || stats.totalPurchases)} د.ع`, color: '#15803d' },
        { label: 'إجمالي المتبقي للموردين:', value: `${formatCurrency(totalRemaining)} د.ع`, color: totalRemaining > 0 ? '#c2410c' : undefined },
        { label: 'صافي إجمالي المشتريات:', value: `${formatCurrency(stats.totalPurchases)} د.ع`, color: '#13293d' },
      ],
      organizerSignatureText: 'مسؤول المشتريات',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
