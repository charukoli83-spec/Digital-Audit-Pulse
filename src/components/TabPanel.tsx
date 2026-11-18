import { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  FileEdit,
  HelpCircle,
  ListChecks,
  MapPin,
  Search,
  Tags,
  XCircle,
} from 'lucide-react';
import type { AuditReport, AuditStatus } from '../types/audit';
import { ChecklistView } from './ChecklistView';
import { KeywordTable } from './KeywordTable';

type TabId = 'seo' | 'content' | 'keywords' | 'technical' | 'ai_search';

interface TabPanelProps {
  report: AuditReport;
  completedChecklistItems: string[];
  onToggleChecklistItem: (itemKey: string) => void;
}

function StatusBadge({ status }: { status: AuditStatus }) {
  if (status === 'Pass') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Pass</span>
      </span>
    );
  }
  if (status === 'Warning') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Warning</span>
      </span>
    );
  }
  if (status === 'Fail') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Fail</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <HelpCircle className="h-3.5 w-3.5 shrink-0" />
      <span>Could not verify</span>
    </span>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export function TabPanel({
  report,
  completedChecklistItems,
  onToggleChecklistItem,
}: TabPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('seo');

  const tabs: Array<{ id: TabId; label: string; icon: typeof Search; count?: number }> = [
    { id: 'seo', label: 'SEO Audit', icon: Search, count: report.seoChecks.length },
    {
      id: 'content',
      label: 'Content',
      icon: FileEdit,
      count: report.contentRecommendations.ideas.length,
    },
    { id: 'keywords', label: 'Keywords', icon: Tags, count: report.keywords.length },
    {
      id: 'technical',
      label: 'Technical Checklist',
      icon: ListChecks,
      count: report.technicalChecklist.length,
    },
    { id: 'ai_search', label: 'AI Search', icon: Bot },
  ];

  return (
    <section
      aria-label="Detailed audit sections"
      className="mt-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Tab Navigation Bar */}
      <div
        role="tablist"
        aria-label="Audit categories"
        className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-3 dark:border-slate-800 sm:px-6"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 ${
                selected
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'seo' && (
          <div
            role="tabpanel"
            id="panel-seo"
            aria-labelledby="tab-seo"
            className="animate-tab-in space-y-6"
          >
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                On-Page SEO Checks
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Evidence-based inspection of core HTML metadata, structure, links, and social tags
              </p>
            </div>

            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {report.seoChecks.map((check, i) => (
                <div key={`${check.item}-${i}`} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {check.item}
                    </h3>
                    <StatusBadge status={check.status} />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3 md:gap-6">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        What was found
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-200">
                        {check.finding}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Why it matters
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
                        {check.whyItMatters}
                      </p>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        How to fix
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-200">
                        {check.fix}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {report.localSeo?.applicable && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Local SEO Signals · {report.localSeo.location}
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Google Business Profile Signals
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {report.localSeo.gbpSignals}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      NAP Consistency (Name, Address, Phone)
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {report.localSeo.napConsistency}
                    </p>
                  </div>
                </div>

                {report.localSeo.localKeywords?.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Local Keyword Opportunities
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {report.localSeo.localKeywords.join('  ·  ')}
                    </p>
                  </div>
                )}

                {report.localSeo.recommendations?.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    {report.localSeo.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-2 h-1 w-1 rounded-full bg-indigo-500 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div
            role="tabpanel"
            id="panel-content"
            aria-labelledby="tab-content"
            className="animate-tab-in space-y-8"
          >
            {/* Rewrite Suggestions */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                    Current Page Rewrite Suggestions
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Optimized title tag, meta description, and H1 with live character counts
                  </p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {[
                  {
                    label: 'Title Tag',
                    ideal: 'Ideal: 50–60 chars',
                    current: report.contentRecommendations.rewrites.currentTitle,
                    suggested: report.contentRecommendations.rewrites.title,
                  },
                  {
                    label: 'Meta Description',
                    ideal: 'Ideal: 140–155 chars',
                    current: report.contentRecommendations.rewrites.currentMetaDescription,
                    suggested: report.contentRecommendations.rewrites.metaDescription,
                  },
                  {
                    label: 'Primary H1 Heading',
                    ideal: 'Ideal: 20–70 chars',
                    current: report.contentRecommendations.rewrites.currentH1,
                    suggested: report.contentRecommendations.rewrites.h1,
                  },
                ].map((rw) => (
                  <div key={rw.label} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {rw.label}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {rw.suggested.length} chars
                        </span>
                        <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{rw.ideal}</span>
                      </div>
                      <CopyButton text={rw.suggested} />
                    </div>

                    {rw.current && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Observed:</span> {rw.current}
                      </p>
                    )}

                    <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {rw.suggested}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Gap Analysis */}
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Content Gap Analysis
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                High-intent topics your prospective customers search for that are missing or thin
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {report.contentRecommendations.gaps.map((gap, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
                  >
                    <span className="mt-0.5 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      0{i + 1}
                    </span>
                    <span className="leading-relaxed">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 8-10 Specific Content Ideas */}
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Recommended Content Ideas ({report.contentRecommendations.ideas.length})
              </h2>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                        <th className="px-4 py-3">Working Title</th>
                        <th className="px-3 py-3">Target Keyword</th>
                        <th className="px-3 py-3">Intent</th>
                        <th className="px-3 py-3">Format</th>
                        <th className="px-4 py-3">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.contentRecommendations.ideas.map((idea, i) => (
                        <tr
                          key={i}
                          className="border-t border-slate-100 text-sm dark:border-slate-800/80"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {idea.title}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                            {idea.keyword}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {idea.intent}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {idea.format}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">
                            <span
                              className={
                                idea.priority === 'High'
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : idea.priority === 'Medium'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-slate-500 dark:text-slate-400'
                              }
                            >
                              {idea.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 30-Day Content Calendar */}
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  30-Day Content Calendar
                </h2>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {report.contentRecommendations.calendar.map((entry, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {entry.week}
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                      {entry.topic}
                    </p>
                    {entry.format && (
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Format: {entry.format}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div
            role="tabpanel"
            id="panel-keywords"
            aria-labelledby="tab-keywords"
            className="animate-tab-in"
          >
            <KeywordTable report={report} />
          </div>
        )}

        {activeTab === 'technical' && (
          <div
            role="tabpanel"
            id="panel-technical"
            aria-labelledby="tab-technical"
            className="animate-tab-in"
          >
            <ChecklistView
              report={report}
              completedKeys={completedChecklistItems}
              onToggleItem={onToggleChecklistItem}
            />
          </div>
        )}

        {activeTab === 'ai_search' && (
          <div
            role="tabpanel"
            id="panel-ai_search"
            aria-labelledby="tab-ai_search"
            className="animate-tab-in space-y-8"
          >
            {/* AI Search Overview Header */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  AI Search & Answer-Engine Readiness
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Evaluates how easily your site can be retrieved, understood, and cited by Google AI
                  Overviews, ChatGPT, Perplexity, Gemini, and Microsoft Copilot.
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {report.aiSearch.score}
                  <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  AI Citation Readiness
                </div>
              </div>
            </div>

            {/* 9 Factor Breakdown */}
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Signal Evaluation ({report.aiSearch.factors.length} Factors)
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {report.aiSearch.factors.map((factor, i) => {
                  const tone =
                    factor.score < 50
                      ? 'text-rose-600 dark:text-rose-400'
                      : factor.score < 75
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400';

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {factor.name}
                        </h4>
                        <span className={`font-mono text-sm font-bold tabular-nums ${tone}`}>
                          {factor.score}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {factor.finding}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 8-10 Concrete AI Search Recommendations with Examples */}
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Actionable Recommendations & Implementation Snippets
              </h3>
              <div className="mt-3 space-y-4">
                {report.aiSearch.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {i + 1}. {rec.title}
                      </h4>
                      <span
                        className={`text-xs font-semibold ${
                          rec.impact === 'High'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {rec.description}
                    </p>

                    {rec.example && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5 dark:border-slate-800">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Ready-to-use example
                          </span>
                          <CopyButton text={rec.example} label="Copy snippet" />
                        </div>
                        <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {rec.example}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 10 Sample AI Questions */}
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Sample Customer AI Prompts & Answer Coverage
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                10 questions a customer might ask an AI assistant where this business should appear
              </p>

              <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {report.aiSearch.sampleQuestions.map((sq, i) => (
                  <div key={i} className="p-3.5 sm:px-4">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          “{sq.question}”
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {sq.coverage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
