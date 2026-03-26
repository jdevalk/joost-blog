import nlwebIndex from '../src/generated/nlweb-index.mjs';

const STOPWORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
	'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'who',
	'why', 'with', 'you', 'your'
]);

const MAX_CONTEXT_CHARS = 10000;
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

// Query alias/synonym expansion — applied before tokenization and embedding
const QUERY_ALIASES = [
	[/\bwp\b/gi, 'wordpress'],
	[/\bcms share\b/gi, 'cms market share'],
	[/\bseo plugin\b/gi, 'yoast seo plugin'],
	[/\bgutenberg\b/gi, 'gutenberg block editor'],
	[/\bblock editor\b/gi, 'gutenberg block editor'],
	[/\bemilia\b/gi, 'emilia capital'],
	[/\bdev-?rel\b/gi, 'developer relations'],
	[/\bprogress ?planner\b/gi, 'progress planner plugin'],
];

function expandAliases(query) {
	let expanded = query;
	for (const [pattern, replacement] of QUERY_ALIASES) {
		expanded = expanded.replace(pattern, replacement);
	}
	return expanded;
}

const TYPE_LABELS = {
	'WebPage': 'page',
	'BlogPosting': 'blog post',
	'VideoObject': 'video',
};

const SYSTEM_PROMPT = `You are a helpful assistant answering questions about Joost de Valk and his blog joost.blog. Joost is an internet entrepreneur from the Netherlands, founder of Yoast (the WordPress SEO plugin company), and investor at Emilia Capital.

Rules:
- Answer ONLY based on the provided context. Do not make up information.
- If the context doesn't contain enough information to answer, say so honestly.
- Keep answers concise and direct — 2-4 sentences for simple questions, more for complex ones.
- Do not repeat the question back. Just answer it.
- Write in a natural, conversational tone.
- Use markdown formatting: **bold** for emphasis, bullet lists where appropriate, and links for referenced posts.

Attribution:
- ALWAYS link to the sources you reference using markdown: [Post Title](URL). Every answer must include at least one link.
- Only cite sources that directly support your answer. Do not link to sources just because they were provided.
- Prefer blog posts and pages over video transcripts as sources — video transcripts are rougher and less authoritative.

Temporal awareness:
- Each source has a publication date and content type. Pay attention to dates.
- When sources contain conflicting or evolving views, prefer the most recent source — Joost's views may have changed over time.
- If a question asks about Joost's current view, base your answer on the most recent relevant source.
- When views have clearly evolved, briefly acknowledge the change (e.g., "Joost initially thought X, but as of [date] his view is Y").
- For factual/historical questions (e.g., "when did X happen?"), older sources are fine.

Follow-up questions:
- This may be a multi-turn conversation. Previous exchanges are included in the message history.
- When the user asks a vague follow-up (e.g., "what about that?", "tell me more", "and governance?"), interpret it in the context of the prior conversation.
- Base your answer on the NEW context provided with the follow-up question, not on the previous answer's context. The retrieval system has already searched for relevant content based on the follow-up.
- If the follow-up doesn't make sense without prior context and the new context doesn't help, ask the user to clarify.`;

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
	const nameLower = document.name.toLowerCase();
	const descLower = document.description.toLowerCase();
	const urlLower = document.url.toLowerCase();
	const keywordsLower = (document.keywords || []).map((k) => String(k).toLowerCase());
	let score = 0;

	// Exact phrase match bonus
	if (fullQuery && needle.includes(fullQuery.toLowerCase())) {
		score += 20;
	}

	for (const token of tokens) {
		const occurrences = needle.split(token).length - 1;
		if (!occurrences) continue;

		// Cap body occurrence score with log scaling — prevents long transcripts from dominating
		score += Math.min(occurrences, 3) + Math.log2(Math.max(occurrences - 3, 1));

		// Structured field matches are the strongest signal
		if (nameLower.includes(token)) score += 10;
		if (descLower.includes(token)) score += 5;
		if (keywordsLower.some((kw) => kw.includes(token))) score += 7;
		if (urlLower.includes(token)) score += 4;
	}

	// Apply per-document searchWeight from frontmatter (default 1.0)
	// Use this to boost authoritative pages or dampen low-value ones
	const weight = document.searchWeight ?? 1.0;
	score = score * weight;

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
	const expanded = expandAliases(query);
	const tokens = tokenize(expanded);

	return nlwebIndex
		.map((document) => {
			const keywordScore = scoreDocument(document, tokens, expanded);

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
		const typeLabel = TYPE_LABELS[document.type] || 'content';
		const date = document.datePublished ? document.datePublished.split('T')[0] : null;
		const meta = [`Type: ${typeLabel}`, date ? `Published: ${date}` : null].filter(Boolean).join(' | ');
		context += `## ${document.name}\nURL: https://joost.blog${document.url}\n${meta}\n${text}\n\n`;
		sources.push({
			url: `https://joost.blog${document.url}`,
			title: document.name,
			type: typeLabel,
			datePublished: date,
		});
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

// Build a lightweight query augmentation from conversation history for retrieval
function augmentQuery(query, prevExchanges) {
	if (!prevExchanges || prevExchanges.length === 0) return query;

	// Short/vague follow-ups likely need context from the previous turn
	const isVagueFollowUp = query.split(/\s+/).length <= 5
		|| /^(what about|tell me more|and |how about|why|can you|more on)/i.test(query);

	if (!isVagueFollowUp) return query;

	// Append the previous query to give retrieval more signal
	const lastQuery = prevExchanges[prevExchanges.length - 1]?.query;
	if (lastQuery) return `${query} (context: ${lastQuery})`;

	return query;
}

async function generateAnswer(ai, query, scoredResults, prevExchanges, sessionId) {
	const { context, sources } = buildContext(scoredResults);

	if (!context.trim()) {
		return fallbackSummarize(query, scoredResults.map((r) => r.document));
	}

	try {
		// Build message history — include only the most recent exchanges to avoid stale context
		const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

		if (prevExchanges && prevExchanges.length > 0) {
			// Keep last 3 exchanges max, but summarize older ones to save tokens
			const recent = prevExchanges.slice(-3);
			for (const exchange of recent) {
				messages.push({ role: 'user', content: exchange.query });
				// Truncate long previous answers to save context budget
				const prevAnswer = exchange.answer.length > 500
					? exchange.answer.slice(0, 500) + '...'
					: exchange.answer;
				messages.push({ role: 'assistant', content: prevAnswer });
			}
		}

		messages.push({ role: 'user', content: `Context from joost.blog:\n\n${context}\n\nQuestion: ${query}` });

		const response = await ai.run(MODEL, {
			messages,
			max_tokens: 512,
			temperature: 0.3,
		}, {
			headers: { 'x-session-affinity': sessionId },
		});

		const answer = response.response
			|| response.result?.response
			|| response.choices?.[0]?.message?.content;
		if (!answer) throw new Error('Empty model response');

		// Extract sources the model actually referenced
		const usedUrlSet = new Set();
		const usedTitleSet = new Set();

		// Match markdown links: [Title](URL)
		const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
		let match;
		while ((match = linkPattern.exec(answer)) !== null) {
			usedUrlSet.add(match[2].replace(/\/$/, ''));
			usedTitleSet.add(match[1].toLowerCase());
		}

		// Filter sources: match by URL first, then by title mention as fallback
		let usedSources = sources.filter((s) => {
			const urlNorm = s.url.replace(/\/$/, '');
			if (usedUrlSet.has(urlNorm)) return true;
			// Title-based fallback: model may reference a post by name without linking
			if (usedTitleSet.has(s.title.toLowerCase())) return true;
			return false;
		});

		// If the model didn't link to anything, fall back to top 3 context sources
		if (usedSources.length === 0) usedSources = sources.slice(0, 3);

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
		debug: body.debug || query.get('debug') === 'true',
	};
}

async function handle(request, env) {
	const startTime = Date.now();
	const payload = await normalizeRequest(request);
	const query = payload.decontextualized_query || payload.query;

	if (!query.trim()) {
		return json({
			error: 'Missing required query parameter: query',
			query_id: payload.query_id,
		}, 400);
	}

	// Parse previous exchanges early so we can use them for query augmentation
	let prevExchanges = [];
	if (payload.prev) {
		try {
			prevExchanges = JSON.parse(payload.prev);
		} catch {
			// prev can also be a comma-separated list of queries (NLWeb format) — ignore
		}
	}

	// Augment vague follow-ups with context from previous turn for better retrieval
	const searchQuery = augmentQuery(query, prevExchanges);

	// Embed query for semantic search
	const ai = env?.AI;
	const embedStart = Date.now();
	const queryEmbedding = ai ? await embedQuery(ai, searchQuery) : null;
	const embedMs = Date.now() - embedStart;

	const searchStart = Date.now();
	const scoredResults = search(searchQuery, queryEmbedding);
	const searchMs = Date.now() - searchStart;

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

	let generateMs = 0;
	if (payload.mode === 'summarize' || payload.mode === 'generate') {
		let generated;

		const genStart = Date.now();
		if (ai) {
			generated = await generateAnswer(ai, query, scoredResults, prevExchanges, payload.query_id);
		} else {
			// No AI binding available (local dev) — use deterministic fallback
			generated = fallbackSummarize(query, scoredResults.map((r) => r.document));
		}
		generateMs = Date.now() - genStart;

		response.answer = generated.answer;
		response.summary = generated.answer;
		response.sources = generated.sources;
	}

	if (payload.debug) {
		response.debug = {
			timing: {
				total_ms: Date.now() - startTime,
				embed_ms: embedMs,
				search_ms: searchMs,
				generate_ms: generateMs,
			},
			retrieval: scoredResults.map(({ document, score, keywordScore, semanticScore }) => ({
				id: document.id || document.url,
				name: document.name,
				url: document.url,
				type: document.type,
				datePublished: document.datePublished,
				score,
				keywordScore,
				semanticScore,
			})),
			index_size: nlwebIndex.length,
			had_embedding: !!queryEmbedding,
			model: MODEL,
		};
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
