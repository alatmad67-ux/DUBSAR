
'use client';

import { AdapterFactory } from '@/infra/database/adapter-factory';
import { DB_COMMANDS } from '@/infra/database/adapter';

/**
 * @fileOverview Local Authentication Service v2.1.
 */

export interface LocalUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
}

export interface UnifiedAppSettings {
  businessName: string;
  businessType: string;
  phone: string;
  phone1: string;
  phone2: string;
  address: string;
  logo: string;
  invoiceHeaderImage: string;

  // Print & Layout Options
  defaultPrintFormat: '80mm' | 'A4';
  defaultPrintSize: '80mm' | 'A4';
  fontScale: 'small' | 'medium' | 'large';
  printFontScale: 'small' | 'medium' | 'large';

  // Header & Logo visibility
  showLogo: boolean;
  showCompanyLogo: boolean;

  // Dynamic A4 / 80mm Table Columns & Elements
  showItemIndex: boolean;
  showItemName: boolean;
  showBarcode: boolean;
  showBarcodeOnInvoice: boolean;
  showUnit: boolean;
  showQuantity: boolean;
  showPrice: boolean;
  showDiscount: boolean;
  showTotal: boolean;
  showQrCode: boolean;

  // Party & Cashier Visibility
  showCashierName: boolean;
  showCustomerBalance: boolean;
  showPreviousBalance: boolean;

  // Footer & Signatures (A4 & 80mm)
  showSignatures: boolean;
  showOrganizerName: boolean;
  showSupplierName: boolean;
  invoiceNotice: string;
  footerNotes: string;
  invoiceFooterNotes: string;
  footerText: string;
  thankYouMessage: string;

  // Printers
  selectedThermalPrinter: string;
  selectedA4Printer: string;
  autoPrintOnSave: boolean;
  printCopies: number;

  [key: string]: any;
}

const DEFAULT_UNIFIED_SETTINGS: UnifiedAppSettings = {
  businessName: 'مؤسسة دوبسار التجارية',
  businessType: 'تجارة عامة ومواد احتياطية',
  phone: '',
  phone1: '',
  phone2: '',
  address: 'بغداد - الكرادة',
  logo: '',
  invoiceHeaderImage: '',

  defaultPrintFormat: '80mm',
  defaultPrintSize: '80mm',
  fontScale: 'medium',
  printFontScale: 'medium',

  showLogo: true,
  showCompanyLogo: true,

  showItemIndex: true,
  showItemName: true,
  showBarcode: true,
  showBarcodeOnInvoice: true,
  showUnit: true,
  showQuantity: true,
  showPrice: true,
  showDiscount: true,
  showTotal: true,
  showQrCode: true,

  showCashierName: true,
  showCustomerBalance: true,
  showPreviousBalance: true,

  showSignatures: true,
  showOrganizerName: true,
  showSupplierName: true,
  invoiceNotice: 'فاتورة مبيعات معتمدة رسمياً',
  footerNotes: 'البضاعة المباعة لا ترد ولا تستبدل إلا خلال 3 أيام وبحالتها الأصلية مع إبراز الفاتورة.',
  invoiceFooterNotes: 'البضاعة المباعة لا ترد ولا تستبدل إلا خلال 3 أيام وبحالتها الأصلية مع إبراز الفاتورة.',
  footerText: 'البضاعة المباعة لا ترد ولا تستبدل إلا خلال 3 أيام وبحالتها الأصلية مع إبراز الفاتورة.',
  thankYouMessage: 'شكراً لتعاملكم معنا - نتطلع لخدمتكم دائماً',

  selectedThermalPrinter: '',
  selectedA4Printer: '',
  autoPrintOnSave: true,
  printCopies: 1,
};

export class LocalAuthService {
  private static adapter = AdapterFactory.getAdapter();

  /**
   * Normalizes aliases across general settings, design settings, and print renderer.
   */
  private static normalizeSettingsObject(raw: Record<string, any>): UnifiedAppSettings {
    const merged: Record<string, any> = { ...DEFAULT_UNIFIED_SETTINGS, ...raw };

    const phone = raw.phone || raw.phone1 || merged.phone1 || merged.phone || '';
    merged.phone = phone;
    merged.phone1 = phone;

    const format = (raw.defaultPrintFormat || raw.defaultPrintSize || merged.defaultPrintFormat || '80mm') as '80mm' | 'A4';
    merged.defaultPrintFormat = format;
    merged.defaultPrintSize = format;

    const scale = (raw.fontScale || raw.printFontScale || merged.fontScale || 'medium') as 'small' | 'medium' | 'large';
    merged.fontScale = scale;
    merged.printFontScale = scale;

    const showLogo = raw.showLogo !== undefined ? Boolean(raw.showLogo) : (raw.showCompanyLogo !== undefined ? Boolean(raw.showCompanyLogo) : true);
    merged.showLogo = showLogo;
    merged.showCompanyLogo = showLogo;

    const showBarcode = raw.showBarcode !== undefined ? Boolean(raw.showBarcode) : (raw.showBarcodeOnInvoice !== undefined ? Boolean(raw.showBarcodeOnInvoice) : true);
    merged.showBarcode = showBarcode;
    merged.showBarcodeOnInvoice = showBarcode;

    merged.showItemIndex = raw.showItemIndex !== undefined ? Boolean(raw.showItemIndex) : true;
    merged.showItemName = raw.showItemName !== undefined ? Boolean(raw.showItemName) : true;
    merged.showUnit = raw.showUnit !== undefined ? Boolean(raw.showUnit) : true;
    merged.showQuantity = raw.showQuantity !== undefined ? Boolean(raw.showQuantity) : true;
    merged.showPrice = raw.showPrice !== undefined ? Boolean(raw.showPrice) : true;
    merged.showDiscount = raw.showDiscount !== undefined ? Boolean(raw.showDiscount) : true;
    merged.showTotal = raw.showTotal !== undefined ? Boolean(raw.showTotal) : true;
    merged.showOrganizerName = raw.showOrganizerName !== undefined ? Boolean(raw.showOrganizerName) : true;
    merged.showSupplierName = raw.showSupplierName !== undefined ? Boolean(raw.showSupplierName) : true;
    merged.showSignatures = raw.showSignatures !== undefined ? Boolean(raw.showSignatures) : true;

    const footer = raw.footerNotes ?? raw.invoiceFooterNotes ?? raw.footerText ?? merged.footerNotes;
    merged.footerNotes = footer;
    merged.invoiceFooterNotes = footer;
    merged.footerText = footer;

    return merged as UnifiedAppSettings;
  }

  /**
   * Synchronously reads and unifies settings from localStorage (`dubsar_app_settings`),
   * safely migrating any legacy values from `dubsar_invoice_settings` without data loss.
   */
  static getUnifiedSettingsSync(): UnifiedAppSettings {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_UNIFIED_SETTINGS };
    }
    try {
      let appStored: Record<string, any> = {};
      let legacyInvoiceStored: Record<string, any> = {};

      const rawApp = localStorage.getItem('dubsar_app_settings');
      if (rawApp) {
        appStored = JSON.parse(rawApp) || {};
      }

      const rawLegacy = localStorage.getItem('dubsar_invoice_settings');
      if (rawLegacy) {
        legacyInvoiceStored = JSON.parse(rawLegacy) || {};
      }

      // Preserve non-empty images across both stores during migration
      const preservedHeaderImage =
        legacyInvoiceStored.invoiceHeaderImage || appStored.invoiceHeaderImage || '';
      const preservedLogo =
        appStored.logo || legacyInvoiceStored.logo || '';

      const combined = this.normalizeSettingsObject({
        ...appStored,
        ...legacyInvoiceStored,
        // Ensure newer fields in appStored are not clobbered by empty legacy fields
        businessName: legacyInvoiceStored.businessName || appStored.businessName || DEFAULT_UNIFIED_SETTINGS.businessName,
        phone: legacyInvoiceStored.phone || appStored.phone1 || appStored.phone || '',
        address: legacyInvoiceStored.address || appStored.address || DEFAULT_UNIFIED_SETTINGS.address,
        logo: preservedLogo,
        invoiceHeaderImage: preservedHeaderImage,
      });

      // If legacy key existed, persist unified result into `dubsar_app_settings` and remove the duplicate key
      if (rawLegacy) {
        localStorage.setItem('dubsar_app_settings', JSON.stringify(combined));
        localStorage.removeItem('dubsar_invoice_settings');
      }

      return combined;
    } catch {
      return { ...DEFAULT_UNIFIED_SETTINGS };
    }
  }

  /**
   * Asynchronously loads unified settings from both SQLite (`app_settings`) and `dubsar_app_settings`,
   * ensuring SQLite `invoiceHeaderImage` and `logo` are synced into the unified store.
   */
  static async getUnifiedSettings(): Promise<UnifiedAppSettings> {
    const localUnified = this.getUnifiedSettingsSync();
    try {
      const dbSettings = await this.getAppSettings();
      if (dbSettings && typeof dbSettings === 'object') {
        const merged = this.normalizeSettingsObject({
          ...localUnified,
          businessName: dbSettings.businessName || localUnified.businessName,
          businessType: dbSettings.businessType || localUnified.businessType,
          phone: dbSettings.phone || localUnified.phone1 || localUnified.phone,
          address: dbSettings.address || localUnified.address,
          logo: dbSettings.logo || localUnified.logo || '',
          invoiceHeaderImage: dbSettings.invoiceHeaderImage || localUnified.invoiceHeaderImage || '',
        });

        if (typeof window !== 'undefined') {
          localStorage.setItem('dubsar_app_settings', JSON.stringify(merged));
        }

        // If local had invoiceHeaderImage or logo that wasn't in SQLite yet, sync it back to SQLite
        if (
          (merged.invoiceHeaderImage && !dbSettings.invoiceHeaderImage) ||
          (merged.logo && !dbSettings.logo)
        ) {
          await this.saveAppSettings({
            businessName: merged.businessName,
            businessType: merged.businessType,
            phone: merged.phone,
            address: merged.address,
            logo: merged.logo,
            invoiceHeaderImage: merged.invoiceHeaderImage,
          }).catch(() => {});
        }

        return merged;
      }
    } catch {}
    return localUnified;
  }

  /**
   * Saves partial settings safely into the unified store (`dubsar_app_settings` + SQLite `app_settings`).
   * Never wipes `invoiceHeaderImage` or `logo` unless explicitly cleared via `clearHeaderImage` / `clearLogo`.
   */
  static async saveUnifiedSettings(
    partial: Record<string, any>,
    options?: { clearHeaderImage?: boolean; clearLogo?: boolean }
  ): Promise<UnifiedAppSettings> {
    const current = await this.getUnifiedSettings();

    const nextHeaderImage = options?.clearHeaderImage
      ? ''
      : partial.invoiceHeaderImage !== undefined && partial.invoiceHeaderImage !== ''
      ? String(partial.invoiceHeaderImage)
      : current.invoiceHeaderImage || '';

    const nextLogo = options?.clearLogo
      ? ''
      : partial.logo !== undefined && partial.logo !== ''
      ? String(partial.logo)
      : current.logo || '';

    const updated = this.normalizeSettingsObject({
      ...current,
      ...partial,
      logo: nextLogo,
      invoiceHeaderImage: nextHeaderImage,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('dubsar_app_settings', JSON.stringify(updated));
      localStorage.removeItem('dubsar_invoice_settings');
    }

    await this.saveAppSettings({
      businessName: updated.businessName || 'مؤسسة دوبسار التجارية',
      businessType: updated.businessType || 'commercial',
      phone: updated.phone1 || updated.phone || '',
      address: updated.address || '',
      logo: updated.logo || '',
      invoiceHeaderImage: updated.invoiceHeaderImage || '',
      ...(options?.clearHeaderImage ? { clearHeaderImage: 'true' } : {}),
      ...(options?.clearLogo ? { clearLogo: 'true' } : {}),
    });

    return updated;
  }

  static async ensureOwnerExists() {
    return await this.adapter.execute(DB_COMMANDS.GET_SETUP_STATUS);
  }

  static async createFirstAdmin(username: string, displayName: string, pin: string) {
    return await this.adapter.execute(DB_COMMANDS.CREATE_FIRST_ADMIN, {
      username,
      displayName,
      pin,
    });
  }

  static async getSetupStatus() {
    return await this.adapter.execute(DB_COMMANDS.GET_SETUP_STATUS);
  }

  static async getAppSettings() {
    return await this.adapter.execute(DB_COMMANDS.GET_APP_SETTINGS);
  }

  static async saveAppSettings(settings: Record<string, string>) {
    return await this.adapter.execute(DB_COMMANDS.SAVE_APP_SETTINGS, { settings });
  }

  static async login(username: string, pin: string): Promise<LocalUser | null> {
    const user = await this.adapter.execute(DB_COMMANDS.LOGIN, { username, pin });
    if (user) {
      await this.adapter.execute(DB_COMMANDS.LOG_AUDIT, {
        action: 'تسجيل دخول',
        details: `المستخدم: ${username}`,
        user: user.displayName,
      });
    }
    return user;
  }

  static async getUsers() {
    return await this.adapter.query(DB_COMMANDS.GET_USERS);
  }

  static async createUser(data: any) {
    return await this.adapter.execute(DB_COMMANDS.CREATE_USER, { user: data });
  }

  static async deleteUser(id: string) {
    return await this.adapter.execute(DB_COMMANDS.DELETE_USER, { id });
  }
}
