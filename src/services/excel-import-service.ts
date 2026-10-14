import * as XLSX from 'xlsx';
import { InventoryService } from './inventory-service';
import { Product } from '@/core/entities/product';

export interface ImportFieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  type: 'string' | 'number';
  synonyms: string[];
}

export const IMPORT_FIELDS: ImportFieldDefinition[] = [
  {
    key: 'name',
    label: 'اسم المنتج',
    required: true,
    type: 'string',
    synonyms: [
      'اسم المنتج', 'اسم المادة', 'المادة', 'المنتج', 'اسم الصنف', 'الصنف', 'المواد',
      'product', 'product name', 'item', 'item name', 'name', 'product_name', 'item_name'
    ]
  },
  {
    key: 'barcode',
    label: 'الباركود',
    type: 'string',
    synonyms: [
      'الباركود', 'باركود', 'كود المادة', 'كود المنتج', 'الكود', 'كود', 'رقم الباركود', 'رمز المنتج',
      'barcode', 'code', 'sku', 'upc', 'ean', 'item code'
    ]
  },
  {
    key: 'category',
    label: 'التصنيف',
    type: 'string',
    synonyms: [
      'التصنيف', 'تصنيف', 'الفئة', 'فئة', 'القسم', 'قسم', 'المجموعة',
      'category', 'cat', 'group', 'department'
    ]
  },
  {
    key: 'brand',
    label: 'العلامة التجارية / الماركة',
    type: 'string',
    synonyms: [
      'العلامة التجارية', 'العلامة', 'الماركة', 'ماركة', 'الشركة المصنعة', 'الشركة', 'براند',
      'brand', 'make', 'manufacturer'
    ]
  },
  {
    key: 'unit',
    label: 'الوحدة',
    type: 'string',
    synonyms: [
      'الوحدة', 'وحدة', 'وحدة القياس', 'القياس', 'نوع الوحدة',
      'unit', 'uom', 'measuring unit'
    ]
  },
  {
    key: 'purchasePrice',
    label: 'سعر التكلفة (الشراء)',
    type: 'number',
    synonyms: [
      'سعر التكلفة', 'التكلفة', 'سعر الشراء', 'شراء', 'تكلفة', 'سعر الكلفة', 'الكلفة', 'كلفة',
      'cost', 'cost price', 'purchase price', 'buy price', 'purchase_price', 'cost_price'
    ]
  },
  {
    key: 'retailPrice',
    label: 'سعر البيع (المفرد)',
    type: 'number',
    synonyms: [
      'سعر البيع', 'البيع', 'سعر المفرد', 'مفرد', 'السعر', 'سعر القطعة', 'سعر بيع', 'بيع',
      'price', 'retail price', 'sale price', 'selling price', 'retail', 'retail_price', 'sale_price'
    ]
  },
  {
    key: 'wholesalePrice',
    label: 'سعر الجملة',
    type: 'number',
    synonyms: [
      'سعر الجملة', 'الجملة', 'جملة', 'سعر جملة',
      'wholesale', 'wholesale price', 'wholesale_price'
    ]
  },
  {
    key: 'agentPrice',
    label: 'سعر الوكيل / الخاص',
    type: 'number',
    synonyms: [
      'سعر الوكيل', 'الوكيل', 'وكيل', 'سعر خاص',
      'agent price', 'agent', 'dealer price'
    ]
  },
  {
    key: 'stockQuantity',
    label: 'الكمية (المخزون)',
    type: 'number',
    synonyms: [
      'الكمية', 'كمية', 'المخزون', 'مخزون', 'الرصيد', 'رصيد', 'العدد', 'عدد',
      'quantity', 'qty', 'stock', 'stock quantity', 'stock_quantity', 'count', 'inventory'
    ]
  },
  {
    key: 'minStockLevel',
    label: 'الحد الأدنى للمخزون',
    type: 'number',
    synonyms: [
      'الحد الأدنى للمخزون', 'الحد الأدنى', 'الحد الادنى', 'حد الطلب', 'تنبيه النواقص', 'اقل كمية', 'أقل كمية',
      'min stock', 'min stock level', 'min_stock', 'alert level', 'reorder level'
    ]
  },
  {
    key: 'storageLocation',
    label: 'موقع التخزين / الرف',
    type: 'string',
    synonyms: [
      'موقع التخزين', 'مكان التخزين', 'الموقع', 'موقع', 'الرف', 'رف', 'المكان',
      'storage location', 'location', 'shelf', 'bin', 'rack', 'storage_location'
    ]
  },
  {
    key: 'description',
    label: 'الوصف / ملاحظات',
    type: 'string',
    synonyms: [
      'الوصف', 'وصف', 'الملاحظات', 'ملاحظات', 'تفاصيل', 'بيان',
      'description', 'desc', 'notes', 'details'
    ]
  }
];

export interface ImportOptions {
  duplicateBarcodeStrategy: 'skip' | 'update' | 'new';
  autoCreateCategories: boolean;
  matchByNameIfNoBarcode: boolean;
}

export interface PreparedImportRow {
  rowNumber: number;
  originalData: Record<string, any>;
  sanitized: {
    name: string;
    barcode?: string;
    category?: string;
    brand?: string;
    unit?: string;
    purchasePrice: number;
    retailPrice: number;
    wholesalePrice: number;
    agentPrice: number;
    stockQuantity: number;
    minStockLevel: number;
    storageLocation?: string;
    description?: string;
  };
  status: 'valid' | 'duplicate_in_file' | 'existing_in_db' | 'error';
  action: 'create' | 'update' | 'skip';
  matchedExistingProduct?: Product | null;
  errors: string[];
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: PreparedImportRow[];
  toCreateCount: number;
  toUpdateCount: number;
  toSkipCount: number;
  errorCount: number;
  newCategories: string[];
}

export interface ImportErrorItem {
  rowNumber: number;
  productName: string;
  barcode?: string;
  reason: string;
  originalData: Record<string, any>;
}

export interface ImportExecutionResult {
  total: number;
  added: number;
  updated: number;
  skipped: number;
  errors: ImportErrorItem[];
}

/**
 * Normalizes an Arabic or English header string for fuzzy matching.
 */
function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // Remove Arabic harakat
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[-_/\\]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Parses and sanitizes a numeric value from Excel.
 * Supports Arabic numerals, currency signs, commas, and negative signs.
 */
export function sanitizeNumber(val: any, defaultValue = 0): { value: number; isValid: boolean } {
  if (val === undefined || val === null || val === '') {
    return { value: defaultValue, isValid: true };
  }

  if (typeof val === 'number') {
    if (isNaN(val)) return { value: defaultValue, isValid: false };
    return { value: val, isValid: true };
  }

  let str = val.toString().trim();
  if (str === '') return { value: defaultValue, isValid: true };

  // Convert Arabic-Indic digits to ASCII 0-9
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replaceAll(arabicDigits[i], i.toString());
  }

  // Remove currency words, symbols and commas
  str = str.replace(/[$,،د.عIQDUSD]/gi, '').replace(/\s+/g, '').trim();

  const num = Number(str);
  if (isNaN(num)) {
    return { value: defaultValue, isValid: false };
  }

  return { value: num, isValid: true };
}

/**
 * Parses barcode string, preventing scientific notation and trimming.
 */
export function sanitizeBarcode(val: any): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') {
    // If large integer was converted to scientific notation, format as integer
    return BigInt(Math.floor(val)).toString();
  }
  let str = val.toString().trim();
  // Convert Arabic numerals
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    str = str.replaceAll(arabicDigits[i], i.toString());
  }
  return str;
}

export class ExcelImportService {
  /**
   * Reads raw bytes / buffer from an Excel (.xlsx, .xls) or CSV file.
   */
  static parseFileBuffer(buffer: ArrayBuffer | Uint8Array): { headers: string[]; rawRows: Record<string, any>[] } {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('الملف لا يحتوي على أي ورقة عمل صالحة');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with headers as array
    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
    if (!rawData || rawData.length === 0) {
      return { headers: [], rawRows: [] };
    }

    // Find the first non-empty row to use as headers
    let headerRowIdx = 0;
    while (headerRowIdx < rawData.length) {
      const row = rawData[headerRowIdx];
      if (Array.isArray(row) && row.some(cell => String(cell).trim().length > 0)) {
        break;
      }
      headerRowIdx++;
    }

    if (headerRowIdx >= rawData.length) {
      return { headers: [], rawRows: [] };
    }

    const rawHeaders = rawData[headerRowIdx] as any[];
    const headers = rawHeaders
      .map(h => (h !== undefined && h !== null ? String(h).trim() : ''))
      .filter((h, idx, arr) => h.length > 0 || arr.slice(idx + 1).some(sub => sub.length > 0));

    const rawRows: Record<string, any>[] = [];
    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const rowArr = rawData[r];
      if (!Array.isArray(rowArr)) continue;
      
      // Check if entire row is empty
      const hasContent = rowArr.some(cell => cell !== undefined && cell !== null && String(cell).trim().length > 0);
      if (!hasContent) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((headerName, colIdx) => {
        if (headerName) {
          rowObj[headerName] = rowArr[colIdx] ?? '';
        }
      });
      rawRows.push(rowObj);
    }

    return { headers, rawRows };
  }

  /**
   * Auto-maps Excel headers to DUBSAR product fields.
   */
  static autoMapHeaders(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const usedHeaders = new Set<string>();

    for (const field of IMPORT_FIELDS) {
      const normalizedSynonyms = field.synonyms.map(normalizeString);
      
      // Try exact or close match first
      let matchedHeader = headers.find(h => {
        if (usedHeaders.has(h)) return false;
        const normH = normalizeString(h);
        return normalizedSynonyms.includes(normH);
      });

      // Try partial match if not found
      if (!matchedHeader) {
        matchedHeader = headers.find(h => {
          if (usedHeaders.has(h)) return false;
          const normH = normalizeString(h);
          return normalizedSynonyms.some(syn => normH.includes(syn) || syn.includes(normH));
        });
      }

      if (matchedHeader) {
        mapping[field.key] = matchedHeader;
        usedHeaders.add(matchedHeader);
      } else {
        mapping[field.key] = '';
      }
    }

    return mapping;
  }

  /**
   * Validates and prepares rows before committing to database.
   */
  static validateRows(
    rawRows: Record<string, any>[],
    mapping: Record<string, string>,
    existingProducts: Product[],
    existingCategories: any[],
    options: ImportOptions
  ): ImportValidationResult {
    const preparedRows: PreparedImportRow[] = [];
    const seenBarcodesInFile = new Set<string>();
    const existingBarcodeMap = new Map<string, Product>();
    const existingNameMap = new Map<string, Product>();
    const knownCategories = new Set<string>(
      (existingCategories || []).map(c => normalizeString(c.name || ''))
    );
    const newCategoriesSet = new Set<string>();

    for (const p of existingProducts || []) {
      if (p.barcode && p.barcode.trim()) {
        existingBarcodeMap.set(p.barcode.trim(), p);
      }
      if (p.name && p.name.trim()) {
        existingNameMap.set(normalizeString(p.name), p);
      }
    }

    let toCreateCount = 0;
    let toUpdateCount = 0;
    let toSkipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // 1-indexed Excel row (header is row 1)
      const errors: string[] = [];

      // Extract values according to mapping
      const rawName = mapping.name ? row[mapping.name] : '';
      const name = rawName ? String(rawName).trim() : '';
      
      const rawBarcode = mapping.barcode ? row[mapping.barcode] : '';
      const barcode = sanitizeBarcode(rawBarcode);

      const rawCategory = mapping.category ? row[mapping.category] : '';
      const category = rawCategory ? String(rawCategory).trim() : '';

      const rawBrand = mapping.brand ? row[mapping.brand] : '';
      const brand = rawBrand ? String(rawBrand).trim() : '';

      const rawUnit = mapping.unit ? row[mapping.unit] : '';
      const unit = rawUnit ? String(rawUnit).trim() : 'قطعة';

      const rawLocation = mapping.storageLocation ? row[mapping.storageLocation] : '';
      const storageLocation = rawLocation ? String(rawLocation).trim() : '';

      const rawDescription = mapping.description ? row[mapping.description] : '';
      const description = rawDescription ? String(rawDescription).trim() : '';

      // Numbers
      const purchasePriceParsed = sanitizeNumber(mapping.purchasePrice ? row[mapping.purchasePrice] : 0, 0);
      if (!purchasePriceParsed.isValid || purchasePriceParsed.value < 0) {
        errors.push('سعر الشراء/التكلفة غير صالح (يجب أن يكون رقماً غير سالب)');
      }

      const retailPriceParsed = sanitizeNumber(mapping.retailPrice ? row[mapping.retailPrice] : 0, 0);
      if (!retailPriceParsed.isValid || retailPriceParsed.value < 0) {
        errors.push('سعر البيع غير صالح (يجب أن يكون رقماً غير سالب)');
      }

      const wholesalePriceParsed = sanitizeNumber(mapping.wholesalePrice ? row[mapping.wholesalePrice] : 0, 0);
      if (!wholesalePriceParsed.isValid || wholesalePriceParsed.value < 0) {
        errors.push('سعر الجملة غير صالح (يجب أن يكون رقماً غير سالب)');
      }

      const agentPriceParsed = sanitizeNumber(mapping.agentPrice ? row[mapping.agentPrice] : 0, 0);
      if (!agentPriceParsed.isValid || agentPriceParsed.value < 0) {
        errors.push('سعر الوكيل غير صالح');
      }

      const stockQuantityParsed = sanitizeNumber(mapping.stockQuantity ? row[mapping.stockQuantity] : 0, 0);
      if (!stockQuantityParsed.isValid || stockQuantityParsed.value < 0) {
        errors.push('كمية المخزون غير صالحة');
      }

      const minStockLevelParsed = sanitizeNumber(mapping.minStockLevel ? row[mapping.minStockLevel] : 5, 5);
      if (!minStockLevelParsed.isValid || minStockLevelParsed.value < 0) {
        errors.push('الحد الأدنى للمخزون غير صالح');
      }

      // Name validation
      if (!name) {
        errors.push('اسم المنتج مفقود');
      }

      // Check category
      if (category) {
        const normCat = normalizeString(category);
        if (!knownCategories.has(normCat)) {
          newCategoriesSet.add(category);
        }
      }

      let status: PreparedImportRow['status'] = 'valid';
      let action: PreparedImportRow['action'] = 'create';
      let matchedExistingProduct: Product | null = null;

      // Duplicate barcode inside the file
      if (barcode) {
        if (seenBarcodesInFile.has(barcode)) {
          status = 'duplicate_in_file';
          errors.push(`باركود مكرر داخل ملف Excel (${barcode})`);
        } else {
          seenBarcodesInFile.add(barcode);
        }
      }

      // Check existing in DB
      if (barcode && existingBarcodeMap.has(barcode)) {
        matchedExistingProduct = existingBarcodeMap.get(barcode)!;
        status = 'existing_in_db';
      } else if (!barcode && options.matchByNameIfNoBarcode && name) {
        const normName = normalizeString(name);
        if (existingNameMap.has(normName)) {
          matchedExistingProduct = existingNameMap.get(normName)!;
          status = 'existing_in_db';
        }
      }

      // Determine action based on duplicate strategy
      if (matchedExistingProduct) {
        if (options.duplicateBarcodeStrategy === 'skip') {
          action = 'skip';
        } else if (options.duplicateBarcodeStrategy === 'update') {
          action = 'update';
        } else if (options.duplicateBarcodeStrategy === 'new') {
          action = 'create';
        }
      }

      if (errors.length > 0) {
        status = 'error';
        errorCount++;
      } else if (action === 'skip') {
        toSkipCount++;
      } else if (action === 'update') {
        toUpdateCount++;
      } else {
        toCreateCount++;
      }

      preparedRows.push({
        rowNumber: rowNum,
        originalData: row,
        sanitized: {
          name,
          barcode: barcode || undefined,
          category: category || undefined,
          brand: brand || undefined,
          unit: unit || 'قطعة',
          purchasePrice: purchasePriceParsed.value,
          retailPrice: retailPriceParsed.value,
          wholesalePrice: wholesalePriceParsed.value,
          agentPrice: agentPriceParsed.value,
          stockQuantity: Math.floor(stockQuantityParsed.value),
          minStockLevel: Math.floor(minStockLevelParsed.value),
          storageLocation: storageLocation || undefined,
          description: description || undefined,
        },
        status,
        action,
        matchedExistingProduct,
        errors,
      });
    }

    return {
      totalRows: rawRows.length,
      validRows: preparedRows,
      toCreateCount,
      toUpdateCount,
      toSkipCount,
      errorCount,
      newCategories: Array.from(newCategoriesSet),
    };
  }

  /**
   * Executes the import row-by-row with async batching and live progress.
   */
  static async executeImport(
    rows: PreparedImportRow[],
    existingCategories: any[],
    options: ImportOptions,
    onProgress?: (progress: { current: number; total: number; percentage: number; currentItemName: string }) => void
  ): Promise<ImportExecutionResult> {
    const total = rows.length;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const errors: ImportErrorItem[] = [];

    // Category cache mapping: normalizedName -> categoryId
    const categoryCache = new Map<string, string>();
    for (const cat of existingCategories || []) {
      if (cat.name) {
        categoryCache.set(normalizeString(cat.name), cat.id);
      }
    }

    // Process rows
    for (let i = 0; i < total; i++) {
      const row = rows[i];

      // Yield event loop every 5 rows to ensure 100% smooth UI updates
      if (i % 5 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }

      if (onProgress) {
        const percentage = Math.round(((i + 1) / total) * 100);
        onProgress({
          current: i + 1,
          total,
          percentage,
          currentItemName: row.sanitized.name || `صف ${row.rowNumber}`,
        });
      }

      // If row has validation errors, record and continue
      if (row.status === 'error' || row.errors.length > 0) {
        errors.push({
          rowNumber: row.rowNumber,
          productName: row.sanitized.name || 'بدون اسم',
          barcode: row.sanitized.barcode,
          reason: row.errors.join('، '),
          originalData: row.originalData,
        });
        continue;
      }

      // If action is skip
      if (row.action === 'skip') {
        skipped++;
        continue;
      }

      try {
        // Resolve or create category
        let categoryId: string | undefined = undefined;
        if (row.sanitized.category) {
          const normCat = normalizeString(row.sanitized.category);
          if (categoryCache.has(normCat)) {
            categoryId = categoryCache.get(normCat);
          } else if (options.autoCreateCategories) {
            try {
              const newCat = await InventoryService.saveCategory(row.sanitized.category.trim());
              categoryId = newCat.id;
              categoryCache.set(normCat, newCat.id);
            } catch (catErr: any) {
              console.warn(`[ExcelImport] Failed to create category "${row.sanitized.category}":`, catErr);
            }
          }
        }

        if (row.action === 'update' && row.matchedExistingProduct) {
          // Update existing product
          const updatePayload: any = {
            name: row.sanitized.name,
            purchasePrice: row.sanitized.purchasePrice,
            retailPrice: row.sanitized.retailPrice,
            wholesalePrice: row.sanitized.wholesalePrice,
            agentPrice: row.sanitized.agentPrice,
            unit: row.sanitized.unit,
            stockQuantity: row.sanitized.stockQuantity,
            minStockLevel: row.sanitized.minStockLevel,
          };

          if (categoryId) updatePayload.categoryId = categoryId;
          if (row.sanitized.brand) updatePayload.brand = row.sanitized.brand;
          if (row.sanitized.storageLocation) updatePayload.storageLocation = row.sanitized.storageLocation;
          if (row.sanitized.description) updatePayload.description = row.sanitized.description;

          await InventoryService.updateProduct(row.matchedExistingProduct.id, updatePayload);
          updated++;
        } else {
          // Create new product
          let finalBarcode = row.sanitized.barcode;
          // If duplicate strategy is 'new' and barcode was matching existing, generate a suffix or new code
          if (row.matchedExistingProduct && options.duplicateBarcodeStrategy === 'new' && finalBarcode) {
            finalBarcode = `${finalBarcode}-${Date.now().toString().slice(-4)}`;
          }

          const createPayload: any = {
            name: row.sanitized.name,
            barcode: finalBarcode || undefined,
            categoryId,
            brand: row.sanitized.brand || undefined,
            unit: row.sanitized.unit || 'قطعة',
            purchasePrice: row.sanitized.purchasePrice,
            retailPrice: row.sanitized.retailPrice,
            wholesalePrice: row.sanitized.wholesalePrice,
            agentPrice: row.sanitized.agentPrice,
            stockQuantity: row.sanitized.stockQuantity,
            minStockLevel: row.sanitized.minStockLevel,
            storageLocation: row.sanitized.storageLocation || undefined,
            description: row.sanitized.description || undefined,
            status: row.sanitized.stockQuantity > 0 ? 'available' : 'out_of_stock',
          };

          await InventoryService.saveProduct(createPayload);
          added++;
        }
      } catch (err: any) {
        errors.push({
          rowNumber: row.rowNumber,
          productName: row.sanitized.name,
          barcode: row.sanitized.barcode,
          reason: err?.message || 'خطأ أثناء الحفظ في قاعدة البيانات',
          originalData: row.originalData,
        });
      }
    }

    return {
      total,
      added,
      updated,
      skipped,
      errors,
    };
  }

  /**
   * Generates a ready-to-use Excel template with sample rows.
   */
  static generateTemplateWorkbook(): XLSX.WorkBook {
    const headers = [
      'اسم المنتج',
      'الباركود',
      'التصنيف',
      'العلامة التجارية',
      'الوحدة',
      'سعر التكلفة',
      'سعر البيع',
      'سعر الجملة',
      'الكمية',
      'الحد الأدنى للمخزون',
      'موقع التخزين',
      'الوصف'
    ];

    const sampleRows = [
      [
        'زيت محرك سوبر 1 لتر',
        '6291040001234',
        'زيوت وسوائل',
        'Total',
        'علبة',
        6500,
        8500,
        7500,
        50,
        10,
        'رف A-1',
        'زيت محرك تخليقي ممتاز'
      ],
      [
        'فلتر هواء كورولا',
        '6291040005678',
        'فلاتر',
        'Toyota',
        'قطعة',
        12000,
        18000,
        15000,
        25,
        5,
        'رف B-3',
        'فلتر ياباني أصلي'
      ],
      [
        'شمعات إشعال بلاتينيوم',
        '6291040009012',
        'كهربائيات',
        'NGK',
        'طقم',
        20000,
        28000,
        25000,
        15,
        4,
        'رف C-2',
        'طقم 4 شمعات إشعال'
      ]
    ];

    const data = [headers, ...sampleRows];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 26 }, // اسم المنتج
      { wch: 18 }, // الباركود
      { wch: 16 }, // التصنيف
      { wch: 18 }, // العلامة التجارية
      { wch: 10 }, // الوحدة
      { wch: 14 }, // سعر التكلفة
      { wch: 14 }, // سعر البيع
      { wch: 14 }, // سعر الجملة
      { wch: 10 }, // الكمية
      { wch: 18 }, // الحد الأدنى للمخزون
      { wch: 16 }, // موقع التخزين
      { wch: 30 }, // الوصف
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'قالب المنتجات');
    return workbook;
  }

  /**
   * Generates an Excel file containing all failed rows with error reasons.
   */
  static generateErrorsWorkbook(errors: ImportErrorItem[]): XLSX.WorkBook {
    const rows = errors.map(err => {
      return {
        'رقم الصف': err.rowNumber,
        'اسم المنتج': err.productName,
        'الباركود': err.barcode || '-',
        'سبب الخطأ': err.reason,
        ...err.originalData,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'أخطاء الاستيراد');
    return workbook;
  }

  /**
   * Triggers download of an XLSX workbook in the browser.
   */
  static downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(workbook, filename);
  }
}
