import nlwebIndex from '../src/generated/nlweb-index.mjs';
import { MAX_QUERY_LENGTH } from './_ask/config.js';
import { search, embedQuery } from './_ask/retrieval.js';
import { generateAnswer, fallbackSummarize } from './_ask/generation.js';
import { logAsk } from './_shared/ask-log.js';

const SERVER_INFO = { name: 'joost.blog', version: '1.0.0' };
const PROTOCOL_VERSION = '2025-11-25';

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version, MCP-Session-Id',
};

function ok(id, result) {
	return { jsonrpc: '2.0', id, result };
}

function rpcErr(id, code, message) {
	return { jsonrpc: '2.0', id, error: { code, message } };
}

function respond(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
	});
}

const TOOLS = [
	{
		name: 'ask_joost',
		description:
			"Ask a question about anything Joost de Valk has written or spoken about — SEO, WordPress, the open web, AI, open source, his career at Yoast, or his investments via Emilia Capital. Returns an AI-generated answer grounded in his blog posts and video transcripts, with source URLs for every claim. Use this instead of trying to crawl or search the site directly: it does retrieval over a curated semantic index and returns cited prose in one call.",
		inputSchema: {
			type: 'object',
			properties: {
				question: {
					type: 'string',
					description:
						"A natural-language question. Maximum 500 characters. Examples: \"What's Joost's take on WordPress market share?\", \"Why did Joost leave Yoast?\", \"What does Joost think about AI's impact on SEO?\"",
					maxLength: 500,
				},
			},
			required: ['question'],
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'list_recent_content',
		description:
			"List Joost de Valk's published blog posts on joost.blog, optionally filtered by topic keyword and/or publish date. Returns chronologically sorted (newest first) entries with title, URL, publish date, excerpt, and categories. Use this when you want to enumerate or browse what Joost has written — e.g. 'what has Joost published this year', 'list posts about WordPress', 'what's the most recent post'. For semantic Q&A or 'what does Joost think about X', use ask_joost instead.",
		inputSchema: {
			type: 'object',
			properties: {
				topic: {
					type: 'string',
					description:
						"Optional keyword to filter by. Matches case-insensitively against title, excerpt, and categories. Examples: 'wordpress', 'seo', 'ai'.",
				},
				since: {
					type: 'string',
					format: 'date',
					description: 'Optional ISO date (YYYY-MM-DD). Only posts published on or after this date are returned.',
				},
				limit: {
					type: 'integer',
					minimum: 1,
					maximum: 50,
					description: 'Maximum number of posts to return. Defaults to 20. Capped at 50.',
				},
			},
		},
		annotations: { readOnlyHint: true },
	},
];

function sanitizeQuery(raw) {
	return raw
		.replace(/\b(ignore|disregard|forget|override)\b.{0,30}\b(previous|above|prior|system|all)\b.{0,30}\b(instructions?|prompts?|rules?|context)\b/gi, '')
		.replace(/\b(you are now|act as|pretend to be|roleplay as|new persona|system prompt)\b/gi, '')
		.replace(/\b(do not follow|stop being|bypass|jailbreak)\b/gi, '')
		.trim();
}

async function executeAskJoost(args, env) {
	const raw = String(args?.question ?? '').slice(0, MAX_QUERY_LENGTH);
	const question = sanitizeQuery(raw);

	if (!question.trim()) {
		return { content: [{ type: 'text', text: 'Missing question.' }], isError: true };
	}

	if (!Array.isArray(nlwebIndex) || nlwebIndex.length === 0) {
		return { content: [{ type: 'text', text: 'Search index unavailable.' }], isError: true };
	}

	try {
		const ai = env?.AI;
		const queryEmbedding = ai ? await embedQuery(ai, question) : null;
		const scoredResults = search(question, queryEmbedding, nlwebIndex);

		const generated = ai
			? await generateAnswer(ai, question, scoredResults, [], crypto.randomUUID())
			: fallbackSummarize(question, scoredResults.map((r) => r.document));

		const answer = generated.answer?.trim() || 'No answer generated.';
		const sources = (generated.sources ?? []).map((s) => ({
			url: new URL(s.url, 'https://joost.blog').toString(),
			title: s.name,
		}));

		return {
			content: [
				{ type: 'text', text: answer },
				{ type: 'text', text: `Sources (JSON):\n${JSON.stringify(sources, null, 2)}` },
			],
		};
	} catch (e) {
		return { content: [{ type: 'text', text: `ask_joost error: ${e.message}` }], isError: true };
	}
}

async function executeListRecentContent(args, request, env) {
	const { topic, since, limit } = args ?? {};

	try {
		const res = await env.ASSETS.fetch(new URL('/writing-index.json', request.url));
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const index = await res.json();

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
			categories: item.categories,
		}));

		return {
			content: [{
				type: 'text',
				text: JSON.stringify({ total_matched: matches.length, returned: results.length, items: results }, null, 2),
			}],
		};
	} catch (e) {
		return { content: [{ type: 'text', text: `list_recent_content error: ${e.message}` }], isError: true };
	}
}

async function handleMessage(msg, context) {
	const { method, id, params } = msg;
	const { env, request } = context;

	// Notifications have no id — acknowledge with 202, no body (handled by caller)
	if (id === undefined) return null;

	let response;
	switch (method) {
		case 'initialize':
			response = ok(id, {
				protocolVersion: PROTOCOL_VERSION,
				capabilities: { tools: {} },
				serverInfo: SERVER_INFO,
			});
			break;

		case 'ping':
			// Keepalive noise — don't log, mirror cocktail.glass.
			return ok(id, {});

		case 'tools/list':
			response = ok(id, { tools: TOOLS });
			break;

		case 'tools/call': {
			const { name, arguments: args } = params ?? {};
			if (name === 'ask_joost') response = ok(id, await executeAskJoost(args, env));
			else if (name === 'list_recent_content') response = ok(id, await executeListRecentContent(args, request, env));
			else response = rpcErr(id, -32601, `Unknown tool: ${name}`);
			break;
		}

		default:
			response = rpcErr(id, -32601, `Method not found: ${method}`);
	}

	logMcp(context, msg, response);
	return response;
}

// Writes one ask_log row per MCP message. Called per message inside
// handleMessage so batched JSON-RPC requests (a single POST carrying
// initialize + tools/call) produce one row per call rather than collapsing
// into one. Mirrors cocktail.glass logMcpCall: initialize rows give the
// client mix; tools/call rows give the tool mix and the raw arguments.
function logMcp(context, msg, response) {
	const method = msg?.method || '';
	const params = msg?.params || {};

	const protocolHeader = context.request.headers.get('mcp-protocol-version') || '';

	if (method === 'tools/call') {
		const toolName = String(params.name || '');
		let args = '';
		try {
			args = JSON.stringify(params.arguments || {});
		} catch {
			args = '';
		}
		const isError = !!(response && (response.error || response.result?.isError));
		logAsk(context, {
			surface: 'mcp',
			action: toolName || 'tools/call',
			text: args,
			protocol: protocolHeader,
			isError,
		});
		return;
	}

	if (method === 'initialize') {
		const clientInfo = params.clientInfo || {};
		logAsk(context, {
			surface: 'mcp',
			action: 'initialize',
			client: clientInfo.name,
			clientVersion: clientInfo.version,
			protocol: params.protocolVersion || protocolHeader,
		});
		return;
	}

	// Everything else (tools/list, unknown methods) — log lightly.
	logAsk(context, {
		surface: 'mcp',
		action: method || 'unknown',
		protocol: protocolHeader,
		isError: !!response?.error,
	});
}

export function onRequestOptions() {
	return new Response(null, { status: 204, headers: CORS });
}

export function onRequestGet() {
	return new Response('Method Not Allowed', { status: 405, headers: CORS });
}

export async function onRequestPost(context) {
	const { request } = context;

	let body;
	try {
		body = await request.json();
	} catch {
		return respond(rpcErr(null, -32700, 'Parse error'), 400);
	}

	if (Array.isArray(body)) {
		const results = await Promise.all(body.map((msg) => handleMessage(msg, context)));
		const responses = results.filter(Boolean);
		if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
		return respond(responses);
	}

	const result = await handleMessage(body, context);
	if (result === null) return new Response(null, { status: 202, headers: CORS });
	return respond(result);
}
