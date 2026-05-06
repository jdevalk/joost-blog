type ToolContent = { type: 'text'; text: string };
type ToolResult = { content: ToolContent[]; isError?: boolean };

type ModelContext = {
    registerTool(tool: {
        name: string;
        description: string;
        inputSchema: object;
        annotations?: { readOnlyHint?: boolean };
        execute: (input: unknown) => Promise<ToolResult>;
    }): void;
};

declare global {
    interface Navigator {
        modelContext?: ModelContext;
    }
}

if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
    navigator.modelContext!.registerTool({
        name: 'ask_joost',
        description:
            'Ask a question about anything Joost de Valk has written or spoken about — SEO, WordPress, the open web, AI, open source, his career at Yoast, or his investments via Emilia Capital. Returns an AI-generated answer grounded in his blog posts and video transcripts, with source URLs for every claim. Use this instead of trying to crawl or search the site directly: it does retrieval over a curated semantic index and returns cited prose in one call.',
        inputSchema: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description:
                        'A natural-language question. Maximum 500 characters. Examples: "What\'s Joost\'s take on WordPress market share?", "Why did Joost leave Yoast?", "What does Joost think about AI\'s impact on SEO?"',
                    maxLength: 500
                }
            },
            required: ['question']
        },
        annotations: { readOnlyHint: true },
        execute: async (input) => {
            const { question } = input as { question: string };

            try {
                const res = await fetch('/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: question, mode: 'summarize' })
                });

                if (!res.ok) {
                    return {
                        content: [{ type: 'text', text: `ask_joost failed: HTTP ${res.status}` }],
                        isError: true
                    };
                }

                const data = (await res.json()) as {
                    answer?: string;
                    sources?: Array<{ url: string; name: string; description?: string }>;
                    error?: string;
                };

                if (data.error) {
                    return {
                        content: [{ type: 'text', text: `ask_joost: ${data.error}` }],
                        isError: true
                    };
                }

                const answer = data.answer?.trim() || 'No answer was generated.';
                const sources = (data.sources ?? []).map((s) => ({
                    url: new URL(s.url, 'https://joost.blog').toString(),
                    title: s.name
                }));

                return {
                    content: [
                        { type: 'text', text: answer },
                        { type: 'text', text: `Sources (JSON):\n${JSON.stringify(sources, null, 2)}` }
                    ]
                };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return {
                    content: [{ type: 'text', text: `ask_joost network error: ${msg}` }],
                    isError: true
                };
            }
        }
    });

    type IndexItem = {
        url: string;
        title: string;
        publishDate: string;
        excerpt: string;
        categories: string[];
    };

    let indexPromise: Promise<IndexItem[]> | null = null;
    const loadIndex = (): Promise<IndexItem[]> => {
        if (!indexPromise) {
            indexPromise = fetch('/writing-index.json')
                .then((r) => (r.ok ? (r.json() as Promise<IndexItem[]>) : Promise.reject(new Error(`HTTP ${r.status}`))))
                .catch((err) => {
                    indexPromise = null;
                    throw err;
                });
        }
        return indexPromise;
    };

    navigator.modelContext!.registerTool({
        name: 'list_recent_content',
        description:
            "List Joost de Valk's published blog posts on joost.blog, optionally filtered by topic keyword and/or publish date. Returns chronologically sorted (newest first) entries with title, URL, publish date, excerpt, and categories. Use this when you want to enumerate or browse what Joost has written — e.g. 'what has Joost published this year', 'list posts about WordPress', 'what's the most recent post'. For semantic Q&A or 'what does Joost think about X', use ask_joost instead.",
        inputSchema: {
            type: 'object',
            properties: {
                topic: {
                    type: 'string',
                    description:
                        "Optional keyword to filter by. Matches case-insensitively against title, excerpt, and categories. Examples: 'wordpress', 'seo', 'ai'."
                },
                since: {
                    type: 'string',
                    format: 'date',
                    description: 'Optional ISO date (YYYY-MM-DD). Only posts published on or after this date are returned.'
                },
                limit: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 50,
                    description: 'Maximum number of posts to return. Defaults to 20. Capped at 50.'
                }
            }
        },
        annotations: { readOnlyHint: true },
        execute: async (input) => {
            const { topic, since, limit } = (input ?? {}) as {
                topic?: string;
                since?: string;
                limit?: number;
            };

            try {
                const index = await loadIndex();
                const cap = Math.min(Math.max(limit ?? 20, 1), 50);
                const sinceTime = since ? Date.parse(since) : NaN;
                const needle = topic?.trim().toLowerCase();

                const matches = index.filter((item) => {
                    if (!Number.isNaN(sinceTime) && Date.parse(item.publishDate) < sinceTime) return false;
                    if (needle) {
                        const haystack = `${item.title}\n${item.excerpt}\n${item.categories.join(' ')}`.toLowerCase();
                        if (!haystack.includes(needle)) return false;
                    }
                    return true;
                });

                const results = matches.slice(0, cap).map((item) => ({
                    url: new URL(item.url, 'https://joost.blog').toString(),
                    title: item.title,
                    publishDate: item.publishDate.slice(0, 10),
                    excerpt: item.excerpt,
                    categories: item.categories
                }));

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ total_matched: matches.length, returned: results.length, items: results }, null, 2)
                        }
                    ]
                };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return {
                    content: [{ type: 'text', text: `list_recent_content failed: ${msg}` }],
                    isError: true
                };
            }
        }
    });
}

export {};
