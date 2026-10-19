/**
 * @fileOverview Receipt Voucher Print Template (سند قبض مالي).
 * Supports both A4 corporate layout and 80mm thermal receipt format.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { CAIRO_FONT_CSS } from '@/core/templates/cairo-font';
import { SHARED_PRINT_RESET } from '../../common/shared-styles';
import { formatNumber, formatDisplayInvoiceNumber } from '../../common/number-formatter';

export function renderReceiptVoucherTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
  const isA4 = template.format === 'A4';
  const business = data.business || {};
  const doc = data.document || {};
  const party = data.party || {};
  const totals = data.totals || { netTotal: 0 };

  const voucherNo = formatDisplayInvoiceNumber(doc.number);
  const cur = totals.currency === 'USD' ? '$' : totals.currency === 'IQD' ? 'د.ع' : totals.currency || 'د.ع';
  const amount = Number(totals.netTotal || totals.paid || 0);

  const phone = business.phone1 || business.phone2 || '';
  const dateStr = doc.date || new Date().toISOString().split('T')[0];
  const timeStr = doc.time || '';
  const paymentMethod = doc.paymentMethod || 'نقداً';
  const notes = doc.notes || 'تسديد دفعة مالية لحساب العميل';
  const cashier = doc.cashierName || 'أمين الصندوق';

  if (!isA4) {
    // 80mm Thermal Receipt Voucher
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>&#8203;</title>
        <style>
          ${CAIRO_FONT_CSS}
          ${SHARED_PRINT_RESET}

          @page { size: 80mm auto; margin: 0; }
          body { font-size: 10px; line-height: 1.4; color: #000; padding: 2mm 1mm; width: 72mm; margin: 0 auto; }
          .rec-header { text-align: center; margin-bottom: 6px; }
          .rec-biz-name { font-size: 15px; font-weight: 900; }
          .rec-title-box { background: #13293d; color: #fff; padding: 4px; font-size: 12px; font-weight: 900; text-align: center; border-radius: 4px; margin: 5px 0; }
          .rec-amount-box { border: 2px solid #13293d; background: #f8fafc; padding: 6px; text-align: center; margin: 6px 0; border-radius: 4px; }
          .amount-val { font-size: 16px; font-weight: 900; color: #16a34a; font-family: monospace; }
          .rec-row { display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 3px; }
          .rec-divider { border-top: 1px dashed #666; margin: 5px 0; }
          .rec-notes-box { background: #f1f5f9; padding: 4px; font-size: 9px; border-radius: 2px; margin: 4px 0; }
          .rec-sig { display: flex; justify-content: space-between; font-size: 8.5px; font-weight: 700; margin-top: 10px; padding: 0 4px; }
        </style>
      </head>
      <body>
        <div class="rec-header">
          ${business.logo ? `<img src="${business.logo}" style="max-height: 38px; display: block; margin: 0 auto 3px;" alt="logo" />` : ''}
          <div class="rec-biz-name">${business.name || 'مؤسسة دوبسار التجارية'}</div>
          ${phone ? `<div style="font-size: 9px; font-family: monospace;">${phone}</div>` : ''}
        </div>

        <div class="rec-title-box">سند قبض مالي (رسمي)</div>

        <div class="rec-row">
          <span>رقم السند:</span>
          <span class="num-ltr font-mono bold">${voucherNo}</span>
        </div>
        <div class="rec-row">
          <span>التاريخ:</span>
          <span class="num-ltr font-mono">${dateStr} ${timeStr}</span>
        </div>
        <div class="rec-row">
          <span>استلمنا من:</span>
          <span class="bold">${party.name || 'العميل'}</span>
        </div>
        <div class="rec-row">
          <span>طريقة الدفع:</span>
          <span>${paymentMethod}</span>
        </div>

        <div class="rec-amount-box">
          <div style="font-size: 9px; color: #475569; font-weight: bold;">المبلغ المستلم</div>
          <div class="amount-val num-ltr">${formatNumber(amount)} ${cur}</div>
        </div>

        <div class="rec-notes-box">
          <strong>البيان:</strong> ${notes}
        </div>

        ${party.currentBalance !== undefined ? `
        <div class="rec-row" style="font-weight: bold;">
          <span>الرصيد بعد القبض:</span>
          <span class="num-ltr font-mono">${formatNumber(party.currentBalance)} ${cur}</span>
        </div>` : ''}

        <div class="rec-divider"></div>

        <div class="rec-row">
          <span>أمين الصندوق:</span>
          <span>${cashier}</span>
        </div>

        <div class="rec-sig">
          <span>توقيع المستلم</span>
          <span>توقيع الدافع</span>
        </div>

        <div class="dubsar-minimal-footer">
          <span>نظام DUBSAR المالي</span>
          ${phone ? `<span class="dubsar-footer-dot">•</span><span>${phone}</span>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  // A4 Corporate Receipt Voucher
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>&#8203;</title>
      <style>
        ${CAIRO_FONT_CSS}
        ${SHARED_PRINT_RESET}

        @page { size: A4 portrait; margin: 10mm 12mm; }

        .voucher-container {
          width: 100%;
          max-width: 210mm;
          margin: 0 auto;
          background: #ffffff;
        }

        .v-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--dubsar-navy);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .v-biz-name {
          font-size: 20px;
          font-weight: 900;
          color: var(--dubsar-navy);
        }

        .v-biz-sub {
          font-size: 11px;
          color: #64748b;
        }

        .v-title-card {
          background: linear-gradient(135deg, var(--dubsar-navy) 0%, var(--dubsar-blue) 100%);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .v-title {
          font-size: 16px;
          font-weight: 900;
        }

        .v-meta-tag {
          background: #ffffff;
          color: #0f172a;
          padding: 3px 10px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 12px;
        }

        .v-amount-banner {
          background: #f0fdf4;
          border: 2px solid #86efac;
          border-radius: 8px;
          padding: 12px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .v-amount-val {
          font-size: 22px;
          font-weight: 900;
          color: #15803d;
        }

        .v-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .v-box {
          background: #f8fafc;
          border: 1px solid var(--dubsar-border);
          border-radius: 6px;
          padding: 10px 14px;
        }

        .v-box-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--dubsar-blue);
          border-bottom: 1px solid var(--dubsar-border);
          padding-bottom: 4px;
          margin-bottom: 6px;
        }

        .v-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .v-label {
          color: #64748b;
          font-weight: 600;
        }

        .v-val {
          color: #0f172a;
          font-weight: 700;
        }

        .v-statement-box {
          background: #ffffff;
          border: 1px solid var(--dubsar-border);
          border-radius: 6px;
          padding: 12px 14px;
          margin-bottom: 18px;
          font-size: 11.5px;
          line-height: 1.6;
        }

        .v-signatures {
          display: flex;
          justify-content: space-between;
          padding: 10px 40px;
          margin-top: 20px;
        }

        .v-sig-box {
          text-align: center;
          min-width: 150px;
          border-top: 1px dashed #94a3b8;
          padding-top: 6px;
          font-weight: 700;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="voucher-container">
        <!-- Header -->
        <div class="v-header">
          <div>
            <div class="v-biz-name">${business.name || 'مؤسسة دوبسار التجارية'}</div>
            <div class="v-biz-sub">${business.address || ''} ${phone ? `• هاتف: ${phone}` : ''}</div>
          </div>
          ${business.logo ? `<img src="${business.logo}" style="max-height: 50px; max-width: 120px; object-fit: contain;" alt="logo" />` : '<div style="font-size: 12px; font-weight: 900; color: var(--dubsar-navy);">DUBSAR 2.0</div>'}
        </div>

        <!-- Title Banner -->
        <div class="v-title-card">
          <div class="v-title">سند قبض مالي (Receipt Voucher)</div>
          <div class="v-meta-tag font-mono num-ltr">رقم السند: ${voucherNo}</div>
        </div>

        <!-- Amount Banner -->
        <div class="v-amount-banner">
          <div>
            <span style="font-size: 12px; color: #166534; font-weight: 700;">المبلغ المقبوض:</span>
          </div>
          <div class="v-amount-val font-mono num-ltr">${formatNumber(amount)} ${cur}</div>
        </div>

        <!-- Details Grid -->
        <div class="v-grid">
          <div class="v-box">
            <div class="v-box-title">بيانات الدافع / العميل</div>
            <div class="v-row">
              <span class="v-label">الاسم:</span>
              <span class="v-val">${party.name || 'عميل نقدي'}</span>
            </div>
            ${party.phone ? `
            <div class="v-row">
              <span class="v-label">الهاتف:</span>
              <span class="v-val font-mono num-ltr">${party.phone}</span>
            </div>` : ''}
            ${party.currentBalance !== undefined ? `
            <div class="v-row">
              <span class="v-label">الرصيد بعد السند:</span>
              <span class="v-val font-mono num-ltr">${formatNumber(party.currentBalance)} ${cur}</span>
            </div>` : ''}
          </div>

          <div class="v-box">
            <div class="v-box-title">تفاصيل العملية</div>
            <div class="v-row">
              <span class="v-label">التاريخ والوقت:</span>
              <span class="v-val font-mono num-ltr">${dateStr}${timeStr ? ` • ${timeStr}` : ''}</span>
            </div>
            <div class="v-row">
              <span class="v-label">طريقة القبض:</span>
              <span class="v-val">${paymentMethod}</span>
            </div>
            <div class="v-row">
              <span class="v-label">أمين الصندوق:</span>
              <span class="v-val">${cashier}</span>
            </div>
          </div>
        </div>

        <!-- Statement / Notes -->
        <div class="v-statement-box">
          <strong style="color: var(--dubsar-navy);">البيان / تفاصيل القبض:</strong>
          <p style="margin-top: 4px; color: #334155;">${notes}</p>
        </div>

        <!-- Signatures -->
        <div class="v-signatures">
          <div class="v-sig-box">توقيع الدافع (المسلم)</div>
          <div class="v-sig-box">توقيع أمين الصندوق (المستلم)</div>
        </div>

        <!-- Minimal Brand Footer -->
        <div class="dubsar-minimal-footer">
          <span>نظام DUBSAR المالي</span>
          ${phone ? `<span class="dubsar-footer-dot">•</span><span>${phone}</span>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}
