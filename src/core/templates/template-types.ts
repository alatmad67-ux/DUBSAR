/**
 * @fileOverview DUBSAR 2.0 Unified Document Templates Type Definitions.
 * Single source of truth for Preview, Print, and PDF rendering.
 */

export type DocumentType = 
  | 'sales_invoice' 
  | 'purchase_invoice' 
  | 'sales_return' 
  | 'purchase_return' 
  | 'receipt_voucher' 
  | 'payment_voucher' 
  | 'transfer_voucher' 
  | 'quotation' 
  | 'sales_list' 
  | 'purchase_list' 
  | 'customer_statement' 
  | 'supplier_statement' 
  | 'profit_report';

export type TemplateFormat = '80mm' | 'A4';
export type AlignmentType = 'right' | 'center' | 'left';

export interface TemplateSection {
  id: string;
  type: 
    | 'header' 
    | 'logo' 
    | 'business_info' 
    | 'document_meta' 
    | 'party_info' 
    | 'items_table' 
    | 'totals' 
    | 'notes' 
    | 'signatures' 
    | 'footer' 
    | 'dubsar_branding';
  nameArabic: string;
  visible: boolean;
  order: number;
  alignment: AlignmentType;
  fontSize: number; // in pixels or pt (e.g. 11, 14, 18)
  customTitle?: string;
  options?: {
    showLogo?: boolean;
    showPhone?: boolean;
    showAddress?: boolean;
    showCashier?: boolean;
    showBarcode?: boolean;
    showUnit?: boolean;
    showItemPrice?: boolean;
    showItemTotal?: boolean;
    showSerial?: boolean;
    showPreviousBalance?: boolean;
    showCurrentBalance?: boolean;
    showSignatures?: boolean;
    showFooterNotice?: boolean;
    [key: string]: any;
  };
}

export interface DocumentTemplate {
  id: string;
  documentType: DocumentType;
  titleArabic: string;
  format: TemplateFormat;
  direction: 'rtl' | 'ltr';
  fontFamily: string;
  primaryColor: string;
  sections: TemplateSection[];
}

export interface DocumentRenderData {
  business?: {
    name?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    logo?: string;
    footerNotice?: string;
  };
  document?: {
    number?: string;
    title?: string;
    date?: string;
    time?: string;
    cashierName?: string;
    paymentMethod?: string;
    priceType?: string;
    notes?: string;
  };
  party?: {
    type?: 'customer' | 'supplier' | 'branch' | 'other';
    name?: string;
    phone?: string;
    address?: string;
    previousBalance?: number;
    currentBalance?: number;
  };
  items?: Array<{
    name: string;
    barcode?: string;
    quantity: number;
    unit?: string;
    price: number;
    total: number;
    serialNo?: string;
    notes?: string;
  }>;
  totals?: {
    subtotal?: number;
    discount?: number;
    netTotal: number;
    paid?: number;
    remaining?: number;
    receivedAmount?: number;
    changeGiven?: number;
    currency?: string;
  };
  reportData?: {
    startDate?: string;
    endDate?: string;
    summaryStats?: Array<{ label: string; value: string | number }>;
    tableHeaders?: string[];
    tableRows?: Array<Array<string | number>>;
  };
}
