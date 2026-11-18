export type PrimaryGoal = 'leads' | 'sales' | 'traffic' | 'brand_awareness';

export interface AuditContextInput {
  businessType?: string;
  targetLocation?: string;
  targetLanguages?: string;
  competitors?: string[];
  primaryGoal?: PrimaryGoal;
}

export interface AuditRequest {
  url: string;
  context?: AuditContextInput;
}

export type AuditStatus = 'Pass' | 'Warning' | 'Fail' | 'Could not verify';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type SearchIntent = 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';

export interface CategoryScores {
  overall: number;
  seo: number;
  content: number;
  keywords: number;
  technical: number;
  aiSearch: number;
  summaries: {
    seo: string;
    content: string;
    keywords: string;
    technical: string;
    aiSearch: string;
  };
}

export interface PriorityFix {
  title: string;
  category: string;
  impact: PriorityLevel;
  effort: PriorityLevel;
  description: string;
}

export interface SeoCheck {
  item: string;
  status: AuditStatus;
  finding: string;
  whyItMatters: string;
  fix: string;
}

export interface LocalSeoBlock {
  applicable: boolean;
  location: string;
  gbpSignals: string;
  napConsistency: string;
  localKeywords: string[];
  recommendations: string[];
}

export interface ContentIdea {
  title: string;
  keyword: string;
  intent: SearchIntent;
  format: 'Blog' | 'Landing Page' | 'FAQ' | 'Comparison' | 'Video';
  priority: PriorityLevel;
}

export interface ContentRewrites {
  currentTitle?: string;
  title: string;
  currentMetaDescription?: string;
  metaDescription: string;
  currentH1?: string;
  h1: string;
}

export interface CalendarEntry {
  week: string;
  topic: string;
  format?: string;
}

export interface ContentRecommendations {
  gaps: string[];
  ideas: ContentIdea[];
  rewrites: ContentRewrites;
  calendar: CalendarEntry[];
}

export interface KeywordSuggestion {
  keyword: string;
  intent: SearchIntent;
  relevance: number;
  difficulty: 'Low' | 'Medium' | 'High';
  pageType: string;
  tail: 'Short-tail' | 'Long-tail';
  cluster: string;
  quickWin: boolean;
}

export interface TechnicalChecklistItem {
  group: string;
  item: string;
  status: AuditStatus;
  severity: SeverityLevel;
  fix: string;
}

export interface AiSearchFactor {
  name: string;
  score: number;
  finding: string;
}

export interface AiSearchRecommendation {
  title: string;
  impact: PriorityLevel;
  description: string;
  example: string;
}

export interface AiSampleQuestion {
  question: string;
  coverage: string;
}

export interface AiSearchAudit {
  score: number;
  factors: AiSearchFactor[];
  recommendations: AiSearchRecommendation[];
  sampleQuestions: AiSampleQuestion[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AuditReport {
  url: string;
  auditDate: string;
  businessSummary: string;
  scores: CategoryScores;
  priorityFixes: PriorityFix[];
  seoChecks: SeoCheck[];
  localSeo?: LocalSeoBlock;
  contentRecommendations: ContentRecommendations;
  keywords: KeywordSuggestion[];
  technicalChecklist: TechnicalChecklistItem[];
  aiSearch: AiSearchAudit;
  limitations: string[];
  groundingSources?: GroundingSource[];
}

export interface SavedAudit {
  id: string;
  normalizedUrl: string;
  report: AuditReport;
  context?: AuditContextInput;
  completedChecklistItems: string[];
}

export interface ScoreDeltas {
  overall: number;
  seo: number;
  content: number;
  keywords: number;
  technical: number;
  aiSearch: number;
  previousDate: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
