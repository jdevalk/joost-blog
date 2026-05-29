// AI crawler ROI report.
//
// Joins Cloudflare Analytics Engine `agent_log` (AI bot hits per path) with
// Google Search Console Search Analytics (impressions/clicks per page), so we
// can see which pages AI crawlers hammer hardest and what search traffic those
// pages get in return.
//
// Two datasets, one join key (URL path). Same time window for both.
//
// Outputs (gitignored under scripts/out/):
//   roi-by-page.csv          One row per page, wide format.
//   roi-by-page-bot.csv      One row per (page, AI bot) pair, long format.
//   roi-summary.md           Top movers, crawl-waste candidates, bot totals.
//
// ──────────────────────────────────────────────────────────────────────────
// Setup
// ──────────────────────────────────────────────────────────────────────────
//
// 1. Cloudflare side. Already in .env:
//      CF_ACCOUNT_ID
//      CF_ANALYTICS_TOKEN   (Account → Account Analytics → Read)
//
// 2. GSC side. One-time Google Cloud setup:
//      a. In a Google Cloud project, enable "Google Search Console API".
//      b. Create a service account, give it no IAM roles, generate a JSON key.
//      c. Save the JSON key somewhere outside the repo (it's a secret) and
//         set GSC_SERVICE_ACCOUNT_JSON in .env to its absolute path.
//      d. In Search Console → Settings → Users and permissions, add the
//         service account's email (looks like
//         my-sa@my-project.iam.gserviceaccount.com) as a Restricted user.
//      e. Set GSC_SITE in .env. For a domain property use
//         `sc-domain:joost.blog`; for a URL property use `https://joost.blog/`.
//
// 3. Run:
//      node --env-file-if-exists=.env scripts/ai-crawler-roi.mjs
//
//    Options:
//      --days N        Time window in days (default 28).
//      --out DIR       Output directory (default scripts/out).
//      --min-hits N    Only include pages with ≥ N AI bot hits in the
//                      summary's top tables (default 5).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ──────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────

// AI training / inference / answer-engine crawlers. Mirrors functions/_middleware.js's
// BOT_UA_MATCHERS but trimmed to the "this isn't traditional search" set.
const AI_BOTS = [
	// OpenAI
	'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
	// Anthropic
	'ClaudeBot', 'Claude-Web', 'Claude-User', 'anthropic-ai',
	// Perplexity
	'PerplexityBot', 'Perplexity-User',
	// Google AI (Googlebot itself stays in SEARCH_BOTS)
	'Google-Extended',
	// Meta
	'Meta-ExternalAgent', 'Meta-ExternalFetcher',
	// Apple (Applebot-Extended is the AI-training one)
	'Applebot-Extended',
	// ByteDance
	'Bytespider',
	// Amazon
	'Amazonbot',
	// Common Crawl (feeds many LLMs)
	'CCBot',
	// Cohere
	'cohere-training-data-crawler', 'cohere-ai',
	// DuckDuckGo AI
	'DuckAssistBot',
	// Mistral
	'MistralAI-User',
	// You.com
	'YouBot',
	// Kagi
	'KagiBot',
	// Webz.io (sells LLM training data)
	'omgilibot', 'omgili',
	// Diffbot
	'Diffbot',
	// Allen AI
	'AI2Bot',
	// Timpi
	'Timpibot',
	// NICT (Japan)
	'ICC-Crawler',
	// Huawei
	'PetalBot',
	// Imagesift (TheHive)
	'ImagesiftBot',
];

// Traditional search crawlers, kept separately so we can show "AI vs search"
// as a sanity-check column.
const SEARCH_BOTS = ['Googlebot', 'Bingbot', 'YandexBot', 'Applebot', 'GoogleOther'];

// Vendor groups for per-page rollups in the wide CSV.
const VENDOR_GROUPS = {
	openai: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
	anthropic: ['ClaudeBot', 'Claude-Web', 'Claude-User', 'anthropic-ai'],
	perplexity: ['PerplexityBot', 'Perplexity-User'],
	google_ai: ['Google-Extended'],
	meta: ['Meta-ExternalAgent', 'Meta-ExternalFetcher'],
	apple_ai: ['Applebot-Extended'],
	bytedance: ['Bytespider'],
	amazon: ['Amazonbot'],
	common_crawl: ['CCBot'],
	cohere: ['cohere-training-data-crawler', 'cohere-ai'],
};

const GSC_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const GSC_API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';

// ──────────────────────────────────────────────────────────────────────────
// CLI args
// ──────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
	const args = { days: 28, out: path.join('scripts', 'out'), minHits: 5 };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--days') args.days = Number(argv[++i]);
		else if (a === '--out') args.out = argv[++i];
		else if (a === '--min-hits') args.minHits = Number(argv[++i]);
		else if (a === '--help' || a === '-h') {
			console.log(
				'Usage: node scripts/ai-crawler-roi.mjs [--days N] [--out DIR] [--min-hits N]'
			);
			process.exit(0);
		}
	}
	if (!Number.isFinite(args.days) || args.days < 1) {
		throw new Error(`--days must be a positive integer, got ${args.days}`);
	}
	return args;
}

// ──────────────────────────────────────────────────────────────────────────
// Cloudflare Analytics Engine
// ──────────────────────────────────────────────────────────────────────────

async function queryAE(accountId, token, sql) {
	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
		{
			method: 'POST',
			headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
			body: sql,
		}
	);
	if (!res.ok) {
		throw new Error(`Analytics Engine ${res.status}: ${await res.text()}`);
	}
	return res.json();
}

// Per-bot, per-path totals for the time window. Limit 9999 is the AE SQL cap.
async function fetchBotHitsByPath(accountId, token, days) {
	const sql = `
		SELECT index1 AS bot, blob4 AS path, SUM(_sample_interval) AS hits
		FROM agent_log
		WHERE timestamp > NOW() - INTERVAL '${days}' DAY
		GROUP BY bot, path
		ORDER BY hits DESC
		LIMIT 9999
	`;
	const json = await queryAE(accountId, token, sql);
	return (json.data || []).map((r) => ({
		bot: String(r.bot || ''),
		path: String(r.path || ''),
		hits: Number(r.hits) || 0,
	}));
}

// ──────────────────────────────────────────────────────────────────────────
// Google Search Console (service account auth, no external deps)
// ──────────────────────────────────────────────────────────────────────────

function b64url(buf) {
	return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Builds a signed JWT for service-account auth and exchanges it for an access
// token. Tokens last an hour, which is plenty for a one-shot script.
async function getGscAccessToken(serviceAccountJsonPath) {
	const raw = await fs.readFile(serviceAccountJsonPath, 'utf8');
	const sa = JSON.parse(raw);
	if (!sa.client_email || !sa.private_key) {
		throw new Error(
			`Service account JSON at ${serviceAccountJsonPath} is missing client_email or private_key`
		);
	}

	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'RS256', typ: 'JWT' };
	const claims = {
		iss: sa.client_email,
		scope: GSC_SCOPE,
		aud: sa.token_uri || GSC_TOKEN_URI,
		exp: now + 3600,
		iat: now,
	};
	const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
	const signer = crypto.createSign('RSA-SHA256');
	signer.update(signingInput);
	const signature = b64url(signer.sign(sa.private_key));
	const jwt = `${signingInput}.${signature}`;

	const res = await fetch(sa.token_uri || GSC_TOKEN_URI, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt,
		}),
	});
	if (!res.ok) {
		throw new Error(`GSC token exchange ${res.status}: ${await res.text()}`);
	}
	const data = await res.json();
	if (!data.access_token) {
		throw new Error(`GSC token exchange returned no access_token: ${JSON.stringify(data)}`);
	}
	return data.access_token;
}

// Page-level Search Analytics for the window. Paginates in 25k-row batches in
// case the property is huge; for joost.blog we'll easily fit in one.
async function fetchGscPages(accessToken, site, days) {
	const end = new Date();
	const start = new Date(end);
	start.setUTCDate(start.getUTCDate() - days);
	const startDate = start.toISOString().slice(0, 10);
	const endDate = end.toISOString().slice(0, 10);

	const url = `${GSC_API_BASE}/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
	const rows = [];
	const batchSize = 25000;
	for (let startRow = 0; ; startRow += batchSize) {
		const body = {
			startDate,
			endDate,
			dimensions: ['page'],
			rowLimit: batchSize,
			startRow,
			type: 'web',
		};
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(`GSC searchAnalytics ${res.status}: ${await res.text()}`);
		}
		const data = await res.json();
		const batch = data.rows || [];
		rows.push(...batch);
		if (batch.length < batchSize) break;
	}
	return { rows, startDate, endDate };
}

// ──────────────────────────────────────────────────────────────────────────
// Join / shape
// ──────────────────────────────────────────────────────────────────────────

// Drops query strings and fragments, lowercases the host, leaves the path as
// is so it matches what `_middleware.js` writes to blob4.
function pageUrlToPath(pageUrl) {
	try {
		const u = new URL(pageUrl);
		return u.pathname;
	} catch {
		// Domain-property GSC sometimes returns relative paths already.
		return String(pageUrl).split('?')[0].split('#')[0];
	}
}

function normalizePath(p) {
	if (!p) return '';
	// Strip query / hash defensively. Don't touch trailing slash because the
	// site treats /foo/ and /foo as different URLs and we want crawl/search to
	// match on whichever form Cloudflare logged.
	return p.split('?')[0].split('#')[0];
}

function summarizeByPage(botHits) {
	// path → { bots: {bot: hits}, totals: {ai, search, all} }
	const pages = new Map();
	for (const { bot, path: p, hits } of botHits) {
		const np = normalizePath(p);
		if (!np) continue;
		if (!pages.has(np)) {
			pages.set(np, { bots: new Map(), aiTotal: 0, searchTotal: 0, allTotal: 0 });
		}
		const entry = pages.get(np);
		entry.bots.set(bot, (entry.bots.get(bot) || 0) + hits);
		entry.allTotal += hits;
		if (AI_BOTS.includes(bot)) entry.aiTotal += hits;
		else if (SEARCH_BOTS.includes(bot)) entry.searchTotal += hits;
	}
	return pages;
}

function topBotFor(botMap) {
	let best = '', bestCount = 0;
	for (const [bot, count] of botMap) {
		if (AI_BOTS.includes(bot) && count > bestCount) {
			best = bot;
			bestCount = count;
		}
	}
	return { bot: best, hits: bestCount };
}

function vendorTotalsFor(botMap) {
	const out = {};
	for (const [vendor, bots] of Object.entries(VENDOR_GROUPS)) {
		out[vendor] = bots.reduce((sum, b) => sum + (botMap.get(b) || 0), 0);
	}
	return out;
}

// ──────────────────────────────────────────────────────────────────────────
// CSV / Markdown writers
// ──────────────────────────────────────────────────────────────────────────

function csvCell(v) {
	if (v == null) return '';
	const s = String(v);
	if (s.includes(',') || s.includes('"') || s.includes('\n')) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function csvLine(values) {
	return values.map(csvCell).join(',') + '\n';
}

async function writeWideCsv(file, joined) {
	const vendors = Object.keys(VENDOR_GROUPS);
	const headers = [
		'path',
		'ai_hits',
		'search_hits',
		'top_ai_bot',
		'top_ai_bot_hits',
		...vendors.map((v) => `${v}_hits`),
		'impressions',
		'clicks',
		'ctr',
		'position',
		'clicks_per_1k_ai_hits',
	];
	let out = csvLine(headers);
	for (const row of joined) {
		out += csvLine([
			row.path,
			row.aiHits,
			row.searchHits,
			row.topAiBot,
			row.topAiBotHits,
			...vendors.map((v) => row.vendors[v] || 0),
			row.impressions,
			row.clicks,
			row.ctr.toFixed(4),
			row.position ? row.position.toFixed(2) : '',
			row.clicksPer1kAi != null ? row.clicksPer1kAi.toFixed(2) : '',
		]);
	}
	await fs.writeFile(file, out, 'utf8');
}

async function writeLongCsv(file, botHits, gscByPath) {
	const headers = [
		'path',
		'bot',
		'bot_category',
		'hits',
		'page_impressions',
		'page_clicks',
		'page_position',
	];
	let out = csvLine(headers);
	for (const { bot, path: p, hits } of botHits) {
		const np = normalizePath(p);
		const gsc = gscByPath.get(np) || gscByPath.get(np.replace(/\/$/, '')) || gscByPath.get(np + '/');
		const category = AI_BOTS.includes(bot)
			? 'ai'
			: SEARCH_BOTS.includes(bot)
				? 'search'
				: 'other';
		out += csvLine([
			np,
			bot,
			category,
			hits,
			gsc?.impressions ?? '',
			gsc?.clicks ?? '',
			gsc ? gsc.position.toFixed(2) : '',
		]);
	}
	await fs.writeFile(file, out, 'utf8');
}

function mdTable(headers, rows, aligns) {
	if (rows.length === 0) return '_No data._\n';
	const head = `| ${headers.join(' | ')} |\n`;
	const sep =
		'| ' +
		headers.map((_, i) => (aligns?.[i] === 'right' ? '---:' : '---')).join(' | ') +
		' |\n';
	const body = rows
		.map((r) => `| ${r.map((c) => (c == null ? '' : String(c))).join(' | ')} |`)
		.join('\n');
	return head + sep + body + '\n';
}

function fmtInt(n) {
	return new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0));
}

function fmtFloat(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return '';
	return Number(n).toFixed(digits);
}

async function writeMarkdownSummary(file, ctx) {
	const { joined, botTotals, gscByPath, startDate, endDate, days, minHits } = ctx;

	const aiTotal = joined.reduce((s, r) => s + r.aiHits, 0);
	const searchTotal = joined.reduce((s, r) => s + r.searchHits, 0);
	const totalImpressions = [...gscByPath.values()].reduce((s, p) => s + p.impressions, 0);
	const totalClicks = [...gscByPath.values()].reduce((s, p) => s + p.clicks, 0);

	const eligible = joined.filter((r) => r.aiHits >= minHits);

	const topByAi = [...eligible]
		.sort((a, b) => b.aiHits - a.aiHits)
		.slice(0, 25)
		.map((r) => [
			r.path,
			fmtInt(r.aiHits),
			r.topAiBot || '—',
			fmtInt(r.impressions),
			fmtInt(r.clicks),
			fmtFloat(r.clicksPer1kAi),
		]);

	// Crawl waste = lots of AI hits but no GSC impressions.
	const crawlWaste = [...eligible]
		.filter((r) => r.impressions === 0)
		.sort((a, b) => b.aiHits - a.aiHits)
		.slice(0, 25)
		.map((r) => [r.path, fmtInt(r.aiHits), r.topAiBot || '—']);

	// "AI darlings" = high AI hits relative to search impressions.
	const darlings = [...eligible]
		.filter((r) => r.impressions > 0)
		.map((r) => ({ ...r, ratio: r.aiHits / r.impressions }))
		.sort((a, b) => b.ratio - a.ratio)
		.slice(0, 25)
		.map((r) => [
			r.path,
			fmtInt(r.aiHits),
			fmtInt(r.impressions),
			fmtFloat(r.ratio),
			r.topAiBot || '—',
		]);

	// "Search winners with no AI interest" — pages getting GSC impressions but
	// not on AI radars. Useful to know what humans find that LLMs miss.
	const searchWinners = [...joined]
		.filter((r) => r.impressions >= 50 && r.aiHits === 0)
		.sort((a, b) => b.impressions - a.impressions)
		.slice(0, 25)
		.map((r) => [r.path, fmtInt(r.impressions), fmtInt(r.clicks)]);

	// Bot leaderboard, sorted by AI total.
	const botRows = [...botTotals.entries()]
		.map(([bot, hits]) => ({
			bot,
			hits,
			category: AI_BOTS.includes(bot) ? 'ai' : SEARCH_BOTS.includes(bot) ? 'search' : 'other',
		}))
		.sort((a, b) => b.hits - a.hits)
		.slice(0, 40)
		.map((r) => [r.bot, r.category, fmtInt(r.hits)]);

	const lines = [];
	lines.push(`# AI crawler ROI — joost.blog`);
	lines.push('');
	lines.push(`**Window:** ${startDate} → ${endDate} (${days} days)`);
	lines.push(`**Generated:** ${new Date().toISOString()}`);
	lines.push('');
	lines.push(`## Totals`);
	lines.push('');
	lines.push(
		mdTable(
			['Metric', 'Value'],
			[
				['AI bot hits', fmtInt(aiTotal)],
				['Traditional search bot hits', fmtInt(searchTotal)],
				['GSC impressions', fmtInt(totalImpressions)],
				['GSC clicks', fmtInt(totalClicks)],
				[
					'Sitewide clicks per 1k AI hits',
					aiTotal > 0 ? fmtFloat((totalClicks / aiTotal) * 1000) : '—',
				],
			]
		)
	);
	lines.push('');
	lines.push(`## Most AI-crawled pages (top 25, ≥ ${minHits} AI hits)`);
	lines.push('');
	lines.push(
		mdTable(
			['Path', 'AI hits', 'Top AI bot', 'GSC impressions', 'GSC clicks', 'Clicks / 1k AI hits'],
			topByAi
		)
	);
	lines.push('');
	lines.push(`## Crawl-waste candidates`);
	lines.push('');
	lines.push(
		`Pages crawled by AI bots ≥ ${minHits} times but with zero GSC impressions. Either GSC ` +
			`isn't indexing them, the URL has no search demand, or they shouldn't be public.`
	);
	lines.push('');
	lines.push(mdTable(['Path', 'AI hits', 'Top AI bot'], crawlWaste));
	lines.push('');
	lines.push(`## AI darlings — high AI interest vs. search impressions`);
	lines.push('');
	lines.push(
		`Sorted by (AI hits / GSC impressions). High ratio = LLMs are reading it far more than ` +
			`humans are searching for it.`
	);
	lines.push('');
	lines.push(
		mdTable(
			['Path', 'AI hits', 'Impressions', 'Ratio', 'Top AI bot'],
			darlings,
			[null, 'right', 'right', 'right']
		)
	);
	lines.push('');
	lines.push(`## Search winners the AIs ignore`);
	lines.push('');
	lines.push(
		`Pages with ≥ 50 GSC impressions in the window but zero AI bot hits. Where the SEO is ` +
			`landing without the LLMs noticing.`
	);
	lines.push('');
	lines.push(mdTable(['Path', 'Impressions', 'Clicks'], searchWinners));
	lines.push('');
	lines.push(`## Bot leaderboard`);
	lines.push('');
	lines.push(mdTable(['Bot', 'Category', 'Hits'], botRows));
	lines.push('');

	await fs.writeFile(file, lines.join('\n'), 'utf8');
}

// ──────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────

async function main() {
	const args = parseArgs(process.argv.slice(2));

	const accountId = process.env.CF_ACCOUNT_ID;
	const cfToken = process.env.CF_ANALYTICS_TOKEN;
	const gscJsonPath = process.env.GSC_SERVICE_ACCOUNT_JSON;
	const gscSite = process.env.GSC_SITE;

	const missing = [];
	if (!accountId) missing.push('CF_ACCOUNT_ID');
	if (!cfToken) missing.push('CF_ANALYTICS_TOKEN');
	if (!gscJsonPath) missing.push('GSC_SERVICE_ACCOUNT_JSON');
	if (!gscSite) missing.push('GSC_SITE');
	if (missing.length) {
		console.error(`Missing env vars: ${missing.join(', ')}. See the header comment in this file.`);
		process.exit(1);
	}

	console.log(`Fetching Cloudflare agent_log for the last ${args.days} days…`);
	const botHits = await fetchBotHitsByPath(accountId, cfToken, args.days);
	console.log(`  ${fmtInt(botHits.length)} (bot, path) rows.`);

	console.log(`Authenticating with Google Search Console…`);
	const accessToken = await getGscAccessToken(gscJsonPath);

	console.log(`Fetching GSC Search Analytics for ${gscSite}…`);
	const { rows: gscRows, startDate, endDate } = await fetchGscPages(
		accessToken,
		gscSite,
		args.days
	);
	console.log(`  ${fmtInt(gscRows.length)} page rows (${startDate} → ${endDate}).`);

	// Build GSC lookup keyed by path. GSC returns absolute URLs for both
	// `sc-domain:` and URL-prefix properties.
	const gscByPath = new Map();
	for (const r of gscRows) {
		const p = normalizePath(pageUrlToPath(r.keys?.[0] || ''));
		if (!p) continue;
		// If the same path appears twice (HTTPS vs www mix), merge.
		const prev = gscByPath.get(p);
		if (prev) {
			prev.impressions += r.impressions;
			prev.clicks += r.clicks;
			// Position should be the impression-weighted average; we approximate
			// with a weighted mean on the fly.
			const totalImps = prev.impressions || 1;
			prev.position = (prev.position * (totalImps - r.impressions) + r.position * r.impressions) /
				totalImps;
		} else {
			gscByPath.set(p, {
				impressions: r.impressions,
				clicks: r.clicks,
				position: r.position,
			});
		}
	}

	// Per-page summary keyed by path.
	const pageSummary = summarizeByPage(botHits);

	// Build the union of all paths across both sides.
	const allPaths = new Set([...pageSummary.keys(), ...gscByPath.keys()]);
	const joined = [...allPaths].map((p) => {
		const cf = pageSummary.get(p) || { bots: new Map(), aiTotal: 0, searchTotal: 0, allTotal: 0 };
		const gsc = gscByPath.get(p) ||
			gscByPath.get(p.replace(/\/$/, '')) ||
			gscByPath.get(p + '/') ||
			{ impressions: 0, clicks: 0, position: 0 };
		const top = topBotFor(cf.bots);
		const vendors = vendorTotalsFor(cf.bots);
		const ctr = gsc.impressions > 0 ? gsc.clicks / gsc.impressions : 0;
		const clicksPer1kAi = cf.aiTotal > 0 ? (gsc.clicks / cf.aiTotal) * 1000 : null;
		return {
			path: p,
			aiHits: cf.aiTotal,
			searchHits: cf.searchTotal,
			topAiBot: top.bot,
			topAiBotHits: top.hits,
			vendors,
			impressions: gsc.impressions,
			clicks: gsc.clicks,
			ctr,
			position: gsc.position,
			clicksPer1kAi,
		};
	});

	// Sort by AI hits desc so the wide CSV opens at the interesting end.
	joined.sort((a, b) => b.aiHits - a.aiHits || b.impressions - a.impressions);

	// Bot totals across all paths.
	const botTotals = new Map();
	for (const { bot, hits } of botHits) {
		botTotals.set(bot, (botTotals.get(bot) || 0) + hits);
	}

	// Write outputs.
	await fs.mkdir(args.out, { recursive: true });
	const stamp = endDate;
	const wideCsv = path.join(args.out, `roi-by-page-${stamp}.csv`);
	const longCsv = path.join(args.out, `roi-by-page-bot-${stamp}.csv`);
	const summaryMd = path.join(args.out, `roi-summary-${stamp}.md`);

	await writeWideCsv(wideCsv, joined);
	await writeLongCsv(longCsv, botHits, gscByPath);
	await writeMarkdownSummary(summaryMd, {
		joined,
		botTotals,
		gscByPath,
		startDate,
		endDate,
		days: args.days,
		minHits: args.minHits,
	});

	console.log('');
	console.log(`Wrote ${wideCsv}`);
	console.log(`Wrote ${longCsv}`);
	console.log(`Wrote ${summaryMd}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
