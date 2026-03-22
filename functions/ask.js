import nlwebIndex from '../src/generated/nlweb-index.mjs';

const STOPWORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
	'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'who',
	'why', 'with', 'you', 'your'
]);

const MAX_CONTEXT_CHARS = 10000;
const MODEL = '@cf/meta/llama-3.1-70b-instruct';
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

const SYSTEM_PROMPT = `You are a helpful assistant answering questions about Joost de Valk and his blog joost.blog. Joost is an internet entrepreneur from the Netherlands, founder of Yoast (the WordPress SEO plugin company), and investor at Emilia Capital.

Rules:
- Answer ONLY based on the provided context. Do not make up information.
- If the context doesn't contain enough information to answer, say so honestly.
- Keep answers concise and direct — 2-4 sentences for simple questions, more for complex ones.
- ALWAYS link to the blog posts you reference using markdown: [Post Title](URL). The URL is provided in the context for each post. Every answer should include at least one link.
- Do not repeat the question back. Just answer it.
- Write in a natural, conversational tone.
- Use markdown formatting: **bold** for emphasis, bullet lists where appropriate, and links for referenced posts.
- Each post has a publication date. When posts contain conflicting or evolving views, prefer the most recent post — Joost's views may have changed over time. You can acknowledge the evolution if relevant.`;

const headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Content-Type': 'application/json; charset=utf-8',
};

function json(body, status = 200) {
	return new Response(JSON.stringify(body, null, 2), {
		status,
		headers,
	});
}

function tokenize(value = '') {
	return String(value)
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
		.split(/\s+/)
		.map((token) => token.trim())
		.filter((token) => token && token.length > 1 && !STOPWORDS.has(token));
}

function buildNeedle(document) {
	return [
		document.name,
		document.description,
		document.type,
		...(document.keywords || []),
		document.text,
	].join(' \n ').toLowerCase();
}

function scoreDocument(document, tokens, fullQuery) {
	const needle = buildNeedle(document);
	let score = 0;

	// Exact phrase match bonus
	if (fullQuery && needle.includes(fullQuery.toLowerCase())) {
		score += 20;
	}

	for (const token of tokens) {
		const occurrences = needle.split(token).length - 1;
		if (!occurrences) continue;

		score += occurrences;
		if (document.name.toLowerCase().includes(token)) score += 8;
		if (document.description.toLowerCase().includes(token)) score += 4;
		if ((document.keywords || []).some((keyword) => String(keyword).toLowerCase().includes(token))) score += 6;
		if (document.url.toLowerCase().includes(token)) score += 3;
	}

	// Pages are authoritative/canonical — boost them over blog posts and videos
	if (score > 0 && document.type === 'WebPage') score += 15;

	// Videos (transcript-heavy) are less useful as sources — demote slightly
	if (score > 0 && document.type === 'VideoObject') score = Math.round(score * 0.7);

	return score;
}

function cosineSimilarity(a, b) {
	if (!a || !b || a.length !== b.length) return 0;
	let dot = 0, magA = 0, magB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		magA += a[i] * a[i];
		magB += b[i] * b[i];
	}
	const mag = Math.sqrt(magA) * Math.sqrt(magB);
	return mag === 0 ? 0 : dot / mag;
}

async function embedQuery(ai, query) {
	if (!ai) return null;
	try {
		const res = await ai.run(EMBEDDING_MODEL, { text: [query] });
		return res?.data?.[0] || null;
	} catch {
		return null;
	}
}

function search(query, queryEmbedding) {
	const tokens = tokenize(query);

	return nlwebIndex
		.map((document) => {
			const keywordScore = scoreDocument(document, tokens, query);

			// Semantic score: cosine similarity scaled to comparable range
			let semanticScore = 0;
			if (queryEmbedding && document.embedding) {
				const similarity = cosineSimilarity(queryEmbedding, document.embedding);
				// Scale similarity (typically 0.3-0.9) to a score range comparable to keyword scoring
				semanticScore = Math.max(0, similarity - 0.3) * 100;
			}

			// Blend: keyword and semantic scores complement each other
			const score = keywordScore + semanticScore;
			return { document, score, keywordScore, semanticScore };
		})
		.filter((item) => item.score > 2)
		.sort((a, b) => b.score - a.score)
		.slice(0, 8);
}

function buildContext(scoredResults) {
	// Sort pages first within the results so the LLM sees canonical info before blog posts
	const sorted = [...scoredResults].sort((a, b) => {
		const aPage = a.document.type === 'WebPage' ? 1 : 0;
		const bPage = b.document.type === 'WebPage' ? 1 : 0;
		return bPage - aPage || b.score - a.score;
	});

	const maxResults = Math.min(sorted.length, 5);
	const perResultBudget = Math.floor(MAX_CONTEXT_CHARS / maxResults);
	let context = '';
	const sources = [];

	for (let i = 0; i < maxResults; i++) {
		const { document } = sorted[i];
		const text = document.text.length > perResultBudget
			? document.text.slice(0, perResultBudget) + '...'
			: document.text;
		const date = document.datePublished ? `Published: ${document.datePublished.split('T')[0]}\n` : '';
		context += `## ${document.name}\nURL: https://joost.blog${document.url}\n${date}${text}\n\n`;
		sources.push({ url: `https://joost.blog${document.url}`, title: document.name });
	}

	return { context, sources };
}

function fallbackSummarize(query, results) {
	if (!results.length) {
		return {
			answer: `I couldn't find a good match on joost.blog for "${query}". Try a more specific query or fewer keywords.`,
			sources: [],
		};
	}

	const top = results[0];
	const extras = results.slice(1, 3).map((r) => r.name);
	const extraText = extras.length ? ` Related matches include ${extras.join(' and ')}.` : '';
	return {
		answer: `${top.name} looks like the best match for "${query}". ${top.description}${extraText}`,
		sources: results.slice(0, 3).map((r) => ({ url: `https://joost.blog${r.url}`, title: r.name })),
	};
}

async function generateAnswer(ai, query, scoredResults, prevExchanges) {
	const { context, sources } = buildContext(scoredResults);

	if (!context.trim()) {
		return fallbackSummarize(query, scoredResults.map((r) => r.document));
	}

	try {
		// Build message history from previous exchanges
		const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

		if (prevExchanges && prevExchanges.length > 0) {
			// Include up to 3 previous exchanges for context
			for (const exchange of prevExchanges.slice(-3)) {
				messages.push({ role: 'user', content: exchange.query });
				messages.push({ role: 'assistant', content: exchange.answer });
			}
		}

		messages.push({ role: 'user', content: `Context from joost.blog:\n\n${context}\n\nQuestion: ${query}` });

		const response = await ai.run(MODEL, {
			messages,
			max_tokens: 512,
			temperature: 0.3,
		});

		const answer = response.response || response.result?.response;
		if (!answer) throw new Error('Empty model response');

		// Extract sources the model actually referenced (by URL in markdown links)
		const usedUrls = new Set();
		const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
		let match;
		while ((match = linkPattern.exec(answer)) !== null) {
			usedUrls.add(match[2].replace(/\/$/, ''));
		}

		// Filter sources to only those referenced in the answer, preserving order
		let usedSources = sources.filter((s) => usedUrls.has(s.url.replace(/\/$/, '')));

		// If the model didn't link to anything, fall back to all context sources
		if (usedSources.length === 0) usedSources = sources;

		return { answer, sources: usedSources };
	} catch (err) {
		// Fallback to deterministic summary on any LLM failure
		console.error('AI generation failed, falling back:', err.message);
		return fallbackSummarize(query, scoredResults.map((r) => r.document));
	}
}

async function normalizeRequest(request) {
	const url = new URL(request.url);
	const query = url.searchParams;
	let body = {};

	if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
		body = await request.json();
	}

	return {
		query: body.query || body.q || query.get('query') || query.get('q') || '',
		mode: body.mode || query.get('mode') || 'list',
		site: body.site || query.get('site') || 'joost.blog',
		prev: body.prev || query.get('prev') || '',
		decontextualized_query: body.decontextualized_query || query.get('decontextualized_query') || '',
		query_id: body.query_id || query.get('query_id') || crypto.randomUUID(),
	};
}

async function handle(request, env) {
	const payload = await normalizeRequest(request);
	const query = payload.decontextualized_query || payload.query;

	if (!query.trim()) {
		return json({
			error: 'Missing required query parameter: query',
			query_id: payload.query_id,
		}, 400);
	}

	// Embed query for semantic search (runs in parallel with keyword search intent)
	const ai = env?.AI;
	const queryEmbedding = ai ? await embedQuery(ai, query) : null;

	const scoredResults = search(query, queryEmbedding);

	const results = scoredResults.map(({ document, score }) => ({
		url: document.url,
		name: document.name,
		site: payload.site,
		score,
		description: document.description,
		schema_object: document.schema_object,
	}));

	const response = {
		query_id: payload.query_id,
		site: payload.site,
		mode: payload.mode,
		query,
		results,
	};

	if (payload.mode === 'summarize' || payload.mode === 'generate') {
		let generated;

		// Parse previous exchanges from prev parameter (JSON array of {query, answer} objects)
		let prevExchanges = [];
		if (payload.prev) {
			try {
				prevExchanges = JSON.parse(payload.prev);
			} catch {
				// prev can also be a comma-separated list of queries (NLWeb format) — ignore for now
			}
		}

		if (ai) {
			generated = await generateAnswer(ai, query, scoredResults, prevExchanges);
		} else {
			// No AI binding available (local dev) — use deterministic fallback
			generated = fallbackSummarize(query, scoredResults.map((r) => r.document));
		}

		response.answer = generated.answer;
		response.summary = generated.answer;
		response.sources = generated.sources;
	}

	return json(response);
}

export function onRequestOptions() {
	return new Response(null, { status: 204, headers });
}

export async function onRequestGet(context) {
	return handle(context.request, context.env);
}

export async function onRequestPost(context) {
	return handle(context.request, context.env);
}
