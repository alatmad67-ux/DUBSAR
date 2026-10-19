/**
 * @fileOverview Purchase Return Print Template (فاتورة مرتجع مشتريات).
 * Formatted with clear supplier return title and purchase pricing structure.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderA4InvoiceTemplate } from '../../invoices/a4/a4-invoice-template';
import { renderThermalInvoiceTemplate } from '../../invoices/80mm/thermal-invoice-template';

export function renderPurchaseReturnTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
  const returnData: DocumentRenderData = {
    ...data,
    document: {
      ...data.document,
      title: data.document?.title || 'فاتورة مرتجع مشتريات (Purchase Return)',
    }
  };

  if (template.format === 'A4') {
    return renderA4InvoiceTemplate(template, returnData);
  }
  return renderThermalInvoiceTemplate(template, returnData);
}
