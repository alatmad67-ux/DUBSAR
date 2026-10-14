/**
 * @fileOverview DUBSAR 2.0 Unified Document Renderer.
 * Single source of truth for Preview, Print, and PDF.
 * Implements the verified DUBSAR brand identity (Navy + Blue + Gold) with offline Cairo font
 * exactly matching the reference design layout for both A4 and 80mm formats.
 */

import { DocumentTemplate, DocumentRenderData } from './template-types';
import { LocalAuthService } from '@/services/local-auth-service';
import { CAIRO_FONT_CSS } from './cairo-font';

export class DocumentRenderer {
  /**
   * Main entrypoint: Dispatches to two strictly separated templates (A4 vs 80mm)
   * using the unified data & settings model.
   */
  static renderToHtml(template: DocumentTemplate, rawData: DocumentRenderData | Record<string, any>): string {
    const data = this.normalizeData(rawData);
    if (template.format === 'A4') {
      return this.renderA4Html(template, data);
    }
    return this.render80mmHtml(template, data);
  }

  /**
   * Converts any raw invoice number or ID into a clean sequence number:
   * e.g., 1 -> "0001", 42 -> "0042", "INV-1001" -> "0001", "INV-1034" -> "0034".
   * Never displays internal UUIDs, timestamps, or raw GUIDs to the user.
   */
  public static formatDisplayInvoiceNumber(rawNumber: any): string {
    if (rawNumber === undefined || rawNumber === null || rawNumber === '') {
      return '0001';
    }

    const str = String(rawNumber).trim();

    // Already 4+ digit pure sequence (e.g. "0001", "0042")
    if (/^\d{4}$/.test(str)) {
      return str;
    }

    // Pure number < 1000 (e.g. "1", "25") -> pad to 4 digits
    if (/^\d{1,3}$/.test(str)) {
      return str.padStart(4, '0');
    }

    // Extract numbers from prefixed IDs like "INV-1001", "POS-0005", "INV-1"
    const digitMatch = str.match(/\d+/g);
    if (digitMatch && digitMatch.length > 0) {
      const lastDigits = digitMatch[digitMatch.length - 1];
      const parsed = parseInt(lastDigits, 10);
      if (!isNaN(parsed) && parsed > 0) {
        // If it was based on old DUBSAR starting offset 1000 (e.g. 1001 -> 1, 1034 -> 34)
        if (parsed >= 1001 && parsed <= 1999 && (str.startsWith('INV-') || str.startsWith('POS-') || str.startsWith('10'))) {
          return String(parsed - 1000).padStart(4, '0');
        }
        if (parsed < 10000) {
          return String(parsed).padStart(4, '0');
        }
      }
    }

    // If it's a UUID or timestamp, produce a deterministic 4-digit sequence
    if (str.length > 10 || str.includes('-')) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const seq = (Math.abs(hash) % 9999) + 1;
      return String(seq).padStart(4, '0');
    }

    return str.padStart(4, '0');
  }

  /**
   * Vector Code128 Barcode Generator (Subset B)
   * High performance, crisp vector SVG with zero external dependencies.
   */
  public static generateCode128Svg(code: string, height: number = 34): string {
    if (!code) code = '0001';

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

    let checksum = 104;
    const indices: number[] = [104];

    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const index = (charCode >= 32 && charCode <= 126) ? charCode - 32 : 0;
      indices.push(index);
      checksum += index * (i + 1);
    }

    indices.push(checksum % 103);
    indices.push(106);

    let barsSvg = '';
    let xPos = 0;

    for (const idx of indices) {
      const pattern = patterns[idx] || patterns[0];
      let isBar = true;
      for (let p = 0; p < pattern.length; p++) {
        const width = parseInt(pattern[p], 10) * 1.5;
        if (isBar) {
          barsSvg += `<rect x="${xPos}" y="0" width="${width}" height="${height}" fill="#13293d" />`;
        }
        xPos += width;
        isBar = !isBar;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${xPos} ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; display: block;">${barsSvg}</svg>`;
  }

  /**
   * Deterministic Offline QR Code SVG Generator (21x21 matrix with valid finder patterns)
   */
  public static generateQrCodeSvg(text: string, size: number = 60): string {
    const modules: boolean[][] = Array.from({ length: 21 }, () => Array(21).fill(false));

    // Finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            modules[r + i][c + j] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, 14);
    drawFinder(14, 0);

    // Timing patterns
    for (let i = 8; i < 13; i++) {
      modules[6][i] = i % 2 === 0;
      modules[i][6] = i % 2 === 0;
    }

    // Data hash fill
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const isFinderArea =
          (r < 8 && c < 8) ||
          (r < 8 && c >= 13) ||
          (r >= 13 && c < 8) ||
          r === 6 || c === 6;
        if (!isFinderArea) {
          const bit = Math.abs((hash ^ (r * 31 + c * 17))) % 7;
          modules[r][c] = bit === 0 || bit === 2 || bit === 4;
        }
      }
    }

    let rects = '';
    const cellSize = (size / 21).toFixed(2);
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        if (modules[r][c]) {
          rects += `<rect x="${(c * Number(cellSize)).toFixed(2)}" y="${(r * Number(cellSize)).toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="#13293d" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: block; border-radius: 4px; background: #ffffff;">${rects}</svg>`;
  }

  /**
   * Top Geometric Corner Ribbon SVG (Navy #13293d + Gold #d4af37)
   */
  private static getTopRibbonsSvg(): string {
    return `
      <div class="a4-top-ribbon-decor">
        <svg viewBox="0 0 160 80" width="160" height="80" xmlns="http://www.w3.org/2000/svg" style="display: block;">
          <polygon points="0,0 140,0 110,38 0,38" fill="#13293d" />
          <polygon points="0,38 110,38 85,62 0,62" fill="#d4af37" />
          <polygon points="110,38 140,0 155,0 120,44 95,44" fill="#c59b27" opacity="0.6" />
        </svg>
      </div>
    `;
  }

  /**
   * Bottom Geometric Corner Ribbon SVG
   */
  private static getBottomRibbonsSvg(): string {
    return `
      <div class="a4-bottom-ribbon-decor">
        <svg viewBox="0 0 160 60" width="160" height="60" xmlns="http://www.w3.org/2000/svg" style="display: block;">
          <polygon points="0,60 140,60 110,24 0,24" fill="#13293d" />
          <polygon points="0,24 110,24 85,4 0,4" fill="#d4af37" />
        </svg>
      </div>
    `;
  }

  /**
   * DUBSAR Official Vector Branding Block
   */
  private static getDubsarBrandingBlock(): string {
    return `
      <div class="dubsar-brand-badge">
        <div class="dubsar-icon-box">
          <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="8" fill="#13293d" />
            <path d="M10 28 L20 12 L30 28 Z" fill="none" stroke="#2563eb" stroke-width="3" stroke-linejoin="round" />
            <polygon points="20,16 23,23 30,23 25,27 27,34 20,30 13,34 15,27 10,23 17,23" fill="#d4af37" />
          </svg>
        </div>
        <div class="dubsar-brand-texts">
          <span class="dubsar-brand-title">DUBSAR</span>
          <span class="dubsar-brand-subtitle">إدارة أعمالك... أسهل</span>
        </div>
      </div>
    `;
  }

  /**
   * ============================================================================
   * 1. A4 CORPORATE INVOICE RENDERER
   * Exact reproduction of reference design: media_1789696422989.jpg
   * ============================================================================
   */
  private static renderA4Html(template: DocumentTemplate, data: DocumentRenderData): string {
    const opts = data.printOptions || {};
    const primaryColor = '#13293d';
    const goldColor = '#d4af37';

    const headerImage = (data.business?.headerImage || '').trim();
    const hasWideHeaderImage = headerImage.length > 0;
    const showLogo = opts.showLogo !== false;
    const logoUrl = (data.business?.logo || '').trim();

    const businessName = data.business?.name || 'اسم المتجر للتجارة العامة';
    const businessType = data.business?.businessType || '';
    const slogan = data.business?.slogan || 'جودة • ثقة • أسعار مميزة';
    const address = data.business?.address || 'بغداد - الكرادة';
    const phone = [data.business?.phone1, data.business?.phone2].filter(Boolean).join(' | ') || '0771 234 5678';
    const docTitle = data.document?.title || template.titleArabic || 'فاتورة بيع';

    const displayInvoiceNo = this.formatDisplayInvoiceNumber(data.document?.number);
    const date = data.document?.date || new Date().toISOString().split('T')[0];
    const time = data.document?.time || '03:45 م';
    const cashier = opts.showCashierName !== false ? (data.document?.cashierName || 'المسؤول') : 'المسؤول';
    const saleType = data.document?.saleType || (data.document?.paymentMethod === 'credit' ? 'آجل / ذمم' : 'نقدي');
    const warehouse = data.document?.warehouse || 'المستودع الرئيسي';

    const party = data.party;
    const customerName = party?.name && party.name.trim() !== '' ? party.name : 'عميل نقدي';
    const customerPhone = party?.phone || '';
    const customerAddress = party?.address || '';

    // QR Code text representation
    const qrText = `DUBSAR|${businessName}|${displayInvoiceNo}|${data.totals?.netTotal || 0}|${date}`;
    const qrSvg = this.generateQrCodeSvg(qrText, 62);
    const barcodeSvg = this.generateCode128Svg(displayInvoiceNo, 36);

    // Header HTML
    const headerHtml = hasWideHeaderImage
      ? `
        <div class="a4-header-banner">
          <img src="${headerImage}" alt="ترويسة الفاتورة" class="a4-header-banner-img" />
        </div>
      `
      : `
        <div class="a4-custom-header">
          ${this.getTopRibbonsSvg()}
          <div class="a4-header-content">
            <!-- Left Side: DUBSAR Logo & QR Code -->
            <div class="a4-header-left">
              ${this.getDubsarBrandingBlock()}
              <div class="a4-header-divider"></div>
              <div class="a4-qr-box">
                ${qrSvg}
              </div>
            </div>

            <!-- Right Side: Business Info -->
            <div class="a4-header-right">
              <div class="a4-store-name">${businessName}</div>
              ${businessType ? `<div class="a4-store-type">${businessType}</div>` : ''}
              <div class="a4-store-slogan">${slogan}</div>
              <div class="a4-store-contacts">
                <span class="a4-contact-item">
                  <span class="a4-contact-icon">📞</span>
                  <span class="num-ltr">${phone}</span>
                </span>
                <span class="a4-contact-divider">•</span>
                <span class="a4-contact-item">
                  <span class="a4-contact-icon">📍</span>
                  <span>${address}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      `;

    // Meta Card with 3 Columns & Bottom Sub-Bar
    const metaCardHtml = `
      <div class="a4-meta-wrapper">
        <div class="a4-title-pill-container">
          <div class="a4-title-pill">${docTitle}</div>
        </div>

        <div class="a4-meta-card">
          <div class="a4-meta-top-grid">
            <!-- Right Sub-Card: Customer Info -->
            <div class="a4-subcard customer-subcard">
              <div class="meta-row">
                <span class="meta-label">اسم الزبون:</span>
                <span class="meta-val bold">${customerName}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">الهاتف:</span>
                <span class="meta-val font-mono num-ltr">${customerPhone || '---'}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">العنوان:</span>
                <span class="meta-val">${customerAddress || '---'}</span>
              </div>
            </div>

            <!-- Middle Sub-Card: Date & Time -->
            <div class="a4-subcard datetime-subcard">
              <div class="meta-row">
                <span class="meta-label">التاريخ:</span>
                <span class="meta-val font-mono num-ltr">${date}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">الوقت:</span>
                <span class="meta-val font-mono num-ltr">${time}</span>
              </div>
            </div>

            <!-- Left Sub-Card: Barcode & Sequence -->
            <div class="a4-subcard barcode-subcard">
              <div class="barcode-svg-container">
                ${barcodeSvg}
              </div>
              <div class="barcode-number-text num-ltr">${displayInvoiceNo}</div>
            </div>
          </div>

          <!-- Bottom Sub-Bar: Cashier | Sale Type | Warehouse -->
          <div class="a4-meta-bottom-bar">
            <div class="bottom-bar-item">
              <span class="bar-label">المستخدم:</span>
              <span class="bar-val">${cashier}</span>
            </div>
            <div class="bottom-bar-divider">|</div>
            <div class="bottom-bar-item">
              <span class="bar-label">نوع البيع:</span>
              <span class="bar-val bold">${saleType}</span>
            </div>
            <div class="bottom-bar-divider">|</div>
            <div class="bottom-bar-item">
              <span class="bar-label">المستودع:</span>
              <span class="bar-val">${warehouse}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Dynamic Columns for Items Table
    const showItemIndex = opts.showItemIndex !== false;
    const showBarcode = opts.showBarcode !== false;
    const showUnit = opts.showUnit !== false;
    const showDiscount = opts.showDiscount !== false;

    interface ColDef {
      key: string;
      label: string;
      weight: number;
      align: 'right' | 'center' | 'left';
    }

    const activeCols: ColDef[] = [];
    if (showItemIndex) activeCols.push({ key: 'index', label: '#', weight: 4.5, align: 'center' });
    activeCols.push({ key: 'name', label: 'المادة', weight: 35, align: 'right' });
    if (showBarcode) activeCols.push({ key: 'barcode', label: 'الباركود', weight: 14, align: 'center' });
    if (showUnit) activeCols.push({ key: 'unit', label: 'الوحدة', weight: 8.5, align: 'center' });
    activeCols.push({ key: 'quantity', label: 'العدد', weight: 8, align: 'center' });
    activeCols.push({ key: 'price', label: 'سعر الوحدة', weight: 13, align: 'center' });
    if (showDiscount) activeCols.push({ key: 'discount', label: 'الخصم', weight: 8, align: 'center' });
    activeCols.push({ key: 'total', label: 'الإجمالي', weight: 14, align: 'left' });

    const totalWeight = activeCols.reduce((sum, c) => sum + c.weight, 0);
    const colgroupHtml = activeCols
      .map((c) => `<col style="width: ${((c.weight / totalWeight) * 100).toFixed(2)}%;" />`)
      .join('\n');

    const theadHtml = activeCols
      .map((c) => `<th class="${c.align}">${c.label}</th>`)
      .join('\n');

    const items = data.items || [];
    let tbodyHtml = '';
    let totalItemsQuantity = 0;

    if (items.length === 0) {
      tbodyHtml = `<tr><td colspan="${activeCols.length}" class="center empty-table-cell">لا توجد مواد مسجلة في هذه الفاتورة</td></tr>`;
    } else {
      tbodyHtml = items
        .map((it, idx) => {
          const qty = Number(it.quantity || 1);
          totalItemsQuantity += qty;
          const lineTotal = Number(it.total ?? (qty * Number(it.price || 0) - Number(it.discount || 0)));

          const cells = activeCols
            .map((col) => {
              switch (col.key) {
                case 'index':
                  return `<td class="center font-mono num-ltr">${idx + 1}</td>`;
                case 'name':
                  return `
                    <td class="right item-name-cell">
                      <div class="wrap-text bold">${it.name}</div>
                      ${it.serialNo ? `<div class="sub-text font-mono num-ltr">S/N: ${it.serialNo}</div>` : ''}
                      ${it.notes ? `<div class="sub-text">${it.notes}</div>` : ''}
                    </td>
                  `;
                case 'barcode':
                  return `<td class="center font-mono num-ltr">${it.barcode || '-'}</td>`;
                case 'unit':
                  return `<td class="center">${it.unit || 'قطعة'}</td>`;
                case 'quantity':
                  return `<td class="center font-mono num-ltr bold">${qty}</td>`;
                case 'price':
                  return `<td class="center font-mono num-ltr">${Number(it.price || 0).toLocaleString()}</td>`;
                case 'discount':
                  return `<td class="center font-mono num-ltr">${Number(it.discount || 0) > 0 ? Number(it.discount).toLocaleString() : '-'}</td>`;
                case 'total':
                  return `<td class="left font-mono num-ltr bold table-total-cell">${lineTotal.toLocaleString()}</td>`;
                default:
                  return '<td></td>';
              }
            })
            .join('\n');

          return `<tr class="${idx % 2 === 1 ? 'row-alt' : ''}">${cells}</tr>`;
        })
        .join('\n');
    }

    // Totals, Balances & Notes
    const totals = data.totals || { netTotal: 0 };
    const cur = totals.currency === 'USD' ? '$' : totals.currency === 'IQD' ? 'د.ع' : totals.currency || 'د.ع';
    const subtotal = Number(totals.subtotal ?? totals.netTotal);
    const discount = Number(totals.discount || 0);
    const netTotal = Number(totals.netTotal || 0);
    const paid = Number(totals.paid ?? netTotal);
    const remaining = Number(totals.remaining ?? Math.max(0, netTotal - paid));
    const itemCount = totals.itemCount ?? (items.length > 0 ? items.length : 0);

    const showPrevBal = opts.showPreviousBalance !== false;
    const showCurrBal = opts.showCustomerBalance !== false;
    const prevBal = Number(data.party?.previousBalance || 0);
    const currBal = Number(data.party?.currentBalance || 0);

    const docNotes = data.document?.notes || data.business?.footerNotice || 'البضاعة المباعة لا ترد ولا تستبدل إلا بموجب هذه الفاتورة الأصلية وخلال المدة المحددة.';

    const summaryBlockHtml = `
      <div class="a4-bottom-section">
        <!-- Right Column: Notes -->
        <div class="a4-notes-card">
          <div class="notes-header bold">ملاحظة:</div>
          <div class="notes-body wrap-text">${docNotes}</div>
        </div>

        <!-- Left Column: 2-Column Structured Totals Box -->
        <div class="a4-totals-grid-card">
          <div class="totals-subcolumn">
            <div class="total-row">
              <span class="total-label">إجمالي المواد:</span>
              <span class="total-value font-mono num-ltr">${subtotal.toLocaleString()} ${cur}</span>
            </div>
            <div class="total-row">
              <span class="total-label">الخصم:</span>
              <span class="total-value font-mono num-ltr">${discount.toLocaleString()} ${cur}</span>
            </div>
            <div class="total-row net-total-row">
              <span class="total-label bold">الصافي:</span>
              <span class="total-value bold font-mono num-ltr">${netTotal.toLocaleString()} ${cur}</span>
            </div>
          </div>

          <div class="totals-col-divider"></div>

          <div class="totals-subcolumn">
            <div class="total-row">
              <span class="total-label">المدفوع:</span>
              <span class="total-value font-mono num-ltr" style="color: #16a34a;">${paid.toLocaleString()} ${cur}</span>
            </div>
            <div class="total-row">
              <span class="total-label">المتبقي:</span>
              <span class="total-value font-mono num-ltr ${remaining > 0 ? 'debt-highlight' : ''}">${remaining.toLocaleString()} ${cur}</span>
            </div>
            <div class="total-row">
              <span class="total-label">عدد المواد:</span>
              <span class="total-value font-mono num-ltr bold">${itemCount}</span>
            </div>
          </div>
        </div>
      </div>

      ${(showPrevBal && prevBal > 0) || (showCurrBal && currBal > 0) ? `
      <div class="a4-balances-strip">
        ${showPrevBal && prevBal > 0 ? `<span>الرصيد السابق: <strong class="font-mono num-ltr">${prevBal.toLocaleString()} ${cur}</strong></span>` : ''}
        ${showCurrBal && currBal > 0 ? `<span>الرصيد الكلي في الذمة: <strong class="font-mono num-ltr" style="color: #dc2626;">${currBal.toLocaleString()} ${cur}</strong></span>` : ''}
      </div>` : ''}
    `;

    // Signatures Block
    const showSignatures = opts.showSignatures !== false;
    const showOrganizerName = opts.showOrganizerName !== false;
    const showSupplierName = opts.showSupplierName !== false;

    const signaturesHtml = showSignatures && (showOrganizerName || showSupplierName)
      ? `
        <div class="a4-signatures-section">
          ${showSupplierName ? `
          <div class="sig-block">
            <span class="sig-title">اسم المجهز:</span>
            <span class="sig-line">...................................................</span>
            <span class="sig-sub">(اختياري)</span>
          </div>` : '<div></div>'}

          ${showOrganizerName ? `
          <div class="sig-block">
            <span class="sig-title">اسم المنظم:</span>
            <span class="sig-line">...................................................</span>
            <span class="sig-sub">${cashier}</span>
          </div>` : '<div></div>'}
        </div>
      `
      : '';

    // Official DUBSAR Footer
    const footerHtml = `
      <div class="a4-official-footer">
        ${this.getBottomRibbonsSvg()}
        <div class="footer-center-text">
          <span>نظام DUBSAR لإدارة المبيعات</span>
          <span class="footer-bullet">•</span>
          <span class="font-mono num-ltr">07858833838</span>
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>&#8203;</title>
        <style>
          ${CAIRO_FONT_CSS}

          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            font-family: 'Cairo', Tahoma, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            background: #ffffff;
            color: #0f172a;
            font-size: 11.5px;
            line-height: 1.4;
            direction: rtl;
          }

          .a4-page-container {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 10mm 12mm 10mm 12mm;
            background: #ffffff;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .a4-content-body {
            flex: 1;
            position: relative;
          }

          .center { text-align: center; }
          .right { text-align: right; }
          .left { text-align: left; }
          .bold { font-weight: 700; }
          .font-mono { font-family: 'Cairo', Tahoma, Arial, sans-serif; }
          .num-ltr { direction: ltr; unicode-bidi: embed; display: inline-block; }
          .wrap-text { word-break: break-word; overflow-wrap: break-word; white-space: normal; }

          /* Top Decorative Ribbons */
          .a4-top-ribbon-decor {
            position: absolute;
            top: -10mm;
            left: -12mm;
            z-index: 1;
            pointer-events: none;
          }

          /* Header Layout */
          .a4-custom-header {
            position: relative;
            padding-bottom: 12px;
            margin-bottom: 10px;
          }

          .a4-header-banner {
            width: 100%;
            margin-bottom: 12px;
          }

          .a4-header-banner-img {
            width: 100%;
            height: auto;
            max-height: 175px;
            object-fit: contain;
            display: block;
          }

          .a4-header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            z-index: 2;
          }

          .a4-header-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .dubsar-brand-badge {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .dubsar-icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .dubsar-brand-texts {
            display: flex;
            flex-direction: column;
          }

          .dubsar-brand-title {
            font-size: 19px;
            font-weight: 900;
            color: #13293d;
            letter-spacing: 0.5px;
            line-height: 1.1;
          }

          .dubsar-brand-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
          }

          .a4-header-divider {
            width: 1.5px;
            height: 48px;
            background: #cbd5e1;
          }

          .a4-qr-box {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            background: #ffffff;
          }

          .a4-header-right {
            text-align: right;
            max-width: 58%;
          }

          .a4-store-name {
            font-size: 21px;
            font-weight: 900;
            color: #13293d;
            line-height: 1.2;
          }

          .a4-store-type {
            font-size: 12px;
            font-weight: 700;
            color: #334155;
            margin-top: 1px;
          }

          .a4-store-slogan {
            font-size: 12px;
            font-weight: 800;
            color: #c59b27;
            margin-top: 2px;
            letter-spacing: 0.5px;
          }

          .a4-store-contacts {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 8px;
            margin-top: 4px;
            font-size: 11px;
            color: #334155;
          }

          .a4-contact-divider {
            color: #94a3b8;
          }

          /* Document Title Badge Pill */
          .a4-meta-wrapper {
            position: relative;
            margin-bottom: 12px;
          }

          .a4-title-pill-container {
            text-align: center;
            margin-bottom: -13px;
            position: relative;
            z-index: 10;
          }

          .a4-title-pill {
            display: inline-block;
            background: #13293d;
            color: #ffffff;
            font-size: 14px;
            font-weight: 900;
            padding: 4px 34px;
            border-radius: 9999px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            letter-spacing: 0.5px;
          }

          /* Meta Card Container */
          .a4-meta-card {
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 10px;
            padding: 18px 14px 8px 14px;
          }

          .a4-meta-top-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.9fr 1fr;
            gap: 16px;
            align-items: center;
          }

          .a4-subcard {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .meta-row {
            display: flex;
            align-items: baseline;
            gap: 6px;
            font-size: 11px;
          }

          .meta-label {
            color: #475569;
            font-weight: 700;
            flex-shrink: 0;
          }

          .meta-val {
            color: #0f172a;
          }

          .barcode-subcard {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-left: 8px;
          }

          .barcode-svg-container {
            width: 100%;
            max-width: 155px;
          }

          .barcode-number-text {
            font-size: 12px;
            font-weight: 900;
            color: #13293d;
            letter-spacing: 2px;
            margin-top: 2px;
          }

          .a4-meta-bottom-bar {
            border-top: 1px solid #e2e8f0;
            margin-top: 8px;
            padding-top: 6px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            font-size: 11px;
          }

          .bottom-bar-item {
            display: flex;
            gap: 6px;
            align-items: center;
          }

          .bar-label {
            color: #64748b;
            font-weight: 700;
          }

          .bar-val {
            color: #0f172a;
          }

          .bottom-bar-divider {
            color: #cbd5e1;
          }

          /* Items Table */
          .a4-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border: 1px solid #13293d;
          }

          .a4-table thead tr {
            background: #13293d;
            color: #ffffff;
          }

          .a4-table th {
            padding: 7px 5px;
            font-size: 11.5px;
            font-weight: 800;
            border-left: 1px solid rgba(255, 255, 255, 0.15);
          }

          .a4-table th:last-child {
            border-left: none;
          }

          .a4-table td {
            padding: 6px 5px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
            border-left: 1px solid #e2e8f0;
            vertical-align: middle;
          }

          .a4-table td:last-child {
            border-left: none;
          }

          .a4-table tr.row-alt {
            background: #f8fafc;
          }

          .table-total-cell {
            color: #13293d;
          }

          .empty-table-cell {
            padding: 24px !important;
            color: #64748b;
            font-weight: 700;
          }

          .sub-text {
            font-size: 9px;
            color: #64748b;
          }

          /* Bottom Section: Notes & Totals */
          .a4-bottom-section {
            display: flex;
            gap: 14px;
            align-items: stretch;
            margin-bottom: 8px;
          }

          .a4-notes-card {
            flex: 1;
            min-width: 0;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .notes-header {
            font-size: 11.5px;
            color: #13293d;
          }

          .notes-body {
            font-size: 10px;
            color: #475569;
            line-height: 1.45;
          }

          .a4-totals-grid-card {
            width: 330px;
            flex-shrink: 0;
            background: #f8fafc;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 10px;
            display: flex;
            gap: 10px;
          }

          .totals-subcolumn {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 4px;
          }

          .totals-col-divider {
            width: 1px;
            background: #cbd5e1;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 11px;
          }

          .total-label {
            color: #475569;
            font-weight: 700;
          }

          .total-value {
            color: #0f172a;
          }

          .net-total-row {
            border-top: 1.5px solid #13293d;
            padding-top: 3px;
            margin-top: 2px;
          }

          .net-total-row .total-label {
            color: #13293d;
            font-size: 12.5px;
          }

          .net-total-row .total-value {
            color: #13293d;
            font-size: 13px;
          }

          .debt-highlight {
            color: #dc2626 !important;
            font-weight: 900;
          }

          .a4-balances-strip {
            display: flex;
            justify-content: flex-end;
            gap: 20px;
            padding: 4px 8px;
            font-size: 10.5px;
            background: #f1f5f9;
            border-radius: 6px;
            margin-bottom: 8px;
          }

          /* Signatures Section */
          .a4-signatures-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 24px 30px 6px 30px;
          }

          .sig-block {
            display: flex;
            align-items: baseline;
            gap: 6px;
            font-size: 11.5px;
          }

          .sig-title {
            font-weight: 800;
            color: #13293d;
          }

          .sig-line {
            color: #94a3b8;
            letter-spacing: 1px;
          }

          .sig-sub {
            color: #475569;
            font-size: 10px;
          }

          /* Bottom Decorative Ribbon & Official Footer */
          .a4-bottom-ribbon-decor {
            position: absolute;
            bottom: -10mm;
            left: -12mm;
            z-index: 1;
            pointer-events: none;
          }

          .a4-official-footer {
            position: relative;
            border-top: 1.5px solid #13293d;
            padding-top: 6px;
            margin-top: 10px;
          }

          .footer-center-text {
            text-align: center;
            font-size: 11px;
            font-weight: 800;
            color: #13293d;
            position: relative;
            z-index: 2;
          }

          .footer-bullet {
            margin: 0 8px;
            color: #d4af37;
          }

          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-page-container">
          <div class="a4-content-body">
            ${headerHtml}
            ${metaCardHtml}
            <table class="a4-table">
              <colgroup>
                ${colgroupHtml}
              </colgroup>
              <thead>
                <tr>
                  ${theadHtml}
                </tr>
              </thead>
              <tbody>
                ${tbodyHtml}
              </tbody>
            </table>
            ${summaryBlockHtml}
            ${signaturesHtml}
          </div>
          ${footerHtml}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * ============================================================================
   * 2. 80MM THERMAL RECEIPT RENDERER
   * Exact reproduction of thermal receipt in reference: media_1789696422989.jpg
   * ============================================================================
   */
  private static render80mmHtml(template: DocumentTemplate, data: DocumentRenderData): string {
    const opts = data.printOptions || {};
    const businessName = data.business?.name || 'اسم المتجر للتجارة العامة';
    const slogan = data.business?.slogan || 'جودة • ثقة • أسعار مميزة';
    const phone = [data.business?.phone1, data.business?.phone2].filter(Boolean).join(' | ') || '0771 234 5678';
    const address = data.business?.address || 'بغداد - الكرادة';
    const docTitle = data.document?.title || template.titleArabic || 'فاتورة بيع';

    const displayInvoiceNo = this.formatDisplayInvoiceNumber(data.document?.number);
    const date = data.document?.date || new Date().toISOString().split('T')[0];
    const time = data.document?.time || '03:45 م';
    const cashier = opts.showCashierName !== false ? (data.document?.cashierName || 'المسؤول') : 'المسؤول';
    const saleType = data.document?.saleType || (data.document?.paymentMethod === 'credit' ? 'آجل / ذمم' : 'نقدي');
    const warehouse = data.document?.warehouse || 'المستودع الرئيسي';

    const customerName = data.party?.name && data.party.name.trim() !== '' ? data.party.name : 'عميل نقدي';
    const customerPhone = data.party?.phone || '';

    const barcodeSvg = this.generateCode128Svg(displayInvoiceNo, 32);

    // Items Table rows
    const items = data.items || [];
    let itemsHtml = '';
    let totalItemsQuantity = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qty = Number(it.quantity || 1);
      totalItemsQuantity += qty;
      const lineTotal = Number(it.total ?? (qty * Number(it.price || 0) - Number(it.discount || 0)));

      itemsHtml += `
        <tr>
          <td class="col-num num-ltr">${i + 1}</td>
          <td class="col-name wrap-text">${it.name}</td>
          <td class="col-qty num-ltr bold">${qty}</td>
          <td class="col-price num-ltr">${Number(it.price || 0).toLocaleString()}</td>
          <td class="col-tot num-ltr bold">${lineTotal.toLocaleString()}</td>
        </tr>
      `;
    }

    const totals = data.totals || { netTotal: 0 };
    const cur = totals.currency === 'USD' ? '$' : totals.currency === 'IQD' ? 'د.ع' : totals.currency || 'د.ع';
    const subtotal = Number(totals.subtotal ?? totals.netTotal);
    const discount = Number(totals.discount || 0);
    const netTotal = Number(totals.netTotal || 0);
    const paid = Number(totals.paid ?? netTotal);
    const remaining = Number(totals.remaining ?? Math.max(0, netTotal - paid));
    const itemCount = totals.itemCount ?? (items.length > 0 ? items.length : 0);

    const docNotes = data.document?.notes || data.business?.footerNotice || 'البضاعة المباعة لا ترد ولا تستبدل إلا بموجب الفاتورة.';

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>&#8203;</title>
        <style>
          ${CAIRO_FONT_CSS}

          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            font-family: 'Cairo', Tahoma, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            max-width: 72mm;
            background: #ffffff;
            color: #000000;
            font-size: 10.5px;
            line-height: 1.35;
            direction: rtl;
          }

          .receipt-wrapper {
            width: 100%;
            max-width: 71mm;
            margin: 0 auto;
            padding: 2mm 2mm 2mm 2mm;
          }

          .center { text-align: center; }
          .bold { font-weight: 700; }
          .num-ltr { direction: ltr; unicode-bidi: embed; display: inline-block; }
          .wrap-text { word-break: break-word; overflow-wrap: break-word; white-space: normal; }

          /* Header */
          .rec-header {
            text-align: center;
            border-bottom: 1.5px solid #13293d;
            padding-bottom: 5px;
            margin-bottom: 5px;
          }

          .rec-store-name {
            font-size: 15px;
            font-weight: 900;
            color: #13293d;
          }

          .rec-slogan {
            font-size: 10px;
            font-weight: 800;
            color: #c59b27;
            margin-top: 1px;
          }

          .rec-contact {
            font-size: 9.5px;
            color: #334155;
            margin-top: 2px;
          }

          /* Barcode */
          .rec-barcode-box {
            text-align: center;
            margin: 4px 0 6px 0;
          }

          .rec-barcode-svg {
            width: 75%;
            margin: 0 auto;
          }

          .rec-barcode-num {
            font-size: 11px;
            font-weight: 900;
            color: #13293d;
            letter-spacing: 2px;
          }

          /* Title pill */
          .rec-badge-pill {
            display: inline-block;
            background: #13293d;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 2px 16px;
            border-radius: 9999px;
            margin: 3px 0 5px 0;
          }

          /* Meta rows */
          .rec-meta-box {
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 5px;
            font-size: 9.5px;
          }

          .rec-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 1px;
          }

          .rec-meta-lbl {
            color: #475569;
            font-weight: 700;
          }

          /* Table */
          .rec-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 6px;
          }

          .rec-table th {
            background: #13293d;
            color: #ffffff;
            padding: 3px 2px;
            font-weight: 800;
          }

          .rec-table td {
            padding: 3px 2px;
            border-bottom: 1px dotted #e2e8f0;
            vertical-align: middle;
          }

          .col-num { width: 8%; text-align: center; }
          .col-name { width: 44%; text-align: right; }
          .col-qty { width: 12%; text-align: center; }
          .col-price { width: 18%; text-align: center; }
          .col-tot { width: 18%; text-align: left; }

          /* Totals Breakdown */
          .rec-totals-box {
            border-top: 1.5px solid #13293d;
            border-bottom: 1.5px solid #13293d;
            padding: 4px 0;
            margin-bottom: 6px;
            font-size: 10px;
          }

          .rec-total-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 1px;
          }

          .rec-grand-total {
            font-size: 12px;
            font-weight: 900;
            color: #13293d;
            border-top: 1px dashed #94a3b8;
            padding-top: 2px;
            margin-top: 2px;
          }

          /* Notes & Signatures */
          .rec-notes {
            font-size: 8.5px;
            color: #475569;
            text-align: center;
            margin-bottom: 6px;
          }

          .rec-sig {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #334155;
            padding-top: 4px;
            margin-bottom: 6px;
          }

          /* Footer */
          .rec-footer {
            border-top: 1px dashed #94a3b8;
            padding-top: 4px;
            text-align: center;
            font-size: 8.5px;
            font-weight: 800;
            color: #13293d;
          }

          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-wrapper">
          <!-- Header -->
          <div class="rec-header">
            <div class="rec-store-name">${businessName}</div>
            <div class="rec-slogan">${slogan}</div>
            <div class="rec-contact">
              <span>📞 <span class="num-ltr">${phone}</span></span>
              <span> • </span>
              <span>📍 ${address}</span>
            </div>
            <div>
              <span class="rec-badge-pill">${docTitle}</span>
            </div>
          </div>

          <!-- Barcode & Sequence -->
          <div class="rec-barcode-box">
            <div class="rec-barcode-svg">
              ${barcodeSvg}
            </div>
            <div class="rec-barcode-num num-ltr">${displayInvoiceNo}</div>
          </div>

          <!-- Meta -->
          <div class="rec-meta-box">
            <div class="rec-meta-row">
              <span class="rec-meta-lbl">التاريخ والوقت:</span>
              <span class="num-ltr">${date} • ${time}</span>
            </div>
            <div class="rec-meta-row">
              <span class="rec-meta-lbl">الزبون:</span>
              <span class="bold">${customerName}</span>
            </div>
            ${customerPhone ? `
            <div class="rec-meta-row">
              <span class="rec-meta-lbl">الهاتف:</span>
              <span class="num-ltr">${customerPhone}</span>
            </div>` : ''}
            <div class="rec-meta-row">
              <span class="rec-meta-lbl">المستخدم / نوع البيع:</span>
              <span>${cashier} • ${saleType}</span>
            </div>
          </div>

          <!-- Items Table -->
          <table class="rec-table">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-name">المادة</th>
                <th class="col-qty">العدد</th>
                <th class="col-price">السعر</th>
                <th class="col-tot">الإجمالي</th>
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
              <span class="num-ltr font-mono">${subtotal.toLocaleString()} ${cur}</span>
            </div>
            ${discount > 0 ? `
            <div class="rec-total-row" style="color: #dc2626;">
              <span>الخصم:</span>
              <span class="num-ltr font-mono">-${discount.toLocaleString()} ${cur}</span>
            </div>` : ''}
            <div class="rec-total-row rec-grand-total">
              <span>الصافي:</span>
              <span class="num-ltr font-mono">${netTotal.toLocaleString()} ${cur}</span>
            </div>
            <div class="rec-total-row">
              <span>المدفوع:</span>
              <span class="num-ltr font-mono bold" style="color: #16a34a;">${paid.toLocaleString()} ${cur}</span>
            </div>
            ${remaining > 0 ? `
            <div class="rec-total-row">
              <span>المتبقي:</span>
              <span class="num-ltr font-mono bold" style="color: #dc2626;">${remaining.toLocaleString()} ${cur}</span>
            </div>` : ''}
            <div class="rec-total-row">
              <span>عدد المواد:</span>
              <span class="num-ltr font-mono">${itemCount}</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="rec-notes wrap-text">
            ${docNotes}
          </div>

          <!-- Signature -->
          <div class="rec-sig">
            <span>توقيع الكاشير</span>
            <span>توقيع المستلم</span>
          </div>

          <!-- Official DUBSAR Footer -->
          <div class="rec-footer">
            نظام DUBSAR لإدارة المبيعات • 07858833838
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Normalizes incoming diverse raw document data into structured DocumentRenderData,
   * automatically enriching with unified settings (`LocalAuthService.getUnifiedSettingsSync()`).
   */
  static normalizeData(raw: any): DocumentRenderData {
    if (!raw) return {};

    const unified = LocalAuthService.getUnifiedSettingsSync();

    // If already normalized
    if (raw.business || raw.document || raw.party) {
      const existing = raw as DocumentRenderData;
      return {
        ...existing,
        business: {
          name: existing.business?.name || unified.businessName || 'اسم المتجر للتجارة العامة',
          businessType: existing.business?.businessType || unified.businessType || '',
          slogan: existing.business?.slogan || 'جودة • ثقة • أسعار مميزة',
          phone1: existing.business?.phone1 ?? (unified.phone1 || unified.phone),
          phone2: existing.business?.phone2 ?? unified.phone2,
          address: existing.business?.address ?? unified.address,
          logo: existing.business?.logo ?? unified.logo,
          headerImage: existing.business?.headerImage ?? unified.invoiceHeaderImage,
          footerNotice: existing.business?.footerNotice ?? (unified.footerNotes || unified.invoiceFooterNotes || unified.footerText),
          thankYouMessage: existing.business?.thankYouMessage ?? unified.thankYouMessage,
          supportPhone: existing.business?.supportPhone || '07858833838',
        },
        document: {
          ...existing.document,
          warehouse: existing.document?.warehouse || 'المستودع الرئيسي',
          saleType: existing.document?.saleType || (existing.document?.paymentMethod === 'credit' ? 'آجل / ذمم' : 'نقدي'),
        },
        totals: {
          ...existing.totals,
          netTotal: existing.totals?.netTotal || 0,
          itemCount: existing.totals?.itemCount ?? (existing.items?.length || 0),
        },
        printOptions: {
          fontScale: existing.printOptions?.fontScale ?? unified.fontScale,
          showLogo: existing.printOptions?.showLogo ?? unified.showLogo,
          showItemIndex: existing.printOptions?.showItemIndex ?? unified.showItemIndex,
          showBarcode: existing.printOptions?.showBarcode ?? unified.showBarcode,
          showUnit: existing.printOptions?.showUnit ?? unified.showUnit,
          showDiscount: existing.printOptions?.showDiscount ?? unified.showDiscount,
          showQrCode: existing.printOptions?.showQrCode ?? unified.showQrCode,
          showCashierName: existing.printOptions?.showCashierName ?? unified.showCashierName,
          showCustomerBalance: existing.printOptions?.showCustomerBalance ?? unified.showCustomerBalance,
          showPreviousBalance: existing.printOptions?.showPreviousBalance ?? unified.showPreviousBalance,
          showSignatures: existing.printOptions?.showSignatures ?? unified.showSignatures,
          showOrganizerName: existing.printOptions?.showOrganizerName ?? unified.showOrganizerName,
          showSupplierName: existing.printOptions?.showSupplierName ?? unified.showSupplierName,
        },
      };
    }

    // Merge passed businessSettings with unified settings
    const settings = { ...unified, ...(raw.businessSettings || {}) };

    const items = Array.isArray(raw.items)
      ? raw.items.map((it: any) => ({
          name: it.name || it.productName || 'مادة',
          barcode: it.barcode,
          quantity: Number(it.quantity || 1),
          unit: it.unit || 'قطعة',
          price: Number(it.price || it.unitPrice || 0),
          discount: Number(it.discount || it.discountAmount || 0),
          total: Number(it.total || Number(it.quantity || 1) * Number(it.price || it.unitPrice || 0) - Number(it.discount || 0)),
          serialNo: it.serialNo,
          notes: it.notes,
        }))
      : [];

    return {
      business: {
        name: settings.businessName || raw.businessName || 'اسم المتجر للتجارة العامة',
        businessType: settings.businessType || raw.businessType || '',
        slogan: raw.slogan || settings.slogan || 'جودة • ثقة • أسعار مميزة',
        phone1: settings.phone1 || settings.phone || raw.phone1 || raw.phone,
        phone2: settings.phone2 || raw.phone2,
        address: settings.address || raw.address,
        logo: settings.logo ?? raw.logo ?? unified.logo,
        headerImage: settings.invoiceHeaderImage ?? raw.invoiceHeaderImage ?? raw.headerImage ?? unified.invoiceHeaderImage,
        footerNotice: settings.footerNotes || settings.invoiceFooterNotes || settings.footerText || settings.invoiceNotice,
        thankYouMessage: settings.thankYouMessage || unified.thankYouMessage,
        supportPhone: '07858833838',
      },
      document: {
        number: raw.invoiceNo || raw.voucherNo || raw.orderNumber || raw.id,
        title: raw.title,
        date: raw.date || (raw.createdAt ? new Date(Number(raw.createdAt)).toLocaleDateString('ar-IQ') : new Date().toLocaleDateString('ar-IQ')),
        time: raw.time || (raw.createdAt ? new Date(Number(raw.createdAt)).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : ''),
        cashierName: raw.cashierName || raw.employeeName || raw.createdBy || 'المسؤول',
        paymentMethod: raw.paymentMethod || 'cash',
        saleType: raw.saleType || (raw.paymentMethod === 'credit' ? 'آجل / ذمم' : 'نقدي'),
        warehouse: raw.warehouse || 'المستودع الرئيسي',
        priceType: raw.priceType || 'retail',
        notes: raw.notes,
      },
      party: {
        type: raw.supplierName ? 'supplier' : 'customer',
        name: raw.customerName || raw.supplierName || raw.partyName || raw.customer?.name || 'عميل نقدي',
        phone: raw.customerPhone || raw.partyPhone || raw.customer?.phone || '',
        address: raw.customerAddress || raw.customer?.address || '',
        previousBalance: Number(raw.previousBalance || 0),
        currentBalance: Number(raw.currentBalance || 0),
      },
      items,
      totals: {
        itemCount: raw.itemCount ?? items.length,
        subtotal: Number(raw.subtotal || raw.totalAmount || raw.netTotal || 0),
        discount: Number(raw.discountAmount || raw.discount || 0),
        netTotal: Number(raw.netTotal || raw.totalAmount || raw.total || 0),
        paid: Number(raw.paidAmount ?? raw.paid ?? raw.totalAmount ?? 0),
        remaining: Number(raw.remaining ?? Math.max(0, Number(raw.totalAmount || 0) - Number(raw.paidAmount || 0))),
        receivedAmount: raw.receivedAmount ? Number(raw.receivedAmount) : undefined,
        changeGiven: raw.changeGiven ? Number(raw.changeGiven) : undefined,
        currency: raw.currency || 'د.ع',
      },
      printOptions: {
        fontScale: settings.fontScale || settings.printFontScale || 'medium',
        showLogo: settings.showLogo !== undefined ? Boolean(settings.showLogo) : (settings.showCompanyLogo !== undefined ? Boolean(settings.showCompanyLogo) : true),
        showItemIndex: settings.showItemIndex !== undefined ? Boolean(settings.showItemIndex) : true,
        showBarcode: settings.showBarcode !== undefined ? Boolean(settings.showBarcode) : (settings.showBarcodeOnInvoice !== undefined ? Boolean(settings.showBarcodeOnInvoice) : true),
        showUnit: settings.showUnit !== undefined ? Boolean(settings.showUnit) : true,
        showDiscount: settings.showDiscount !== undefined ? Boolean(settings.showDiscount) : true,
        showQrCode: settings.showQrCode !== undefined ? Boolean(settings.showQrCode) : true,
        showCashierName: settings.showCashierName !== undefined ? Boolean(settings.showCashierName) : true,
        showCustomerBalance: settings.showCustomerBalance !== undefined ? Boolean(settings.showCustomerBalance) : true,
        showPreviousBalance: settings.showPreviousBalance !== undefined ? Boolean(settings.showPreviousBalance) : true,
        showSignatures: settings.showSignatures !== undefined ? Boolean(settings.showSignatures) : true,
        showOrganizerName: settings.showOrganizerName !== undefined ? Boolean(settings.showOrganizerName) : true,
        showSupplierName: settings.showSupplierName !== undefined ? Boolean(settings.showSupplierName) : true,
      },
    };
  }
}
