import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { getDisplayHost } from '../utils/url';

const LOADING_STEPS = [
  'Reading your page',
  'Checking technical signals',
  'Researching keywords',
  'Evaluating AI search readiness',
  'Building your report',
];

interface LoadingAuditProps {
  targetUrl: string;
}

export function LoadingAudit({ targetUrl }: LoadingAuditProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Progress Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Live audit in progress
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Auditing <span className="font-mono">{getDisplayHost(targetUrl)}</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Inspecting live page context and public search results. Typically completes in 20–45 seconds.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="tabular-nums">
              Step {stepIndex + 1} of {LOADING_STEPS.length}
            </span>
          </div>
        </div>

        {/* 5-step stepper */}
        <ol
          aria-label="Audit progress steps"
          className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-5"
        >
          {LOADING_STEPS.map((label, idx) => {
            const done = idx < stepIndex;
            const current = idx === stepIndex;
            return (
              <li
                key={label}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                  done
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : current
                    ? 'border-indigo-300 bg-indigo-50/80 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200'
                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold shrink-0 tabular-nums">
                  {done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : current ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </span>
                <span className="truncate">{label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Skeleton layout matching ScoreOverview & Tabs */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12" aria-hidden="true">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="mx-auto mt-5 h-4 w-44 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mx-auto mt-2.5 h-3 w-64 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
          {[0, 1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-6 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" aria-hidden="true">
        <div className="flex gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          {[0, 1, 2, 3, 4].map((t) => (
            <div key={t} className="h-8 w-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-12 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
