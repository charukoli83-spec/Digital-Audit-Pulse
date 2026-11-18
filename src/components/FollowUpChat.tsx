import { useState, type FormEvent } from 'react';
import { Loader2, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditReport, ChatMessage } from '../types/audit';

interface FollowUpChatProps {
  report: AuditReport;
}

const STARTER_PROMPTS = [
  'What should I fix first this week for the fastest SEO gain?',
  'Write an FAQ schema JSON-LD block tailored to this site.',
  'Which 5 quick-win keywords should we build landing pages for first?',
];

export function FollowUpChat({ report }: FollowUpChatProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendQuestion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setExpanded(true);
    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditReport: report,
          messages,
          question: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.answer) {
        throw new Error(data.error || 'Could not generate a follow-up answer.');
      }
      setMessages([...nextMessages, { role: 'model', text: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendQuestion(input);
  }

  return (
    <section
      aria-label="Ask follow-up questions about this audit"
      className="mt-6 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 print:hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 shrink-0">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Ask Follow-Up Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chat with Gemini using this complete audit report as context
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5 dark:border-slate-800">
          {messages.length === 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendQuestion(prompt)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {messages.length > 0 && (
            <div className="mb-4 max-h-96 space-y-3 overflow-y-auto pr-1">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'ml-auto max-w-2xl bg-indigo-600 text-white'
                      : 'mr-auto max-w-3xl border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>Analyzing your audit report...</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mb-3 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a keyword, rewrite, schema snippet, or priority fix..."
              aria-label="Follow-up question"
              className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send follow-up question"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
