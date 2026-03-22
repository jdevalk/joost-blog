import nlwebIndex from '../src/generated/nlweb-index.mjs';

const STOPWORDS = new Set([
	'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
	'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'who',
	'why', 'with', 'you', 'your'
]);

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

function scoreDocument(document, tokens) {
	const needle = buildNeedle(document);
	let score = 0;

	for (const token of tokens) {
		const occurrences = needle.split(token).length - 1;
		if (!occurrences) continue;

		score += occurrences;
		if (document.name.toLowerCase().includes(token)) score += 8;
		if (document.description.toLowerCase().includes(token)) score += 4;
		if ((document.keywords || []).some((keyword) => String(keyword).toLowerCase().includes(token))) score += 6;
		if (document.url.toLowerCase().includes(token)) score += 3;
	}

	return score;
}

function summarize(query, results) {
	if (!results.length) {
		return `I couldn't find a good match on joost.blog for “${query}”. Try a more specific query or fewer keywords.`;
	}

	const top = results[0];
	const extras = results.slice(1, 3).map((result) => result.name);
	const extraText = extras.length ? ` Related matches include ${extras.join(' and ')}.` : '';
	return `${top.name} looks like the best match for “${query}”. ${top.description}${extraText}`;
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

async function handle(request) {
	const payload = await normalizeRequest(request);
	const query = payload.decontextualized_query || payload.query;

	if (!query.trim()) {
		return json({
			error: 'Missing required query parameter: query',
			query_id: payload.query_id,
		}, 400);
	}

	const tokens = tokenize(query);
	const results = nlwebIndex
		.map((document) => ({ document, score: scoreDocument(document, tokens) }))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 8)
		.map(({ document, score }) => ({
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
		response.answer = summarize(query, results);
		response.summary = response.answer;
	}

	return json(response);
}

export function onRequestOptions() {
	return new Response(null, { status: 204, headers });
}

export async function onRequestGet(context) {
	return handle(context.request);
}

export async function onRequestPost(context) {
	return handle(context.request);
}
