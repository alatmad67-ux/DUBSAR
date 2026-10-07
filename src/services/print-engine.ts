/**
 * @fileOverview DUBSAR 2.0 Native Vector Print Engine
 * Provides crystal-clear, isolated document printing for thermal receipts (80mm),
 * standard corporate invoices (A4), and barcode stickers.
 * Eliminates screen clipping and viewport screenshot issues by rendering into an isolated print frame.
 */

import { DocumentType } from '@/core/templates/template-types';
import { DocumentRenderer } from '@/core/templates/document-renderer';
import { TemplateService } from '@/core/templates/template-service';

export interface InvoicePrintItem {
  name: string;
  barcode?: string;
  quantity: number;
  price: number;
  total?: number;
  unit?: string;
  serialNo?: string;
}

export interface InvoicePrintData {
  invoiceNo: string;
  date: string;
  time?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  cashierName?: string;
  priceType?: string;
  currency?: string;
  items: InvoicePrintItem[];
  subtotal: number;
  discountAmount?: number;
  netTotal: number;
  paidAmount?: number;
  remaining?: number;
  receivedAmount?: number;
  changeGiven?: number;
  previousBalance?: number;
  currentBalance?: number;
  businessSettings?: {
    businessName?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    logo?: string;
    footerText?: string;
    invoiceNotice?: string;
  };
}

export interface BarcodeLabelItem {
  productName: string;
  barcode: string;
  price: number;
  unit?: string;
  businessName?: string;
  copies: number;
}

export interface BarcodeLabelConfig {
  widthMm: number;
  heightMm: number;
  showStoreName: boolean;
  showPrice: boolean;
  showBarcodeNumber: boolean;
  showProductName: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface DailyReportPrintData {
  date: string;
  salesTotal: number;
  salesPaidTotal: number;
  purchasesTotal: number;
  netCashFlow: number;
  dailySales: Array<{
    id?: string;
    invoiceNo?: string;
    customerName?: string;
    paymentMethod?: string;
    totalAmount: number;
    paidAmount?: number;
    createdAt?: any;
  }>;
  dailyPurchases?: Array<{
    id?: string;
    invoiceNo?: string;
    supplierName?: string;
    paymentMethod?: string;
    totalAmount: number;
    createdAt?: any;
  }>;
  businessSettings?: {
    businessName?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    logo?: string;
    footerText?: string;
  };
}

export interface VoucherPrintData {
  voucherNo: string;
  type: 'receipt' | 'payment';
  date: string;
  time?: string;
  partyName: string;
  partyPhone?: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  employeeName?: string;
  currentBalance?: number;
  businessSettings?: {
    businessName?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    logo?: string;
    footerText?: string;
  };
}

export interface GeneralReportPrintData {
  title: string;
  dateRange?: string;
  stats: {
    totalSales: number;
    estimatedProfit: number;
    salesCount: number;
    purchasesCount?: number;
    totalPurchases?: number;
  };
  recentSales?: Array<{
    id?: string;
    invoiceNo?: string;
    customerName?: string;
    totalAmount: number;
    paidAmount?: number;
    paymentMethod?: string;
    createdAt?: any;
  }>;
  businessSettings?: {
    businessName?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    logo?: string;
    footerText?: string;
  };
}

export interface AccountStatementPrintData {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  currentBalance: number;
  totalPaid?: number;
  transactions: Array<{
    id?: string;
    date: string;
    type: string;
    description: string;
    amount: number;
    balance?: number;
  }>;
  businessSettings?: {
    businessName?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    logo?: string;
    footerText?: string;
  };
}

/**
 * Generate SVG for Code128 barcode pattern (B subset)
 */
export function generateCode128Svg(code: string, height: number = 40): string {
  if (!code) code = '000000';
  
  // Basic Code128B pattern table for ASCII 32 to 126
  const patterns: string[] = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
  ];

  // Start code B is index 104
  let checksum = 104;
  const indices: number[] = [104];

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const index = (charCode >= 32 && charCode <= 126) ? charCode - 32 : 0;
    indices.push(index);
    checksum += index * (i + 1);
  }

  // Checksum character
  indices.push(checksum % 103);
  // Stop pattern index 106
  indices.push(106);

  // Build SVG bars
  let barsSvg = '';
  let xPos = 0;

  for (const idx of indices) {
    const pattern = patterns[idx] || patterns[0];
    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10) * 1.5;
      if (isBar) {
        barsSvg += `<rect x="${xPos}" y="0" width="${width}" height="${height}" fill="#000000" />`;
      }
      xPos += width;
      isBar = !isBar;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${xPos} ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; display: block;">${barsSvg}</svg>`;
}

export class PrintEngine {
  /**
   * Directly prints pure HTML content through an isolated iframe to bypass any app overflow-hidden limitations.
   */
  static printIsolatedHtml(htmlContent: string): Promise<void> {
    return new Promise((resolve) => {
      // Remove any existing print frame
      const oldFrame = document.getElementById('dubsar-print-frame');
      if (oldFrame) {
        oldFrame.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'dubsar-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        resolve();
        return;
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.error('[PrintEngine Error]', err);
          } finally {
            setTimeout(() => {
              iframe.remove();
              resolve();
            }, 1000);
          }
        }, 250);
      };
    });
  }

  /**
   * Universal Document Printer using DocumentRenderer and TemplateService.
   * Single source of truth across all 13 documents.
   */
  static async printDocument(documentType: DocumentType, data: any, format: '80mm' | 'A4' = '80mm'): Promise<void> {
    const template = TemplateService.getTemplate(documentType, format);
    const html = DocumentRenderer.renderToHtml(template, data);
    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints a crystal-clear 80mm Thermal Receipt using the unified template engine.
   */
  static async printThermalReceipt(data: InvoicePrintData): Promise<void> {
    await this.printDocument('sales_invoice', data, '80mm');
  }

  /**
   * Legacy raw thermal receipt fallback (if needed).
   */
  static async printThermalReceiptLegacy(data: InvoicePrintData): Promise<void> {
    const settings = data.businessSettings || {};
    const businessName = settings.businessName || 'مؤسسة دوبسار التجارية';
    const currency = data.currency === 'USD' ? '$' : 'د.ع';

    const itemsRows = data.items.map(item => `
      <tr>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">
          ${item.name}
          ${item.serialNo ? `<div style="font-size: 9px; color: #555;">سيريال: ${item.serialNo}</div>` : ''}
        </td>
        <td style="padding: 4px 0; text-align: center; font-family: monospace;">${item.quantity}</td>
        <td style="padding: 4px 0; text-align: center; font-family: monospace;">${Number(item.price).toLocaleString()}</td>
        <td style="padding: 4px 0; text-align: left; font-weight: bold; font-family: monospace;">${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    const barcodeSvg = generateCode128Svg(data.invoiceNo, 36);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة رقم ${data.invoiceNo}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
            margin: 0;
            padding: 8px 10px;
            width: 80mm;
            background: #ffffff;
            color: #000000;
            font-size: 11px;
            line-height: 1.4;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .font-mono { font-family: monospace; }
          .dashed-line {
            border-bottom: 1px dashed #000000;
            margin: 6px 0;
          }
          .solid-line {
            border-bottom: 1.5px solid #000000;
            margin: 6px 0;
          }
          .header-title {
            font-size: 14px;
            font-weight: 900;
            margin-bottom: 2px;
          }
          .badge {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 3px;
            margin: 4px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin: 4px 0;
          }
          th {
            border-bottom: 1.5px solid #000;
            padding: 3px 0;
            font-weight: 900;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin: 2px 0;
          }
          .total-highlight {
            font-size: 13px;
            font-weight: 900;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 4px 0;
            margin: 4px 0;
          }
          .footer-note {
            font-size: 9.5px;
            color: #333;
            margin-top: 6px;
          }
          .logo-img {
            max-height: 48px;
            max-width: 130px;
            object-contain: contain;
            margin: 0 auto 4px auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          ${settings.logo ? `<img src="${settings.logo}" class="logo-img" alt="logo" />` : ''}
          <div class="header-title">${businessName}</div>
          ${settings.address ? `<div style="font-size: 10px;">${settings.address}</div>` : ''}
          ${settings.phone1 ? `<div style="font-size: 10px; font-family: monospace;">${settings.phone1}</div>` : ''}
          <div class="badge">فاتورة مبيعات</div>
        </div>

        <div class="dashed-line"></div>

        <div class="meta-row">
          <span>رقم القائمة:</span>
          <span class="font-bold font-mono">${data.invoiceNo}</span>
        </div>
        <div class="meta-row">
          <span>التاريخ:</span>
          <span>${data.date} ${data.time || ''}</span>
        </div>
        <div class="meta-row">
          <span>العميل:</span>
          <span class="font-bold">${data.customerName || 'زبون نقدي'}</span>
        </div>
        ${data.customerPhone ? `
        <div class="meta-row">
          <span>الهاتف:</span>
          <span class="font-mono">${data.customerPhone}</span>
        </div>` : ''}
        ${data.cashierName ? `
        <div class="meta-row">
          <span>الموظف:</span>
          <span>${data.cashierName}</span>
        </div>` : ''}

        <div class="solid-line"></div>

        <table>
          <thead>
            <tr>
              <th class="text-right">المادة</th>
              <th class="text-center" style="width: 28px;">العدد</th>
              <th class="text-center" style="width: 50px;">السعر</th>
              <th class="text-left" style="width: 55px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="solid-line"></div>

        <div class="total-row">
          <span>المجموع:</span>
          <span class="font-mono font-bold">${data.subtotal.toLocaleString()} ${currency}</span>
        </div>

        ${(data.discountAmount && data.discountAmount > 0) ? `
        <div class="total-row" style="color: #000;">
          <span>الخصم:</span>
          <span class="font-mono">-${data.discountAmount.toLocaleString()} ${currency}</span>
        </div>` : ''}

        <div class="total-row total-highlight">
          <span>الصافي المطلوب:</span>
          <span class="font-mono">${data.netTotal.toLocaleString()} ${currency}</span>
        </div>

        <div class="total-row">
          <span>الواصل (المدفوع):</span>
          <span class="font-mono font-bold">${(data.paidAmount ?? data.netTotal).toLocaleString()} ${currency}</span>
        </div>

        ${(data.receivedAmount && data.receivedAmount > data.netTotal) ? `
        <div class="total-row">
          <span>المستلم نقداً:</span>
          <span class="font-mono">${data.receivedAmount.toLocaleString()} ${currency}</span>
        </div>
        <div class="total-row" style="font-weight: 900; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 0; margin: 2px 0;">
          <span>الباقي للزبون:</span>
          <span class="font-mono font-bold">${(data.changeGiven ?? (data.receivedAmount - data.netTotal)).toLocaleString()} ${currency}</span>
        </div>` : ''}

        ${(data.remaining && data.remaining > 0) ? `
        <div class="total-row" style="font-weight: bold;">
          <span>المتبقي (ذمة):</span>
          <span class="font-mono">${data.remaining.toLocaleString()} ${currency}</span>
        </div>` : ''}

        ${(data.currentBalance && data.currentBalance > 0) ? `
        <div class="dashed-line"></div>
        <div class="total-row font-bold">
          <span>الرصيد الكلي:</span>
          <span class="font-mono">${data.currentBalance.toLocaleString()} ${currency}</span>
        </div>` : ''}

        <div class="dashed-line"></div>

        <div class="text-center" style="margin: 8px 0;">
          <div style="width: 70%; margin: 0 auto;">${barcodeSvg}</div>
          <div class="font-mono" style="font-size: 10px; margin-top: 2px; letter-spacing: 2px;">*${data.invoiceNo}*</div>
        </div>

        <div class="text-center footer-note">
          <p>${settings.footerText || 'شكراً لتعاملكم معنا • البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام'}</p>
          <div style="border-top: 1px dotted #888; padding-top: 4px; margin-top: 4px; font-weight: bold; font-size: 9px;">
            نظام DUBSAR لإدارة المبيعات | هاتف: 07858833838
          </div>
        </div>
      </body>
      </html>
    `;

    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints an official A4 Corporate Invoice using the unified template engine.
   */
  static async printA4Invoice(data: InvoicePrintData): Promise<void> {
    await this.printDocument('sales_invoice', data, 'A4');
  }

  /**
   * Legacy raw A4 invoice fallback (if needed).
   */
  static async printA4InvoiceLegacy(data: InvoicePrintData): Promise<void> {
    const settings = data.businessSettings || {};
    const businessName = settings.businessName || 'مؤسسة دوبسار التجارية';
    const currency = data.currency === 'USD' ? '$' : 'د.ع';

    const itemsRows = data.items.map((item, index) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; text-align: center; font-family: monospace;">${index + 1}</td>
        <td style="padding: 8px; text-align: right; font-weight: bold;">
          ${item.name}
          ${item.serialNo ? `<span style="font-size: 10px; color: #64748b; margin-right: 6px;">(سيريال: ${item.serialNo})</span>` : ''}
        </td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${item.barcode || '-'}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace; font-weight: bold;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${Number(item.price).toLocaleString()}</td>
        <td style="padding: 8px; text-align: left; font-family: monospace; font-weight: bold;">${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    const barcodeSvg = generateCode128Svg(data.invoiceNo, 40);

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>فاتورة مبيعات ${data.invoiceNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
            margin: 0;
            padding: 12px;
            background: #ffffff;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.5;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 22px;
            font-weight: 900;
            color: #0284c7;
            margin-bottom: 4px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #0284c7;
            color: #ffffff;
            font-weight: 900;
            padding: 8px;
            text-align: center;
          }
          .summary-box {
            margin-left: auto;
            width: 320px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .summary-total {
            border-top: 2px solid #0284c7;
            margin-top: 4px;
            padding-top: 6px;
            font-size: 15px;
            font-weight: 900;
            color: #0284c7;
          }
          .footer-note {
            margin-top: 30px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            text-align: center;
            font-size: 11px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="title">${businessName}</div>
            ${settings.address ? `<div>${settings.address}</div>` : ''}
            ${settings.phone1 ? `<div style="font-family: monospace;">${settings.phone1} ${settings.phone2 ? `| ${settings.phone2}` : ''}</div>` : ''}
          </div>
          <div style="text-align: left;">
            ${settings.logo ? `<img src="${settings.logo}" style="max-height: 60px; max-width: 160px; object-contain: contain;" alt="logo" />` : ''}
            <div style="font-size: 16px; font-weight: 900; margin-top: 4px;">فاتورة مبيعات رسمية</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="meta-item"><span>رقم الفاتورة:</span><span style="font-family: monospace; font-weight: bold; color: #0284c7;">${data.invoiceNo}</span></div>
            <div class="meta-item"><span>التاريخ والوقت:</span><span style="font-family: monospace;">${data.date} ${data.time || ''}</span></div>
            <div class="meta-item"><span>منظم الفاتورة:</span><span>${data.cashierName || 'المسؤول'}</span></div>
          </div>
          <div>
            <div class="meta-item"><span>اسم العميل:</span><span style="font-weight: bold;">${data.customerName || 'زبون نقدي'}</span></div>
            ${data.customerPhone ? `<div class="meta-item"><span>رقم الهاتف:</span><span style="font-family: monospace;">${data.customerPhone}</span></div>` : ''}
            ${data.customerAddress ? `<div class="meta-item"><span>العنوان:</span><span>${data.customerAddress}</span></div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">ت</th>
              <th style="text-align: right;">المادة / الوصف</th>
              <th style="width: 100px;">الباركود</th>
              <th style="width: 70px;">الكمية</th>
              <th style="width: 90px;">السعر المفرد</th>
              <th style="width: 100px; text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="width: 300px; text-align: center;">
            <div style="width: 220px; margin: 0 auto;">${barcodeSvg}</div>
            <div style="font-family: monospace; font-size: 11px; margin-top: 4px; letter-spacing: 2px;">*${data.invoiceNo}*</div>
          </div>

          <div class="summary-box">
            <div class="summary-row">
              <span>المجموع الكلي:</span>
              <span style="font-family: monospace; font-weight: bold;">${data.subtotal.toLocaleString()} ${currency}</span>
            </div>
            ${(data.discountAmount && data.discountAmount > 0) ? `
            <div class="summary-row" style="color: #16a34a;">
              <span>الخصم الممنوح:</span>
              <span style="font-family: monospace;">-${data.discountAmount.toLocaleString()} ${currency}</span>
            </div>` : ''}
            <div class="summary-row summary-total">
              <span>الصافي المطلوب:</span>
              <span style="font-family: monospace;">${data.netTotal.toLocaleString()} ${currency}</span>
            </div>
            <div class="summary-row">
              <span>المبلغ المدفوع (الواصل):</span>
              <span style="font-family: monospace; font-weight: bold;">${(data.paidAmount ?? data.netTotal).toLocaleString()} ${currency}</span>
            </div>
            ${(data.remaining && data.remaining > 0) ? `
            <div class="summary-row" style="color: #dc2626; font-weight: bold;">
              <span>المتبقي (الذمة):</span>
              <span style="font-family: monospace;">${data.remaining.toLocaleString()} ${currency}</span>
            </div>` : ''}
            ${(data.currentBalance && data.currentBalance > 0) ? `
            <div class="summary-row" style="border-top: 1px dashed #cbd5e1; margin-top: 4px; padding-top: 4px; font-weight: bold;">
              <span>الرصيد الكلي بذمة العميل:</span>
              <span style="font-family: monospace;">${data.currentBalance.toLocaleString()} ${currency}</span>
            </div>` : ''}
          </div>
        </div>

        <div class="footer-note">
          <p>${settings.footerText || 'شكراً لتعاملكم معنا • البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام'}</p>
          <div style="margin-top: 6px; font-weight: bold; color: #0284c7;">
            نظام DUBSAR لإدارة المبيعات والمخازن | هاتف الدعم الفني: 07858833838
          </div>
        </div>
      </body>
      </html>
    `;

    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints crisp barcode stickers/labels.
   */
  static async printBarcodeLabels(
    items: BarcodeLabelItem[],
    config: BarcodeLabelConfig
  ): Promise<void> {
    const labelsHtml: string[] = [];

    for (const item of items) {
      const barcodeSvg = generateCode128Svg(item.barcode, 32);
      const singleLabel = `
        <div class="label-card">
          ${config.showStoreName && item.businessName ? `<div class="store-name">${item.businessName}</div>` : ''}
          ${config.showProductName ? `<div class="product-name">${item.productName}</div>` : ''}
          <div class="barcode-svg">${barcodeSvg}</div>
          ${config.showBarcodeNumber ? `<div class="barcode-text font-mono">${item.barcode}</div>` : ''}
          ${config.showPrice ? `<div class="price-tag font-mono">${Number(item.price).toLocaleString()} د.ع</div>` : ''}
        </div>
      `;

      for (let i = 0; i < (item.copies || 1); i++) {
        labelsHtml.push(singleLabel);
      }
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة ملصقات الباركود</title>
        <style>
          @page {
            size: ${config.widthMm}mm ${config.heightMm}mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background: #ffffff;
            color: #000000;
          }
          .label-card {
            width: ${config.widthMm}mm;
            height: ${config.heightMm}mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 2mm 3mm;
            text-align: center;
            overflow: hidden;
          }
          .store-name {
            font-size: 8px;
            font-weight: bold;
            color: #333;
            max-height: 12px;
            overflow: hidden;
            white-space: nowrap;
          }
          .product-name {
            font-size: ${config.fontSize === 'small' ? '8px' : config.fontSize === 'large' ? '11px' : '9.5px'};
            font-weight: 900;
            line-height: 1.1;
            max-height: 20px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
          }
          .barcode-svg {
            width: 90%;
            margin: 1px auto;
          }
          .barcode-text {
            font-size: 8px;
            letter-spacing: 1px;
            font-family: monospace;
          }
          .price-tag {
            font-size: ${config.fontSize === 'small' ? '9px' : config.fontSize === 'large' ? '12px' : '10.5px'};
            font-weight: 900;
            border-top: 1px solid #000;
            width: 80%;
            padding-top: 1px;
          }
          .font-mono { font-family: monospace; }
        </style>
      </head>
      <body>
        ${labelsHtml.join('')}
      </body>
      </html>
    `;

    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints a crystal-clear A4 Daily Report.
   */
  static async printDailyReport(data: DailyReportPrintData): Promise<void> {
    const settings = data.businessSettings || {};
    const businessName = settings.businessName || 'مؤسسة دوبسار التجارية';

    const salesRows = (data.dailySales || []).map((s, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: bold; font-family: monospace;">${s.invoiceNo || s.id || '-'}</td>
        <td style="padding: 6px 8px;">${s.customerName || 'زبون نقدي'}</td>
        <td style="padding: 6px 8px; text-align: center;">${s.paymentMethod === 'cash' ? 'نقدي' : s.paymentMethod === 'credit' ? 'آجل' : (s.paymentMethod || 'نقدي')}</td>
        <td style="padding: 6px 8px; text-align: left; font-weight: bold; font-family: monospace;">${Number(s.totalAmount || 0).toLocaleString()} د.ع</td>
        <td style="padding: 6px 8px; text-align: left; font-family: monospace; color: #16a34a;">${Number(s.paidAmount ?? s.totalAmount ?? 0).toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const purchasesRows = (data.dailyPurchases || []).map((p, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: bold; font-family: monospace;">${p.invoiceNo || p.id || '-'}</td>
        <td style="padding: 6px 8px;">${p.supplierName || 'مورد عام'}</td>
        <td style="padding: 6px 8px; text-align: center;">${p.paymentMethod === 'cash' ? 'نقدي' : p.paymentMethod === 'credit' ? 'آجل' : (p.paymentMethod || 'نقدي')}</td>
        <td style="padding: 6px 8px; text-align: left; font-weight: bold; font-family: monospace; color: #dc2626;">${Number(p.totalAmount || 0).toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير الحركة اليومية - ${data.date}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
            margin: 0;
            padding: 8px;
            background: #ffffff;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .title {
            font-size: 20px;
            font-weight: 900;
            color: #0284c7;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          .kpi-label {
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 15px;
            font-weight: 900;
            font-family: monospace;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #0284c7;
            color: #ffffff;
            font-weight: 900;
            padding: 7px 8px;
            font-size: 11px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 900;
            color: #1e293b;
            margin-bottom: 6px;
            border-right: 3px solid #0284c7;
            padding-right: 6px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            padding: 0 40px;
          }
          .sig-box {
            text-align: center;
            width: 180px;
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            font-weight: bold;
            font-size: 11px;
          }
          .footer-note {
            margin-top: 25px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="title">${businessName}</div>
            <div style="font-weight: bold; font-size: 14px; margin-top: 2px;">تقرير الحركة اليومية الشاملة</div>
            ${settings.address ? `<div>${settings.address}</div>` : ''}
            ${settings.phone1 ? `<div style="font-family: monospace;">${settings.phone1}</div>` : ''}
          </div>
          <div style="text-align: left;">
            ${settings.logo ? `<img src="${settings.logo}" style="max-height: 55px; max-width: 150px; object-contain: contain;" alt="logo" />` : ''}
            <div style="font-size: 11px; font-weight: bold; margin-top: 4px;">تاريخ التقرير: <span style="font-family: monospace;">${data.date}</span></div>
            <div style="font-size: 10px; color: #64748b;">تاريخ الطباعة: <span style="font-family: monospace;">${new Date().toLocaleDateString('ar-IQ')} ${new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">إجمالي مبيعات اليوم</div>
            <div class="kpi-value" style="color: #16a34a;">${Number(data.salesTotal || 0).toLocaleString()} د.ع</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${(data.dailySales || []).length} فواتير صادر</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">النقد المحصل (الصندوق)</div>
            <div class="kpi-value" style="color: #0284c7;">${Number(data.salesPaidTotal || 0).toLocaleString()} د.ع</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">نقداً مقبوض</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">إجمالي المشتريات</div>
            <div class="kpi-value" style="color: #dc2626;">${Number(data.purchasesTotal || 0).toLocaleString()} د.ع</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${(data.dailyPurchases || []).length} فواتير توريد</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">صافي التدفق النقدي</div>
            <div class="kpi-value" style="color: ${data.netCashFlow >= 0 ? '#16a34a' : '#dc2626'};">${Number(data.netCashFlow || 0).toLocaleString()} د.ع</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">رصيد اليوم</div>
          </div>
        </div>

        <div class="section-title">فواتير مبيعات اليوم (${(data.dailySales || []).length})</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">ت</th>
              <th style="width: 120px; text-align: right;">رقم الفاتورة</th>
              <th style="text-align: right;">اسم العميل</th>
              <th style="width: 80px; text-align: center;">طريقة الدفع</th>
              <th style="width: 110px; text-align: left;">المبلغ الإجمالي</th>
              <th style="width: 110px; text-align: left;">الواصل (النقدي)</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows.length > 0 ? salesRows : '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748b;">لا توجد فواتير مبيعات مسجلة لهذا اليوم</td></tr>'}
          </tbody>
          ${(data.dailySales || []).length > 0 ? `
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 900; border-top: 2px solid #0284c7;">
              <td colspan="4" style="padding: 6px 8px; text-align: right;">المجموع الإجمالي للمبيعات</td>
              <td style="padding: 6px 8px; text-align: left; font-family: monospace;">${Number(data.salesTotal || 0).toLocaleString()} د.ع</td>
              <td style="padding: 6px 8px; text-align: left; font-family: monospace; color: #16a34a;">${Number(data.salesPaidTotal || 0).toLocaleString()} د.ع</td>
            </tr>
          </tfoot>` : ''}
        </table>

        ${(data.dailyPurchases && data.dailyPurchases.length > 0) ? `
        <div class="section-title">فواتير مشتريات اليوم (${data.dailyPurchases.length})</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">ت</th>
              <th style="width: 120px; text-align: right;">رقم القائمة</th>
              <th style="text-align: right;">اسم المورد</th>
              <th style="width: 80px; text-align: center;">طريقة الدفع</th>
              <th style="width: 130px; text-align: left;">المبلغ الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${purchasesRows}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: 900; border-top: 2px solid #dc2626;">
              <td colspan="4" style="padding: 6px 8px; text-align: right;">المجموع الإجمالي للمشتريات</td>
              <td style="padding: 6px 8px; text-align: left; font-family: monospace; color: #dc2626;">${Number(data.purchasesTotal || 0).toLocaleString()} د.ع</td>
            </tr>
          </tfoot>
        </table>` : ''}

        <div class="signatures">
          <div class="sig-box">توقيع المحاسب / أمين الصندوق</div>
          <div class="sig-box">توقيع المدير المسؤول</div>
        </div>

        <div class="footer-note">
          <div>نظام DUBSAR 2.0 لإدارة الأعمال والمخازن • تقرير رسمي مستخرج من قاعدة البيانات المحلية</div>
        </div>
      </body>
      </html>
    `;

    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints a crystal-clear A4 General Financial / Analytics Report.
   */
  static async printGeneralReport(data: GeneralReportPrintData): Promise<void> {
    const settings = data.businessSettings || {};
    const businessName = settings.businessName || 'مؤسسة دوبسار التجارية';

    const recentRows = (data.recentSales || []).map((s, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: bold; font-family: monospace;">${s.invoiceNo || s.id || '-'}</td>
        <td style="padding: 6px 8px;">${s.customerName || 'زبون نقدي'}</td>
        <td style="padding: 6px 8px; text-align: center;">${s.paymentMethod === 'cash' ? 'نقدي' : s.paymentMethod === 'credit' ? 'آجل' : (s.paymentMethod || 'نقدي')}</td>
        <td style="padding: 6px 8px; text-align: left; font-weight: bold; font-family: monospace;">${Number(s.totalAmount || 0).toLocaleString()} د.ع</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
            margin: 0;
            padding: 8px;
            background: #ffffff;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .title {
            font-size: 20px;
            font-weight: 900;
            color: #0284c7;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          .kpi-label {
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 15px;
            font-weight: 900;
            font-family: monospace;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #0284c7;
            color: #ffffff;
            font-weight: 900;
            padding: 7px 8px;
            font-size: 11px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 900;
            color: #1e293b;
            margin-bottom: 6px;
            border-right: 3px solid #0284c7;
            padding-right: 6px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            padding: 0 40px;
          }
          .sig-box {
            text-align: center;
            width: 180px;
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            font-weight: bold;
            font-size: 11px;
          }
          .footer-note {
            margin-top: 25px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="title">${businessName}</div>
            <div style="font-weight: bold; font-size: 14px; margin-top: 2px;">${data.title}</div>
            ${data.dateRange ? `<div style="font-size: 11px; color: #475569;">الفترة: ${data.dateRange}</div>` : ''}
            ${settings.address ? `<div>${settings.address}</div>` : ''}
          </div>
          <div style="text-align: left;">
            ${settings.logo ? `<img src="${settings.logo}" style="max-height: 55px; max-width: 150px; object-contain: contain;" alt="logo" />` : ''}
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">تاريخ الطباعة: <span style="font-family: monospace;">${new Date().toLocaleDateString('ar-IQ')} ${new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">إجمالي المبيعات</div>
            <div class="kpi-value" style="color: #16a34a;">${Number(data.stats.totalSales || 0).toLocaleString()} د.ع</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">صافي الأرباح التقديرية</div>
            <div class="kpi-value" style="color: #0284c7;">${Number(data.stats.estimatedProfit || 0).toLocaleString()} د.ع</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">عدد فواتير المبيعات</div>
            <div class="kpi-value">${data.stats.salesCount || 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">إجمالي المشتريات</div>
            <div class="kpi-value" style="color: #dc2626;">${Number(data.stats.totalPurchases || 0).toLocaleString()} د.ع</div>
          </div>
        </div>

        ${(data.recentSales && data.recentSales.length > 0) ? `
        <div class="section-title">أحدث العمليات والحركات (${data.recentSales.length})</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">ت</th>
              <th style="width: 130px; text-align: right;">رقم الفاتورة</th>
              <th style="text-align: right;">العميل / الطرف الآخر</th>
              <th style="width: 90px; text-align: center;">طريقة الدفع</th>
              <th style="width: 130px; text-align: left;">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${recentRows}
          </tbody>
        </table>` : ''}

        <div class="signatures">
          <div class="sig-box">توقيع المحاسب</div>
          <div class="sig-box">توقيع المدير العام</div>
        </div>

        <div class="footer-note">
          <div>نظام DUBSAR 2.0 • تقرير التحليلات والأداء المالي</div>
        </div>
      </body>
      </html>
    `;

    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints a crystal-clear A4 Customer / Supplier Account Statement.
   */
  static async printAccountStatement(data: AccountStatementPrintData): Promise<void> {
    const settings = data.businessSettings || {};
    const businessName = settings.businessName || 'مؤسسة دوبسار التجارية';

    const transRows = (data.transactions || []).map((t, idx) => {
      const isDebit = t.type === 'sale' || t.type === 'purchase' || t.amount > 0;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 8px; text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace;">${t.date}</td>
          <td style="padding: 6px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; background: ${isDebit ? '#fee2e2; color: #b91c1c' : '#dcfce7; color: #15803d'};">
              ${t.type === 'sale' ? 'فاتورة بيع' : t.type === 'purchase' ? 'فاتورة شراء' : 'دفعة نقدية'}
            </span>
          </td>
          <td style="padding: 6px 8px;">${t.description || '-'}</td>
          <td style="padding: 6px 8px; text-align: left; font-weight: bold; font-family: monospace; color: ${isDebit ? '#dc2626' : '#16a34a'};">
            ${Math.abs(Number(t.amount || 0)).toLocaleString()} د.ع
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>كشف حساب - ${data.customerName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
            margin: 0;
            padding: 8px;
            background: #ffffff;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .title {
            font-size: 20px;
            font-weight: 900;
            color: #0284c7;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #0284c7;
            color: #ffffff;
            font-weight: 900;
            padding: 7px 8px;
            font-size: 11px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            padding: 0 40px;
          }
          .sig-box {
            text-align: center;
            width: 180px;
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            font-weight: bold;
            font-size: 11px;
          }
          .footer-note {
            margin-top: 25px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="title">${businessName}</div>
            <div style="font-weight: bold; font-size: 14px; margin-top: 2px;">كشف حساب تفصيلي</div>
            ${settings.address ? `<div>${settings.address}</div>` : ''}
            ${settings.phone1 ? `<div style="font-family: monospace;">${settings.phone1}</div>` : ''}
          </div>
          <div style="text-align: left;">
            ${settings.logo ? `<img src="${settings.logo}" style="max-height: 55px; max-width: 150px; object-contain: contain;" alt="logo" />` : ''}
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">تاريخ الاستخراج: <span style="font-family: monospace;">${new Date().toLocaleDateString('ar-IQ')} ${new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <div class="meta-row"><span>اسم العميل / الحساب:</span><span style="font-weight: bold;">${data.customerName}</span></div>
            ${data.customerPhone ? `<div class="meta-row"><span>رقم الهاتف:</span><span style="font-family: monospace;">${data.customerPhone}</span></div>` : ''}
            ${data.customerAddress ? `<div class="meta-row"><span>العنوان:</span><span>${data.customerAddress}</span></div>` : ''}
          </div>
          <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
            <div class="meta-row">
              <span style="font-weight: bold;">الرصيد المستحق (الذمة الحالية):</span>
              <span style="font-weight: 900; font-family: monospace; color: #dc2626; font-size: 13px;">${Number(data.currentBalance || 0).toLocaleString()} د.ع</span>
            </div>
            ${data.totalPaid !== undefined ? `
            <div class="meta-row">
              <span>إجمالي التسديدات:</span>
              <span style="font-weight: bold; font-family: monospace; color: #16a34a;">${Number(data.totalPaid || 0).toLocaleString()} د.ع</span>
            </div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">ت</th>
              <th style="width: 140px; text-align: right;">التاريخ والوقت</th>
              <th style="width: 90px; text-align: center;">نوع الحركة</th>
              <th style="text-align: right;">التفاصيل والبيان</th>
              <th style="width: 120px; text-align: left;">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${transRows.length > 0 ? transRows : '<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b;">لا توجد حركات مسجلة لهذا الحساب</td></tr>'}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">توقيع المحاسب</div>
          <div class="sig-box">توقيع ومصادقة العميل</div>
        </div>

        <div class="footer-note">
          <div>نظام DUBSAR 2.0 • كشف حساب مالي رسمي</div>
        </div>
      </body>
      </html>
    `;

    await this.printIsolatedHtml(html);
  }

  /**
   * Generates and prints crystal-clear official Receipt / Payment Vouchers (80mm & A4).
   */
  static async printVoucher(data: VoucherPrintData, format: '80mm' | 'A4' = '80mm'): Promise<void> {
    const settings = data.businessSettings || {};
    const businessName = settings.businessName || 'مؤسسة دوبسار التجارية';
    const isReceipt = data.type === 'receipt';
    const voucherTitle = isReceipt ? 'سند قبض مالي' : 'سند صرف مالي';
    const partyLabel = isReceipt ? 'استلمنا من السيد / السيدة:' : 'صرفنا إلى السيد / السيدة:';
    const paymentMethodLabel = data.paymentMethod === 'cash' ? 'نقداً' : data.paymentMethod === 'transfer' ? 'تحويل بنكي / إلكتروني' : data.paymentMethod === 'check' ? 'صك مصرفي' : data.paymentMethod;

    if (format === '80mm') {
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${voucherTitle} - ${data.voucherNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 3mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
              margin: 0;
              padding: 4px;
              width: 74mm;
              background: #fff;
              color: #000;
              font-size: 11px;
              line-height: 1.35;
            }
            .center { text-align: center; }
            .header {
              border-bottom: 2px dashed #000;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 16px;
              font-weight: 900;
              margin-bottom: 3px;
            }
            .subtitle {
              font-size: 13px;
              font-weight: bold;
              border: 1px solid #000;
              padding: 2px 6px;
              display: inline-block;
              border-radius: 4px;
              margin-top: 2px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .amount-box {
              border: 2px solid #000;
              padding: 8px;
              text-align: center;
              margin: 8px 0;
              border-radius: 6px;
              background: #f8fafc;
            }
            .amount-val {
              font-size: 18px;
              font-weight: 900;
              font-family: monospace;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .sig-area {
              margin-top: 16px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="center header">
            <div class="title">${businessName}</div>
            <div class="subtitle">${voucherTitle}</div>
            ${settings.phone1 ? `<div style="font-family: monospace; font-size: 10px; margin-top: 3px;">هاتف: ${settings.phone1}</div>` : ''}
          </div>

          <div class="info-row">
            <span>رقم السند:</span>
            <span style="font-weight: 900; font-family: monospace;">${data.voucherNo}</span>
          </div>
          <div class="info-row">
            <span>التاريخ:</span>
            <span style="font-family: monospace;">${data.date} ${data.time || ''}</span>
          </div>

          <div class="divider"></div>

          <div style="margin-bottom: 4px; font-weight: bold;">${partyLabel}</div>
          <div style="font-size: 13px; font-weight: 900; padding: 2px 0;">${data.partyName}</div>
          ${data.partyPhone ? `<div style="font-size: 10px; font-family: monospace; color: #444;">هاتف: ${data.partyPhone}</div>` : ''}

          <div class="amount-box">
            <div style="font-size: 10px; font-weight: bold;">المبلغ المستلم / المدفوع:</div>
            <div class="amount-val">${Number(data.amount || 0).toLocaleString()} د.ع</div>
          </div>

          <div class="info-row">
            <span>طريقة الدفع:</span>
            <span style="font-weight: bold;">${paymentMethodLabel}</span>
          </div>

          ${data.notes ? `
          <div class="divider"></div>
          <div style="font-size: 10px; margin-top: 4px;">
            <span style="font-weight: bold;">البيان / ملاحظات:</span>
            <div>${data.notes}</div>
          </div>` : ''}

          ${data.currentBalance !== undefined ? `
          <div class="divider"></div>
          <div class="info-row">
            <span>الرصيد المتبقي:</span>
            <span style="font-weight: 900; font-family: monospace;">${Number(data.currentBalance || 0).toLocaleString()} د.ع</span>
          </div>` : ''}

          <div class="sig-area">
            <div>المحاسب: ${data.employeeName || 'الكاشير'}</div>
            <div>توقيع المستلم: ...........</div>
          </div>

          <div class="center" style="margin-top: 14px; font-size: 9px; color: #666; border-top: 1px dotted #888; padding-top: 4px;">
            نظام DUBSAR 2.0 • سند رسمي
          </div>
        </body>
        </html>
      `;
      await this.printIsolatedHtml(html);
    } else {
      // A4 format
      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${voucherTitle} - ${data.voucherNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, Tahoma, sans-serif;
              margin: 0;
              padding: 12px;
              background: #fff;
              color: #0f172a;
              font-size: 12px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 22px;
              font-weight: 900;
              color: #0284c7;
            }
            .badge {
              font-size: 14px;
              font-weight: 900;
              background: #f0f9ff;
              border: 1px solid #0284c7;
              color: #0369a1;
              padding: 4px 14px;
              border-radius: 8px;
              display: inline-block;
              margin-top: 4px;
            }
            .meta-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .amount-card {
              border: 2px solid ${isReceipt ? '#16a34a' : '#0284c7'};
              background: ${isReceipt ? '#f0fdf4' : '#f0f9ff'};
              border-radius: 12px;
              padding: 16px;
              text-align: center;
              margin-bottom: 20px;
            }
            .amount-val {
              font-size: 24px;
              font-weight: 900;
              font-family: monospace;
              color: ${isReceipt ? '#15803d' : '#0369a1'};
              margin-top: 4px;
            }
            .notes-box {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 30px;
              background: #fff;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding: 0 40px;
            }
            .sig-box {
              text-align: center;
              width: 180px;
              border-top: 1px dashed #94a3b8;
              padding-top: 8px;
              font-weight: bold;
            }
            .footer-note {
              margin-top: 40px;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${businessName}</div>
              <div class="badge">${voucherTitle}</div>
              ${settings.address ? `<div style="margin-top: 4px; color: #475569;">${settings.address}</div>` : ''}
              ${settings.phone1 ? `<div style="font-family: monospace; color: #475569;">هاتف: ${settings.phone1}</div>` : ''}
            </div>
            <div style="text-align: left;">
              ${settings.logo ? `<img src="${settings.logo}" style="max-height: 60px; max-width: 160px; object-contain: contain;" alt="logo" />` : ''}
              <div style="font-family: monospace; font-size: 11px; margin-top: 6px;">
                رقم السند: <strong>${data.voucherNo}</strong>
              </div>
              <div style="font-family: monospace; font-size: 11px; color: #64748b;">
                التاريخ: ${data.date} ${data.time || ''}
              </div>
            </div>
          </div>

          <div class="meta-box">
            <div>
              <div class="meta-row">
                <span style="color: #64748b;">${partyLabel}</span>
                <span style="font-weight: 900; font-size: 14px;">${data.partyName}</span>
              </div>
              ${data.partyPhone ? `
              <div class="meta-row">
                <span style="color: #64748b;">رقم الهاتف:</span>
                <span style="font-family: monospace; font-weight: bold;">${data.partyPhone}</span>
              </div>` : ''}
            </div>
            <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
              <div class="meta-row">
                <span style="color: #64748b;">طريقة الدفع:</span>
                <span style="font-weight: bold;">${paymentMethodLabel}</span>
              </div>
              <div class="meta-row">
                <span style="color: #64748b;">الموظف المسؤول:</span>
                <span style="font-weight: bold;">${data.employeeName || 'المسؤول'}</span>
              </div>
            </div>
          </div>

          <div class="amount-card">
            <div style="font-size: 13px; font-weight: bold; color: #475569;">المبلغ الإجمالي المستلم / المصروف</div>
            <div class="amount-val">${Number(data.amount || 0).toLocaleString()} دينار عراقي</div>
          </div>

          ${data.notes ? `
          <div class="notes-box">
            <span style="font-weight: bold; color: #475569; display: block; margin-bottom: 4px;">البيان والملاحظات:</span>
            <div>${data.notes}</div>
          </div>` : ''}

          ${data.currentBalance !== undefined ? `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <div style="background: #f1f5f9; padding: 10px 16px; border-radius: 8px; font-size: 13px;">
              <span>الرصيد المتبقي بذمة الحساب: </span>
              <strong style="font-family: monospace; font-size: 14px; color: #dc2626;">${Number(data.currentBalance || 0).toLocaleString()} د.ع</strong>
            </div>
          </div>` : ''}

          <div class="signatures">
            <div class="sig-box">توقيع وأمين الصندوق</div>
            <div class="sig-box">توقيع المستلم / العميل</div>
          </div>

          <div class="footer-note">
            <div>نظام DUBSAR 2.0 لإدارة الأعمال والمخازن • وثيقة مالية رسمية صادرة من النظام</div>
          </div>
        </body>
        </html>
      `;
      await this.printIsolatedHtml(html);
    }
  }
}


