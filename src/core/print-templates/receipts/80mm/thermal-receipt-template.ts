/**
 * @fileOverview 80mm Thermal Receipt Template (إيصال قبض / استلام حراري 80mm).
 * Compact thermal receipt for POS counter transactions.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderReceiptVoucherTemplate } from '../../vouchers/receipt/receipt-voucher-template';

export function renderThermalReceiptTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
  // Use the dedicated thermal receipt voucher engine configured for 80mm
  return renderReceiptVoucherTemplate({
    ...template,
    format: '80mm',
    titleArabic: template.titleArabic || 'وصل استلام نقدي',
  }, data);
}
