/**
 * @fileOverview Sales Report Template (A4 Multi-page).
 * Standardized corporate report for sales transactions, summaries, and KPIs.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface SalesReportInputData extends DocumentRenderData {
  salesStats?: {
    totalSales: number;
    cashSales?: number;
    creditSales?: number;
    invoicesCount: number;
    totalDiscount?: number;
    netProfit?: number;
  };
  transactions?: Array<{
    invoiceNo: string;
    date: string;
    customerName: string;
    paymentType: string;
    subtotal: number;
    discount?: number;
    netTotal: number;
    paidAmount?: number;
    remainingAmount?: number;
  }>;
}

export function renderSalesReportTemplate(template: DocumentTemplate, data: SalesReportInputData): string {
  const stats = data.salesStats || {
    totalSales: data.totals?.netTotal || 0,
    invoicesCount: data.items?.length || 0,
  };

  const kpis: ReportKpiCard[] = [
    { label: 'إجمالي المبيعات', value: `${formatCurrency(stats.totalSales)} د.ع`, highlightColor: '#006494' },
    { label: 'عدد الفواتير', value: formatNumber(stats.invoicesCount) },
  ];

  if (stats.cashSales !== undefined) {
    kpis.push({ label: 'مبيعات نقدية', value: `${formatCurrency(stats.cashSales)} د.ع` });
  }
  if (stats.creditSales !== undefined) {
    kpis.push({ label: 'مبيعات آجلة', value: `${formatCurrency(stats.creditSales)} د.ع`, highlightColor: '#c2410c' });
  }
  if (stats.netProfit !== undefined) {
    kpis.push({ label: 'صافي الأرباح', value: `${formatCurrency(stats.netProfit)} د.ع`, highlightColor: '#15803d' });
  }

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'رقم الفاتورة', width: '80px', align: 'center' },
    { header: 'التاريخ', width: '80px', align: 'center' },
    { header: 'الزبون / العميل', width: '130px', align: 'right' },
    { header: 'نوع الدفع', width: '60px', align: 'center' },
    { header: 'الإجمالي', width: '80px', align: 'left' },
    { header: 'الواصل', width: '80px', align: 'left' },
    { header: 'المتبقي', width: '80px', align: 'left' },
  ];

  const txs = data.transactions || [];
  const rows = txs.map((t, idx) => [
    idx + 1,
    t.invoiceNo,
    t.date,
    t.customerName || 'عميل نقدي',
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
      title: data.document?.title || 'تقرير المبيعات التفصيلي',
      periodText: data.reportData?.startDate ? `الفترة من: ${data.reportData.startDate} إلى: ${data.reportData.endDate || data.reportData.startDate}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي الواصل المستلم:', value: `${formatCurrency(totalPaid || stats.totalSales)} د.ع`, color: '#15803d' },
        { label: 'إجمالي المتبقي (الذمم):', value: `${formatCurrency(totalRemaining)} د.ع`, color: totalRemaining > 0 ? '#c2410c' : undefined },
        { label: 'صافي إجمالي المبيعات:', value: `${formatCurrency(stats.totalSales)} د.ع`, color: '#006494' },
      ],
      organizerSignatureText: 'المحاسب المسؤول',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
