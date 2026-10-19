/**
 * @fileOverview Sales Return Print Template (فاتورة مرتجع مبيعات).
 * Based on the official invoice layout with prominent return badge and clear accounting summary.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderA4InvoiceTemplate } from '../../invoices/a4/a4-invoice-template';
import { renderThermalInvoiceTemplate } from '../../invoices/80mm/thermal-invoice-template';

export function renderSalesReturnTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
  // Enhance data with clear Return title
  const returnData: DocumentRenderData = {
    ...data,
    document: {
      ...data.document,
      title: data.document?.title || 'فاتورة مرتجع مبيعات (Sales Return)',
    }
  };

  if (template.format === 'A4') {
    return renderA4InvoiceTemplate(template, returnData);
  }
  return renderThermalInvoiceTemplate(template, returnData);
}
