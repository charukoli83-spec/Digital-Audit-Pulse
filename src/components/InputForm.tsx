import { useState, type FormEvent } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Clock, Globe, Trash2 } from 'lucide-react';
import type { AuditContextInput, PrimaryGoal, SavedAudit } from '../types/audit';
import { formatAuditDate, getDisplayHost, validateAndNormalizeUrl } from '../utils/url';

interface InputFormProps {
  onSubmit: (url: string, context: AuditContextInput) => void;
  isLoading: boolean;
  history: SavedAudit[];
  onSelectSaved: (saved: SavedAudit) => void;
  onDeleteSaved: (id: string) => void;
  initialUrl?: string;
}

const EXAMPLE_URLS = [
  { label: 'stripe.com', url: 'https://stripe.com' },
  { label: 'linear.app', url: 'https://linear.app' },
  { label: 'vercel.com', url: 'https://vercel.com' },
];

export function InputForm({
  onSubmit,
  isLoading,
  history,
  onSelectSaved,
  onDeleteSaved,
  initialUrl = '',
}: InputFormProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);

  const [businessType, setBusinessType] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [targetLanguages, setTargetLanguages] = useState('');
  const [competitorsRaw, setCompetitorsRaw] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('leads');

  function buildContext(): AuditContextInput {
    const competitors = competitorsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    return {
      businessType: businessType.trim() || undefined,
      targetLocation: targetLocation.trim() || undefined,
      targetLanguages: targetLanguages.trim() || undefined,
      competitors: competitors.length > 0 ? competitors : undefined,
      primaryGoal: showContext ? primaryGoal : undefined,
    };
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const check = validateAndNormalizeUrl(urlInput);
    if (!check.valid) {
      setUrlError(check.error || 'Please enter a valid URL.');
      return;
    }
    setUrlError(null);
    setUrlInput(check.url);
    onSubmit(check.url, buildContext());
  }

  function handleExampleClick(exampleUrl: string) {
    setUrlInput(exampleUrl);
    setUrlError(null);
    onSubmit(exampleUrl, buildContext());
  }

  return (
    <div className="mx-auto max-w-[920px] px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl text-balance">
          AuditPilot: AI Digital Marketing Audit
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg leading-relaxed">
          Enter any public website URL to generate an evidence-based SEO audit, keyword plan,
          technical checklist, content roadmap, and AI search readiness score in under a minute.
        </p>
      </div>

      {/* Main URL form card */}
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7"
      >
        <label
          htmlFor="audit-url-input"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Website URL
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative flex-1">
            <Globe
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="audit-url-input"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (urlError) setUrlError(null);
              }}
              placeholder="https://yourcompany.com"
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? 'audit-url-error' : 'audit-url-note'}
              className={`h-12 w-full rounded-xl border bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 ${
                urlError
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-700 dark:focus:border-indigo-400'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 whitespace-nowrap shrink-0"
          >
            <span>Analyze website</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {urlError && (
          <p
            id="audit-url-error"
            role="alert"
            className="mt-2.5 text-sm font-medium text-rose-600 dark:text-rose-400"
          >
            {urlError}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Try an example:</span>
            {EXAMPLE_URLS.map((example) => (
              <button
                key={example.url}
                type="button"
                onClick={() => handleExampleClick(example.url)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 whitespace-nowrap shrink-0"
              >
                {example.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowContext((prev) => !prev)}
            aria-expanded={showContext}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 whitespace-nowrap shrink-0"
          >
            <span>Add context</span>
            {showContext ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Collapsible context panel */}
        {showContext && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ctx-business-type"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Business type
              </label>
              <input
                id="ctx-business-type"
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g., B2B SaaS, Dental clinic, Specialty coffee"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="ctx-location"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Target country or city
              </label>
              <input
                id="ctx-location"
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="e.g., Austin, TX or United Kingdom"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="ctx-languages"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Target language(s)
              </label>
              <input
                id="ctx-languages"
                type="text"
                value={targetLanguages}
                onChange={(e) => setTargetLanguages(e.target.value)}
                placeholder="e.g., English, Spanish"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="ctx-goal"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Primary goal
              </label>
              <select
                id="ctx-goal"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value as PrimaryGoal)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                <option value="leads">Generate qualified leads</option>
                <option value="sales">Increase online sales</option>
                <option value="traffic">Grow organic search traffic</option>
                <option value="brand_awareness">Build brand awareness</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="ctx-competitors"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Competitor URLs (2 to 3, comma or newline separated)
              </label>
              <input
                id="ctx-competitors"
                type="text"
                value={competitorsRaw}
                onChange={(e) => setCompetitorsRaw(e.target.value)}
                placeholder="https://competitor1.com, https://competitor2.com"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>
          </div>
        )}

        <p
          id="audit-url-note"
          className="mt-4 border-t border-slate-100 pt-3.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"
        >
          Scores are AI-estimated from the live page and public search data.
        </p>
      </form>

      {/* What's included overview */}
      <div className="mt-10 grid grid-cols-1 gap-6 border-t border-slate-200 pt-8 dark:border-slate-800 sm:grid-cols-3">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            SEO & Technical Hygiene
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Checks on-page tags, schema markup, canonicals, crawlability, and estimated Core Web Vitals.
          </p>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Keywords & Content Plan
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Delivers 20–30 clustered keyword opportunities, title/meta rewrites, and a 30-day calendar.
          </p>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            AI Search Readiness
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Evaluates visibility across Google AI Overviews, ChatGPT, Perplexity, Gemini, and Copilot.
          </p>
        </div>
      </div>

      {/* Recent Audits in localStorage */}
      {history.length > 0 && (
        <section className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent audits
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Saved locally ({history.length} of 10)
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {history.slice(0, 5).map((item) => {
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
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSaved(item)}
                    className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                        {getDisplayHost(item.report.url)}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="tabular-nums">{formatAuditDate(item.report.auditDate)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.report.scores.seo} SEO · {item.report.scores.aiSearch} AI</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-display text-lg font-bold tabular-nums ${scoreTone}`}>
                        {score}
                      </span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteSaved(item.id)}
                    aria-label={`Delete audit for ${getDisplayHost(item.report.url)}`}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-rose-400 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
