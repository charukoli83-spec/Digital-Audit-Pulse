import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Check,
  Copy,
  Download,
  Search,
  Sparkles,
} from 'lucide-react';
import type { AuditReport, KeywordSuggestion } from '../types/audit';
import { downloadKeywordsCsv } from '../utils/export';

interface KeywordTableProps {
  report: AuditReport;
}

type SortKey = 'relevance' | 'keyword' | 'difficulty' | 'intent';

const DIFFICULTY_RANK: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export function KeywordTable({ report }: KeywordTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [clusterFilter, setClusterFilter] = useState<string>('All');
  const [groupByCluster, setGroupByCluster] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [copiedAll, setCopiedAll] = useState(false);

  const clusters = useMemo(() => {
    const set = new Set<string>();
    report.keywords.forEach((k) => {
      if (k.cluster) set.add(k.cluster);
    });
    return Array.from(set);
  }, [report.keywords]);

  const quickWins = useMemo(
    () => report.keywords.filter((k) => k.quickWin),
    [report.keywords]
  );

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = report.keywords.filter((kw) => {
      if (q && !kw.keyword.toLowerCase().includes(q) && !kw.cluster.toLowerCase().includes(q)) {
        return false;
      }
      if (intentFilter !== 'All' && kw.intent !== intentFilter) return false;
      if (difficultyFilter !== 'All' && kw.difficulty !== difficultyFilter) return false;
      if (clusterFilter !== 'All' && kw.cluster !== clusterFilter) return false;
      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'relevance') {
        cmp = a.relevance - b.relevance;
      } else if (sortBy === 'difficulty') {
        cmp = (DIFFICULTY_RANK[a.difficulty] ?? 2) - (DIFFICULTY_RANK[b.difficulty] ?? 2);
      } else if (sortBy === 'intent') {
        cmp = a.intent.localeCompare(b.intent);
      } else {
        cmp = a.keyword.localeCompare(b.keyword);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [report.keywords, searchQuery, intentFilter, difficultyFilter, clusterFilter, sortBy, sortDir]);

  const groupedKeywords = useMemo(() => {
    const groups: Record<string, KeywordSuggestion[]> = {};
    filteredAndSorted.forEach((kw) => {
      const c = kw.cluster || 'General';
      if (!groups[c]) groups[c] = [];
      groups[c].push(kw);
    });
    return Object.entries(groups);
  }, [filteredAndSorted]);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'relevance' ? 'desc' : 'asc');
    }
  }

  async function handleCopyAllKeywords() {
    const text = filteredAndSorted.map((k) => k.keyword).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // Ignore
    }
  }

  function renderDifficultyText(diff: string) {
    const tone =
      diff === 'Low'
        ? 'text-emerald-700 dark:text-emerald-400'
        : diff === 'High'
        ? 'text-rose-700 dark:text-rose-400'
        : 'text-amber-700 dark:text-amber-400';
    return <span className={`font-medium ${tone}`}>{diff} (Est.)</span>;
  }

  function renderRows(rows: KeywordSuggestion[]) {
    return rows.map((kw, i) => (
      <tr
        key={`${kw.keyword}-${i}`}
        className="border-t border-slate-100 text-sm transition-colors hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-800/40"
      >
        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
          <div className="flex items-center gap-2">
            <span>{kw.keyword}</span>
            {kw.quickWin && (
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                Quick win
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">{kw.cluster}</td>
        <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">{kw.intent}</td>
        <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          {kw.relevance}/100
        </td>
        <td className="px-3 py-3 text-xs whitespace-nowrap">{renderDifficultyText(kw.difficulty)}</td>
        <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">{kw.pageType}</td>
        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {kw.tail}
        </td>
      </tr>
    ));
  }

  return (
    <div className="space-y-6">
      {/* Estimate Disclaimer & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Difficulty and relevance scores are AI-estimated heuristics. Exact search volumes are omitted
          unless measured via Google Keyword Planner or Search Console.
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyAllKeywords}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {copiedAll ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied {filteredAndSorted.length}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy all keywords</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => downloadKeywordsCsv(report)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Quick Wins ({quickWins.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              High relevance paired with lower estimated competition
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {quickWins.map((kw, i) => (
              <div
                key={`qw-${kw.keyword}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {kw.keyword}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {kw.intent} · {kw.pageType}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {kw.relevance}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {kw.difficulty}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Group Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter keywords or clusters..."
              aria-label="Filter keywords"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <select
            aria-label="Filter by search intent"
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="All">All intents</option>
            <option value="Informational">Informational</option>
            <option value="Commercial">Commercial</option>
            <option value="Transactional">Transactional</option>
            <option value="Navigational">Navigational</option>
          </select>

          <select
            aria-label="Filter by estimated difficulty"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="All">All difficulties</option>
            <option value="Low">Low (Est.)</option>
            <option value="Medium">Medium (Est.)</option>
            <option value="High">High (Est.)</option>
          </select>

          <select
            aria-label="Filter by cluster"
            value={clusterFilter}
            onChange={(e) => setClusterFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="All">All clusters ({clusters.length})</option>
            {clusters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setGroupByCluster(false)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              !groupByCluster
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            All ({filteredAndSorted.length})
          </button>
          <button
            type="button"
            onClick={() => setGroupByCluster(true)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              groupByCluster
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            By cluster
          </button>
        </div>
      </div>

      {/* Keywords Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No keywords match your current filters.
        </div>
      ) : groupByCluster ? (
        <div className="space-y-4">
          {groupedKeywords.map(([clusterName, rows]) => (
            <div
              key={clusterName}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/40">
                <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {clusterName}
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {rows.length} keywords
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-2.5">Keyword</th>
                      <th className="px-3 py-2.5">Cluster</th>
                      <th className="px-3 py-2.5">Intent</th>
                      <th className="px-3 py-2.5 text-right">Relevance (Est.)</th>
                      <th className="px-3 py-2.5">Difficulty</th>
                      <th className="px-3 py-2.5">Page Type</th>
                      <th className="px-4 py-2.5">Tail</th>
                    </tr>
                  </thead>
                  <tbody>{renderRows(rows)}</tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('keyword')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Keyword</span>
                      <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3">Cluster</th>
                  <th className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('intent')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Intent</span>
                      <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('relevance')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Relevance (Est.)</span>
                      <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSort('difficulty')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      <span>Difficulty</span>
                      <ArrowDownUp className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-3 py-3">Suggested Page Type</th>
                  <th className="px-4 py-3">Tail</th>
                </tr>
              </thead>
              <tbody>{renderRows(filteredAndSorted)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
