import { History, Moon, Plus, RefreshCw, Sun } from 'lucide-react';
import type { AuditReport } from '../types/audit';
import { formatAuditDate, getDisplayHost } from '../utils/url';
import { ReportExporter } from './ReportExporter';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeReport: AuditReport | null;
  completedChecklistItems: string[];
  historyCount: number;
  onOpenHistory: () => void;
  onNewAudit: () => void;
  onReaudit: () => void;
  isAuditing: boolean;
}

export function Header({
  theme,
  onToggleTheme,
  activeReport,
  completedChecklistItems,
  historyCount,
  onOpenHistory,
  onNewAudit,
  onReaudit,
  isAuditing,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 print:hidden">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Wordmark + Contextual Audit Breadcrumb */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onNewAudit}
            className="font-display text-lg font-bold tracking-tight text-slate-900 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-100 dark:hover:text-indigo-400 whitespace-nowrap shrink-0"
          >
            AuditPilot
          </button>

          {activeReport && (
            <div className="hidden min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400 md:flex">
              <span aria-hidden="true">/</span>
              <span className="max-w-[260px] truncate font-mono text-slate-700 dark:text-slate-200">
                {getDisplayHost(activeReport.url)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0 tabular-nums">
                {formatAuditDate(activeReport.auditDate)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeReport && (
            <>
              <button
                type="button"
                onClick={onReaudit}
                disabled={isAuditing}
                title="Re-run audit and compare against this snapshot"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                Re-audit
              </button>

              <ReportExporter
                report={activeReport}
                completedChecklistItems={completedChecklistItems}
              />

              <button
                type="button"
                onClick={onNewAudit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New audit</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenHistory}
            aria-label={`Open saved audits (${historyCount})`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <History className="h-3.5 w-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                ({historyCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white shrink-0"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile secondary bar for active audit URL */}
      {activeReport && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-1.5 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400 md:hidden">
          <span className="truncate font-mono text-slate-700 dark:text-slate-200">
            {getDisplayHost(activeReport.url)}
          </span>
          <span className="whitespace-nowrap shrink-0 tabular-nums">
            {formatAuditDate(activeReport.auditDate)}
          </span>
        </div>
      )}
    </header>
  );
}
