import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Info,
  Minus,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { AuditReport, ScoreDeltas } from '../types/audit';
import { formatAuditDate, getGaugeTier, getScoreLabel } from '../utils/url';

interface ScoreOverviewProps {
  report: AuditReport;
  deltas: ScoreDeltas | null;
  theme: 'light' | 'dark';
}

function DeltaBadge({ delta }: { delta?: number }) {
  if (delta === undefined || delta === null) return null;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
        <Minus className="h-3 w-3" />
        0
      </span>
    );
  }
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
        positive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-600 dark:text-rose-400'
      }`}
    >
      {positive ? (
        <ArrowUpRight className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5" />
      )}
      {positive ? `+${delta}` : delta}
    </span>
  );
}

function OverallGauge({ score, delta }: { score: number; delta?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimatedScore(score);
    });
    return () => cancelAnimationFrame(id);
  }, [score]);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (animatedScore / 100) * circumference;

  const tier = getGaugeTier(score);
  const strokeColor =
    tier === 'red' ? '#dc2626' : tier === 'amber' ? '#d97706' : '#16a34a';
  const textTone =
    tier === 'red'
      ? 'text-rose-600 dark:text-rose-400'
      : tier === 'amber'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const statusLabel = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-40 w-40 items-center justify-center"
        role="img"
        aria-label={`Overall audit score ${score} out of 100, rated ${statusLabel}`}
      >
        <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display text-4xl font-bold tabular-nums ${textTone}`}>
            {score}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            out of 100
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`text-sm font-semibold ${textTone}`}>{statusLabel}</span>
        {delta !== undefined && (
          <>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <DeltaBadge delta={delta} />
          </>
        )}
      </div>
    </div>
  );
}

export function ScoreOverview({ report, deltas, theme }: ScoreOverviewProps) {
  const categories = [
    {
      key: 'seo',
      label: 'SEO',
      score: report.scores.seo,
      summary: report.scores.summaries.seo,
      delta: deltas?.seo,
    },
    {
      key: 'content',
      label: 'Content',
      score: report.scores.content,
      summary: report.scores.summaries.content,
      delta: deltas?.content,
    },
    {
      key: 'keywords',
      label: 'Keywords',
      score: report.scores.keywords,
      summary: report.scores.summaries.keywords,
      delta: deltas?.keywords,
    },
    {
      key: 'technical',
      label: 'Technical',
      score: report.scores.technical,
      summary: report.scores.summaries.technical,
      delta: deltas?.technical,
    },
    {
      key: 'aiSearch',
      label: 'AI Search Readiness',
      score: report.scores.aiSearch,
      summary: report.scores.summaries.aiSearch,
      delta: deltas?.aiSearch,
    },
  ];

  const radarData = categories.map((cat) => ({
    subject: cat.key === 'aiSearch' ? 'AI Search' : cat.label,
    score: cat.score,
    fullMark: 100,
  }));

  const gridStroke = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tickColor = theme === 'dark' ? '#cbd5e1' : '#475569';

  return (
    <section aria-label="Audit score overview" className="space-y-6">
      {/* Visible mandatory disclaimer + Compare mode banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 sm:items-center">
          <Info className="mt-0.5 h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 sm:mt-0" />
          <span>
            AI-generated estimates. Verify critical findings with Google Search Console, PageSpeed
            Insights and a full site crawl.
          </span>
        </div>

        {deltas && (
          <div className="flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap shrink-0">
            <span>Comparing vs. {formatAuditDate(deltas.previousDate)}</span>
            <DeltaBadge delta={deltas.overall} />
          </div>
        )}
      </div>

      {/* Top row: Overall Score + Radar Chart + Business Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Overall Score Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Overall Audit Score
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Weighted average across all five audit dimensions
            </p>
          </div>

          <div className="my-6">
            <OverallGauge score={report.scores.overall} delta={deltas?.overall} />
          </div>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Site Summary
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {report.businessSummary}
            </p>
          </div>
        </div>

        {/* Five Category Score Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
          {categories.map((cat) => {
            const tier = getGaugeTier(cat.score);
            const label = getScoreLabel(cat.score);
            const scoreColor =
              tier === 'red'
                ? 'text-rose-600 dark:text-rose-400'
                : tier === 'amber'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400';

            const barColor =
              tier === 'red'
                ? 'bg-rose-500'
                : tier === 'amber'
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            return (
              <div
                key={cat.key}
                className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${
                  cat.key === 'aiSearch' ? 'sm:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {cat.label}
                    </h3>
                    <div className="flex items-baseline gap-2 shrink-0">
                      <DeltaBadge delta={cat.delta} />
                      <span className={`font-display text-2xl font-bold tabular-nums ${scoreColor}`}>
                        {cat.score}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className={`font-medium ${scoreColor}`}>{label}</span>
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {cat.score}/100
                    </span>
                  </div>

                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {cat.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Radar Chart */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Category Balance
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Relative strength across 5 pillars
            </p>
          </div>

          <div
            className="mt-2 h-64 w-full flex-1"
            role="img"
            aria-label="Radar chart comparing SEO, Content, Keywords, Technical, and AI Search scores"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke={gridStroke} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: tickColor, fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="#4f46e5"
                  fillOpacity={0.2}
                />
                <Tooltip
                  formatter={(value) => [`${value}/100`, 'Score']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 5 Priority Fixes + Limitations/Sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                Top 5 Priority Fixes
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Ranked by expected marketing impact relative to implementation effort
              </p>
            </div>
          </div>

          <ol className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {report.priorityFixes.slice(0, 5).map((fix, idx) => (
              <li key={`${fix.title}-${idx}`} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 font-mono text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fix.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                        <span>{fix.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            fix.impact === 'High'
                              ? 'font-medium text-emerald-700 dark:text-emerald-400'
                              : ''
                          }
                        >
                          {fix.impact} impact
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{fix.effort} effort</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {fix.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Limitations & Verified Grounding Sources */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Verification Limitations
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Items that require direct site access or crawling tools to confirm
            </p>

            {report.limitations.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {report.limitations.slice(0, 6).map((lim, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                No extra retrieval limitations reported for this run.
              </p>
            )}
          </div>

          {report.groundingSources && report.groundingSources.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pages & Search Sources Consulted
              </h3>
              <ul className="mt-2 space-y-1.5">
                {report.groundingSources.slice(0, 5).map((src, idx) => (
                  <li key={`${src.uri}-${idx}`} className="truncate text-xs">
                    <a
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{src.title || src.uri}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
