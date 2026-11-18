import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
} from 'lucide-react';
import type { AuditReport } from '../types/audit';
import {
  buildShortSummaryText,
  downloadAuditJson,
  downloadChecklistCsv,
  downloadKeywordsCsv,
  downloadMarkdownReport,
} from '../utils/export';

interface ReportExporterProps {
  report: AuditReport;
  completedChecklistItems: string[];
}

export function ReportExporter({ report, completedChecklistItems }: ReportExporterProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedAction, setCopiedAction] = useState<'copy' | 'share' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  async function handleCopySummary(kind: 'copy' | 'share') {
    const text = buildShortSummaryText(report);
    try {
      if (kind === 'share' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `AuditPilot Report: ${report.url}`,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopiedAction(kind);
      setTimeout(() => setCopiedAction(null), 2200);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedAction(kind);
        setTimeout(() => setCopiedAction(null), 2200);
      } catch {
        // Ignore clipboard denial
      }
    }
  }

  function handlePrintPdf() {
    setMenuOpen(false);
    setTimeout(() => {
      window.print();
    }, 80);
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleCopySummary('copy')}
        aria-label="Copy short score summary"
        className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
      >
        {copiedAction === 'copy' ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copy summary</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => handleCopySummary('share')}
        aria-label="Share audit summary"
        className="hidden xl:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
      >
        {copiedAction === 'share' ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Shared</span>
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Download report</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 z-40"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handlePrintPdf}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <div>PDF Report</div>
              <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Multi-page print-ready document
              </div>
            </div>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadKeywordsCsv(report);
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Keywords (CSV)</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadChecklistCsv(report, completedChecklistItems);
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Technical Checklist (CSV)</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadMarkdownReport(report);
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Markdown Report (.md)</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              downloadAuditJson(report);
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileCode2 className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Full Raw Audit (.json)</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800 lg:hidden" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              handleCopySummary('copy');
              setMenuOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
          >
            <Copy className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Copy Summary</span>
          </button>
        </div>
      )}
    </div>
  );
}
