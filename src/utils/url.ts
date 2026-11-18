export function validateAndNormalizeUrl(rawInput: string): {
  valid: boolean;
  url: string;
  error?: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, url: '', error: 'Please enter a website URL to audit.' };
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        url: '',
        error: 'Only http:// and https:// website URLs are supported.',
      };
    }

    const hostname = parsed.hostname;
    if (!hostname || !hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
      return {
        valid: false,
        url: '',
        error: 'Enter a valid domain name (for example, example.com or https://example.com).',
      };
    }

    if (/\s/.test(candidate)) {
      return {
        valid: false,
        url: '',
        error: 'Website URLs cannot contain spaces.',
      };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return {
      valid: false,
      url: '',
      error: 'That does not look like a valid URL. Try something like example.com.',
    };
  }
}

export function normalizeAuditKey(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${host}${path}`;
  } catch {
    return rawUrl.toLowerCase().trim();
  }
}

export function getDisplayHost(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, '') + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return rawUrl;
  }
}

export function getScoreLabel(score: number): 'Poor' | 'Needs work' | 'Good' | 'Excellent' {
  if (score < 50) return 'Poor';
  if (score < 65) return 'Needs work';
  if (score < 85) return 'Good';
  return 'Excellent';
}

export function getGaugeTier(score: number): 'red' | 'amber' | 'green' {
  if (score < 50) return 'red';
  if (score < 75) return 'amber';
  return 'green';
}

export function formatAuditDate(isoOrString: string): string {
  const parsed = new Date(isoOrString);
  if (Number.isNaN(parsed.getTime())) {
    return isoOrString;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
