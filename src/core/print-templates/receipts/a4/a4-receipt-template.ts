/**
 * @fileOverview A4 Receipt Template (إيصال استلام رسمي A4).
 * Dedicated corporate receipt template with payment details and signatures.
 */

import { DocumentTemplate, DocumentRenderData } from '@/core/templates/template-types';
import { renderReceiptVoucherTemplate } from '../../vouchers/receipt/receipt-voucher-template';

export function renderA4ReceiptTemplate(template: DocumentTemplate, data: DocumentRenderData): string {
  // Use the dedicated corporate receipt voucher engine configured for A4
  return renderReceiptVoucherTemplate({
    ...template,
    format: 'A4',
    titleArabic: template.titleArabic || 'إيصال استلام مالي رسمي',
  }, data);
}
