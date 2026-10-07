/**
 * @fileOverview DUBSAR 2.0 Unified Document Renderer.
 * Single source of truth for Preview, Print, and PDF.
 */

import { DocumentTemplate, DocumentRenderData, TemplateSection } from './template-types';

export class DocumentRenderer {
  /**
   * Main entrypoint: Renders a template with data into a full, self-contained HTML document.
   */
  static renderToHtml(template: DocumentTemplate, rawData: DocumentRenderData | Record<string, any>): string {
    const data = this.normalizeData(rawData);
    const isA4 = template.format === 'A4';
    const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

    const sectionsHtml = sortedSections
      .filter(sec => sec.visible)
      .map(sec => this.renderSection(sec, template, data))
      .filter(Boolean)
      .join('\n');

    return `
      <!DOCTYPE html>
      <html dir="${template.direction || 'rtl'}" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>${template.titleArabic} - ${data.document?.number || ''}</title>
        <style>
          @page {
            size: ${isA4 ? 'A4 portrait' : '80mm auto'};
            margin: ${isA4 ? '12mm' : '3mm'};
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: ${template.fontFamily};
            margin: 0;
            padding: ${isA4 ? '12px' : '4px'};
            width: ${isA4 ? 'auto' : '74mm'};
            background: #ffffff;
            color: #0f172a;
            font-size: ${isA4 ? '12px' : '11px'};
            line-height: 1.35;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .left { text-align: left; }
          .font-mono { font-family: monospace, ui-monospace, sans-serif; }
          .bold { font-weight: bold; }
          .black { font-weight: 900; }
          
          /* Section styling */
          .doc-section {
            margin-bottom: ${isA4 ? '14px' : '8px'};
          }
          .divider {
            border-top: ${isA4 ? '1px solid #e2e8f0' : '1px dashed #000'};
            margin: ${isA4 ? '12px 0' : '6px 0'};
          }
          
          /* Table styling */
          table.doc-table {
            width: 100%;
            border-collapse: collapse;
            margin: ${isA4 ? '12px 0' : '6px 0'};
          }
          table.doc-table th {
            background: ${isA4 ? template.primaryColor : '#f1f5f9'};
            color: ${isA4 ? '#ffffff' : '#000000'};
            font-weight: 900;
            padding: ${isA4 ? '8px 10px' : '5px 4px'};
            font-size: ${isA4 ? '11px' : '10px'};
            border-bottom: ${isA4 ? '2px solid ' + template.primaryColor : '1.5px solid #000'};
          }
          table.doc-table td {
            padding: ${isA4 ? '7px 10px' : '5px 4px'};
            border-bottom: 1px dotted #cbd5e1;
            font-size: ${isA4 ? '11px' : '10px'};
          }
          
          /* Totals block */
          .totals-grid {
            margin: ${isA4 ? '12px 0' : '6px 0'};
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: ${isA4 ? '12px' : '11px'};
          }
          .grand-total {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 6px 0;
            font-size: ${isA4 ? '16px' : '13px'};
            font-weight: 900;
          }

          /* Signatures */
          .sig-container {
            display: flex;
            justify-content: space-between;
            margin-top: ${isA4 ? '36px' : '18px'};
            padding: 0 ${isA4 ? '30px' : '10px'};
          }
          .sig-box {
            text-align: center;
            width: ${isA4 ? '180px' : '110px'};
            border-top: 1px dashed #64748b;
            padding-top: 6px;
            font-size: ${isA4 ? '11px' : '9px'};
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${sectionsHtml}
      </body>
      </html>
    `;
  }

  /**
   * Renders an individual section according to its template options.
   */
  private static renderSection(sec: TemplateSection, template: DocumentTemplate, data: DocumentRenderData): string {
    const isA4 = template.format === 'A4';
    const alignClass = sec.alignment === 'center' ? 'center' : sec.alignment === 'left' ? 'left' : 'right';

    switch (sec.type) {
      case 'logo': {
        const logoUrl = data.business?.logo;
        if (!logoUrl) return '';
        return `
          <div class="doc-section ${alignClass}">
            <img src="${logoUrl}" alt="logo" style="max-height: ${isA4 ? '60px' : '45px'}; max-width: ${isA4 ? '160px' : '120px'}; object-fit: contain;" />
          </div>
        `;
      }

      case 'business_info': {
        const name = data.business?.name || 'مؤسسة دوبسار التجارية';
        const address = sec.options?.showAddress !== false ? data.business?.address : null;
        const phone = sec.options?.showPhone !== false ? (data.business?.phone1 || data.business?.phone2) : null;
        return `
          <div class="doc-section ${alignClass}">
            <div style="font-size: ${sec.fontSize}px; font-weight: 900;">${name}</div>
            ${address ? `<div style="font-size: ${sec.fontSize - 3}px; color: #475569; margin-top: 2px;">${address}</div>` : ''}
            ${phone ? `<div class="font-mono" style="font-size: ${sec.fontSize - 3}px; color: #475569; margin-top: 2px;">هاتف: ${phone}</div>` : ''}
          </div>
        `;
      }

      case 'header': {
        const title = sec.customTitle || data.document?.title || template.titleArabic;
        return `
          <div class="doc-section ${alignClass}">
            <div style="display: inline-block; padding: ${isA4 ? '4px 16px' : '2px 8px'}; border: 1.5px solid ${isA4 ? template.primaryColor : '#000'}; border-radius: 6px; font-size: ${sec.fontSize}px; font-weight: 900; background: ${isA4 ? '#f0f9ff' : '#ffffff'}; color: ${isA4 ? template.primaryColor : '#000000'};">
              ${title}
            </div>
          </div>
        `;
      }

      case 'document_meta': {
        const docNo = data.document?.number || '---';
        const date = data.document?.date || '---';
        const time = data.document?.time || '';
        const cashier = sec.options?.showCashier !== false ? data.document?.cashierName : null;
        const method = data.document?.paymentMethod;

        return `
          <div class="doc-section" style="font-size: ${sec.fontSize}px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span class="bold">رقم المستند:</span>
              <span class="font-mono black">${docNo}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span class="bold">التاريخ:</span>
              <span class="font-mono">${date} ${time}</span>
            </div>
            ${cashier ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>المسؤول:</span>
              <span class="bold">${cashier}</span>
            </div>` : ''}
            ${method ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>طريقة الدفع:</span>
              <span class="bold">${method === 'credit' ? 'آجل' : 'نقدي'}</span>
            </div>` : ''}
          </div>
          <div class="divider"></div>
        `;
      }

      case 'party_info': {
        const party = data.party;
        if (!party || !party.name) return '';
        const label = party.type === 'supplier' ? 'المورد:' : 'العميل / الزبون:';

        return `
          <div class="doc-section" style="font-size: ${sec.fontSize}px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span class="bold">${label}</span>
              <span class="black">${party.name}</span>
            </div>
            ${party.phone ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>رقم الهاتف:</span>
              <span class="font-mono">${party.phone}</span>
            </div>` : ''}
            ${party.address ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>العنوان:</span>
              <span>${party.address}</span>
            </div>` : ''}
          </div>
        `;
      }

      case 'items_table': {
        const items = data.items || [];
        const showBarcode = !!sec.options?.showBarcode;
        const showUnit = sec.options?.showUnit !== false;

        let rowsHtml = '';
        if (items.length === 0) {
          rowsHtml = `<tr><td colspan="5" class="center" style="padding: 12px; color: #64748b;">لا توجد بنود مسجلة</td></tr>`;
        } else {
          rowsHtml = items.map((it, idx) => `
            <tr>
              <td class="bold">
                <div>${it.name}</div>
                ${showBarcode && it.barcode ? `<div style="font-size: 8px; color: #64748b;" class="font-mono">${it.barcode}</div>` : ''}
                ${it.serialNo ? `<div style="font-size: 8px; color: #64748b;" class="font-mono">S/N: ${it.serialNo}</div>` : ''}
              </td>
              <td class="center font-mono">${it.quantity}${showUnit && it.unit ? ` ${it.unit}` : ''}</td>
              <td class="center font-mono">${Number(it.price || 0).toLocaleString()}</td>
              <td class="left font-mono bold">${Number(it.total || (it.quantity * it.price) || 0).toLocaleString()}</td>
            </tr>
          `).join('');
        }

        return `
          <table class="doc-table">
            <thead>
              <tr>
                <th class="right">المادة / البيان</th>
                <th class="center" style="width: 50px;">الكمية</th>
                <th class="center" style="width: 70px;">السعر</th>
                <th class="left" style="width: 75px;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `;
      }

      case 'totals': {
        const totals = data.totals;
        if (!totals) return '';
        const cur = totals.currency || 'د.ع';

        return `
          <div class="totals-grid" style="font-size: ${sec.fontSize}px;">
            ${totals.subtotal !== undefined && totals.discount ? `
            <div class="totals-row">
              <span>المجموع الفرعي:</span>
              <span class="font-mono">${Number(totals.subtotal).toLocaleString()} ${cur}</span>
            </div>
            <div class="totals-row">
              <span>الخصم الممنوح:</span>
              <span class="font-mono" style="color: #dc2626;">-${Number(totals.discount).toLocaleString()} ${cur}</span>
            </div>` : ''}

            <div class="totals-row grand-total">
              <span>المبلغ الإجمالي الصافي:</span>
              <span class="font-mono">${Number(totals.netTotal || 0).toLocaleString()} ${cur}</span>
            </div>

            ${totals.paid !== undefined ? `
            <div class="totals-row">
              <span class="bold">المدفوع (الواصل):</span>
              <span class="font-mono bold" style="color: #16a34a;">${Number(totals.paid).toLocaleString()} ${cur}</span>
            </div>` : ''}

            ${totals.remaining !== undefined && totals.remaining > 0 ? `
            <div class="totals-row">
              <span class="bold">المتبقي (الذمة):</span>
              <span class="font-mono bold" style="color: #dc2626;">${Number(totals.remaining).toLocaleString()} ${cur}</span>
            </div>` : ''}

            ${totals.receivedAmount !== undefined && totals.changeGiven !== undefined ? `
            <div class="totals-row" style="font-size: 10px; color: #475569;">
              <span>المستلم: <strong class="font-mono">${Number(totals.receivedAmount).toLocaleString()}</strong></span>
              <span>الباقي للزبون: <strong class="font-mono" style="color: #16a34a;">${Number(totals.changeGiven).toLocaleString()}</strong></span>
            </div>` : ''}
          </div>
        `;
      }

      case 'notes': {
        const notes = data.document?.notes;
        if (!notes) return '';
        return `
          <div class="doc-section" style="font-size: ${sec.fontSize}px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px;">
            <span class="bold">ملاحظات: </span>
            <span>${notes}</span>
          </div>
        `;
      }

      case 'signatures': {
        return `
          <div class="sig-container">
            <div class="sig-box">توقيع المستلم / العميل</div>
            <div class="sig-box">توقيع وأمين الصندوق</div>
          </div>
        `;
      }

      case 'footer': {
        const notice = data.business?.footerNotice || 'البضاعة المباعة لا ترد ولا تستبدل إلا بموجب هذه الفاتورة • شكراً لزيارتكم';
        return `
          <div class="doc-section center" style="font-size: ${sec.fontSize}px; color: #475569; margin-top: 10px;">
            <div>${notice}</div>
          </div>
        `;
      }

      case 'dubsar_branding': {
        return `
          <div class="center" style="font-size: 8px; color: #94a3b8; border-top: 1px dotted #cbd5e1; padding-top: 4px; margin-top: 8px;">
            نظام DUBSAR 2.0 لإدارة الأعمال والمخازن • وثيقة رسمية
          </div>
        `;
      }

      default:
        return '';
    }
  }

  /**
   * Normalizes incoming diverse raw document data into structured DocumentRenderData.
   */
  static normalizeData(raw: any): DocumentRenderData {
    if (!raw) return {};

    // If already normalized
    if (raw.business || raw.document || raw.party) {
      return raw as DocumentRenderData;
    }

    // Auto-detect settings
    const settings = raw.businessSettings || {};

    return {
      business: {
        name: settings.businessName || raw.businessName || 'مؤسسة دوبسار التجارية',
        phone1: settings.phone1 || raw.phone1,
        phone2: settings.phone2 || raw.phone2,
        address: settings.address || raw.address,
        logo: settings.logo || raw.logo,
        footerNotice: settings.footerText || settings.invoiceNotice
      },
      document: {
        number: raw.invoiceNo || raw.voucherNo || raw.orderNumber || raw.id,
        title: raw.title,
        date: raw.date || (raw.createdAt ? new Date(Number(raw.createdAt)).toLocaleDateString('ar-IQ') : new Date().toLocaleDateString('ar-IQ')),
        time: raw.time || (raw.createdAt ? new Date(Number(raw.createdAt)).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : ''),
        cashierName: raw.cashierName || raw.employeeName || raw.createdBy || 'المسؤول',
        paymentMethod: raw.paymentMethod || 'cash',
        priceType: raw.priceType || 'retail',
        notes: raw.notes
      },
      party: {
        type: raw.supplierName ? 'supplier' : 'customer',
        name: raw.customerName || raw.supplierName || raw.partyName || (raw.customer?.name) || 'زبون نقدي',
        phone: raw.customerPhone || raw.partyPhone || (raw.customer?.phone) || '',
        address: raw.customerAddress || (raw.customer?.address) || '',
        previousBalance: Number(raw.previousBalance || 0),
        currentBalance: Number(raw.currentBalance || 0)
      },
      items: Array.isArray(raw.items) ? raw.items.map((it: any) => ({
        name: it.name || it.productName || 'مادة',
        barcode: it.barcode,
        quantity: Number(it.quantity || 1),
        unit: it.unit,
        price: Number(it.price || it.unitPrice || 0),
        total: Number(it.total || (Number(it.quantity || 1) * Number(it.price || it.unitPrice || 0))),
        serialNo: it.serialNo,
        notes: it.notes
      })) : [],
      totals: {
        subtotal: Number(raw.subtotal || raw.totalAmount || raw.netTotal || 0),
        discount: Number(raw.discountAmount || raw.discount || 0),
        netTotal: Number(raw.netTotal || raw.totalAmount || raw.total || 0),
        paid: Number(raw.paidAmount ?? raw.paid ?? raw.totalAmount ?? 0),
        remaining: Number(raw.remaining ?? (Math.max(0, Number(raw.totalAmount || 0) - Number(raw.paidAmount || 0)))),
        receivedAmount: raw.receivedAmount ? Number(raw.receivedAmount) : undefined,
        changeGiven: raw.changeGiven ? Number(raw.changeGiven) : undefined,
        currency: raw.currency || 'د.ع'
      }
    };
  }
}
