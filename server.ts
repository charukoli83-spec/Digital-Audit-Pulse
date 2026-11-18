import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { Request, Response } from 'express';
import type { AuditContextInput, AuditReport, ChatMessage, GroundingSource } from './src/types/audit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYSTEM_INSTRUCTION =
  "You are a senior SEO and digital marketing strategist. Base every finding on evidence from the page or search results. If something cannot be verified, say 'Could not verify' instead of guessing. Never invent statistics, rankings or traffic numbers.";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const AUDIT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    url: { type: Type.STRING, description: 'The audited website URL.' },
    auditDate: { type: Type.STRING, description: 'ISO 8601 date-time string of the audit.' },
    businessSummary: {
      type: Type.STRING,
      description: 'Concise 2-3 sentence summary of what the site/business does based on observed page content.',
    },
    scores: {
      type: Type.OBJECT,
      properties: {
        overall: { type: Type.INTEGER },
        seo: { type: Type.INTEGER },
        content: { type: Type.INTEGER },
        keywords: { type: Type.INTEGER },
        technical: { type: Type.INTEGER },
        aiSearch: { type: Type.INTEGER },
        summaries: {
          type: Type.OBJECT,
          properties: {
            seo: { type: Type.STRING },
            content: { type: Type.STRING },
            keywords: { type: Type.STRING },
            technical: { type: Type.STRING },
            aiSearch: { type: Type.STRING },
          },
          required: ['seo', 'content', 'keywords', 'technical', 'aiSearch'],
        },
      },
      required: ['overall', 'seo', 'content', 'keywords', 'technical', 'aiSearch', 'summaries'],
    },
    priorityFixes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          impact: { type: Type.STRING },
          effort: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['title', 'category', 'impact', 'effort', 'description'],
      },
    },
    seoChecks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          status: { type: Type.STRING },
          finding: { type: Type.STRING },
          whyItMatters: { type: Type.STRING },
          fix: { type: Type.STRING },
        },
        required: ['item', 'status', 'finding', 'whyItMatters', 'fix'],
      },
    },
    localSeo: {
      type: Type.OBJECT,
      properties: {
        applicable: { type: Type.BOOLEAN },
        location: { type: Type.STRING },
        gbpSignals: { type: Type.STRING },
        napConsistency: { type: Type.STRING },
        localKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['applicable', 'location', 'gbpSignals', 'napConsistency', 'localKeywords', 'recommendations'],
    },
    contentRecommendations: {
      type: Type.OBJECT,
      properties: {
        gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        ideas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              keyword: { type: Type.STRING },
              intent: { type: Type.STRING },
              format: { type: Type.STRING },
              priority: { type: Type.STRING },
            },
            required: ['title', 'keyword', 'intent', 'format', 'priority'],
          },
        },
        rewrites: {
          type: Type.OBJECT,
          properties: {
            currentTitle: { type: Type.STRING },
            title: { type: Type.STRING },
            currentMetaDescription: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            currentH1: { type: Type.STRING },
            h1: { type: Type.STRING },
          },
          required: ['title', 'metaDescription', 'h1'],
        },
        calendar: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              week: { type: Type.STRING },
              topic: { type: Type.STRING },
              format: { type: Type.STRING },
            },
            required: ['week', 'topic'],
          },
        },
      },
      required: ['gaps', 'ideas', 'rewrites', 'calendar'],
    },
    keywords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          keyword: { type: Type.STRING },
          intent: { type: Type.STRING },
          relevance: { type: Type.INTEGER },
          difficulty: { type: Type.STRING },
          pageType: { type: Type.STRING },
          tail: { type: Type.STRING },
          cluster: { type: Type.STRING },
          quickWin: { type: Type.BOOLEAN },
        },
        required: ['keyword', 'intent', 'relevance', 'difficulty', 'pageType', 'tail', 'cluster', 'quickWin'],
      },
    },
    technicalChecklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          group: { type: Type.STRING },
          item: { type: Type.STRING },
          status: { type: Type.STRING },
          severity: { type: Type.STRING },
          fix: { type: Type.STRING },
        },
        required: ['group', 'item', 'status', 'severity', 'fix'],
      },
    },
    aiSearch: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        factors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.INTEGER },
              finding: { type: Type.STRING },
            },
            required: ['name', 'score', 'finding'],
          },
        },
        recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              impact: { type: Type.STRING },
              description: { type: Type.STRING },
              example: { type: Type.STRING },
            },
            required: ['title', 'impact', 'description', 'example'],
          },
        },
        sampleQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              coverage: { type: Type.STRING },
            },
            required: ['question', 'coverage'],
          },
        },
      },
      required: ['score', 'factors', 'recommendations', 'sampleQuestions'],
    },
    limitations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'url',
    'auditDate',
    'businessSummary',
    'scores',
    'priorityFixes',
    'seoChecks',
    'contentRecommendations',
    'keywords',
    'technicalChecklist',
    'aiSearch',
    'limitations',
  ],
};

function buildAuditPrompt(url: string, context?: AuditContextInput): string {
  const goalLabels: Record<string, string> = {
    leads: 'Lead generation',
    sales: 'Direct online sales / conversions',
    traffic: 'Organic search traffic growth',
    brand_awareness: 'Brand awareness & authority',
  };

  const contextLines: string[] = [];
  if (context?.businessType?.trim()) {
    contextLines.push(`- Business Type: ${context.businessType.trim()}`);
  }
  if (context?.targetLocation?.trim()) {
    contextLines.push(`- Target Country or City: ${context.targetLocation.trim()}`);
  }
  if (context?.targetLanguages?.trim()) {
    contextLines.push(`- Target Language(s): ${context.targetLanguages.trim()}`);
  }
  if (context?.competitors && context.competitors.length > 0) {
    contextLines.push(`- Competitor URLs: ${context.competitors.join(', ')}`);
  }
  if (context?.primaryGoal) {
    contextLines.push(`- Primary Goal: ${goalLabels[context.primaryGoal] || context.primaryGoal}`);
  }

  let domainRoot = url;
  try {
    const u = new URL(url);
    domainRoot = `${u.protocol}//${u.hostname}`;
  } catch {
    // keep raw
  }

  return `Perform a comprehensive, evidence-based digital marketing audit of ${url}.

Use the URL context tool to read ${url} (and check ${domainRoot}/robots.txt, ${domainRoot}/sitemap.xml, and ${domainRoot}/llms.txt if reachable), and use Google Search grounding to inspect public search presence, brand mentions, indexed pages, and competitor context.

${contextLines.length > 0 ? `User-supplied context:\n${contextLines.join('\n')}\n` : ''}
Current UTC timestamp: ${new Date().toISOString()}

Strict Requirements:
1. Base every finding strictly on evidence observed from the live page(s) or public search results. If something cannot be verified (for example, exact Core Web Vitals, server headers, robots.txt or llms.txt if unreachable, or internal link depth beyond the landing page), explicitly state "Could not verify" instead of guessing.
2. Never invent statistics, exact monthly search volumes, domain authority scores, rankings, or traffic numbers. Mark keyword difficulty and relevance explicitly as AI-estimated heuristics.
3. Populate ALL fields in the JSON schema thoroughly:
   - scores: integers 0–100 for overall, seo, content, keywords, technical, aiSearch, plus one-sentence summaries for each of the 5 categories.
   - priorityFixes: exactly 5 fixes ranked by highest impact and lowest effort first.
   - seoChecks: cover all 9 required checks: Title Tag, Meta Description, H1 & Heading Structure, URL Structure, Image Alt Text, Internal Linking, Canonical Tag, Schema Markup, and Open Graph Tags. Status must be one of "Pass", "Warning", "Fail", or "Could not verify".
   - localSeo: ${context?.targetLocation?.trim() ? `applicable MUST be true for "${context.targetLocation.trim()}". Evaluate Google Business Profile signals, NAP consistency, and local keyword opportunities.` : 'Set applicable to false unless the site is clearly a local brick-and-mortar or regional service business.'}
   - contentRecommendations:
     * gaps: 5-7 concrete topic gaps the site should cover.
     * ideas: 8-10 specific content ideas with working title, target keyword, search intent (Informational, Commercial, Transactional, Navigational), format (Blog, Landing Page, FAQ, Comparison, Video), and priority (High, Medium, Low).
     * rewrites: improved title tag (aim 50-60 chars), meta description (aim 140-155 chars), and H1, plus current values if observed.
     * calendar: 4 weekly entries (Week 1 to Week 4) forming a 30-day content calendar.
   - keywords: 22 to 28 relevant keyword suggestions grouped across 4-6 thematic clusters, with intent, relevance (0-100), difficulty (Low, Medium, High), suggested pageType, tail (Short-tail or Long-tail), cluster name, and quickWin boolean (mark 5-7 strong low-difficulty/high-relevance targets as true).
   - technicalChecklist: 16 to 24 actionable items spanning ALL 8 groups:
     1) Crawlability and indexing (robots.txt, sitemap.xml, noindex, redirects)
     2) Performance (estimated Core Web Vitals, image optimization, caching)
     3) Mobile and UX
     4) Security (HTTPS, mixed content)
     5) Structured data
     6) URL and canonical hygiene
     7) International SEO (hreflang)
     8) Accessibility basics
     Status must be "Pass", "Warning", "Fail", or "Could not verify". Severity must be "Critical", "High", "Medium", or "Low".
   - aiSearch:
     * score: 0-100 overall AI search & answer-engine readiness score (Google AI Overviews, ChatGPT, Perplexity, Gemini, Copilot).
     * factors: evaluate all 9 factors: Answer-first content structure, FAQ & Q&A coverage, Entity clarity (who/what/where), E-E-A-T signals (authors, credentials, testimonials, sources), Structured data, Brand mentions & web citations, Content freshness, AI bot crawler access (robots.txt), and llms.txt availability.
     * recommendations: 8-10 concrete recommendations with impact (High, Medium, Low), description, and a ready-to-use example (e.g. sample FAQ block, JSON-LD snippet, or llms.txt snippet).
     * sampleQuestions: 10 realistic questions a prospective customer might ask an AI assistant where this business should appear, with a concise assessment of how well the site currently answers each.
   - limitations: explicit list of items that could not be verified from URL context and search grounding alone.`;
}

function extractJsonText(raw: string): string {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function clampScore(val: unknown, fallback = 50): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function validateAndNormalizeReport(rawObj: unknown, fallbackUrl: string): AuditReport {
  if (!rawObj || typeof rawObj !== 'object') {
    throw new Error('INVALID_JSON_STRUCTURE');
  }
  const obj = rawObj as Record<string, unknown>;
  const scoresRaw = (obj.scores && typeof obj.scores === 'object' ? obj.scores : {}) as Record<string, unknown>;
  const summariesRaw = (
    scoresRaw.summaries && typeof scoresRaw.summaries === 'object' ? scoresRaw.summaries : {}
  ) as Record<string, unknown>;

  if (
    typeof obj.businessSummary !== 'string' ||
    !Array.isArray(obj.seoChecks) ||
    !Array.isArray(obj.keywords) ||
    !Array.isArray(obj.technicalChecklist)
  ) {
    throw new Error('INCOMPLETE_AUDIT_SCHEMA');
  }

  const aiSearchRaw = (obj.aiSearch && typeof obj.aiSearch === 'object' ? obj.aiSearch : {}) as Record<string, unknown>;
  const contentRaw = (
    obj.contentRecommendations && typeof obj.contentRecommendations === 'object'
      ? obj.contentRecommendations
      : {}
  ) as Record<string, unknown>;
  const rewritesRaw = (
    contentRaw.rewrites && typeof contentRaw.rewrites === 'object' ? contentRaw.rewrites : {}
  ) as Record<string, unknown>;

  const report: AuditReport = {
    url: typeof obj.url === 'string' && obj.url.trim() ? obj.url.trim() : fallbackUrl,
    auditDate:
      typeof obj.auditDate === 'string' && !Number.isNaN(Date.parse(obj.auditDate))
        ? obj.auditDate
        : new Date().toISOString(),
    businessSummary: obj.businessSummary,
    scores: {
      overall: clampScore(scoresRaw.overall),
      seo: clampScore(scoresRaw.seo),
      content: clampScore(scoresRaw.content),
      keywords: clampScore(scoresRaw.keywords),
      technical: clampScore(scoresRaw.technical),
      aiSearch: clampScore(scoresRaw.aiSearch ?? aiSearchRaw.score),
      summaries: {
        seo: String(summariesRaw.seo ?? 'Could not verify full SEO summary.'),
        content: String(summariesRaw.content ?? 'Could not verify full content summary.'),
        keywords: String(summariesRaw.keywords ?? 'Could not verify full keyword summary.'),
        technical: String(summariesRaw.technical ?? 'Could not verify full technical summary.'),
        aiSearch: String(summariesRaw.aiSearch ?? 'Could not verify full AI search summary.'),
      },
    },
    priorityFixes: Array.isArray(obj.priorityFixes) ? obj.priorityFixes : [],
    seoChecks: obj.seoChecks,
    localSeo:
      obj.localSeo && typeof obj.localSeo === 'object'
        ? (obj.localSeo as AuditReport['localSeo'])
        : undefined,
    contentRecommendations: {
      gaps: Array.isArray(contentRaw.gaps) ? contentRaw.gaps : [],
      ideas: Array.isArray(contentRaw.ideas) ? contentRaw.ideas : [],
      rewrites: {
        currentTitle: typeof rewritesRaw.currentTitle === 'string' ? rewritesRaw.currentTitle : undefined,
        title: String(rewritesRaw.title ?? ''),
        currentMetaDescription:
          typeof rewritesRaw.currentMetaDescription === 'string'
            ? rewritesRaw.currentMetaDescription
            : undefined,
        metaDescription: String(rewritesRaw.metaDescription ?? ''),
        currentH1: typeof rewritesRaw.currentH1 === 'string' ? rewritesRaw.currentH1 : undefined,
        h1: String(rewritesRaw.h1 ?? ''),
      },
      calendar: Array.isArray(contentRaw.calendar) ? contentRaw.calendar : [],
    },
    keywords: obj.keywords,
    technicalChecklist: obj.technicalChecklist,
    aiSearch: {
      score: clampScore(aiSearchRaw.score ?? scoresRaw.aiSearch),
      factors: Array.isArray(aiSearchRaw.factors) ? aiSearchRaw.factors : [],
      recommendations: Array.isArray(aiSearchRaw.recommendations) ? aiSearchRaw.recommendations : [],
      sampleQuestions: Array.isArray(aiSearchRaw.sampleQuestions) ? aiSearchRaw.sampleQuestions : [],
    },
    limitations: Array.isArray(obj.limitations) ? obj.limitations : [],
  };

  return report;
}

function extractGroundingSources(response: unknown): GroundingSource[] {
  try {
    const r = response as {
      candidates?: Array<{
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        };
        urlContextMetadata?: {
          urlMetadata?: Array<{ retrievedUrl?: string; urlRetrievalStatus?: string }>;
        };
      }>;
    };
    const seen = new Set<string>();
    const sources: GroundingSource[] = [];

    const urlMeta = r?.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
    for (const m of urlMeta) {
      if (m.retrievedUrl && m.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS' && !seen.has(m.retrievedUrl)) {
        seen.add(m.retrievedUrl);
        sources.push({ title: 'Live Page Context', uri: m.retrievedUrl });
      }
    }

    const chunks = r?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    for (const chunk of chunks) {
      const uri = chunk?.web?.uri;
      if (uri && !seen.has(uri)) {
        seen.add(uri);
        sources.push({ title: chunk?.web?.title || uri, uri });
      }
    }
    return sources.slice(0, 12);
  } catch {
    return [];
  }
}

function checkUrlRetrievalBlocked(response: unknown, targetUrl: string): string | null {
  try {
    const r = response as {
      candidates?: Array<{
        urlContextMetadata?: {
          urlMetadata?: Array<{ retrievedUrl?: string; urlRetrievalStatus?: string }>;
        };
      }>;
    };
    const meta = r?.candidates?.[0]?.urlContextMetadata?.urlMetadata;
    if (!meta || meta.length === 0) return null;

    const targetHost = new URL(targetUrl).hostname.replace(/^www\./, '');
    const primary = meta.find((m) => m.retrievedUrl?.includes(targetHost)) ?? meta[0];
    const status = primary?.urlRetrievalStatus;
    if (!status || status === 'URL_RETRIEVAL_STATUS_SUCCESS') return null;

    if (status.includes('UNSAFE')) {
      return 'The target URL was flagged as unsafe or restricted by automated retrieval.';
    }
    if (status.includes('ERROR') || status.includes('FAILED')) {
      return `Could not retrieve ${targetUrl} (${status}). The site may be unreachable, timing out, or blocking automated crawlers (robots.txt / firewall).`;
    }
    return null;
  } catch {
    return null;
  }
}

async function runAuditGeneration(
  ai: GoogleGenAI,
  url: string,
  context: AuditContextInput | undefined,
  useStructuredSchema: boolean
): Promise<{ report: AuditReport; rawResponse: unknown }> {
  const prompt = buildAuditPrompt(url, context);
  const schemaInstruction = useStructuredSchema
    ? ''
    : `\n\nReturn ONLY valid JSON (no markdown fences or commentary) matching this exact structure: { "url": string, "auditDate": string, "businessSummary": string, "scores": { "overall": number, "seo": number, "content": number, "keywords": number, "technical": number, "aiSearch": number, "summaries": { "seo": string, "content": string, "keywords": string, "technical": string, "aiSearch": string } }, "priorityFixes": [{ "title": string, "category": string, "impact": "High"|"Medium"|"Low", "effort": "Low"|"Medium"|"High", "description": string }], "seoChecks": [{ "item": string, "status": "Pass"|"Warning"|"Fail"|"Could not verify", "finding": string, "whyItMatters": string, "fix": string }], "localSeo": { "applicable": boolean, "location": string, "gbpSignals": string, "napConsistency": string, "localKeywords": string[], "recommendations": string[] }, "contentRecommendations": { "gaps": string[], "ideas": [{ "title": string, "keyword": string, "intent": string, "format": string, "priority": string }], "rewrites": { "currentTitle": string, "title": string, "currentMetaDescription": string, "metaDescription": string, "currentH1": string, "h1": string }, "calendar": [{ "week": string, "topic": string, "format": string }] }, "keywords": [{ "keyword": string, "intent": string, "relevance": number, "difficulty": "Low"|"Medium"|"High", "pageType": string, "tail": "Short-tail"|"Long-tail", "cluster": string, "quickWin": boolean }], "technicalChecklist": [{ "group": string, "item": string, "status": "Pass"|"Warning"|"Fail"|"Could not verify", "severity": "Critical"|"High"|"Medium"|"Low", "fix": string }], "aiSearch": { "score": number, "factors": [{ "name": string, "score": number, "finding": string }], "recommendations": [{ "title": string, "impact": string, "description": string, "example": string }], "sampleQuestions": [{ "question": string, "coverage": string }] }, "limitations": string[] }`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt + schemaInstruction,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ urlContext: {} }, { googleSearch: {} }],
      ...(useStructuredSchema
        ? {
            responseMimeType: 'application/json',
            responseSchema: AUDIT_RESPONSE_SCHEMA,
          }
        : {}),
    },
  });

  const text = response.text?.trim();
  if (!text) {
    const blockedReason = checkUrlRetrievalBlocked(response, url);
    if (blockedReason) {
      throw new Error(`SITE_UNREACHABLE::${blockedReason}`);
    }
    throw new Error('EMPTY_RESPONSE');
  }

  const jsonStr = extractJsonText(text);
  const parsed = JSON.parse(jsonStr);
  const report = validateAndNormalizeReport(parsed, url);
  report.groundingSources = extractGroundingSources(response);

  const retrievalNote = checkUrlRetrievalBlocked(response, url);
  if (retrievalNote && !report.limitations.some((l) => l.includes('unreachable'))) {
    report.limitations.unshift(retrievalNote);
  }

  return { report, rawResponse: response };
}

function classifyGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);

  if (raw === 'GEMINI_API_KEY_MISSING') {
    return {
      status: 500,
      message: 'Gemini API key is not configured on the server. Check the Settings > Secrets panel.',
    };
  }
  if (raw.startsWith('SITE_UNREACHABLE::')) {
    return {
      status: 422,
      message: raw.replace('SITE_UNREACHABLE::', ''),
    };
  }
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return {
      status: 429,
      message: 'Rate limit reached while running the audit. Please wait a moment and try again.',
    };
  }
  if (/403|PERMISSION_DENIED|API_KEY_INVALID|API key not valid/i.test(raw)) {
    return {
      status: 403,
      message: 'The configured Gemini API key was rejected. Please verify it in Settings > Secrets.',
    };
  }
  if (/EMPTY_RESPONSE/i.test(raw)) {
    return {
      status: 502,
      message: 'Gemini returned an empty response. The target site may be blocking automated inspection.',
    };
  }
  if (/SyntaxError|JSON|INVALID_JSON_STRUCTURE|INCOMPLETE_AUDIT_SCHEMA/i.test(raw)) {
    return {
      status: 502,
      message: 'We received an incomplete audit response after retrying. Please click Try again.',
    };
  }
  return {
    status: 500,
    message: `Audit failed: ${raw.slice(0, 220)}`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/audit', async (req: Request, res: Response) => {
    const { url, context } = (req.body ?? {}) as {
      url?: string;
      context?: AuditContextInput;
    };

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'A valid website URL is required.' });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      res.status(400).json({ error: 'Please enter a valid http:// or https:// website URL.' });
      return;
    }

    const targetUrl = parsedUrl.toString();

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({ error: classified.message });
      return;
    }

    // Attempt 1: Structured JSON schema + URL context + Google Search
    let lastError: unknown = null;
    try {
      const { report } = await runAuditGeneration(ai, targetUrl, context, true);
      res.json({ report });
      return;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);

      // Do not retry auth or rate-limit errors blindly
      if (/403|PERMISSION_DENIED|API_KEY_INVALID|429|RESOURCE_EXHAUSTED/i.test(msg)) {
        const classified = classifyGeminiError(err);
        res.status(classified.status).json({ error: classified.message });
        return;
      }

      // Retry once: if structured output + tools caused a 400 InvalidArgument, fall back to prompt JSON mode
      const isSchemaToolConflict = /400|INVALID_ARGUMENT|response_schema|response_mime_type|tools/i.test(msg);
      try {
        const { report } = await runAuditGeneration(ai, targetUrl, context, !isSchemaToolConflict);
        res.json({ report });
        return;
      } catch (retryErr) {
        lastError = retryErr;
      }
    }

    const classified = classifyGeminiError(lastError);
    res.status(classified.status).json({ error: classified.message });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const { auditReport, messages, question } = (req.body ?? {}) as {
      auditReport?: AuditReport;
      messages?: ChatMessage[];
      question?: string;
    };

    if (!auditReport || !question?.trim()) {
      res.status(400).json({ error: 'Audit report context and a question are required.' });
      return;
    }

    try {
      const ai = getGeminiClient();
      const historyContents = (messages ?? []).slice(-10).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      historyContents.push({
        role: 'user',
        parts: [{ text: question.trim() }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: historyContents,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}

You are answering follow-up questions specifically about the completed digital marketing audit below. Reference concrete findings, scores, keywords, and checklist items from the audit JSON. Keep answers practical, concise, and scannable with bullet points when helpful. Do not invent metrics not present in the audit.

Audit Report JSON:
${JSON.stringify(auditReport)}`,
        },
      });

      const answer = response.text?.trim();
      if (!answer) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try asking again.' });
        return;
      }
      res.json({ answer });
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({ error: classified.message });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`AuditPilot server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AuditPilot server:', err);
  process.exit(1);
});
