/**
 * @fileOverview 80mm Thermal Receipt Print Template for Invoices.
 * Optimized for high-speed POS thermal receipt printers with zero horizontal overflow,
 * auto text-wrapping for Arabic names, and crisp tabular numbers.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { CAIRO_FONT_CSS } from '@/core/templates/cairo-font';
import { SHARED_PRINT_RESET } from '../../common/shared-styles';
import { formatNumber, formatDisplayInvoiceNumber, generateCode128Svg, toAsciiDigits } from '../../common/number-formatter';

export function renderThermalInvoiceTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
  const opts = data.printOptions || {};
  const business = data.business || {};
  const doc = data.document || {};
  const party = data.party || {};
  const totals = data.totals || { netTotal: 0 };
  const items = data.items || [];

  const invoiceNo = formatDisplayInvoiceNumber(doc.number);
  const cur = totals.currency === 'USD' ? '$' : totals.currency === 'IQD' ? 'د.ع' : totals.currency || 'د.ع';

  const subtotal = Number(totals.subtotal ?? totals.netTotal);
  const discount = Number(totals.discount || 0);
  const netTotal = Number(totals.netTotal || 0);
  const paid = Number(totals.paid ?? netTotal);
  const remaining = Number(totals.remaining ?? Math.max(0, netTotal - paid));
  const itemCount = totals.itemCount ?? items.length;

  const phone = business.phone1 || business.phone2 || '';
  const dateStr = toAsciiDigits(doc.date || new Date().toISOString().split('T')[0]);
  const timeStr = toAsciiDigits(doc.time || '');

  const barcodeSvg = generateCode128Svg(invoiceNo, 28);
  const docNotes = doc.notes || business.footerNotice || 'البضاعة المباعة لا ترد ولا تستبدل إلا بموجب الفاتورة.';

  // Dynamic 80mm column definitions
  interface ColDef {
    key: string;
    label: string;
    weight: number;
    widthPercent?: number;
    className: string;
    align: 'right' | 'center' | 'left';
  }

  const activeCols: ColDef[] = [];
  if (opts.showItemIndex !== false) {
    activeCols.push({ key: 'index', label: '#', weight: 8, className: 'col-num', align: 'center' });
  }
  if (opts.showItemName !== false) {
    activeCols.push({ key: 'name', label: 'المادة', weight: 40, className: 'col-name', align: 'right' });
  }
  if (opts.showBarcode === true) {
    activeCols.push({ key: 'barcode', label: 'باركود', weight: 16, className: 'col-barcode', align: 'center' });
  }
  if (opts.showUnit === true) {
    activeCols.push({ key: 'unit', label: 'الوحدة', weight: 10, className: 'col-unit', align: 'center' });
  }
  if (opts.showQuantity !== false) {
    activeCols.push({ key: 'quantity', label: 'العدد', weight: 12, className: 'col-qty', align: 'center' });
  }
  if (opts.showPrice !== false) {
    activeCols.push({ key: 'price', label: 'السعر', weight: 18, className: 'col-price', align: 'center' });
  }
  if (opts.showDiscount === true) {
    activeCols.push({ key: 'discount', label: 'الخصم', weight: 10, className: 'col-discount', align: 'center' });
  }
  if (opts.showTotal !== false) {
    activeCols.push({ key: 'total', label: 'الإجمالي', weight: 22, className: 'col-tot', align: 'center' });
  }

  // Normalize column weights to 100%
  const totalWeight = activeCols.reduce((sum, c) => sum + c.weight, 0);
  activeCols.forEach(c => {
    c.widthPercent = Math.round((c.weight / totalWeight) * 1000) / 10;
  });

  const tableHeadersHtml = activeCols.map(col =>
    `<th class="${col.className}" style="width: ${col.widthPercent}%; text-align: ${col.align};">${col.label}</th>`
  ).join('');

  // Build items rows
  const itemsHtml = items.map((it, i) => {
    const qty = Number(it.quantity || 1);
    const lineTotal = Number(it.total ?? (qty * Number(it.price || 0) - Number(it.discount || 0)));
    const cells = activeCols.map(col => {
      switch (col.key) {
        case 'index':
          return `<td class="col-num num-ltr"><span class="num-ltr">${i + 1}</span></td>`;
        case 'name':
          return `<td class="col-name wrap-text">${it.name}</td>`;
        case 'barcode':
          return `<td class="col-barcode num-ltr font-mono"><span class="num-ltr">${it.barcode || '-'}</span></td>`;
        case 'unit':
          return `<td class="col-unit">${it.unit || 'قطعة'}</td>`;
        case 'quantity':
          return `<td class="col-qty num-ltr bold"><span class="num-ltr">${qty}</span></td>`;
        case 'price':
          return `<td class="col-price num-ltr"><span class="num-ltr">${formatNumber(it.price)}</span></td>`;
        case 'discount':
          return `<td class="col-discount num-ltr"><span class="num-ltr">${Number(it.discount || 0) > 0 ? formatNumber(it.discount) : '-'}</span></td>`;
        case 'total':
          return `<td class="col-tot num-ltr bold"><span class="num-ltr">${formatNumber(lineTotal)}</span></td>`;
        default:
          return `<td></td>`;
      }
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

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
          size: 80mm auto;
          margin: 0 !important;
        }

        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff;
          color: #000000;
          font-size: 10px;
          line-height: 1.35;
        }

        .receipt-container {
          width: 72mm;
          max-width: 72mm;
          margin: 0 auto;
          padding: 2mm 1mm;
          overflow-x: hidden;
        }

        /* Business Header */
        .rec-header {
          text-align: center;
          margin-bottom: 6px;
        }

        .rec-logo {
          max-height: 40px;
          max-width: 90px;
          object-fit: contain;
          margin: 0 auto 3px auto;
          display: block;
        }

        .rec-biz-name {
          font-size: 15px;
          font-weight: 900;
          color: #000000;
          margin-bottom: 2px;
        }

        .rec-biz-info {
          font-size: 9px;
          color: #333333;
          margin-bottom: 2px;
        }

        .rec-title-box {
          background: #000000;
          color: #ffffff;
          padding: 3px;
          font-size: 11px;
          font-weight: 900;
          text-align: center;
          margin: 5px 0;
          border-radius: 2px;
        }

        /* Divider */
        .rec-divider {
          border-top: 1px dashed #444444;
          margin: 4px 0;
        }

        .rec-divider-solid {
          border-top: 1px solid #000000;
          margin: 4px 0;
        }

        /* Meta Rows */
        .rec-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          margin-bottom: 2px;
        }

        /* Table */
        .rec-table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
          table-layout: fixed;
        }

        .rec-table th {
          border-top: 1px solid #000000;
          border-bottom: 1px solid #000000;
          padding: 3px 1px;
          font-size: 9.5px;
          font-weight: 900;
          text-align: center;
        }

        .rec-table td {
          padding: 3px 1px;
          font-size: 9px;
          vertical-align: top;
          border-bottom: 1px dashed #dddddd;
        }

        .col-num { width: 8%; text-align: center; }
        .col-name { width: 42%; text-align: right; font-weight: 700; }
        .col-qty { width: 12%; text-align: center; font-weight: 700; }
        .col-price { width: 18%; text-align: center; }
        .col-tot { width: 20%; text-align: center; font-weight: 900; }

        .wrap-text {
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        /* Totals Box */
        .rec-totals-box {
          margin: 4px 0;
          font-size: 9.5px;
        }

        .rec-total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }

        .rec-grand-total {
          border-top: 1px solid #000000;
          border-bottom: 1px solid #000000;
          padding: 4px 0;
          font-size: 12px;
          font-weight: 900;
          margin: 3px 0;
        }

        /* Barcode Area */
        .rec-barcode-area {
          text-align: center;
          margin: 6px 0 4px 0;
        }

        .rec-notes {
          text-align: center;
          font-size: 8.5px;
          color: #333333;
          margin: 4px 0;
        }

        .rec-sig {
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          font-weight: 700;
          margin-top: 6px;
          padding: 0 4px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Business Header -->
        <div class="rec-header">
          ${business.logo && opts.showLogo !== false ? `<img src="${business.logo}" class="rec-logo" alt="logo" />` : ''}
          <div class="rec-biz-name">${business.name || 'مؤسسة دوبسار التجارية'}</div>
          ${phone ? `<div class="rec-biz-info font-mono num-ltr">${phone}</div>` : ''}
          ${business.address ? `<div class="rec-biz-info">${business.address}</div>` : ''}
        </div>

        <div class="rec-title-box">${doc.title || 'فاتورة مبيعات'}</div>

        <!-- Meta Details -->
        <div class="rec-meta-row">
          <span>رقم الفاتورة:</span>
          <span class="num-ltr font-mono bold">${invoiceNo}</span>
        </div>
        <div class="rec-meta-row">
          <span>التاريخ والوقت:</span>
          <span class="num-ltr font-mono">${dateStr} ${timeStr}</span>
        </div>
        <div class="rec-meta-row">
          <span>الزبون:</span>
          <span class="bold">${party.name || 'زبون نقدي'}</span>
        </div>
        ${doc.cashierName && opts.showCashierName !== false ? `
        <div class="rec-meta-row">
          <span>الكاشير:</span>
          <span>${doc.cashierName}</span>
        </div>` : ''}

        <div class="rec-divider"></div>

        <!-- Items Table -->
        <table class="rec-table">
          <thead>
            <tr>
              ${tableHeadersHtml}
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="rec-totals-box">
          <div class="rec-total-row">
            <span>إجمالي المواد:</span>
            <span class="num-ltr font-mono">${formatNumber(subtotal)} ${cur}</span>
          </div>
          ${discount > 0 ? `
          <div class="rec-total-row" style="color: #dc2626;">
            <span>الخصم:</span>
            <span class="num-ltr font-mono">-${formatNumber(discount)} ${cur}</span>
          </div>` : ''}
          <div class="rec-total-row rec-grand-total">
            <span>الصافي:</span>
            <span class="num-ltr font-mono">${formatNumber(netTotal)} ${cur}</span>
          </div>
          <div class="rec-total-row">
            <span>المدفوع:</span>
            <span class="num-ltr font-mono bold" style="color: #16a34a;">${formatNumber(paid)} ${cur}</span>
          </div>
          ${remaining > 0 ? `
          <div class="rec-total-row">
            <span>المتبقي:</span>
            <span class="num-ltr font-mono bold" style="color: #dc2626;">${formatNumber(remaining)} ${cur}</span>
          </div>` : ''}
          <div class="rec-total-row">
            <span>عدد المواد:</span>
            <span class="num-ltr font-mono">${itemCount}</span>
          </div>
        </div>

        <!-- Barcode Area -->
        <div class="rec-barcode-area">
          <div style="width: 140px; margin: 0 auto;">${barcodeSvg}</div>
          <div style="font-size: 8px; font-family: monospace; font-weight: bold; margin-top: 1px;">${invoiceNo}</div>
        </div>

        <!-- Notes -->
        <div class="rec-notes wrap-text">
          ${docNotes}
        </div>

        <!-- Signature -->
        ${opts.showSignatures !== false ? `
        <div class="rec-sig">
          <span>توقيع الكاشير</span>
          <span>توقيع المستلم</span>
        </div>` : ''}

        <!-- Minimal Unobtrusive Brand Footer -->
        <div class="dubsar-minimal-footer">
          <span>اسم النظام: DUBSAR</span>
          ${phone ? `<span class="dubsar-footer-dot">•</span><span>رقم الهاتف: <span class="num-ltr">${phone}</span></span>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}
