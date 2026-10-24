/**
 * @fileOverview A4 Corporate Invoice Print Template.
 * Faithfully implements the approved DUBSAR reference design (Navy + Royal Blue + Gold)
 * with offline Cairo font and fixed tabular layout.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { CAIRO_FONT_CSS } from '@/core/templates/cairo-font';
import { SHARED_PRINT_RESET } from '../../common/shared-styles';
import { formatNumber, formatDisplayInvoiceNumber, generateCode128Svg, toAsciiDigits } from '../../common/number-formatter';

export function renderA4InvoiceTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
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

  const rawMethod = doc.paymentMethod || (doc as any).payment_method || (remaining > 0.01 ? 'credit' : 'cash');
  let paymentMethodName = 'نقدي';
  if (rawMethod === 'card' || rawMethod === 'mastercard') paymentMethodName = 'Mastercard / بطاقة';
  else if (rawMethod === 'transfer') paymentMethodName = 'تحويل';
  else if (rawMethod === 'credit') paymentMethodName = 'آجل';
  else if (rawMethod === 'split') paymentMethodName = 'دفع مختلط';

  // Customer balances
  const showPrevBal = opts.showPreviousBalance !== false;
  const showCurrBal = opts.showCustomerBalance !== false;
  const prevBal = Number(party.previousBalance || 0);
  const currBal = Number(party.currentBalance || (prevBal + remaining));

  // Dynamic columns definition (8 customizable columns)
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
    activeCols.push({ key: 'index', label: '#', weight: 5, className: 'col-index', align: 'center' });
  }
  if (opts.showItemName !== false) {
    activeCols.push({ key: 'name', label: 'المادة', weight: 32, className: 'col-name', align: 'right' });
  }
  if (opts.showBarcode !== false) {
    activeCols.push({ key: 'barcode', label: 'الباركود', weight: 14, className: 'col-barcode', align: 'center' });
  }
  if (opts.showUnit !== false) {
    activeCols.push({ key: 'unit', label: 'الوحدة', weight: 8, className: 'col-unit', align: 'center' });
  }
  if (opts.showQuantity !== false) {
    activeCols.push({ key: 'quantity', label: 'العدد', weight: 9, className: 'col-quantity', align: 'center' });
  }
  if (opts.showPrice !== false) {
    activeCols.push({ key: 'price', label: 'سعر الوحدة', weight: 15, className: 'col-price', align: 'center' });
  }
  if (opts.showDiscount !== false) {
    activeCols.push({ key: 'discount', label: 'الخصم', weight: 8, className: 'col-discount', align: 'center' });
  }
  if (opts.showTotal !== false) {
    activeCols.push({ key: 'total', label: 'الإجمالي', weight: 17, className: 'col-total', align: 'center' });
  }

  // Normalize column widths to sum strictly to 100%
  const totalWeight = activeCols.reduce((sum, c) => sum + c.weight, 0);
  activeCols.forEach(c => {
    c.widthPercent = Math.round((c.weight / totalWeight) * 1000) / 10;
  });

  // Build Table Headers
  const tableHeadersHtml = activeCols.map(col =>
    `<th class="${col.className}" style="width: ${col.widthPercent}%; text-align: ${col.align};">${col.label}</th>`
  ).join('');

  // Build Table Rows
  const tableRowsHtml = items.map((it, idx) => {
    const qty = Number(it.quantity || 1);
    const lineTotal = Number(it.total ?? (qty * Number(it.price || 0) - Number(it.discount || 0)));
    const cells = activeCols.map(col => {
      switch (col.key) {
        case 'index':
          return `<td class="center col-index font-mono"><span class="num-ltr">${idx + 1}</span></td>`;
        case 'name':
          return `<td class="col-name product-name">${it.name}</td>`;
        case 'barcode':
          return `<td class="center col-barcode font-mono"><span class="num-ltr">${it.barcode || '-'}</span></td>`;
        case 'unit':
          return `<td class="center col-unit">${it.unit || 'قطعة'}</td>`;
        case 'quantity':
          return `<td class="center col-quantity font-mono bold table-qty-cell"><span class="num-ltr">${qty}</span></td>`;
        case 'price':
          return `<td class="center col-price font-mono"><span class="num-ltr">${formatNumber(it.price)}</span></td>`;
        case 'discount':
          return `<td class="center col-discount font-mono"><span class="num-ltr">${Number(it.discount || 0) > 0 ? formatNumber(it.discount) : '-'}</span></td>`;
        case 'total':
          return `<td class="center col-total font-mono bold table-total-cell"><span class="num-ltr">${formatNumber(lineTotal)}</span></td>`;
        default:
          return `<td></td>`;
      }
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  // Header image vs Corporate text header
  const headerHtml = business.headerImage ? `
    <div class="a4-custom-header">
      <img src="${business.headerImage}" alt="ترويسة الفاتورة" class="a4-header-img" />
    </div>
  ` : `
    <div class="a4-corporate-header">
      <div class="a4-company-meta">
        <h1 class="a4-company-name">${business.name || 'مؤسسة دوبسار التجارية'}</h1>
        ${business.businessType ? `<p class="a4-company-desc">${business.businessType}</p>` : ''}
        <div class="a4-company-contact">
          ${phone ? `<span>الهاتف: <strong class="num-ltr font-mono">${phone}</strong></span>` : ''}
          ${business.address ? `<span class="contact-sep">•</span><span>${business.address}</span>` : ''}
        </div>
      </div>
      <div class="a4-brand-seal">
        ${business.logo ? `<img src="${business.logo}" class="a4-small-logo" alt="شعار" />` : ''}
        <div class="a4-dubsar-tag">DUBSAR</div>
      </div>
    </div>
  `;

  const barcodeSvg = generateCode128Svg(invoiceNo, 32);
  const docNotes = doc.notes || business.footerNotice || 'البضاعة المباعة لا ترد ولا تستبدل إلا بموجب الفاتورة الرسمية.';

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
          margin: 0 !important;
        }

        .a4-container {
          width: 100%;
          max-width: 210mm;
          padding: 8mm 10mm;
          margin: 0 auto;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          font-size: 11px;
          line-height: 1.4;
          color: #000000;
        }

        /* Headers */
        .a4-custom-header {
          width: 100%;
          margin-bottom: 6px;
          border-bottom: 2px solid #000000;
          padding-bottom: 4px;
        }

        .a4-header-img {
          width: 100%;
          max-height: 130px;
          object-fit: contain;
          display: block;
        }

        .a4-corporate-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }

        .a4-company-name {
          font-size: 20px;
          font-weight: 900;
          color: #000000;
          margin-bottom: 2px;
        }

        .a4-company-desc {
          font-size: 11px;
          color: #000000;
          margin-bottom: 4px;
        }

        .a4-company-contact {
          font-size: 10.5px;
          color: #000000;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .contact-sep {
          color: #000000;
        }

        .a4-brand-seal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .a4-small-logo {
          height: 48px;
          max-width: 110px;
          object-fit: contain;
        }

        .a4-dubsar-tag {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #000000;
          font-family: 'Courier New', monospace;
        }

        /* Reference Invoice Information Bar */
        .a4-invoice-info-bar {
          position: relative;
          background: #ffffff;
          border: 1.5px solid #000000;
          border-radius: 8px;
          padding: 10px 14px 9px 14px;
          margin: 12px 0 10px 0;
        }

        .a4-info-badge-wrap {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
        }

        .a4-info-badge {
          background: #000000;
          color: #ffffff !important;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 22px;
          border-radius: 9999px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .a4-info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px 12px;
          align-items: center;
          padding-top: 3px;
        }

        .a4-info-col {
          display: flex;
          align-items: baseline;
          gap: 5px;
          font-size: 11px;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          color: #000000;
        }

        .info-lbl {
          color: #000000;
          font-weight: 700;
          flex-shrink: 0;
          font-size: 10.5px;
        }

        .info-val {
          color: #000000;
          font-weight: 800;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        /* Table */
        .a4-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          table-layout: fixed;
          border: 1.5px solid #000000;
          border-radius: 4px;
          overflow: hidden;
        }

        .a4-table thead th {
          background: #000000;
          color: #ffffff !important;
          font-size: 10px;
          font-weight: 800;
          padding: 6px 4px;
          border: 1px solid #000000;
          white-space: nowrap;
        }

        .a4-table tbody td {
          padding: 5px 4px;
          font-size: 10px;
          border: 1px solid #000000;
          vertical-align: middle;
          color: #000000;
          background: #ffffff;
        }

        .a4-table tbody tr:nth-child(even) {
          background: #ffffff;
        }

        .center { text-align: center; }
        .product-name {
          font-weight: 700;
          color: #000000;
          white-space: normal;
          word-break: break-word;
          padding-right: 6px;
        }

        .table-qty-cell { color: #000000; font-size: 11px; font-weight: 700; }
        .table-total-cell { color: #000000; font-size: 11px; font-weight: 800; }

        /* Bottom Section: Notes & Totals */
        .a4-bottom-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 10px;
          margin-bottom: 8px;
        }

        .a4-notes-box {
          background: #ffffff;
          border: 1.5px solid #000000;
          border-radius: 6px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .notes-content {
          font-size: 10px;
          color: #000000;
          line-height: 1.5;
        }

        .a4-totals-box {
          background: #ffffff;
          border: 1.5px solid #000000;
          border-radius: 6px;
          overflow: hidden;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          font-size: 10.5px;
          border-bottom: 1px solid #000000;
          color: #000000;
        }

        .total-row:last-child {
          border-bottom: none;
        }

        .grand-total {
          background: #000000;
          color: #ffffff !important;
          font-weight: 900;
          font-size: 13px;
          padding: 7px 8px;
          border-top: 1.5px solid #000000;
        }

        .debt-highlight {
          color: #000000;
          font-weight: 900;
        }

        .a4-balances-strip {
          background: #ffffff;
          border: 1.5px solid #000000;
          color: #000000;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 10.5px;
          font-weight: 800;
          display: flex;
          justify-content: space-around;
          margin-bottom: 8px;
        }

        /* Signatures */
        .a4-signatures {
          display: flex;
          justify-content: space-between;
          padding: 8px 24px;
          margin-top: 4px;
          font-size: 10.5px;
          font-weight: 700;
          color: #000000;
        }

        .sig-box {
          text-align: center;
          min-width: 130px;
          border-top: 1px dashed #000000;
          padding-top: 4px;
          color: #000000;
        }
      </style>
    </head>
    <body>
      <div class="a4-container">
        <!-- Header -->
        ${headerHtml}

        <!-- Invoice Information Bar - Matching Visual Reference Layout -->
        <div class="a4-invoice-info-bar">
          <div class="a4-info-badge-wrap">
            <span class="a4-info-badge">${doc.title || 'فاتورة مبيعات'}</span>
          </div>
          <div class="a4-info-grid">
            <!-- Row 1 -->
            <div class="a4-info-col">
              <span class="info-lbl">رقم الفاتورة:</span>
              <span class="info-val font-mono bold num-ltr">${invoiceNo}</span>
            </div>
            <div class="a4-info-col">
              <span class="info-lbl">التاريخ:</span>
              <span class="info-val font-mono">${dateStr}</span>
            </div>
            <div class="a4-info-col">
              <span class="info-lbl">الوقت:</span>
              <span class="info-val font-mono">${timeStr || '---'}</span>
            </div>
            <div class="a4-info-col">
              <span class="info-lbl">نوع البيع:</span>
              <span class="info-val bold">${doc.saleType || 'نقدي'}</span>
            </div>

            <!-- Row 2 -->
            <div class="a4-info-col" style="grid-column: span 2;">
              <span class="info-lbl">اسم الزبون:</span>
              <span class="info-val bold">${party.name || 'زبون نقدي'}</span>
            </div>
            <div class="a4-info-col">
              <span class="info-lbl">هاتف الزبون:</span>
              <span class="info-val font-mono num-ltr">${party.phone || '---'}</span>
            </div>
            <div class="a4-info-col">
              <span class="info-lbl">طريقة الدفع:</span>
              <span class="info-val bold">${paymentMethodName}</span>
            </div>
            ${party.address ? `
            <div class="a4-info-col" style="grid-column: span 3;">
              <span class="info-lbl">العنوان:</span>
              <span class="info-val">${party.address}</span>
            </div>
            <div class="a4-info-col">
              <span class="info-lbl">${doc.warehouse ? 'المستودع:' : 'المستخدم:'}</span>
              <span class="info-val">${doc.warehouse || doc.cashierName || 'المستودع الرئيسي'}</span>
            </div>` : `
            <div class="a4-info-col" style="grid-column: span 4;">
              <span class="info-lbl">${doc.warehouse ? 'المستودع:' : 'المستخدم:'}</span>
              <span class="info-val">${doc.warehouse || doc.cashierName || 'المستودع الرئيسي'}</span>
            </div>`}
          </div>
        </div>

        <!-- Items Table -->
        <table class="a4-table">
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <!-- Bottom Section: Notes & Totals -->
        <div class="a4-bottom-section">
          <!-- Notes Box -->
          <div class="a4-notes-box">
            <div>
              <div class="a4-card-title">ملاحظات وشروط الفاتورة</div>
              <div class="notes-content">${docNotes}</div>
            </div>
          </div>

          <!-- Totals Box (Enhanced Financial Summary) -->
          <div class="a4-totals-box">
            <div class="total-row">
              <span>إجمالي المواد:</span>
              <span class="font-mono num-ltr bold">${formatNumber(subtotal)} ${cur}</span>
            </div>
            ${discount > 0 ? `
            <div class="total-row">
              <span>الخصم الممنوح:</span>
              <span class="font-mono num-ltr bold">-${formatNumber(discount)} ${cur}</span>
            </div>` : ''}
            <div class="total-row grand-total">
              <span>الإجمالي النهائي (الصافي):</span>
              <span class="font-mono num-ltr">${formatNumber(netTotal)} ${cur}</span>
            </div>
            <div class="total-row">
              <span>المبلغ المدفوع:</span>
              <span class="font-mono num-ltr bold">${formatNumber(paid)} ${cur}</span>
            </div>
            ${remaining > 0 ? `
            <div class="total-row">
              <span>المتبقي في الذمة:</span>
              <span class="font-mono num-ltr bold debt-highlight">${formatNumber(remaining)} ${cur}</span>
            </div>` : ''}
            <div class="total-row">
              <span>طريقة الدفع:</span>
              <span class="bold">${paymentMethodName}</span>
            </div>
            <div class="total-row" style="color: #000000; font-size: 9.5px; opacity: 0.85; border-top: 1px dotted #000000;">
              <span>عدد المواد:</span>
              <span class="font-mono num-ltr">${itemCount}</span>
            </div>
          </div>
        </div>

        <!-- Customer Balances Strip -->
        ${(showPrevBal && prevBal > 0) || (showCurrBal && currBal > 0) ? `
        <div class="a4-balances-strip">
          ${showPrevBal && prevBal > 0 ? `<span>الرصيد السابق: <strong class="font-mono num-ltr">${formatNumber(prevBal)} ${cur}</strong></span>` : ''}
          ${showCurrBal && currBal > 0 ? `<span>الرصيد الكلي في الذمة: <strong class="font-mono num-ltr debt-highlight">${formatNumber(currBal)} ${cur}</strong></span>` : ''}
        </div>` : ''}

        <!-- Signatures -->
        ${opts.showSignatures !== false ? `
        <div class="a4-signatures">
          <div class="sig-box">توقيع المستلم</div>
          ${opts.showOrganizerName !== false ? '<div class="sig-box">توقيع المنظم</div>' : ''}
        </div>` : ''}

        <!-- Fixed DUBSAR System Footer -->
        <div class="dubsar-minimal-footer">
          نظام دوبسار لإدارة المبيعات | 07858833838
        </div>
      </div>
    </body>
    </html>
  `;
}
