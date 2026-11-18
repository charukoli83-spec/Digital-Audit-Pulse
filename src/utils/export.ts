import type { AuditReport } from '../types/audit';
import { formatAuditDate, getDisplayHost, getScoreLabel } from './url';

function escapeCsvCell(value: string | number | boolean | undefined): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function fileSlug(report: AuditReport): string {
  const host = getDisplayHost(report.url).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const date = new Date(report.auditDate);
  const dateStr = Number.isNaN(date.getTime())
    ? 'audit'
    : date.toISOString().slice(0, 10);
  return `auditpilot-${host || 'site'}-${dateStr}`;
}

export function downloadKeywordsCsv(report: AuditReport): void {
  const headers = [
    'Keyword',
    'Cluster',
    'Intent',
    'AI Relevance (0-100)',
    'Estimated Difficulty',
    'Suggested Page Type',
    'Tail Type',
    'Quick Win',
  ];
  const rows = report.keywords.map((kw) =>
    [
      kw.keyword,
      kw.cluster,
      kw.intent,
      kw.relevance,
      kw.difficulty,
      kw.pageType,
      kw.tail,
      kw.quickWin ? 'Yes' : 'No',
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  const csv = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
  triggerDownload(`${fileSlug(report)}-keywords.csv`, csv, 'text/csv;charset=utf-8;');
}

export function downloadChecklistCsv(
  report: AuditReport,
  completedKeys: string[] = []
): void {
  const completedSet = new Set(completedKeys);
  const headers = ['Group', 'Item', 'Status', 'Severity', 'Completed', 'Fix Instruction'];
  const rows = report.technicalChecklist.map((item, idx) => {
    const key = `${item.group}::${item.item}::${idx}`;
    return [
      item.group,
      item.item,
      item.status,
      item.severity,
      completedSet.has(key) ? 'Done' : 'Open',
      item.fix,
    ]
      .map(escapeCsvCell)
      .join(',');
  });
  const csv = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
  triggerDownload(`${fileSlug(report)}-technical-checklist.csv`, csv, 'text/csv;charset=utf-8;');
}

export function downloadAuditJson(report: AuditReport): void {
  const json = JSON.stringify(report, null, 2);
  triggerDownload(`${fileSlug(report)}.json`, json, 'application/json;charset=utf-8;');
}

export function generateMarkdownReport(report: AuditReport): string {
  const lines: string[] = [];
  lines.push(`# AuditPilot Digital Marketing Audit: ${report.url}`);
  lines.push(`**Audit Date:** ${formatAuditDate(report.auditDate)}`);
  lines.push('');
  lines.push(
    '> Disclaimer: AI-generated estimates based on live page context and public search data. Verify critical findings with Google Search Console, PageSpeed Insights, and a full site crawl.'
  );
  lines.push('');
  lines.push('## Executive Summary');
  lines.push(report.businessSummary);
  lines.push('');
  lines.push('## Score Overview');
  lines.push(`- **Overall Score:** ${report.scores.overall}/100 (${getScoreLabel(report.scores.overall)})`);
  lines.push(`- **SEO:** ${report.scores.seo}/100 — ${report.scores.summaries.seo}`);
  lines.push(`- **Content:** ${report.scores.content}/100 — ${report.scores.summaries.content}`);
  lines.push(`- **Keywords:** ${report.scores.keywords}/100 — ${report.scores.summaries.keywords}`);
  lines.push(`- **Technical:** ${report.scores.technical}/100 — ${report.scores.summaries.technical}`);
  lines.push(`- **AI Search Readiness:** ${report.scores.aiSearch}/100 — ${report.scores.summaries.aiSearch}`);
  lines.push('');

  lines.push('## Top Priority Fixes');
  report.priorityFixes.forEach((fix, i) => {
    lines.push(`${i + 1}. **${fix.title}** (${fix.category} · Impact: ${fix.impact} · Effort: ${fix.effort})`);
    lines.push(`   ${fix.description}`);
  });
  lines.push('');

  lines.push('## SEO Audit');
  report.seoChecks.forEach((check) => {
    lines.push(`- **${check.item} [${check.status}]**`);
    lines.push(`  - Found: ${check.finding}`);
    lines.push(`  - Why it matters: ${check.whyItMatters}`);
    lines.push(`  - How to fix: ${check.fix}`);
  });
  lines.push('');

  if (report.localSeo?.applicable) {
    lines.push(`### Local SEO (${report.localSeo.location})`);
    lines.push(`- **Google Business Profile Signals:** ${report.localSeo.gbpSignals}`);
    lines.push(`- **NAP Consistency:** ${report.localSeo.napConsistency}`);
    lines.push(`- **Local Keywords:** ${report.localSeo.localKeywords.join(', ')}`);
    lines.push('');
  }

  lines.push('## Content Recommendations');
  lines.push('### Content Gaps');
  report.contentRecommendations.gaps.forEach((gap) => lines.push(`- ${gap}`));
  lines.push('');
  lines.push('### Page Rewrite Suggestions');
  lines.push(`- **Title Tag (${report.contentRecommendations.rewrites.title.length} chars):** ${report.contentRecommendations.rewrites.title}`);
  lines.push(`- **Meta Description (${report.contentRecommendations.rewrites.metaDescription.length} chars):** ${report.contentRecommendations.rewrites.metaDescription}`);
  lines.push(`- **H1 (${report.contentRecommendations.rewrites.h1.length} chars):** ${report.contentRecommendations.rewrites.h1}`);
  lines.push('');
  lines.push('### Content Ideas');
  report.contentRecommendations.ideas.forEach((idea) => {
    lines.push(`- **${idea.title}** | Keyword: \`${idea.keyword}\` | Intent: ${idea.intent} | Format: ${idea.format} | Priority: ${idea.priority}`);
  });
  lines.push('');
  lines.push('### 30-Day Content Calendar');
  report.contentRecommendations.calendar.forEach((entry) => {
    lines.push(`- **${entry.week}:** ${entry.topic}${entry.format ? ` (${entry.format})` : ''}`);
  });
  lines.push('');

  lines.push('## Keyword Suggestions (AI Estimates)');
  lines.push('| Keyword | Cluster | Intent | Relevance | Est. Difficulty | Page Type | Tail | Quick Win |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  report.keywords.forEach((kw) => {
    lines.push(
      `| ${kw.keyword} | ${kw.cluster} | ${kw.intent} | ${kw.relevance} | ${kw.difficulty} | ${kw.pageType} | ${kw.tail} | ${kw.quickWin ? 'Yes' : 'No'} |`
    );
  });
  lines.push('');

  lines.push('## Technical SEO Checklist');
  report.technicalChecklist.forEach((item) => {
    lines.push(`- **[${item.status}] (${item.severity}) ${item.group} — ${item.item}:** ${item.fix}`);
  });
  lines.push('');

  lines.push(`## AI Search Optimization (Score: ${report.aiSearch.score}/100)`);
  lines.push('### Readiness Factors');
  report.aiSearch.factors.forEach((f) => {
    lines.push(`- **${f.name} (${f.score}/100):** ${f.finding}`);
  });
  lines.push('');
  lines.push('### Recommendations');
  report.aiSearch.recommendations.forEach((rec) => {
    lines.push(`- **${rec.title} (Impact: ${rec.impact}):** ${rec.description}`);
    lines.push('```');
    lines.push(rec.example);
    lines.push('```');
  });
  lines.push('');
  lines.push('### Sample AI Assistant Questions');
  report.aiSearch.sampleQuestions.forEach((q, idx) => {
    lines.push(`${idx + 1}. **${q.question}** — ${q.coverage}`);
  });
  lines.push('');

  if (report.limitations.length > 0) {
    lines.push('## Limitations & Verification Notes');
    report.limitations.forEach((lim) => lines.push(`- ${lim}`));
  }

  return lines.join('\n');
}

export function downloadMarkdownReport(report: AuditReport): void {
  const md = generateMarkdownReport(report);
  triggerDownload(`${fileSlug(report)}.md`, md, 'text/markdown;charset=utf-8;');
}

export function buildShortSummaryText(report: AuditReport): string {
  const s = report.scores;
  return [
    `AuditPilot Report — ${report.url} (${formatAuditDate(report.auditDate)})`,
    `Overall Score: ${s.overall}/100 (${getScoreLabel(s.overall)})`,
    `SEO: ${s.seo} · Content: ${s.content} · Keywords: ${s.keywords} · Technical: ${s.technical} · AI Search: ${s.aiSearch}`,
    '',
    `Summary: ${report.businessSummary}`,
    '',
    'Top Priorities:',
    ...report.priorityFixes.slice(0, 3).map((f, i) => `${i + 1}. ${f.title} (${f.category})`),
    '',
    'Note: AI-generated estimates from live page & public search data.',
  ].join('\n');
}
