'use client';

import React, { useEffect, useState } from 'react';

export function GlobalErrorCatcher() {
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    // Check if previous crash log exists in localStorage
    const savedLog = localStorage.getItem('dubsar_last_fatal_error');
    if (savedLog) {
      console.error("[PREVIOUS CRASH DETECTED]", savedLog);
    }

    const captureError = (msg: string, url?: string, line?: number, col?: number, errorObj?: any) => {
      const fullDetails = [
        `=== DUBSAR 2.0 FATAL ERROR DIAGNOSIS ===`,
        `Time: ${new Date().toISOString()}`,
        `URL: ${url || window.location.href}`,
        `Line: ${line || 'N/A'}, Column: ${col || 'N/A'}`,
        `Message: ${msg}`,
        `Stack Trace:`,
        errorObj?.stack || (new Error().stack) || 'No stack trace available',
        `=======================================`
      ].join('\n');

      console.error(fullDetails);
      setErrorDetails(fullDetails);

      try {
        localStorage.setItem('dubsar_last_fatal_error', fullDetails);
      } catch (e) {}

      // Try invoking tauri log_audit to persist in SQLite if possible
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        import('@tauri-apps/api/core').then(({ invoke }) => {
          invoke('log_audit', {
            action: 'FATAL_CLIENT_CRASH',
            details: fullDetails.slice(0, 1000),
            user: 'DIAGNOSTIC_LOGGER',
            module: 'SYSTEM_CRASH'
          }).catch(() => {});
        }).catch(() => {});
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      captureError(event.message, event.filename, event.lineno, event.colno, event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      captureError(`Unhandled Promise Rejection: ${message}`, window.location.href, undefined, undefined, reason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!errorDetails) return null;

  return (
    <div 
      className="fixed inset-0 z-[999999] bg-slate-950 text-red-400 p-6 overflow-auto font-mono text-xs select-text"
      dir="ltr"
    >
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-red-950/80 border border-red-500 p-4 rounded-xl text-red-200">
          <h1 className="text-base font-bold text-red-400 mb-1">DUBSAR 2.0 - FATAL CLIENT EXCEPTION CAPTURED</h1>
          <p className="text-xs">The application caught an unhandled client-side exception after login/navigation.</p>
        </div>
        <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl whitespace-pre-wrap break-all text-slate-200 leading-relaxed">
          {errorDetails}
        </pre>
        <button 
          onClick={() => { localStorage.removeItem('dubsar_last_fatal_error'); setErrorDetails(null); }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
        >
          Dismiss Overlay
        </button>
      </div>
    </div>
  );
}
