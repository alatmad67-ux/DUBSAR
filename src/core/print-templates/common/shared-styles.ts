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
    --dubsar-navy: #000000;
    --dubsar-blue: #000000;
    --dubsar-gold: #000000;
    --dubsar-slate: #ffffff;
    --dubsar-border: #000000;
    --dubsar-dark: #000000;
    --dubsar-muted: #000000;
  }

  body {
    font-family: 'Cairo', Tahoma, Arial, sans-serif;
    background: #ffffff;
    color: #000000;
    direction: rtl;
    -webkit-font-smoothing: antialiased;
  }

  /* Monochrome High-Contrast Print Rules */
  *, td, th, span, div, p, strong, b, h1, h2, h3, h4 {
    color: #000000;
  }

  th, .badge-white, .a4-info-badge, .grand-total, .rec-title-box {
    color: #ffffff !important;
  }

  .font-mono {
    font-family: 'Courier New', Courier, monospace;
    color: #000000;
  }

  .num-ltr {
    direction: ltr !important;
    unicode-bidi: isolate;
    color: #000000;
  }

  span.num-ltr, div.num-ltr {
    display: inline-block;
    color: #000000;
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
    color: #000000;
    margin-top: 10px;
    padding-top: 4px;
    user-select: none;
    clear: both;
    border: none !important;
    background: transparent !important;
  }

  .dubsar-footer-dot {
    margin: 0 4px;
    color: #000000;
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
      color: #000000 !important;
      background: #ffffff !important;
    }
    .no-print {
      display: none !important;
    }
    *, td, th, span, div, p, strong, b, h1, h2, h3, h4, span.num-ltr, td.num-ltr {
      color: #000000 !important;
      -webkit-text-fill-color: #000000 !important;
    }
    th, .a4-info-badge, .grand-total, .rec-title-box {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      background: #000000 !important;
    }
    * {
      border-color: #000000 !important;
    }
  }
`;
