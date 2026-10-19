/**
 * @fileOverview Number, Currency, and Barcode Formatting Utilities for DUBSAR Print Templates.
 * Ensures consistent ASCII digits (0-9), preventing Arabic-Indic numeral mixing or LTR/RTL glitched text.
 */

/**
 * Converts any Eastern Arabic digits (٠-٩) to standard ASCII 0-9 digits.
 */
export function toAsciiDigits(str: any): string {
  if (str === undefined || str === null) return '';
  const s = String(str);
  return s.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

/**
 * Formats a number with comma thousand separators and standard 0-9 digits.
 */
export function formatNumber(val: number | string | undefined | null, defaultValue: number = 0): string {
  if (val === undefined || val === null || val === '') {
    return defaultValue.toLocaleString('en-US');
  }
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) {
    return defaultValue.toLocaleString('en-US');
  }
  return num.toLocaleString('en-US');
}

/**
 * Formats a currency amount with currency symbol/code.
 */
export function formatCurrency(val: number | string | undefined | null, currency: string = 'د.ع'): string {
  const curSymbol = currency === 'USD' ? '$' : currency === 'IQD' ? 'د.ع' : currency || 'د.ع';
  return `${formatNumber(val)} ${curSymbol}`;
}

/**
 * Converts any raw invoice number or ID into a clean sequence number:
 * e.g., 1 -> "0001", 42 -> "0042", "INV-1001" -> "0001", "INV-1034" -> "0034".
 * Never displays internal UUIDs, timestamps, or raw GUIDs to the user.
 */
export function formatDisplayInvoiceNumber(rawNumber: any): string {
  if (rawNumber === undefined || rawNumber === null || rawNumber === '') {
    return '0001';
  }

  const str = String(rawNumber).trim();

  // Already 4+ digit pure sequence (e.g. "0001", "0042")
  if (/^\d{4}$/.test(str)) {
    return str;
  }

  // Pure number < 1000 (e.g. "1", "25") -> pad to 4 digits
  if (/^\d{1,3}$/.test(str)) {
    return str.padStart(4, '0');
  }

  // Extract numbers from prefixed IDs like "INV-1001", "POS-0005", "INV-1"
  const digitMatch = str.match(/\d+/g);
  if (digitMatch && digitMatch.length > 0) {
    const lastDigits = digitMatch[digitMatch.length - 1];
    const parsed = parseInt(lastDigits, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // If it was based on old DUBSAR starting offset 1000 (e.g. 1001 -> 1, 1034 -> 34)
      if (parsed >= 1001 && parsed <= 1999 && (str.startsWith('INV-') || str.startsWith('POS-') || str.startsWith('10'))) {
        return String(parsed - 1000).padStart(4, '0');
      }
      if (parsed < 10000) {
        return String(parsed).padStart(4, '0');
      }
    }
  }

  // If it's a UUID or timestamp, produce a deterministic 4-digit sequence
  if (str.length > 10 || str.includes('-')) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const seq = (Math.abs(hash) % 9999) + 1;
    return String(seq).padStart(4, '0');
  }

  return str.padStart(4, '0');
}

/**
 * Vector Code128 Barcode Generator (Subset B)
 * High performance, crisp vector SVG with zero external dependencies.
 */
export function generateCode128Svg(code: string, height: number = 34): string {
  if (!code) code = '0001';

  const patterns: string[] = [
    '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
    '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
    '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
    '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
    '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
    '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
    '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
    '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
  ];

  let checksum = 104;
  const indices: number[] = [104];

  for (let i = 0; i < code.length; i++) {
    const codePoint = code.charCodeAt(i);
    const charCode = codePoint >= 32 && codePoint <= 126 ? codePoint - 32 : 0;
    indices.push(charCode);
    checksum += charCode * (i + 1);
  }

  indices.push(checksum % 103);
  indices.push(106); // Stop code

  let bars = '';
  for (const idx of indices) {
    bars += patterns[idx] || '212222';
  }

  let svgBars = '';
  let x = 0;
  for (let i = 0; i < bars.length; i++) {
    const width = parseInt(bars[i], 10);
    if (i % 2 === 0) {
      svgBars += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000000" />`;
    }
    x += width;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; display: block;">${svgBars}</svg>`;
}
