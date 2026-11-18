import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { FollowUpChat } from './components/FollowUpChat';
import { Header } from './components/Header';
import { HistoryDrawer } from './components/HistoryDrawer';
import { InputForm } from './components/InputForm';
import { LoadingAudit } from './components/LoadingAudit';
import { PrintReport } from './components/PrintReport';
import { ScoreOverview } from './components/ScoreOverview';
import { TabPanel } from './components/TabPanel';
import type { AuditContextInput, AuditReport, SavedAudit } from './types/audit';
import {
  computeScoreDeltas,
  deleteAuditFromHistory,
  findPreviousAuditForUrl,
  loadAuditHistory,
  loadThemePreference,
  saveAuditToHistory,
  saveThemePreference,
  toggleChecklistItemInHistory,
} from './utils/storage';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());
  const [history, setHistory] = useState<SavedAudit[]>(() => loadAuditHistory());
  const [activeAudit, setActiveAudit] = useState<SavedAudit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditingUrl, setAuditingUrl] = useState('');
  const [lastAttempt, setLastAttempt] = useState<{
    url: string;
    context: AuditContextInput;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  const scoreDeltas = useMemo(() => {
    if (!activeAudit) return null;
    const previous = findPreviousAuditForUrl(
      history,
      activeAudit.id,
      activeAudit.report.url
    );
    return computeScoreDeltas(activeAudit.report, previous);
  }, [activeAudit, history]);

  async function runAudit(url: string, context: AuditContextInput) {
    setIsAuditing(true);
    setAuditingUrl(url);
    setLastAttempt({ url, context });
    setErrorMessage(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, context }),
      });

      const data = (await res.json()) as { report?: AuditReport; error?: string };
      if (!res.ok || !data.report) {
        throw new Error(
          data.error || 'Unable to complete the audit for this URL. Please try again.'
        );
      }

      const { saved, history: nextHistory } = saveAuditToHistory(data.report, context);
      setHistory(nextHistory);
      setActiveAudit(saved);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while auditing this website.';
      setErrorMessage(msg);
    } finally {
      setIsAuditing(false);
    }
  }

  function handleSelectSaved(saved: SavedAudit) {
    setErrorMessage(null);
    setIsAuditing(false);
    setActiveAudit(saved);
  }

  function handleDeleteSaved(id: string) {
    const next = deleteAuditFromHistory(id);
    setHistory(next);
    if (activeAudit?.id === id) {
      setActiveAudit(null);
    }
  }

  function handleToggleChecklistItem(itemKey: string) {
    if (!activeAudit) return;
    const nextHistory = toggleChecklistItemInHistory(activeAudit.id, itemKey);
    setHistory(nextHistory);
    const updated = nextHistory.find((item) => item.id === activeAudit.id);
    if (updated) {
      setActiveAudit(updated);
    }
  }

  function handleNewAudit() {
    setErrorMessage(null);
    setIsAuditing(false);
    setActiveAudit(null);
  }

  function handleReaudit() {
    if (!activeAudit) return;
    runAudit(activeAudit.report.url, activeAudit.context ?? {});
  }

  function handleRetry() {
    if (!lastAttempt) return;
    runAudit(lastAttempt.url, lastAttempt.context);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        activeReport={activeAudit?.report ?? null}
        completedChecklistItems={activeAudit?.completedChecklistItems ?? []}
        historyCount={history.length}
        onOpenHistory={() => setHistoryOpen(true)}
        onNewAudit={handleNewAudit}
        onReaudit={handleReaudit}
        isAuditing={isAuditing}
      />

      <main className="print:hidden">
        {isAuditing ? (
          <LoadingAudit targetUrl={auditingUrl} />
        ) : errorMessage ? (
          <div className="mx-auto max-w-[680px] px-4 py-16 sm:px-6">
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-white p-6 dark:border-rose-900/60 dark:bg-slate-900"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div className="flex-1">
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    Audit could not be completed
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {errorMessage}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {lastAttempt && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Try again</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeAudit ? (
          <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
            <ScoreOverview
              report={activeAudit.report}
              deltas={scoreDeltas}
              theme={theme}
            />
            <TabPanel
              report={activeAudit.report}
              completedChecklistItems={activeAudit.completedChecklistItems}
              onToggleChecklistItem={handleToggleChecklistItem}
            />
            <FollowUpChat key={activeAudit.id} report={activeAudit.report} />
          </div>
        ) : (
          <InputForm
            onSubmit={runAudit}
            isLoading={isAuditing}
            history={history}
            onSelectSaved={handleSelectSaved}
            onDeleteSaved={handleDeleteSaved}
            initialUrl={lastAttempt?.url ?? ''}
          />
        )}
      </main>

      {activeAudit && (
        <PrintReport
          report={activeAudit.report}
          completedChecklistItems={activeAudit.completedChecklistItems}
        />
      )}

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        activeAuditId={activeAudit?.id}
        onSelect={handleSelectSaved}
        onDelete={handleDeleteSaved}
      />

      <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 print:hidden">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          AuditPilot · AI-generated estimates from live page context and public search data.
        </div>
      </footer>
    </div>
  );
}
