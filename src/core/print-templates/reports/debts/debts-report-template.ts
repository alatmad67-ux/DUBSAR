/**
 * @fileOverview Debts & Receivables/Payables Report Template (A4 Multi-page).
 * Detailed breakdown of customer receivables and supplier payables with aging and balances.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderBaseReportTemplate, BaseReportData, ReportColumnConfig, ReportKpiCard } from '../base-report-template';
import { formatCurrency, formatNumber } from '../../common/number-formatter';

export interface DebtPartyRow {
  partyName: string;
  phone?: string;
  type: 'customer' | 'supplier';
  balance: number;
  lastPaymentDate?: string;
  notes?: string;
}

export interface DebtsReportInputData extends DocumentRenderData {
  debtsStats?: {
    totalCustomerDebts: number;
    totalSupplierDebts: number;
    partiesCount: number;
  };
  debtParties?: DebtPartyRow[];
}

export function renderDebtsReportTemplate(template: DocumentTemplate, data: DebtsReportInputData): string {
  const parties = data.debtParties || [];
  const stats = data.debtsStats || {
    totalCustomerDebts: parties.filter(p => p.type === 'customer').reduce((s, p) => s + p.balance, 0),
    totalSupplierDebts: parties.filter(p => p.type === 'supplier').reduce((s, p) => s + p.balance, 0),
    partiesCount: parties.length,
  };

  const kpis: ReportKpiCard[] = [
    { label: 'عدد الحسابات المطلوبة', value: formatNumber(stats.partiesCount) },
    { label: 'إجمالي ديون الزبائن (لنا)', value: `${formatCurrency(stats.totalCustomerDebts)} د.ع`, highlightColor: '#15803d' },
    { label: 'إجمالي ديون الموردين (علينا)', value: `${formatCurrency(stats.totalSupplierDebts)} د.ع`, highlightColor: '#c2410c' },
    { label: 'صافي المركز المالي للديون', value: `${formatCurrency(stats.totalCustomerDebts - stats.totalSupplierDebts)} د.ع`, highlightColor: '#006494' },
  ];

  const columns: ReportColumnConfig[] = [
    { header: '#', width: '35px', align: 'center' },
    { header: 'الاسم / الطرف', width: '160px', align: 'right' },
    { header: 'رقم الهاتف', width: '100px', align: 'center' },
    { header: 'نوع الحساب', width: '80px', align: 'center' },
    { header: 'تاريخ آخر تسديد', width: '90px', align: 'center' },
    { header: 'المبلغ المستحق (الرصيد)', width: '110px', align: 'left' },
  ];

  const rows = parties.map((p, idx) => [
    idx + 1,
    p.partyName,
    p.phone ? `<span class="num-ltr font-mono">${p.phone}</span>` : '-',
    p.type === 'customer' ? 'عميل / زبون' : 'مورد / مجهز',
    p.lastPaymentDate || '-',
    `<strong style="color: ${p.balance > 0 ? (p.type === 'customer' ? '#15803d' : '#c2410c') : '#475569'};">${formatCurrency(p.balance)} د.ع</strong>`,
  ]);

  const reportData: BaseReportData = {
    ...data,
    reportConfig: {
      title: data.document?.title || 'تقرير الديون والأرصدة المستحقة (كشف الذمم)',
      periodText: data.document?.date ? `بتاريخ: ${data.document.date}` : undefined,
      kpis,
      columns,
      rows,
      summaryRows: [
        { label: 'إجمالي ذمم الزبائن المستحقة (لنا):', value: `${formatCurrency(stats.totalCustomerDebts)} د.ع`, color: '#15803d' },
        { label: 'إجمالي مستحقات الموردين (علينا):', value: `${formatCurrency(stats.totalSupplierDebts)} د.ع`, color: '#c2410c' },
      ],
      organizerSignatureText: 'مدير الحسابات',
    },
  };

  return renderBaseReportTemplate(template, reportData);
}
