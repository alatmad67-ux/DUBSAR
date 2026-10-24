/**
 * @fileOverview DUBSAR 2.0 Unified Print Template Engine Index & Registry.
 * Central coordinator mapping each document type and format to its isolated HTML/CSS template.
 */

import { DocumentTemplate, DocumentRenderData, DocumentType, TemplateFormat } from '@/core/templates/template-types';

// Invoices
import { renderA4InvoiceTemplate } from './invoices/a4/a4-invoice-template';
import { renderThermalInvoiceTemplate } from './invoices/80mm/thermal-invoice-template';

// Receipts
import { renderA4ReceiptTemplate } from './receipts/a4/a4-receipt-template';
import { renderThermalReceiptTemplate } from './receipts/80mm/thermal-receipt-template';

// Vouchers
import { renderReceiptVoucherTemplate } from './vouchers/receipt/receipt-voucher-template';
import { renderPaymentVoucherTemplate } from './vouchers/payment/payment-voucher-template';

// Returns
import { renderSalesReturnTemplate } from './returns/sales-return/sales-return-template';
import { renderPurchaseReturnTemplate } from './returns/purchase-return/purchase-return-template';

// Reports
import { renderBaseReportTemplate } from './reports/base-report-template';
import { renderSalesReportTemplate } from './reports/sales/sales-report-template';
import { renderPurchasesReportTemplate } from './reports/purchases/purchases-report-template';
import { renderInventoryReportTemplate } from './reports/inventory/inventory-report-template';
import { renderDebtsReportTemplate } from './reports/debts/debts-report-template';
import { renderExpensesReportTemplate } from './reports/expenses/expenses-report-template';
import { renderCashReportTemplate } from './reports/cash/cash-report-template';
import { renderFinancialReportTemplate } from './reports/financial/financial-report-template';
import { renderProductMovementReportTemplate } from './reports/product-movement/product-movement-template';

// Shared Utilities
export * from './common/number-formatter';
export * from './common/shared-styles';

// Re-export individual templates
export {
  renderA4InvoiceTemplate,
  renderThermalInvoiceTemplate,
  renderA4ReceiptTemplate,
  renderThermalReceiptTemplate,
  renderReceiptVoucherTemplate,
  renderPaymentVoucherTemplate,
  renderSalesReturnTemplate,
  renderPurchaseReturnTemplate,
  renderBaseReportTemplate,
  renderSalesReportTemplate,
  renderPurchasesReportTemplate,
  renderInventoryReportTemplate,
  renderDebtsReportTemplate,
  renderExpensesReportTemplate,
  renderCashReportTemplate,
  renderFinancialReportTemplate,
  renderProductMovementReportTemplate,
};

export type TemplateRendererFn = (template: DocumentTemplate, data: any) => string;

/**
 * Registry mapping (DocumentType, TemplateFormat) to specialized renderer function.
 */
export const TEMPLATE_REGISTRY: Partial<Record<DocumentType, Record<TemplateFormat, TemplateRendererFn>>> = {
  sales_invoice: {
    A4: renderA4InvoiceTemplate,
    '80mm': renderThermalInvoiceTemplate,
    '58mm': renderThermalInvoiceTemplate,
  },
  purchase_invoice: {
    A4: (template, data) => renderA4InvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'فاتورة مشتريات رسمية' }, data),
    '80mm': (template, data) => renderThermalInvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'قائمة مشتريات' }, data),
    '58mm': (template, data) => renderThermalInvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'قائمة مشتريات' }, data),
  },
  sales_return: {
    A4: renderSalesReturnTemplate,
    '80mm': renderSalesReturnTemplate,
    '58mm': renderSalesReturnTemplate,
  },
  purchase_return: {
    A4: renderPurchaseReturnTemplate,
    '80mm': renderPurchaseReturnTemplate,
    '58mm': renderPurchaseReturnTemplate,
  },
  receipt_voucher: {
    A4: renderReceiptVoucherTemplate,
    '80mm': renderThermalReceiptTemplate,
    '58mm': renderThermalReceiptTemplate,
  },
  payment_voucher: {
    A4: renderPaymentVoucherTemplate,
    '80mm': renderPaymentVoucherTemplate,
    '58mm': renderPaymentVoucherTemplate,
  },
  quotation: {
    A4: (template, data) => renderA4InvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'عرض أسعار تجاري' }, data),
    '80mm': (template, data) => renderThermalInvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'عرض أسعار' }, data),
    '58mm': (template, data) => renderThermalInvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'عرض أسعار' }, data),
  },
  sales_list: {
    A4: renderA4InvoiceTemplate,
    '80mm': renderThermalInvoiceTemplate,
    '58mm': renderThermalInvoiceTemplate,
  },
  purchase_list: {
    A4: (template, data) => renderA4InvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'قائمة مشتريات' }, data),
    '80mm': (template, data) => renderThermalInvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'قائمة مشتريات' }, data),
    '58mm': (template, data) => renderThermalInvoiceTemplate({ ...template, titleArabic: template.titleArabic || 'قائمة مشتريات' }, data),
  },
  customer_statement: {
    A4: (template, data) => renderDebtsReportTemplate(template, data),
    '80mm': renderThermalReceiptTemplate,
  },
  supplier_statement: {
    A4: (template, data) => renderDebtsReportTemplate(template, data),
    '80mm': renderThermalReceiptTemplate,
  },
  profit_report: {
    A4: renderFinancialReportTemplate,
    '80mm': renderFinancialReportTemplate,
  },
  sales_report: {
    A4: renderSalesReportTemplate,
    '80mm': renderSalesReportTemplate,
  },
  purchases_report: {
    A4: renderPurchasesReportTemplate,
    '80mm': renderPurchasesReportTemplate,
  },
  inventory_report: {
    A4: renderInventoryReportTemplate,
    '80mm': renderInventoryReportTemplate,
  },
  debts_report: {
    A4: renderDebtsReportTemplate,
    '80mm': renderDebtsReportTemplate,
  },
  expenses_report: {
    A4: renderExpensesReportTemplate,
    '80mm': renderExpensesReportTemplate,
  },
  cash_report: {
    A4: renderCashReportTemplate,
    '80mm': renderCashReportTemplate,
  },
  financial_report: {
    A4: renderFinancialReportTemplate,
    '80mm': renderFinancialReportTemplate,
  },
  product_movement_report: {
    A4: renderProductMovementReportTemplate,
    '80mm': renderProductMovementReportTemplate,
  },
};

/**
 * Unified dispatch function that looks up the correct template renderer
 * and falls back gracefully if a specific format is not registered.
 */
export function renderPrintDocument(template: DocumentTemplate, data: DocumentRenderData): string {
  const docType = template.documentType || 'sales_invoice';
  const format = template.format || 'A4';

  const typeConfig = TEMPLATE_REGISTRY[docType];
  if (typeConfig) {
    const renderer = typeConfig[format] || typeConfig['A4'] || typeConfig['80mm'];
    if (renderer) {
      return renderer(template, data);
    }
  }

  // Fallback defaults
  if (format === '80mm') {
    return renderThermalInvoiceTemplate(template, data);
  }
  return renderA4InvoiceTemplate(template, data);
}
