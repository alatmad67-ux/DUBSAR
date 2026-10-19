/**
 * @fileOverview Shared CSS Styles and Print Reset Rules for DUBSAR Print Templates.
 */

export const SHARED_PRINT_RESET = `
  /* Global CSS Reset for High-Fidelity Printing */
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin: 0;
    padding: 0;
  }

  :root {
    --dubsar-navy: #13293d;
    --dubsar-blue: #006494;
    --dubsar-gold: #d4af37;
    --dubsar-slate: #f8fafc;
    --dubsar-border: #cbd5e1;
    --dubsar-dark: #0f172a;
    --dubsar-muted: #64748b;
  }

  body {
    font-family: 'Cairo', Tahoma, Arial, sans-serif;
    background: #ffffff;
    color: #0f172a;
    direction: rtl;
    -webkit-font-smoothing: antialiased;
  }

  .font-mono {
    font-family: 'Courier New', Courier, monospace;
  }

  .num-ltr {
    direction: ltr !important;
    unicode-bidi: isolate;
  }

  span.num-ltr, div.num-ltr {
    display: inline-block;
  }

  td.num-ltr, th.num-ltr {
    display: table-cell !important;
    direction: ltr !important;
  }

  .bold {
    font-weight: 700;
  }

  .bolder {
    font-weight: 800;
  }

  .tabular {
    font-variant-numeric: tabular-nums;
  }

  /* Minimal Unobtrusive DUBSAR Brand Footer */
  .dubsar-minimal-footer {
    text-align: center;
    font-size: 8px;
    color: #64748b;
    opacity: 0.55;
    margin-top: 10px;
    padding-top: 4px;
    user-select: none;
    clear: both;
    border: none !important;
    background: transparent !important;
  }

  .dubsar-footer-dot {
    margin: 0 4px;
    color: #94a3b8;
  }

  /* Page Break Control */
  .page-break-avoid {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  @media print {
    @page {
      margin: 0 !important;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;
