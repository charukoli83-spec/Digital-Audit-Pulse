import type { AuditContextInput, AuditReport, SavedAudit, ScoreDeltas } from '../types/audit';
import { normalizeAuditKey } from './url';

const HISTORY_STORAGE_KEY = 'auditpilot_history_v1';
const THEME_STORAGE_KEY = 'auditpilot_theme_v1';
const MAX_SAVED_AUDITS = 10;

export function loadAuditHistory(): SavedAudit[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveAuditToHistory(
  report: AuditReport,
  context?: AuditContextInput
): { saved: SavedAudit; history: SavedAudit[] } {
  const existing = loadAuditHistory();
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entry: SavedAudit = {
    id,
    normalizedUrl: normalizeAuditKey(report.url),
    report,
    context,
    completedChecklistItems: [],
  };

  const next = [entry, ...existing].slice(0, MAX_SAVED_AUDITS);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors gracefully
  }
  return { saved: entry, history: next };
}

export function deleteAuditFromHistory(auditId: string): SavedAudit[] {
  const existing = loadAuditHistory();
  const next = existing.filter((item) => item.id !== auditId);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
  return next;
}

export function toggleChecklistItemInHistory(
  auditId: string,
  itemKey: string
): SavedAudit[] {
  const existing = loadAuditHistory();
  const next = existing.map((entry) => {
    if (entry.id !== auditId) return entry;
    const set = new Set(entry.completedChecklistItems || []);
    if (set.has(itemKey)) {
      set.delete(itemKey);
    } else {
      set.add(itemKey);
    }
    return { ...entry, completedChecklistItems: Array.from(set) };
  });
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore
  }
  return next;
}

export function findPreviousAuditForUrl(
  history: SavedAudit[],
  currentAuditId: string,
  url: string
): SavedAudit | undefined {
  const key = normalizeAuditKey(url);
  return history.find(
    (entry) => entry.id !== currentAuditId && entry.normalizedUrl === key
  );
}

export function computeScoreDeltas(
  current: AuditReport,
  previous?: SavedAudit
): ScoreDeltas | null {
  if (!previous) return null;
  const prev = previous.report.scores;
  const curr = current.scores;
  return {
    overall: curr.overall - prev.overall,
    seo: curr.seo - prev.seo,
    content: curr.content - prev.content,
    keywords: curr.keywords - prev.keywords,
    technical: curr.technical - prev.technical,
    aiSearch: curr.aiSearch - prev.aiSearch,
    previousDate: previous.report.auditDate,
  };
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore
  }
}
