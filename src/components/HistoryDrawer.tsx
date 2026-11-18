import { useEffect } from 'react';
import { Clock, Trash2, X } from 'lucide-react';
import type { SavedAudit } from '../types/audit';
import { formatAuditDate, getDisplayHost } from '../utils/url';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  history: SavedAudit[];
  activeAuditId?: string;
  onSelect: (audit: SavedAudit) => void;
  onDelete: (id: string) => void;
}

export function HistoryDrawer({
  open,
  onClose,
  history,
  activeAuditId,
  onSelect,
  onDelete,
}: HistoryDrawerProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px] print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Saved audit history"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Saved Audits
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last 10 audits stored locally in your browser
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved audits"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No saved audits yet. Run your first audit to save a snapshot here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item) => {
                const isActive = item.id === activeAuditId;
                const score = item.report.scores.overall;
                const scoreTone =
                  score < 50
                    ? 'text-rose-600 dark:text-rose-400'
                    : score < 75
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400';

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-950/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none"
                    >
                      <div className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {getDisplayHost(item.report.url)}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="tabular-nums">
                          {formatAuditDate(item.report.auditDate)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Overall {score}/100</span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-display text-lg font-bold tabular-nums ${scoreTone}`}>
                        {score}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        aria-label={`Delete audit for ${getDisplayHost(item.report.url)}`}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
