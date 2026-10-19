/**
 * @fileOverview General Financial & P&L Report Template (A4 Multi-page).
 * Executive summary of revenue, cost of goods sold (COGS), gross profit, expenses, and net profit.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface FinancialReportInputData extends DocumentRenderData {
  financialSummary?: {
    totalRevenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    profitMarginPercent?: number;
    cashInHand?: number;
    receivablesTotal?: number;
    payablesTotal?: number;
  };
  breakdownRows?: Array<{
    category: string;
    description: string;
    inflow?: number;
    outflow?: number;
    net: number;
  }>;
}

export function renderFinancialReportTemplate(template: DocumentTemplate, data: FinancialReportInputData): string {
  const sum = data.financialSummary || {
    totalRevenue: data.totals?.netTotal || 0,
    costOfGoodsSold: 0,
    grossProfit: data.totals?.netTotal || 0,
    totalExpenses: 0,
    netProfit: data.totals?.netTotal || 0,
  };

  const kpis: ReportKpiCard[] = [
    { label: 'إجمالي المبيعات (الإيرادات)', value: `${formatCurrency(sum.totalRevenue)} د.ع`, highlightColor: '#006494' },
    { label: 'تكلفة البضاعة المباعة', value: `${formatCurrency(sum.costOfGoodsSold)} د.ع`, highlightColor: '#475569' },
    { label: 'مجمل الربح التجاري', value: `${formatCurrency(sum.grossProfit)} د.ع`, highlightColor: '#0284c7' },
    { label: 'إجمالي المصاريف التشغيلية', value: `${formatCurrency(sum.totalExpenses)} د.ع`, highlightColor: '#dc2626' },
    { label: 'صافي الأرباح النهائية', value: `${formatCurrency(sum.netProfit)} د.ع`, highlightColor: sum.netProfit >= 0 ? '#15803d' : '#b91c1c' },
  ];

  if (sum.profitMarginPercent !== undefined) {
    kpis.push({ label: 'هامش الربح الصافي', value: `%${formatNumber(sum.profitMarginPercent)}` });
  }

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'البند المالي', width: '160px', align: 'right' },
    { header: 'البيان والتفاصيل', width: '220px', align: 'right' },
    { header: 'الإيرادات (+)', width: '100px', align: 'left' },
    { header: 'التكاليف والمصاريف (-)', width: '110px', align: 'left' },
    { header: 'الصافي', width: '100px', align: 'left' },
  ];

  const breakdown = data.breakdownRows || [
    { category: 'المبيعات والإيرادات', description: 'إجمالي حركة المبيعات المحققة', inflow: sum.totalRevenue, net: sum.totalRevenue },
    { category: 'تكلفة المبيعات', description: 'تكلفة المواد الأولية / البضاعة المباعة', outflow: sum.costOfGoodsSold, net: -sum.costOfGoodsSold },
    { category: 'المصاريف التشغيلية', description: 'مصاريف إدارية وعامة ورواتب ونثريات', outflow: sum.totalExpenses, net: -sum.totalExpenses },
  ];

  const rows = breakdown.map((b, idx) => [
    idx + 1,
    b.category,
    b.description,
    b.inflow ? `<span style="color: #15803d;">+${formatCurrency(b.inflow)}</span>` : '-',
    b.outflow ? `<span style="color: #dc2626;">-${formatCurrency(b.outflow)}</span>` : '-',
    `<strong style="color: ${b.net >= 0 ? '#15803d' : '#dc2626'};">${formatCurrency(b.net)} د.ع</strong>`,
  ]);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || 'التقرير المالي الشامل (الأرباح والخسائر)',
      periodText: data.reportData?.startDate ? `عن الفترة: ${data.reportData.startDate} إلى: ${data.reportData.endDate || data.reportData.startDate}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'مجمل الربح من المبيعات:', value: `${formatCurrency(sum.grossProfit)} د.ع`, color: '#0284c7' },
        { label: 'إجمالي النفقات والمصاريف:', value: `${formatCurrency(sum.totalExpenses)} د.ع`, color: '#dc2626' },
        { label: 'صافي الربح الفعلي بعد المصاريف:', value: `${formatCurrency(sum.netProfit)} د.ع`, color: sum.netProfit >= 0 ? '#15803d' : '#b91c1c' },
      ],
      organizerSignatureText: 'المدير المالي والتدقيق',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
