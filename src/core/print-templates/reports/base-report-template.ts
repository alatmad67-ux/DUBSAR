/**
 * @fileOverview Base Report Layout Engine for A4 Multi-page Reports.
 * Handles repeating thead, KPI summary cards, filter metadata, totals footer,
 * and strict suppression of browser print header/footers.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { CAIRO_FONT_CSS } from '@/core/templates/cairo-font';
import { SHARED_PRINT_RESET } from '../common/shared-styles';

export interface ReportColumnConfig {
  header: string;
  width?: string;
  align?: 'right' | 'center' | 'left';
  className?: string;
}

export interface ReportKpiCard {
  label: string;
  value: string | number;
  highlightColor?: string;
}

export interface BaseReportData extends DocumentRenderData {
  reportConfig?: {
    title: string;
    periodText?: string;
    kpis?: ReportKpiCard[];
    columns: ReportColumnConfig[];
    rows: Array<Array<string | number>>;
    summaryRows?: Array<{ label: string; value: string | number; color?: string }>;
    organizerSignatureText?: string;
  };
}

export function renderBaseReportTemplate(template: DocumentTemplate, data: BaseReportData): string {
  const business = data.business || {};
  const config = data.reportConfig || {
    title: data.document?.title || 'تقرير إحصائي رسمي',
    columns: [],
    rows: [],
  };

  const phone = business.phone1 || business.phone2 || '';
  const dateStr = data.document?.date || new Date().toISOString().split('T')[0];
  const timeStr = data.document?.time || '';

  // Header image vs Corporate text header
  const headerHtml = business.headerImage ? `
    <div class="rep-header-img-wrap">
      <img src="${business.headerImage}" alt="ترويسة النشاط" class="rep-header-img" />
    </div>
  ` : `
    <div class="rep-corp-header">
      <div>
        <h1 class="rep-biz-name">${business.name || 'مؤسسة دوبسار التجارية'}</h1>
        <div class="rep-biz-contact">
          ${phone ? `<span>الهاتف: <strong class="num-ltr font-mono">${phone}</strong></span>` : ''}
          ${business.address ? `<span> • ${business.address}</span>` : ''}
        </div>
      </div>
      <div class="rep-brand-badge">
        ${business.logo ? `<img src="${business.logo}" style="max-height: 44px; max-width: 100px; object-fit: contain;" alt="شعار" />` : ''}
        <span class="rep-dubsar-logo font-mono">DUBSAR 2.0</span>
      </div>
    </div>
  `;

  // KPIs HTML
  const kpisHtml = config.kpis && config.kpis.length > 0 ? `
    <div class="rep-kpi-grid">
      ${config.kpis.map(kpi => `
        <div class="rep-kpi-card" ${kpi.highlightColor ? `style="border-top: 3px solid ${kpi.highlightColor};"` : ''}>
          <div class="rep-kpi-label">${kpi.label}</div>
          <div class="rep-kpi-val num-ltr font-mono" ${kpi.highlightColor ? `style="color: ${kpi.highlightColor};"` : ''}>${kpi.value}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Columns & Rows
  const theadHtml = `
    <tr>
      <th style="width: 5%; text-align: center;">#</th>
      ${config.columns.map(col => `
        <th style="${col.width ? `width: ${col.width};` : ''} text-align: ${col.align || 'center'};">${col.header}</th>
      `).join('')}
    </tr>
  `;

  const tbodyHtml = config.rows.length === 0 ? `
    <tr>
      <td colspan="${config.columns.length + 1}" style="text-align: center; padding: 16px; color: #64748b; font-weight: 700;">
        لا توجد حركات مسجلة لهذه الفترة
      </td>
    </tr>
  ` : config.rows.map((rowArr, idx) => `
    <tr>
      <td style="text-align: center; font-family: monospace;" class="num-ltr">${idx + 1}</td>
      ${rowArr.map((cell, cIdx) => {
        const colDef = config.columns[cIdx] || { align: 'center' };
        const align = colDef.align || 'center';
        return `<td style="text-align: ${align};">${cell}</td>`;
      }).join('')}
    </tr>
  `).join('');

  // Summary Rows
  const summaryHtml = config.summaryRows && config.summaryRows.length > 0 ? `
    <div class="rep-summary-box">
      ${config.summaryRows.map(sr => `
        <div class="rep-sum-row" ${sr.color ? `style="color: ${sr.color};"` : ''}>
          <span class="rep-sum-label">${sr.label}:</span>
          <span class="rep-sum-val num-ltr font-mono bold">${sr.value}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>&#8203;</title>
      <style>
        ${CAIRO_FONT_CSS}
        ${SHARED_PRINT_RESET}

        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }

        .rep-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          background: #ffffff;
          font-size: 10.5px;
          line-height: 1.4;
        }

        .rep-header-img-wrap {
          width: 100%;
          border-bottom: 2px solid var(--dubsar-navy);
          margin-bottom: 6px;
          padding-bottom: 4px;
        }

        .rep-header-img {
          width: 100%;
          max-height: 120px;
          object-fit: contain;
          display: block;
        }

        .rep-corp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--dubsar-navy);
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .rep-biz-name {
          font-size: 19px;
          font-weight: 900;
          color: var(--dubsar-navy);
        }

        .rep-biz-contact {
          font-size: 10px;
          color: #475569;
          margin-top: 2px;
        }

        .rep-brand-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .rep-dubsar-logo {
          font-size: 9px;
          font-weight: 800;
          color: var(--dubsar-gold);
        }

        /* Title Card */
        .rep-title-strip {
          background: linear-gradient(135deg, var(--dubsar-navy) 0%, var(--dubsar-blue) 100%);
          color: #ffffff;
          padding: 7px 14px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .rep-title {
          font-size: 15px;
          font-weight: 900;
        }

        .rep-meta-period {
          font-size: 10px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
        }

        /* KPIs */
        .rep-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
          margin-bottom: 10px;
        }

        .rep-kpi-card {
          background: #f8fafc;
          border: 1px solid var(--dubsar-border);
          border-radius: 6px;
          padding: 6px 10px;
          text-align: center;
        }

        .rep-kpi-label {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .rep-kpi-val {
          font-size: 13.5px;
          font-weight: 900;
          color: var(--dubsar-navy);
        }

        /* Table with repeating thead */
        .rep-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          border: 1px solid var(--dubsar-border);
        }

        .rep-table thead {
          display: table-header-group;
        }

        .rep-table tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .rep-table th {
          background: var(--dubsar-navy);
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 6px 4px;
          border: 1px solid #1e3a5f;
          white-space: nowrap;
        }

        .rep-table td {
          padding: 5px 4px;
          font-size: 9.5px;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        .rep-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }

        /* Summary Box */
        .rep-summary-box {
          border: 1px solid var(--dubsar-border);
          background: #f8fafc;
          border-radius: 6px;
          padding: 8px 14px;
          margin-bottom: 10px;
          margin-right: auto;
          max-width: 280px;
        }

        .rep-sum-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 2px 0;
        }

        /* Signatures */
        .rep-signatures {
          display: flex;
          justify-content: space-between;
          padding: 8px 30px;
          margin-top: 14px;
          page-break-inside: avoid;
        }

        .rep-sig-box {
          text-align: center;
          min-width: 140px;
          border-top: 1px dashed #94a3b8;
          padding-top: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <div class="rep-container">
        <!-- Business Header -->
        ${headerHtml}

        <!-- Title & Period Strip -->
        <div class="rep-title-strip">
          <div class="rep-title">${config.title}</div>
          <div class="rep-meta-period">
            ${config.periodText ? config.periodText : `تاريخ الاستخراج: ${dateStr}${timeStr ? ` • ${timeStr}` : ''}`}
          </div>
        </div>

        <!-- KPI Cards -->
        ${kpisHtml}

        <!-- Report Table -->
        <table class="rep-table">
          <thead>
            ${theadHtml}
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>

        <!-- Summary Totals -->
        ${summaryHtml}

        <!-- Signatures -->
        <div class="rep-signatures">
          <div class="rep-sig-box">توقيع معد التقرير</div>
          <div class="rep-sig-box">اعتماد الإدارة / التدقيق</div>
        </div>

        <!-- Minimal Brand Footer -->
        <div class="dubsar-minimal-footer">
          <span>نظام DUBSAR لإدارة الأعمال والتقارير المالية</span>
          ${phone ? `<span class="dubsar-footer-dot">•</span><span>${phone}</span>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}
