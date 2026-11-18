import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import type { AuditReport, AuditStatus, TechnicalChecklistItem } from '../types/audit';
import { downloadChecklistCsv } from '../utils/export';

interface ChecklistViewProps {
  report: AuditReport;
  completedKeys: string[];
  onToggleItem: (itemKey: string) => void;
}

function StatusLabel({ status }: { status: AuditStatus }) {
  if (status === 'Pass') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Pass</span>
      </span>
    );
  }
  if (status === 'Warning') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Warning</span>
      </span>
    );
  }
  if (status === 'Fail') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Fail</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
      <span>Could not verify</span>
    </span>
  );
}

export function ChecklistView({
  report,
  completedKeys,
  onToggleItem,
}: ChecklistViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');

  const completedSet = useMemo(() => new Set(completedKeys), [completedKeys]);

  const indexedItems = useMemo(
    () =>
      report.technicalChecklist.map((item, idx) => ({
        ...item,
        key: `${item.group}::${item.item}::${idx}`,
      })),
    [report.technicalChecklist]
  );

  const totalCount = indexedItems.length;
  const completedCount = indexedItems.filter((item) => completedSet.has(item.key)).length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const grouped = useMemo(() => {
    const filtered = indexedItems.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (severityFilter !== 'All' && item.severity !== severityFilter) return false;
      return true;
    });

    const map = new Map<string, Array<TechnicalChecklistItem & { key: string }>>();
    filtered.forEach((item) => {
      const groupName = item.group || 'General';
      if (!map.has(groupName)) map.set(groupName, []);
      map.get(groupName)!.push(item);
    });
    return Array.from(map.entries());
  }, [indexedItems, statusFilter, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Progress & Filter Header */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Remediation Progress
              </h3>
              <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {completedCount} of {totalCount} done ({percentComplete}%)
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
              role="progressbar"
              aria-valuenow={percentComplete}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Technical checklist completion percentage"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              aria-label="Filter checklist by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="All">All statuses</option>
              <option value="Fail">Fail</option>
              <option value="Warning">Warning</option>
              <option value="Pass">Pass</option>
              <option value="Could not verify">Could not verify</option>
            </select>

            <select
              aria-label="Filter checklist by severity"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="All">All severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button
              type="button"
              onClick={() => downloadChecklistCsv(report, completedKeys)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Checklists */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No technical checklist items match your selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([groupName, items]) => (
            <div
              key={groupName}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {groupName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {items.filter((i) => completedSet.has(i.key)).length}/{items.length} done
                </span>
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => {
                  const checked = completedSet.has(item.key);
                  const severityColor =
                    item.severity === 'Critical'
                      ? 'text-rose-700 dark:text-rose-400 font-semibold'
                      : item.severity === 'High'
                      ? 'text-amber-700 dark:text-amber-400 font-medium'
                      : 'text-slate-500 dark:text-slate-400';

                  return (
                    <li key={item.key} className="px-4 py-3.5 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleItem(item.key)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${
                                checked
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {item.item}
                            </span>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <StatusLabel status={item.status} />
                              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                                ·
                              </span>
                              <span className={`text-xs ${severityColor}`}>
                                {item.severity} severity
                              </span>
                            </div>
                          </div>

                          <p
                            className={`mt-1 text-xs leading-relaxed ${
                              checked
                                ? 'text-slate-400 dark:text-slate-500'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.fix}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
