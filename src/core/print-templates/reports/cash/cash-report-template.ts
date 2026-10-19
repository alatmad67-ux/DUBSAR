/**
 * @fileOverview Cash Drawer & Register Movement Report Template (A4 Multi-page).
 * Detailed breakdown of cash inflow, outflow, register balance, and reconciliation.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface CashTransactionRow {
  time?: string;
  type: 'in' | 'out';
  docType: string;
  docNumber?: string;
  description: string;
  inflow: number;
  outflow: number;
  runningBalance: number;
}

export interface CashReportInputData extends DocumentRenderData {
  cashStats?: {
    openingBalance: number;
    totalInflow: number;
    totalOutflow: number;
    closingBalance: number;
    transactionsCount: number;
  };
  cashTransactions?: CashTransactionRow[];
}

export function renderCashReportTemplate(template: DocumentTemplate, data: CashReportInputData): string {
  const txs = data.cashTransactions || [];
  const stats = data.cashStats || {
    openingBalance: 0,
    totalInflow: txs.reduce((s, t) => s + (t.inflow || 0), 0),
    totalOutflow: txs.reduce((s, t) => s + (t.outflow || 0), 0),
    closingBalance: 0,
    transactionsCount: txs.length,
  };

  const kpis: ReportKpiCard[] = [
    { label: 'الرصيد الافتتاحي', value: `${formatCurrency(stats.openingBalance)} د.ع` },
    { label: 'إجمالي المقبوضات (داخل)', value: `${formatCurrency(stats.totalInflow)} د.ع`, highlightColor: '#15803d' },
    { label: 'إجمالي المدفوعات (خارج)', value: `${formatCurrency(stats.totalOutflow)} د.ع`, highlightColor: '#dc2626' },
    { label: 'الرصيد الختامي للصندوق', value: `${formatCurrency(stats.closingBalance || (stats.openingBalance + stats.totalInflow - stats.totalOutflow))} د.ع`, highlightColor: '#006494' },
  ];

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'الوقت', width: '65px', align: 'center' },
    { header: 'نوع الحركة', width: '100px', align: 'center' },
    { header: 'رقم السند/الفاتورة', width: '100px', align: 'center' },
    { header: 'البيان والتفاصيل', width: '180px', align: 'right' },
    { header: 'وارد (+)', width: '85px', align: 'left' },
    { header: 'صادر (-)', width: '85px', align: 'left' },
    { header: 'الرصيد التراكمي', width: '95px', align: 'left' },
  ];

  const rows = txs.map((t, idx) => [
    idx + 1,
    t.time || '-',
    t.docType || (t.type === 'in' ? 'قبض نقدي' : 'صرف نقدي'),
    t.docNumber || '-',
    t.description || '-',
    t.inflow > 0 ? `<span style="color: #15803d; font-weight: bold;">+${formatCurrency(t.inflow)}</span>` : '-',
    t.outflow > 0 ? `<span style="color: #dc2626; font-weight: bold;">-${formatCurrency(t.outflow)}</span>` : '-',
    formatCurrency(t.runningBalance),
  ]);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || 'تقرير حركة الصندوق والنقدية (الكشف اليومي)',
      periodText: data.document?.date ? `بتاريخ: ${data.document.date}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي الوارد للصندوق (+):', value: `${formatCurrency(stats.totalInflow)} د.ع`, color: '#15803d' },
        { label: 'إجمالي المنصرف من الصندوق (-):', value: `${formatCurrency(stats.totalOutflow)} د.ع`, color: '#dc2626' },
        { label: 'صافي الرصيد الختامي للصندوق:', value: `${formatCurrency(stats.closingBalance || (stats.openingBalance + stats.totalInflow - stats.totalOutflow))} د.ع`, color: '#006494' },
      ],
      organizerSignatureText: 'أمين الصندوق (الكاشير)',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
