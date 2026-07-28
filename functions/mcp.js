import nlwebIndex from '../src/generated/nlweb-index.mjs';
import { MAX_QUERY_LENGTH } from './_ask/config.js';
import { search, embedQuery } from './_ask/retrieval.js';
import { generateAnswer, fallbackSummarize } from './_ask/generation.js';
import { logAsk } from './_shared/ask-log.js';

// Dual-era MCP endpoint (2026-07-28 stateless core + 2025-11-25 legacy),
// with the draft Skills extension (SEP-2640) serving the site's published
// agent skills as skill:// resources.
//
// Modern clients (2026-07-28+) send per-request _meta: protocol version,
// clientInfo, and capabilities travel on every request; there is no
// initialize handshake and no session. Legacy clients (2025-11-25 and
// earlier) still open with initialize — we answer both on the same
// endpoint, per the spec's dual-era compatibility matrix, for at least
// the twelve-month deprecation window.

const SERVER_INFO = { name: 'joost.blog', version: '1.2.0' };
const SUPPORTED_VERSIONS = ['2026-07-28', '2025-11-25'];
const LEGACY_PROTOCOL_VERSION = '2025-11-25';

// _meta keys defined by the 2026-07-28 spec.
const META_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CLIENT_INFO = 'io.modelcontextprotocol/clientInfo';
const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';

// Cache hints for tools/list, resources, and server/discover. The tool
// catalog and skills only change on deploy, so let clients (and shared
// caches) hold them for a day.
const LIST_TTL_MS = 86_400_000;

// --- Skills over MCP (SEP-2640, draft) ------------------------------------
// Serves the skills already published at /.well-known/agent-skills/ as MCP
// resources under skill:// URIs, per the Skills Over MCP working group's
// draft extension. The build script that copies the skills and writes the
// well-known index stays the single source of truth; this is a second
// transport over the same files, not a second copy.

const SKILLS_EXTENSION_ID = 'io.modelcontextprotocol/skills';
const SKILLS_ASSET_BASE = '/.well-known/agent-skills';
const SKILLS_INDEX_URI = 'skill://index.json';
const SKILLS_INDEX_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';

const SERVER_CAPABILITIES = {
	tools: {},
	resources: {},
	extensions: { [SKILLS_EXTENSION_ID]: {} },
};

// MCP error codes from the 2026-07-28 error code allocation policy.
const ERR_METHOD_NOT_FOUND = -32601;
const ERR_HEADER_MISMATCH = -32020;
const ERR_UNSUPPORTED_PROTOCOL_VERSION = -32022;

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version, MCP-Session-Id, Mcp-Method, Mcp-Name',
	'Access-Control-Expose-Headers': 'Deprecation, Sunset, Link',
};

// RFC 9745 / RFC 8594 deprecation signaling on responses to the legacy
// initialize handshake. Note the 2026-07-28 spec REMOVED the handshake from
// the current protocol rather than deprecating it: it survives only in
// earlier revisions, and no spec text says how long dual-era servers should
// keep answering it. These headers announce THIS server's timeline:
// Deprecation is the date the handshake left the current protocol
// (2026-07-28), Sunset the date this server will drop it, borrowing the
// spec's twelve-month deprecation window as a floor. The handshake keeps
// working until then — deprecation is a promise, not a failure mode.
const DEPRECATION_HEADERS = {
	Deprecation: '@1785196800',
	Sunset: 'Wed, 28 Jul 2027 00:00:00 GMT',
	Link: '<https://joost.blog/mcp-goes-stateless/>; rel="deprecation"',
};

function requestMeta(msg) {
	return msg?.params?._meta ?? {};
}

function isModern(msg) {
	return typeof requestMeta(msg)[META_VERSION] === 'string';
}

// Modern results carry a required resultType and the server's identity in
// _meta. Legacy results keep the exact pre-2026 shape.
function ok(id, result, modern = false) {
	const body = modern
		? { ...result, resultType: 'complete', _meta: { [META_SERVER_INFO]: SERVER_INFO } }
		: result;
	return { jsonrpc: '2.0', id, result: body };
}

function rpcErr(id, code, message, data) {
	const error = data === undefined ? { code, message } : { code, message, data };
	return { jsonrpc: '2.0', id, error };
}

function respond(body, status = 200, extraHeaders = null) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', ...(extraHeaders || {}) },
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

async function loadSkillsIndex(request, env) {
	const res = await env.ASSETS.fetch(new URL(`${SKILLS_ASSET_BASE}/index.json`, request.url));
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

function skillUri(name) {
	return `skill://${name}/SKILL.md`;
}

async function executeResourcesList(request, env) {
	const index = await loadSkillsIndex(request, env);
	const resources = [
		{
			uri: SKILLS_INDEX_URI,
			name: 'index.json',
			description: 'Index of the agent skills this server exposes as skill:// resources.',
			mimeType: 'application/json',
		},
		...(index.skills ?? []).map((s) => ({
			uri: skillUri(s.name),
			name: s.name,
			description: s.description,
			mimeType: 'text/markdown',
		})),
	];
	return { resources, ttlMs: LIST_TTL_MS, cacheScope: 'public' };
}

// Returns a resources/read result, or null when the URI matches no skill.
async function executeResourcesRead(uri, request, env) {
	const index = await loadSkillsIndex(request, env);

	if (uri === SKILLS_INDEX_URI) {
		// Same index the well-known URI serves, rebound per the SEP: urls
		// become skill:// resource URIs and digests drop (integrity is the
		// transport's concern over MCP).
		const mcpIndex = {
			$schema: SKILLS_INDEX_SCHEMA,
			skills: (index.skills ?? []).map(({ name, type, description }) => ({
				name,
				type,
				description,
				url: skillUri(name),
			})),
		};
		return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(mcpIndex, null, 2) }] };
	}

	// Only URIs listed in the index resolve — the index is the authoritative
	// record of which resources are skills, and it also keeps this from
	// becoming an arbitrary asset-fetch proxy.
	const skill = (index.skills ?? []).find((s) => skillUri(s.name) === uri);
	if (!skill) return null;

	const res = await env.ASSETS.fetch(new URL(`${SKILLS_ASSET_BASE}/${skill.name}/SKILL.md`, request.url));
	if (!res.ok) return null;
	return { contents: [{ uri, mimeType: 'text/markdown', text: await res.text() }] };
}

// Transport-level validation for modern (2026-07-28+) requests. Legacy
// requests (no _meta protocol version) skip all of this. Returns
// { status, body } when the request must be rejected, null when it may
// proceed. Header checks are mismatch-strict but presence-lenient: a
// missing header never rejects, a contradicting one always does.
function validateModernTransport(request, msg) {
	const meta = requestMeta(msg);
	const bodyVersion = meta[META_VERSION];
	if (typeof bodyVersion !== 'string') return null;

	const id = msg.id ?? null;

	const headerVersion = request.headers.get('mcp-protocol-version');
	if (headerVersion && headerVersion !== bodyVersion) {
		return {
			status: 400,
			body: rpcErr(id, ERR_HEADER_MISMATCH, `MCP-Protocol-Version header (${headerVersion}) does not match _meta protocol version (${bodyVersion})`),
		};
	}

	if (!SUPPORTED_VERSIONS.includes(bodyVersion)) {
		return {
			status: 400,
			body: rpcErr(id, ERR_UNSUPPORTED_PROTOCOL_VERSION, 'Unsupported protocol version', {
				supported: SUPPORTED_VERSIONS,
				requested: bodyVersion,
			}),
		};
	}

	const headerMethod = request.headers.get('mcp-method');
	if (headerMethod && headerMethod !== msg.method) {
		return {
			status: 400,
			body: rpcErr(id, ERR_HEADER_MISMATCH, `Mcp-Method header (${headerMethod}) does not match method (${msg.method})`),
		};
	}

	const headerName = request.headers.get('mcp-name');
	if (headerName) {
		// Mcp-Name mirrors params.name on tools/call and params.uri on
		// resources/read.
		const bodyName =
			msg.method === 'tools/call' ? msg.params?.name
			: msg.method === 'resources/read' ? msg.params?.uri
			: undefined;
		if (bodyName !== undefined && headerName !== bodyName) {
			return {
				status: 400,
				body: rpcErr(id, ERR_HEADER_MISMATCH, `Mcp-Name header (${headerName}) does not match name (${bodyName})`),
			};
		}
	}

	return null;
}

function discoverResult() {
	return {
		resultType: 'complete',
		supportedVersions: SUPPORTED_VERSIONS,
		capabilities: SERVER_CAPABILITIES,
		instructions:
			"Read-only server for joost.blog. Use ask_joost for semantic Q&A over Joost de Valk's writing; use list_recent_content to enumerate or filter his published posts. Joost's agent skills are served as skill:// resources; read skill://index.json for the catalog.",
		ttlMs: LIST_TTL_MS,
		cacheScope: 'public',
		_meta: { [META_SERVER_INFO]: SERVER_INFO },
	};
}

async function handleMessage(msg, context) {
	const { method, id, params } = msg;
	const { env, request } = context;
	const modern = isModern(msg);

	// Notifications have no id — acknowledge with 202, no body (handled by caller)
	if (id === undefined) return null;

	let response;
	switch (method) {
		case 'server/discover':
			// Answered for both eras: dual-era clients probe with this.
			response = ok(id, discoverResult());
			break;

		case 'initialize':
			// Legacy handshake — kept for pre-2026-07-28 clients.
			response = ok(id, {
				protocolVersion: LEGACY_PROTOCOL_VERSION,
				capabilities: SERVER_CAPABILITIES,
				serverInfo: SERVER_INFO,
			});
			break;

		case 'ping':
			// Removed in 2026-07-28, still sent by legacy clients as keepalive
			// noise — answer without logging, mirror cocktail.glass.
			return ok(id, {}, modern);

		case 'tools/list':
			// TOOLS is a static array, so ordering is deterministic and the
			// catalog is publicly cacheable — both spec asks for free.
			response = ok(id, { tools: TOOLS, ttlMs: LIST_TTL_MS, cacheScope: 'public' }, modern);
			break;

		case 'tools/call': {
			const { name, arguments: args } = params ?? {};
			if (name === 'ask_joost') response = ok(id, await executeAskJoost(args, env), modern);
			else if (name === 'list_recent_content') response = ok(id, await executeListRecentContent(args, request, env), modern);
			else response = rpcErr(id, ERR_METHOD_NOT_FOUND, `Unknown tool: ${name}`);
			break;
		}

		case 'resources/list':
			try {
				response = ok(id, await executeResourcesList(request, env), modern);
			} catch (e) {
				response = rpcErr(id, -32603, `resources/list error: ${e.message}`);
			}
			break;

		case 'resources/read': {
			const uri = String(params?.uri ?? '');
			try {
				const result = await executeResourcesRead(uri, request, env);
				if (result) {
					response = ok(id, { ...result, ttlMs: LIST_TTL_MS, cacheScope: 'public' }, modern);
				} else {
					// Resource not found: -32602 per 2026-07-28 (realigned with
					// JSON-RPC Invalid Params), -32002 for legacy clients.
					response = rpcErr(id, modern ? -32602 : -32002, `Resource not found: ${uri}`);
				}
			} catch (e) {
				response = rpcErr(id, -32603, `resources/read error: ${e.message}`);
			}
			break;
		}

		default:
			response = rpcErr(id, ERR_METHOD_NOT_FOUND, `Method not found: ${method}`);
	}

	logMcp(context, msg, response);
	return response;
}

// Writes one ask_log row per MCP message. Called per message inside
// handleMessage so batched JSON-RPC requests (a single POST carrying
// initialize + tools/call) produce one row per call rather than collapsing
// into one. Mirrors cocktail.glass logMcpCall: initialize and
// server/discover rows give the client mix; tools/call rows give the tool
// mix and the raw arguments. Modern clients carry clientInfo in _meta on
// every request, so tools/call rows now get client name and version too —
// legacy clients only identified themselves at initialize.
function logMcp(context, msg, response) {
	const method = msg?.method || '';
	const params = msg?.params || {};
	const meta = requestMeta(msg);

	const protocol = meta[META_VERSION] || context.request.headers.get('mcp-protocol-version') || '';
	const clientInfo = meta[META_CLIENT_INFO] || {};

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
			client: clientInfo.name,
			clientVersion: clientInfo.version,
			protocol,
			isError,
		});
		return;
	}

	if (method === 'initialize' || method === 'server/discover') {
		const legacyClientInfo = params.clientInfo || {};
		logAsk(context, {
			surface: 'mcp',
			action: method,
			client: clientInfo.name || legacyClientInfo.name,
			clientVersion: clientInfo.version || legacyClientInfo.version,
			protocol: protocol || params.protocolVersion || '',
		});
		return;
	}

	// Everything else (tools/list, resources/*, unknown methods) — log
	// lightly; resources/read keeps its URI so the dashboard shows which
	// skills get pulled.
	logAsk(context, {
		surface: 'mcp',
		action: method || 'unknown',
		text: method === 'resources/read' ? String(params.uri || '') : '',
		client: clientInfo.name,
		clientVersion: clientInfo.version,
		protocol,
		isError: !!response?.error,
	});
}

// Modern-era JSON-RPC errors map to HTTP status codes per the transport
// spec; legacy responses stay 200 like they always were.
function httpStatusFor(response, modern) {
	if (!modern || !response?.error) return 200;
	if (response.error.code === ERR_METHOD_NOT_FOUND) return 404;
	return 200;
}

export function onRequestOptions() {
	return new Response(null, { status: 204, headers: CORS });
}

export function onRequestGet() {
	// The 2026-07-28 spec removed the GET stream endpoint entirely; there was
	// never anything to stream here anyway.
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

	// Batched JSON-RPC only ever came from legacy clients (the modern spec
	// requires a single request per POST) — handle it as before.
	if (Array.isArray(body)) {
		const results = await Promise.all(body.map((msg) => handleMessage(msg, context)));
		const responses = results.filter(Boolean);
		if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
		const hasInitialize = body.some((msg) => msg?.method === 'initialize');
		return respond(responses, 200, hasInitialize ? DEPRECATION_HEADERS : null);
	}

	const rejection = validateModernTransport(request, body);
	if (rejection) return respond(rejection.body, rejection.status);

	const result = await handleMessage(body, context);
	if (result === null) return new Response(null, { status: 202, headers: CORS });
	const extraHeaders = body.method === 'initialize' ? DEPRECATION_HEADERS : null;
	return respond(result, httpStatusFor(result, isModern(body)), extraHeaders);
}
