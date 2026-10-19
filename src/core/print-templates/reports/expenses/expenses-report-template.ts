/**
 * @fileOverview Expenses Report Template (A4 Multi-page).
 * Detailed breakdown of operating expenses, categories, payees, and totals.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface ExpenseRow {
  date: string;
  category: string;
  description: string;
  recipient?: string;
  paymentMethod?: string;
  amount: number;
}

export interface ExpensesReportInputData extends DocumentRenderData {
  expensesStats?: {
    totalExpenses: number;
    count: number;
    topCategory?: string;
  };
  expenses?: ExpenseRow[];
}

export function renderExpensesReportTemplate(template: DocumentTemplate, data: ExpensesReportInputData): string {
  const items = data.expenses || [];
  const stats = data.expensesStats || {
    totalExpenses: items.reduce((s, e) => s + (e.amount || 0), 0),
    count: items.length,
  };

  const kpis: ReportKpiCard[] = [
    { label: 'إجمالي المصروفات', value: `${formatCurrency(stats.totalExpenses)} د.ع`, highlightColor: '#dc2626' },
    { label: 'عدد سندات الصرف', value: formatNumber(stats.count) },
  ];

  if (stats.topCategory) {
    kpis.push({ label: 'أعلى بند صرف', value: stats.topCategory });
  }

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'التاريخ', width: '85px', align: 'center' },
    { header: 'بند المصروف', width: '120px', align: 'right' },
    { header: 'البيان / التفاصيل', width: '180px', align: 'right' },
    { header: 'المستفيد / المدفوع له', width: '110px', align: 'right' },
    { header: 'طريقة الدفع', width: '75px', align: 'center' },
    { header: 'المبلغ', width: '90px', align: 'left' },
  ];

  const rows = items.map((e, idx) => [
    idx + 1,
    e.date,
    e.category || 'مصروف عام',
    e.description || '-',
    e.recipient || '-',
    e.paymentMethod || 'نقداً',
    formatCurrency(e.amount),
  ]);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || 'تقرير المصروفات والنفقات التشغيلية',
      periodText: data.reportData?.startDate ? `الفترة من: ${data.reportData.startDate} إلى: ${data.reportData.endDate || data.reportData.startDate}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي المصروفات التشغيلية:', value: `${formatCurrency(stats.totalExpenses)} د.ع`, color: '#dc2626' },
      ],
      organizerSignatureText: 'المسؤول المالي',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
