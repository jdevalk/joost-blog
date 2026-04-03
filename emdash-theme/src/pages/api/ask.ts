import type { APIRoute } from 'astro';
import nlwebIndex from '../../generated/nlweb-index.mjs';
import { MAX_QUERY_LENGTH, AI_TIMEOUT_MS, MODEL } from '../../utils/ask/config.ts';
import { search, augmentQuery } from '../../utils/ask/retrieval.ts';
import {
	generateStreamingAnswer, generateAnswer,
	fallbackSummarize, extractSources,
	buildContext, buildMessages,
} from '../../utils/ask/generation.ts';
import { withTimeout } from '../../utils/ask/config.ts';

export const prerender = false;

const corsHeaders: Record<string, string> = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonHeaders: Record<string, string> = {
	...corsHeaders,
	'Content-Type': 'application/json; charset=utf-8',
};

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body, null, 2), {
		status,
		headers: jsonHeaders,
	});
}

function sanitizeQuery(raw: string): string {
	return raw
		.replace(/\b(ignore|disregard|forget|override)\b.{0,30}\b(previous|above|prior|system|all)\b.{0,30}\b(instructions?|prompts?|rules?|context)\b/gi, '')
		.replace(/\b(you are now|act as|pretend to be|roleplay as|new persona|system prompt)\b/gi, '')
		.replace(/\b(do not follow|stop being|bypass|jailbreak)\b/gi, '')
		.replace(/\b(translate|translation|respond in|answer in|reply in|write in)\b.{0,20}\b(french|german|spanish|chinese|japanese|korean|arabic|russian|hindi|portuguese|dutch|italian|polish|turkish|swedish|thai|indonesian|vietnamese|hebrew|czech|greek|danish|finnish|norwegian|romanian|hungarian|ukrainian|bengali|tamil|swahili)\b/gi, '')
		.trim();
}

interface NormalizedPayload {
	query: string;
	mode: string;
	site: string;
	prev: string;
	decontextualized_query: string;
	query_id: string;
	debug: boolean;
}

async function normalizeRequest(request: Request): Promise<NormalizedPayload> {
	const url = new URL(request.url);
	const query = url.searchParams;
	let body: Record<string, any> = {};

	if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
		try {
			body = await request.json();
		} catch {
			throw new Error('Invalid JSON body');
		}
	}

	return {
		query: sanitizeQuery(String(body.query || body.q || query.get('query') || query.get('q') || '').slice(0, MAX_QUERY_LENGTH)),
		mode: body.mode || query.get('mode') || 'list',
		site: body.site || query.get('site') || 'joost.blog',
		prev: String(body.prev || query.get('prev') || '').slice(0, 10000),
		decontextualized_query: String(body.decontextualized_query || query.get('decontextualized_query') || '').slice(0, MAX_QUERY_LENGTH),
		query_id: body.query_id || query.get('query_id') || crypto.randomUUID(),
		debug: body.debug || query.get('debug') === 'true',
	};
}

function handleStreamingResponse(
	stream: ReadableStream,
	sources: any[],
	query: string,
	scoredResults: any[],
	writer: WritableStreamDefaultWriter,
	encoder: TextEncoder,
): void {
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
		}, AI_TIMEOUT_MS * 3);

		try {
			const reader = stream.getReader ? stream.getReader() : null;
			if (reader) {
				const decoder = new TextDecoder();
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = typeof value === 'string' ? value : decoder.decode(value, { stream: true });
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
				const fallback = fallbackSummarize(query, scoredResults.map((r: any) => r.document));
				await writer.write(encoder.encode(`data: ${JSON.stringify({ fallback: fallback.answer, sources: fallback.sources, done: true })}\n\n`));
			} else {
				const usedSources = extractSources(fullAnswer, sources);
				await writer.write(encoder.encode(`data: ${JSON.stringify({ sources: usedSources, done: true })}\n\n`));
			}
		} catch (err: any) {
			clearTimeout(streamTimeout);
			await writer.write(encoder.encode(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`));
		} finally {
			try { await writer.close(); } catch { /* already closed */ }
		}
	})();
}

async function handle(request: Request): Promise<Response> {
	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	const startTime = Date.now();

	let ai: any = null;
	try {
		const { env } = await import('cloudflare:workers');
		ai = env.AI;
	} catch {
		// Running locally without Cloudflare bindings
	}

	let payload: NormalizedPayload;
	try {
		payload = await normalizeRequest(request);
	} catch (err: any) {
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
	let prevExchanges: any[] = [];
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
	const embedStart = Date.now();
	let queryEmbedding: number[] | null = null;
	if (ai) {
		try {
			const { embedQuery } = await import('../../utils/ask/retrieval.ts');
			queryEmbedding = await embedQuery(ai, searchQuery);
		} catch {
			// Embedding failed, fall back to keyword-only search
		}
	}
	const embedMs = Date.now() - embedStart;

	const searchStart = Date.now();
	const scoredResults = search(searchQuery, queryEmbedding, nlwebIndex);
	const searchMs = Date.now() - searchStart;

	const results = scoredResults.map(({ document, score }: any) => ({
		url: document.url,
		name: document.name,
		site: payload.site,
		score,
		description: document.description,
		schema_object: document.schema_object,
	}));

	const response: Record<string, any> = {
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
				ai, query, scoredResults, prevExchanges, payload.query_id,
			);

			// If retrieval found nothing, return fallback as a single non-streamed response
			if (!stream && fallback) {
				return json({ ...fallback, query_id: payload.query_id, mode: 'stream' });
			}

			const { readable, writable } = new TransformStream();
			const writer = writable.getWriter();
			const encoder = new TextEncoder();

			const sseHeaders: Record<string, string> = {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			};

			handleStreamingResponse(stream!, sources!, query, scoredResults, writer, encoder);

			return new Response(readable, { headers: sseHeaders });
		} catch {
			const generated = fallbackSummarize(query, scoredResults.map((r: any) => r.document));
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
			generated = fallbackSummarize(query, scoredResults.map((r: any) => r.document));
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
			retrieval: scoredResults.map(({ document, score, keywordScore, semanticScore }: any) => ({
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

export const GET: APIRoute = async ({ request }) => {
	return handle(request);
};

export const POST: APIRoute = async ({ request }) => {
	return handle(request);
};

export const OPTIONS: APIRoute = async () => {
	return new Response(null, { status: 204, headers: corsHeaders });
};
