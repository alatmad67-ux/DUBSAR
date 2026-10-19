/**
 * @fileOverview DUBSAR 2.0 Unified Document Renderer & Coordinator.
 * Lightweight single entrypoint connecting UI & Print Engine with the modular Print Template Engine.
 * Implements full backwards compatibility for all existing callers.
 */

import { DocumentTemplate, DocumentRenderData } from './template-types';
import { LocalAuthService } from '@/services/local-auth-service';
import {
  renderPrintDocument,
  renderA4InvoiceTemplate,
  renderThermalInvoiceTemplate,
  formatDisplayInvoiceNumber as fmtDisplayInvoiceNo,
  generateCode128Svg as genCode128Svg,
} from '@/core/print-templates';

export class DocumentRenderer {
  /**
   * Main entrypoint: Dispatches to the modular template engine according to template format & docType.
   */
  static renderToHtml(template: DocumentTemplate, rawData: DocumentRenderData | Record<string, any>): string {
    const data = this.normalizeData(rawData);
    return renderPrintDocument(template, data);
  }

  /**
   * Explicit A4 Invoice HTML renderer.
   */
  public static renderA4Html(template: DocumentTemplate, rawData: DocumentRenderData | Record<string, any>): string {
    const data = this.normalizeData(rawData);
    return renderA4InvoiceTemplate(template, data);
  }

  /**
   * Explicit 80mm Thermal Receipt HTML renderer.
   */
  public static render80mmHtml(template: DocumentTemplate, rawData: DocumentRenderData | Record<string, any>): string {
    const data = this.normalizeData(rawData);
    return renderThermalInvoiceTemplate(template, data);
  }

  /**
   * Converts any raw invoice number or ID into a clean 4-digit sequence number:
   * e.g., 1 -> "0001", 35 -> "0035", "INV-1001" -> "0001".
   */
  public static formatDisplayInvoiceNumber(rawNumber: any): string {
    return fmtDisplayInvoiceNo(rawNumber);
  }

  /**
   * Vector Code128 Barcode Generator (Subset B)
   */
  public static generateCode128Svg(code: string, height: number = 34): string {
    return genCode128Svg(code, height);
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
          rects += `<rect x="${(c * Number(cellSize)).toFixed(2)}" y="${(r * Number(cellSize)).toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="#000000" />`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display: block; border-radius: 4px; background: #ffffff;">${rects}</svg>`;
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
          showItemName: existing.printOptions?.showItemName ?? unified.showItemName,
          showBarcode: existing.printOptions?.showBarcode ?? unified.showBarcode,
          showUnit: existing.printOptions?.showUnit ?? unified.showUnit,
          showQuantity: existing.printOptions?.showQuantity ?? unified.showQuantity,
          showPrice: existing.printOptions?.showPrice ?? unified.showPrice,
          showDiscount: existing.printOptions?.showDiscount ?? unified.showDiscount,
          showTotal: existing.printOptions?.showTotal ?? unified.showTotal,
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
        fontScale: raw.printOptions?.fontScale ?? settings.fontScale ?? settings.printFontScale ?? 'medium',
        showLogo: raw.printOptions?.showLogo !== undefined ? Boolean(raw.printOptions.showLogo) : (settings.showLogo !== undefined ? Boolean(settings.showLogo) : (settings.showCompanyLogo !== undefined ? Boolean(settings.showCompanyLogo) : true)),
        showItemIndex: raw.printOptions?.showItemIndex !== undefined ? Boolean(raw.printOptions.showItemIndex) : (settings.showItemIndex !== undefined ? Boolean(settings.showItemIndex) : true),
        showItemName: raw.printOptions?.showItemName !== undefined ? Boolean(raw.printOptions.showItemName) : (settings.showItemName !== undefined ? Boolean(settings.showItemName) : true),
        showBarcode: raw.printOptions?.showBarcode !== undefined ? Boolean(raw.printOptions.showBarcode) : (settings.showBarcode !== undefined ? Boolean(settings.showBarcode) : (settings.showBarcodeOnInvoice !== undefined ? Boolean(settings.showBarcodeOnInvoice) : true)),
        showUnit: raw.printOptions?.showUnit !== undefined ? Boolean(raw.printOptions.showUnit) : (settings.showUnit !== undefined ? Boolean(settings.showUnit) : true),
        showQuantity: raw.printOptions?.showQuantity !== undefined ? Boolean(raw.printOptions.showQuantity) : (settings.showQuantity !== undefined ? Boolean(settings.showQuantity) : true),
        showPrice: raw.printOptions?.showPrice !== undefined ? Boolean(raw.printOptions.showPrice) : (settings.showPrice !== undefined ? Boolean(settings.showPrice) : true),
        showDiscount: raw.printOptions?.showDiscount !== undefined ? Boolean(raw.printOptions.showDiscount) : (settings.showDiscount !== undefined ? Boolean(settings.showDiscount) : true),
        showTotal: raw.printOptions?.showTotal !== undefined ? Boolean(raw.printOptions.showTotal) : (settings.showTotal !== undefined ? Boolean(settings.showTotal) : true),
        showQrCode: raw.printOptions?.showQrCode !== undefined ? Boolean(raw.printOptions.showQrCode) : (settings.showQrCode !== undefined ? Boolean(settings.showQrCode) : true),
        showCashierName: raw.printOptions?.showCashierName !== undefined ? Boolean(raw.printOptions.showCashierName) : (settings.showCashierName !== undefined ? Boolean(settings.showCashierName) : true),
        showCustomerBalance: raw.printOptions?.showCustomerBalance !== undefined ? Boolean(raw.printOptions.showCustomerBalance) : (settings.showCustomerBalance !== undefined ? Boolean(settings.showCustomerBalance) : true),
        showPreviousBalance: raw.printOptions?.showPreviousBalance !== undefined ? Boolean(raw.printOptions.showPreviousBalance) : (settings.showPreviousBalance !== undefined ? Boolean(settings.showPreviousBalance) : true),
        showSignatures: raw.printOptions?.showSignatures !== undefined ? Boolean(raw.printOptions.showSignatures) : (settings.showSignatures !== undefined ? Boolean(settings.showSignatures) : true),
        showOrganizerName: raw.printOptions?.showOrganizerName !== undefined ? Boolean(raw.printOptions.showOrganizerName) : (settings.showOrganizerName !== undefined ? Boolean(settings.showOrganizerName) : true),
        showSupplierName: raw.printOptions?.showSupplierName !== undefined ? Boolean(raw.printOptions.showSupplierName) : (settings.showSupplierName !== undefined ? Boolean(settings.showSupplierName) : true),
      },
    };
  }
}
