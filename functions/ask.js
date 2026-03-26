import nlwebIndex from '../src/generated/nlweb-index.mjs';

const STOPWORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
	'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'who',
	'why', 'with', 'you', 'your'
]);

const MAX_CONTEXT_CHARS = 10000;
const MAX_QUERY_LENGTH = 500;
const AI_TIMEOUT_MS = 10000;
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

function withTimeout(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('AI request timed out')), ms);
		promise.then(
			(val) => { clearTimeout(timer); resolve(val); },
			(err) => { clearTimeout(timer); reject(err); },
		);
	});
}

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
		const res = await withTimeout(ai.run(EMBEDDING_MODEL, { text: [query] }), AI_TIMEOUT_MS);
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

			// Blend keyword + semantic, then apply per-document searchWeight
			const weight = document.searchWeight ?? 1.0;
			const score = (keywordScore + semanticScore) * weight;
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

function buildMessages(query, context, prevExchanges) {
	const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

	if (prevExchanges && prevExchanges.length > 0) {
		const recent = prevExchanges.slice(-3);
		for (const exchange of recent) {
			messages.push({ role: 'user', content: exchange.query });
			const prevAnswer = exchange.answer.length > 500
				? exchange.answer.slice(0, 500) + '...'
				: exchange.answer;
			messages.push({ role: 'assistant', content: prevAnswer });
		}
	}

	messages.push({ role: 'user', content: `Context from joost.blog:\n\n${context}\n\nQuestion: ${query}` });
	return messages;
}

function extractSources(answer, allSources) {
	const usedUrlSet = new Set();
	const usedTitleSet = new Set();

	const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
	let match;
	while ((match = linkPattern.exec(answer)) !== null) {
		usedUrlSet.add(match[2].replace(/\/$/, ''));
		usedTitleSet.add(match[1].toLowerCase());
	}

	let usedSources = allSources.filter((s) => {
		const urlNorm = s.url.replace(/\/$/, '');
		if (usedUrlSet.has(urlNorm)) return true;
		if (usedTitleSet.has(s.title.toLowerCase())) return true;
		return false;
	});

	if (usedSources.length === 0) usedSources = allSources.slice(0, 3);
	return usedSources;
}

async function generateStreamingAnswer(ai, query, scoredResults, prevExchanges, sessionId) {
	const { context, sources } = buildContext(scoredResults);

	if (!context.trim()) {
		const fallback = fallbackSummarize(query, scoredResults.map((r) => r.document));
		return { stream: null, fallback };
	}

	const messages = buildMessages(query, context, prevExchanges);

	const response = await withTimeout(
		ai.run(MODEL, {
			messages,
			max_tokens: 512,
			temperature: 0.3,
			stream: true,
		}, {
			headers: { 'x-session-affinity': sessionId },
		}),
		AI_TIMEOUT_MS,
	);

	return { stream: response, sources };
}

async function generateAnswer(ai, query, scoredResults, prevExchanges, sessionId) {
	const { context, sources } = buildContext(scoredResults);

	if (!context.trim()) {
		return fallbackSummarize(query, scoredResults.map((r) => r.document));
	}

	try {
		const messages = buildMessages(query, context, prevExchanges);

		const response = await withTimeout(
			ai.run(MODEL, {
				messages,
				max_tokens: 512,
				temperature: 0.3,
			}, {
				headers: { 'x-session-affinity': sessionId },
			}),
			AI_TIMEOUT_MS,
		);

		const answer = response.response
			|| response.result?.response
			|| response.choices?.[0]?.message?.content;
		if (!answer || typeof answer !== 'string' || answer.trim().length < 5) {
			throw new Error('Empty or malformed model response');
		}

		return { answer, sources: extractSources(answer, sources) };
	} catch (err) {
		console.error('AI generation failed, falling back:', err.message);
		return fallbackSummarize(query, scoredResults.map((r) => r.document));
	}
}

async function normalizeRequest(request) {
	const url = new URL(request.url);
	const query = url.searchParams;
	let body = {};

	if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
		try {
			body = await request.json();
		} catch {
			throw new Error('Invalid JSON body');
		}
	}

	return {
		query: String(body.query || body.q || query.get('query') || query.get('q') || '').slice(0, MAX_QUERY_LENGTH),
		mode: body.mode || query.get('mode') || 'list',
		site: body.site || query.get('site') || 'joost.blog',
		prev: String(body.prev || query.get('prev') || '').slice(0, 10000),
		decontextualized_query: String(body.decontextualized_query || query.get('decontextualized_query') || '').slice(0, MAX_QUERY_LENGTH),
		query_id: body.query_id || query.get('query_id') || crypto.randomUUID(),
		debug: body.debug || query.get('debug') === 'true',
	};
}

async function handle(request, env) {
	const startTime = Date.now();

	let payload;
	try {
		payload = await normalizeRequest(request);
	} catch (err) {
		return json({ error: err.message }, 400);
	}

	const query = payload.decontextualized_query || payload.query;

	if (!query.trim()) {
		return json({
			error: 'Missing required query parameter: query',
			query_id: payload.query_id,
		}, 400);
	}

	// Guard against empty or corrupt index
	if (!Array.isArray(nlwebIndex) || nlwebIndex.length === 0) {
		return json({
			error: 'Search index is unavailable. Please try again later.',
			query_id: payload.query_id,
		}, 503);
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

	// Streaming mode: return SSE stream with tokens + final sources event
	if (payload.mode === 'stream' && ai) {
		try {
			const { stream, fallback, sources } = await generateStreamingAnswer(
				ai, query, scoredResults, prevExchanges, payload.query_id
			);

			// If retrieval found nothing, return fallback as a single non-streamed response
			if (!stream && fallback) {
				return json({ ...fallback, query_id: payload.query_id, mode: 'stream' });
			}

			// Build an SSE response that pipes the AI stream and appends sources
			const { readable, writable } = new TransformStream();
			const writer = writable.getWriter();
			const encoder = new TextEncoder();

			const sseHeaders = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			};

			// Process stream in background with a safety timeout
			(async () => {
				let fullAnswer = '';
				const streamTimeout = setTimeout(async () => {
					try {
						const msg = fullAnswer
							? 'Response was cut short due to a timeout.'
							: 'The AI took too long to respond. Please try again.';
						await writer.write(encoder.encode(`data: ${JSON.stringify({ error: msg, done: true })}\n\n`));
						await writer.close();
					} catch { /* already closed */ }
				}, AI_TIMEOUT_MS * 3); // 30s total for streaming (tokens arrive incrementally)

				try {
					const reader = stream.getReader ? stream.getReader() : null;
					if (reader) {
						const decoder = new TextDecoder();
						while (true) {
							const { done, value } = await reader.read();
							if (done) break;
							const chunk = typeof value === 'string' ? value : decoder.decode(value, { stream: true });
							// Workers AI SSE format: lines starting with "data: "
							const lines = chunk.split('\n');
							for (const line of lines) {
								if (line.startsWith('data: ')) {
									const data = line.slice(6);
									if (data === '[DONE]') continue;
									try {
										const parsed = JSON.parse(data);
										const token = parsed.response || parsed.choices?.[0]?.delta?.content || '';
										if (token) {
											fullAnswer += token;
											await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
										}
									} catch {
										// Non-JSON data line, skip
									}
								}
							}
						}
					}

					clearTimeout(streamTimeout);

					// Send sources as final event (with fallback if answer was empty/garbage)
					if (fullAnswer.trim().length < 5) {
						const fallback = fallbackSummarize(query, scoredResults.map((r) => r.document));
						await writer.write(encoder.encode(`data: ${JSON.stringify({ fallback: fallback.answer, sources: fallback.sources, done: true })}\n\n`));
					} else {
						const usedSources = extractSources(fullAnswer, sources);
						await writer.write(encoder.encode(`data: ${JSON.stringify({ sources: usedSources, done: true })}\n\n`));
					}
				} catch (err) {
					clearTimeout(streamTimeout);
					await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`));
				} finally {
					try { await writer.close(); } catch { /* already closed */ }
				}
			})();

			return new Response(readable, { headers: sseHeaders });
		} catch (err) {
			// Fall back to non-streaming on any error
			const generated = fallbackSummarize(query, scoredResults.map((r) => r.document));
			return json({ ...generated, query_id: payload.query_id, mode: 'stream', fallback: true });
		}
	}

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
