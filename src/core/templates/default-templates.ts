import { DocumentTemplate, DocumentType, TemplateFormat } from './template-types';

export const DOCUMENT_TITLES: Record<DocumentType, string> = {
  sales_invoice: 'فاتورة مبيعات',
  purchase_invoice: 'فاتورة شراء وتوريد',
  sales_return: 'سند إرجاع مبيعات',
  purchase_return: 'سند إرجاع مشتريات',
  receipt_voucher: 'سند قبض مالي',
  payment_voucher: 'سند صرف مالي',
  transfer_voucher: 'سند مناقلة مخزنية',
  quotation: 'عرض أسعار',
  sales_list: 'قائمة المبيعات',
  purchase_list: 'قائمة المشتريات',
  customer_statement: 'كشف حساب عميل',
  supplier_statement: 'كشف حساب مورد',
  profit_report: 'تقرير الأرباح والمالية'
};

export function createDefaultTemplate(documentType: DocumentType, format: TemplateFormat = '80mm'): DocumentTemplate {
  const isA4 = format === 'A4';
  const titleArabic = DOCUMENT_TITLES[documentType] || 'مستند رسمي';

  return {
    id: `tpl_${documentType}_${format}`,
    documentType,
    titleArabic,
    format,
    direction: 'rtl',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    primaryColor: '#0284c7',
    sections: [
      {
        id: 'sec_logo',
        type: 'logo',
        nameArabic: 'شعار النشاط التجاري (Logo)',
        visible: true,
        order: 1,
        alignment: 'center',
        fontSize: isA4 ? 14 : 11,
        options: { showLogo: true }
      },
      {
        id: 'sec_business_info',
        type: 'business_info',
        nameArabic: 'بيانات المنشأة (الاسم، العنوان، الهاتف)',
        visible: true,
        order: 2,
        alignment: 'center',
        fontSize: isA4 ? 16 : 13,
        options: { showPhone: true, showAddress: true }
      },
      {
        id: 'sec_header',
        type: 'header',
        nameArabic: 'عنوان ونوع المستند',
        visible: true,
        order: 3,
        alignment: 'center',
        fontSize: isA4 ? 18 : 14,
        customTitle: titleArabic
      },
      {
        id: 'sec_meta',
        type: 'document_meta',
        nameArabic: 'بيانات المستند (الرقم، التاريخ، الوقت، الكاشير)',
        visible: true,
        order: 4,
        alignment: 'right',
        fontSize: isA4 ? 12 : 10,
        options: { showCashier: true }
      },
      {
        id: 'sec_party',
        type: 'party_info',
        nameArabic: 'بيانات الطرف (الزبون / المورد / الجهة)',
        visible: true,
        order: 5,
        alignment: 'right',
        fontSize: isA4 ? 13 : 11,
        options: { showPhone: true, showAddress: true, showPreviousBalance: true }
      },
      {
        id: 'sec_items',
        type: 'items_table',
        nameArabic: 'جدول المواد والبنود',
        visible: true,
        order: 6,
        alignment: 'right',
        fontSize: isA4 ? 12 : 10,
        options: {
          showBarcode: false, // Default to clean table, can be toggled
          showUnit: true,
          showItemPrice: true,
          showItemTotal: true,
          showSerial: true
        }
      },
      {
        id: 'sec_totals',
        type: 'totals',
        nameArabic: 'المجاميع والضرائب والخصم والباقي',
        visible: true,
        order: 7,
        alignment: 'left',
        fontSize: isA4 ? 14 : 12,
        options: { showCurrentBalance: true }
      },
      {
        id: 'sec_notes',
        type: 'notes',
        nameArabic: 'الملاحظات والبيان',
        visible: true,
        order: 8,
        alignment: 'right',
        fontSize: isA4 ? 11 : 9
      },
      {
        id: 'sec_signatures',
        type: 'signatures',
        nameArabic: 'التواقيع والمصادقة',
        visible: isA4, // visible on A4 by default
        order: 9,
        alignment: 'center',
        fontSize: isA4 ? 11 : 9,
        options: { showSignatures: true }
      },
      {
        id: 'sec_footer',
        type: 'footer',
        nameArabic: 'تذييل الفاتورة وملاحظات الاسترجاع',
        visible: true,
        order: 10,
        alignment: 'center',
        fontSize: isA4 ? 10 : 8,
        options: { showFooterNotice: true }
      },
      {
        id: 'sec_dubsar_branding',
        type: 'dubsar_branding',
        nameArabic: 'شعار وتوثيق نظام DUBSAR 2.0',
        visible: true,
        order: 11,
        alignment: 'center',
        fontSize: 8
      }
    ]
  };
}

export function getAllDefaultTemplates(): DocumentTemplate[] {
  const types: DocumentType[] = [
    'sales_invoice',
    'purchase_invoice',
    'sales_return',
    'purchase_return',
    'receipt_voucher',
    'payment_voucher',
    'transfer_voucher',
    'quotation',
    'sales_list',
    'purchase_list',
    'customer_statement',
    'supplier_statement',
    'profit_report'
  ];

  const templates: DocumentTemplate[] = [];
  for (const t of types) {
    templates.push(createDefaultTemplate(t, '80mm'));
    templates.push(createDefaultTemplate(t, 'A4'));
  }
  return templates;
}
