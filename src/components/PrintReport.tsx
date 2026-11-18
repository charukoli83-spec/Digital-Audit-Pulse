import type { AuditReport } from '../types/audit';
import { formatAuditDate, getScoreLabel } from '../utils/url';

interface PrintReportProps {
  report: AuditReport;
  completedChecklistItems: string[];
}

export function PrintReport({ report, completedChecklistItems }: PrintReportProps) {
  const completedSet = new Set(completedChecklistItems);
  const s = report.scores;

  return (
    <div className="hidden print:block bg-white text-slate-900">
      {/* Cover Page */}
      <div className="flex min-h-[240mm] flex-col justify-between border-b border-slate-200 pb-8">
        <div>
          <div className="text-xs font-semibold tracking-wide text-indigo-600">
            AuditPilot · Digital Marketing Audit Report
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900">
            {report.url}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Generated on {formatAuditDate(report.auditDate)}
          </p>

          <div className="mt-10 rounded-xl border border-slate-200 p-6">
            <div className="text-xs font-semibold text-slate-500">Overall Audit Score</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-6xl font-bold tabular-nums text-indigo-600">
                {s.overall}
              </span>
              <span className="text-lg text-slate-500">
                / 100 · {getScoreLabel(s.overall)}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-3 border-t border-slate-100 pt-4 text-center">
              {[
                ['SEO', s.seo],
                ['Content', s.content],
                ['Keywords', s.keywords],
                ['Technical', s.technical],
                ['AI Search', s.aiSearch],
              ].map(([name, val]) => (
                <div key={String(name)}>
                  <div className="text-xs text-slate-500">{name}</div>
                  <div className="mt-1 font-display text-xl font-bold tabular-nums text-slate-900">
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Executive Summary
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {report.businessSummary}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          AI-generated estimates based on live page context and public search data. Verify critical
          findings with Google Search Console, PageSpeed Insights, and a full site crawl.
        </div>
      </div>

      {/* Page 2: Category Summaries & Top 5 Priority Fixes */}
      <div className="print-page-break pt-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Category Breakdown & Priority Fixes
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {[
            ['SEO', s.seo, s.summaries.seo],
            ['Content', s.content, s.summaries.content],
            ['Keywords', s.keywords, s.summaries.keywords],
            ['Technical', s.technical, s.summaries.technical],
            ['AI Search Readiness', s.aiSearch, s.summaries.aiSearch],
          ].map(([label, score, summary]) => (
            <div key={String(label)} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm">{label}</strong>
                <span className="font-mono text-sm font-bold tabular-nums">{score}/100</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{summary}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-6 font-display text-base font-bold text-slate-900">
          Top 5 Priority Fixes
        </h3>
        <ol className="mt-3 space-y-2.5">
          {report.priorityFixes.slice(0, 5).map((fix, i) => (
            <li key={i} className="print-avoid-break rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>
                  {i + 1}. {fix.title}
                </span>
                <span className="text-slate-500">
                  {fix.category} · {fix.impact} impact · {fix.effort} effort
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700">{fix.description}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Page 3: SEO Audit */}
      <div className="print-page-break pt-4">
        <h2 className="font-display text-xl font-bold text-slate-900">On-Page SEO Audit</h2>
        <div className="mt-4 space-y-3">
          {report.seoChecks.map((c, i) => (
            <div key={i} className="print-avoid-break rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{c.item}</span>
                <span>{c.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-700">
                <strong>Found:</strong> {c.finding}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                <strong>Why it matters:</strong> {c.whyItMatters}
              </p>
              <p className="mt-1 text-xs text-slate-800">
                <strong>Fix:</strong> {c.fix}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Page 4: Content Recommendations */}
      <div className="print-page-break pt-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Content Recommendations
        </h2>

        <div className="mt-4 rounded-lg border border-slate-200 p-3 text-xs space-y-1.5">
          <div>
            <strong>Rewritten Title ({report.contentRecommendations.rewrites.title.length} chars):</strong>{' '}
            {report.contentRecommendations.rewrites.title}
          </div>
          <div>
            <strong>
              Rewritten Meta Description ({report.contentRecommendations.rewrites.metaDescription.length}{' '}
              chars):
            </strong>{' '}
            {report.contentRecommendations.rewrites.metaDescription}
          </div>
          <div>
            <strong>Rewritten H1 ({report.contentRecommendations.rewrites.h1.length} chars):</strong>{' '}
            {report.contentRecommendations.rewrites.h1}
          </div>
        </div>

        <h3 className="mt-5 font-display text-sm font-bold">Content Gaps</h3>
        <ul className="mt-2 list-disc pl-5 text-xs space-y-1 text-slate-700">
          {report.contentRecommendations.gaps.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>

        <h3 className="mt-5 font-display text-sm font-bold">Content Ideas</h3>
        <table className="mt-2 w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-1.5 pr-2">Title</th>
              <th className="py-1.5 pr-2">Keyword</th>
              <th className="py-1.5 pr-2">Intent</th>
              <th className="py-1.5 pr-2">Format</th>
              <th className="py-1.5">Priority</th>
            </tr>
          </thead>
          <tbody>
            {report.contentRecommendations.ideas.map((idea, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-2 font-medium">{idea.title}</td>
                <td className="py-1.5 pr-2 font-mono">{idea.keyword}</td>
                <td className="py-1.5 pr-2">{idea.intent}</td>
                <td className="py-1.5 pr-2">{idea.format}</td>
                <td className="py-1.5">{idea.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-5 font-display text-sm font-bold">30-Day Content Calendar</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {report.contentRecommendations.calendar.map((c, i) => (
            <div key={i} className="rounded border border-slate-200 p-2">
              <strong>{c.week}:</strong> {c.topic}
            </div>
          ))}
        </div>
      </div>

      {/* Page 5: Keyword Suggestions */}
      <div className="print-page-break pt-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Keyword Suggestions (AI Estimates)
        </h2>
        <table className="mt-3 w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-1.5 pr-2">Keyword</th>
              <th className="py-1.5 pr-2">Cluster</th>
              <th className="py-1.5 pr-2">Intent</th>
              <th className="py-1.5 pr-2 text-right">Rel.</th>
              <th className="py-1.5 pr-2">Est. Diff.</th>
              <th className="py-1.5 pr-2">Page Type</th>
              <th className="py-1.5">Tail</th>
            </tr>
          </thead>
          <tbody>
            {report.keywords.map((kw, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1 pr-2 font-medium">
                  {kw.keyword} {kw.quickWin ? '(Quick win)' : ''}
                </td>
                <td className="py-1 pr-2">{kw.cluster}</td>
                <td className="py-1 pr-2">{kw.intent}</td>
                <td className="py-1 pr-2 text-right font-mono tabular-nums">{kw.relevance}</td>
                <td className="py-1 pr-2">{kw.difficulty}</td>
                <td className="py-1 pr-2">{kw.pageType}</td>
                <td className="py-1">{kw.tail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Page 6: Technical SEO Checklist & AI Search Optimization */}
      <div className="print-page-break pt-4">
        <h2 className="font-display text-xl font-bold text-slate-900">Technical SEO Checklist</h2>
        <div className="mt-3 space-y-2 text-xs">
          {report.technicalChecklist.map((item, idx) => {
            const key = `${item.group}::${item.item}::${idx}`;
            const done = completedSet.has(key);
            return (
              <div key={key} className="print-avoid-break rounded border border-slate-200 p-2.5">
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    [{done ? 'x' : ' '}] {item.group} — {item.item}
                  </span>
                  <span>
                    {item.status} · {item.severity}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{item.fix}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="print-page-break pt-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          AI Search Optimization ({report.aiSearch.score}/100)
        </h2>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          {report.aiSearch.factors.map((f, i) => (
            <div key={i} className="rounded border border-slate-200 p-2.5">
              <div className="flex justify-between font-semibold">
                <span>{f.name}</span>
                <span className="font-mono tabular-nums">{f.score}</span>
              </div>
              <p className="mt-1 text-slate-600">{f.finding}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-5 font-display text-sm font-bold">Recommendations</h3>
        <div className="mt-2 space-y-2 text-xs">
          {report.aiSearch.recommendations.map((rec, i) => (
            <div key={i} className="print-avoid-break rounded border border-slate-200 p-2.5">
              <div className="font-semibold">
                {i + 1}. {rec.title} ({rec.impact} impact)
              </div>
              <p className="mt-1 text-slate-700">{rec.description}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-5 font-display text-sm font-bold">Sample AI Assistant Questions</h3>
        <ol className="mt-2 list-decimal pl-5 text-xs space-y-1">
          {report.aiSearch.sampleQuestions.map((q, i) => (
            <li key={i}>
              <strong>{q.question}</strong> — {q.coverage}
            </li>
          ))}
        </ol>

        <h3 className="mt-5 font-display text-sm font-bold">Limitations & Notes</h3>
        <ul className="mt-2 list-disc pl-5 text-xs space-y-1 text-slate-600">
          {report.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
