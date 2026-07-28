// Dashboard for crawler traffic (functions/_middleware.js) and /ask + /mcp
// usage (functions/_shared/ask-log.js).
//
// Two Analytics Engine datasets:
//   agent_log — AI/search crawler hits, written by functions/_middleware.js
//   ask_log   — calls to /ask (surface='rest') and /mcp (surface='mcp'),
//               written by functions/_shared/ask-log.js
//
// Access to /admin/* is gated by Cloudflare Access at the edge, so this
// function assumes the caller is already authenticated. It queries the
// Analytics Engine SQL API with a token stored as a Pages secret.

const AGENT = 'agent_log';
const ASK = 'ask_log';

// Detection-source filter fragments for the crawler section. blob1 =
// signature-agent, blob3 = matched UA, blob2 = cf-verified.
const SOURCE_FILTERS = {
	'signature-agent': "blob1 != ''",
	'ua-match': "blob1 = '' AND blob3 != ''",
	'cf-verified': "blob1 = '' AND blob3 = '' AND blob2 != ''",
};

export async function onRequest(context) {
	const { env, request } = context;

	const accountId = env.CF_ACCOUNT_ID;
	const token = env.CF_ANALYTICS_TOKEN;
	if (!accountId || !token) {
		return text('Missing CF_ACCOUNT_ID or CF_ANALYTICS_TOKEN env vars.', 500);
	}

	const params = new URL(request.url).searchParams;
	const source = params.get('source') || '';
	const srcClause = SOURCE_FILTERS[source] ? ` AND (${SOURCE_FILTERS[source]})` : '';

	// `?bot=` filters every crawler panel to one bot. Whitelisted to a strict
	// charset so the value can be inlined safely as a SQL string literal —
	// AE SQL doesn't expose parameter binding for the REST endpoint.
	const rawBot = params.get('bot') || '';
	const bot = /^[A-Za-z0-9._-]+$/.test(rawBot) ? rawBot : '';
	const botClause = bot ? ` AND index1 = '${bot}'` : '';

	const queries = {
		// --- Crawlers ---------------------------------------------------------
		agent_top24h: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '1' DAY${srcClause}${botClause}
			GROUP BY bot ORDER BY count DESC LIMIT 50
		`,
		agent_top7d: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '7' DAY${srcClause}${botClause}
			GROUP BY bot ORDER BY count DESC LIMIT 50
		`,
		agent_top30d: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '30' DAY${srcClause}${botClause}
			GROUP BY bot ORDER BY count DESC LIMIT 50
		`,
		agent_topPaths: `
			SELECT index1 AS bot, blob4 AS path, SUM(_sample_interval) AS count
			FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '7' DAY${srcClause}${botClause}
			GROUP BY bot, path ORDER BY count DESC LIMIT 200
		`,
		agent_hourly: `
			SELECT toStartOfHour(timestamp) AS hour, index1 AS bot, SUM(_sample_interval) AS count
			FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '1' DAY${srcClause}${botClause}
			GROUP BY hour, bot ORDER BY hour ASC
		`,
		// Bot picker — always unfiltered so the dropdown stays usable
		// regardless of which source/bot is currently active. 30d window
		// catches everything that has crawled recently. Volume-ordered so
		// the busiest bots show up first.
		agent_botPicker: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '30' DAY
			GROUP BY bot ORDER BY count DESC LIMIT 200
		`,
		// AE SQL has no CASE/IF, so each source is its own query, combined
		// client-side. The source picker is always 7d-unfiltered so it stays a
		// usable filter regardless of which source is currently active.
		src_signatureAgent: `
			SELECT SUM(_sample_interval) AS count FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 != ''
		`,
		src_uaMatch: `
			SELECT SUM(_sample_interval) AS count FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = '' AND blob3 != ''
		`,
		src_cfVerified: `
			SELECT SUM(_sample_interval) AS count FROM ${AGENT}
			WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = '' AND blob3 = '' AND blob2 != ''
		`,

		// --- Ask (REST /ask, surface='rest') ----------------------------------
		ask_hourly: `
			SELECT toStartOfHour(timestamp) AS hour, SUM(_sample_interval) AS count
			FROM ${ASK}
			WHERE blob1 = 'rest' AND timestamp > NOW() - INTERVAL '1' DAY
			GROUP BY hour ORDER BY hour ASC
		`,
		ask_total24h: `
			SELECT SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'rest' AND timestamp > NOW() - INTERVAL '1' DAY
		`,
		ask_total7d: `
			SELECT SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'rest' AND timestamp > NOW() - INTERVAL '7' DAY
		`,
		ask_errors7d: `
			SELECT SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'rest' AND blob9 = '1' AND timestamp > NOW() - INTERVAL '7' DAY
		`,
		ask_modes7d: `
			SELECT blob2 AS mode, SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'rest' AND timestamp > NOW() - INTERVAL '7' DAY
			GROUP BY mode ORDER BY count DESC
		`,
		// Country picker for REST callers.
		ask_countries7d: `
			SELECT blob8 AS country, SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'rest' AND timestamp > NOW() - INTERVAL '7' DAY
			GROUP BY country ORDER BY count DESC LIMIT 30
		`,
		ask_recent: `
			SELECT timestamp AS time, blob2 AS mode, blob3 AS query, blob9 AS error,
			       blob10 AS result_count, blob11 AS referer, blob8 AS country
			FROM ${ASK}
			WHERE blob1 = 'rest' AND timestamp > NOW() - INTERVAL '30' DAY
			ORDER BY time DESC LIMIT 200
		`,

		// --- MCP (surface='mcp') ----------------------------------------------
		mcp_hourly: `
			SELECT toStartOfHour(timestamp) AS hour, SUM(_sample_interval) AS count
			FROM ${ASK}
			WHERE blob1 = 'mcp' AND timestamp > NOW() - INTERVAL '1' DAY
			GROUP BY hour ORDER BY hour ASC
		`,
		mcp_total24h: `
			SELECT SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'mcp' AND timestamp > NOW() - INTERVAL '1' DAY
		`,
		mcp_tools7d: `
			SELECT blob2 AS tool, SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'mcp' AND blob2 IN ('ask_joost', 'list_recent_content')
			  AND timestamp > NOW() - INTERVAL '7' DAY
			GROUP BY tool ORDER BY count DESC
		`,
		mcp_tools24h: `
			SELECT blob2 AS tool, SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'mcp' AND blob2 IN ('ask_joost', 'list_recent_content')
			  AND timestamp > NOW() - INTERVAL '1' DAY
			GROUP BY tool ORDER BY count DESC
		`,
		mcp_methods7d: `
			SELECT blob2 AS method, SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'mcp' AND timestamp > NOW() - INTERVAL '7' DAY
			GROUP BY method ORDER BY count DESC
		`,
		// Client identity used to arrive only on initialize rows. MCP
		// 2026-07-28 clients skip the handshake and send clientInfo in _meta
		// on every request, so this counts all identified rows instead.
		// Semantics shifted from "sessions per client" to "identified
		// requests per client" — modern clients weigh in on every call,
		// legacy clients only at initialize.
		mcp_clients30d: `
			SELECT blob4 AS client, blob5 AS version, SUM(_sample_interval) AS count
			FROM ${ASK}
			WHERE blob1 = 'mcp' AND blob4 != '' AND timestamp > NOW() - INTERVAL '30' DAY
			GROUP BY client, version ORDER BY count DESC LIMIT 50
		`,
		mcp_protocols30d: `
			SELECT blob6 AS protocol, SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'mcp' AND blob6 != '' AND timestamp > NOW() - INTERVAL '30' DAY
			GROUP BY protocol ORDER BY count DESC
		`,
		mcp_errors7d: `
			SELECT SUM(_sample_interval) AS count FROM ${ASK}
			WHERE blob1 = 'mcp' AND blob9 = '1' AND timestamp > NOW() - INTERVAL '7' DAY
		`,
		mcp_recent: `
			SELECT timestamp AS time, blob2 AS tool, blob3 AS args, blob9 AS error,
			       blob8 AS country
			FROM ${ASK}
			WHERE blob1 = 'mcp' AND blob2 IN ('ask_joost', 'list_recent_content')
			  AND timestamp > NOW() - INTERVAL '30' DAY
			ORDER BY time DESC LIMIT 200
		`,
	};

	const results = {};
	const errors = {};
	await Promise.all(
		Object.entries(queries).map(async ([key, sql]) => {
			try {
				results[key] = await queryAE(accountId, token, sql);
			} catch (err) {
				errors[key] = err.message;
			}
		})
	);

	return new Response(renderDashboard(results, errors, source, bot), {
		headers: { 'Content-Type': 'text/html;charset=utf-8' },
	});
}

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
		throw new Error(`${res.status}: ${await res.text()}`);
	}
	return await res.json();
}

function text(body, status = 200) {
	return new Response(body, { status, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
}

// --- Formatting helpers ---------------------------------------------------

function esc(s) {
	return String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function fmtNum(n) {
	return new Intl.NumberFormat('en-US').format(Number(n) || 0);
}

function rowsOrEmpty(result) {
	return result && result.data ? result.data : [];
}

function firstCount(result) {
	const rows = rowsOrEmpty(result);
	return rows.length === 0 ? 0 : Number(rows[0].count) || 0;
}

function sumCounts(result) {
	return rowsOrEmpty(result).reduce((s, r) => s + (Number(r.count) || 0), 0);
}

// Renders a table. `numeric` lists right-aligned columns; `formatters` maps
// header to a cell renderer.
function renderTable(headers, rows, { numeric = [], formatters = {} } = {}) {
	if (rows.length === 0) return `<p class="empty">No data yet.</p>`;
	const head = headers
		.map((h) => `<th${numeric.includes(h) ? ' class="num"' : ''}>${esc(h)}</th>`)
		.join('');
	const body = rows
		.map((row) => {
			const cells = headers
				.map((h) => {
					const key = h.toLowerCase().replace(/\s+/g, '_');
					const val = row[h] ?? row[key] ?? row[h.toLowerCase()];
					const fmt = formatters[h] || ((v) => esc(v));
					return `<td${numeric.includes(h) ? ' class="num"' : ''}>${fmt(val)}</td>`;
				})
				.join('');
			return `<tr>${cells}</tr>`;
		})
		.join('');
	return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const countCol = { numeric: ['count'], formatters: { count: (v) => fmtNum(v) } };

const PALETTE = [
	'#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
	'#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7',
];
const OTHER_COLOR = '#64748b';

// Stacked horizontal bars: one bar per hour, segmented by key. Used by the
// crawler section for per-bot hourly stacks.
function renderHourlyStacked(rows) {
	if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

	const byHour = new Map();
	const totals = new Map();
	for (const r of rows) {
		const hour = String(r.hour);
		const key = String(r.bot || 'unknown');
		const count = Number(r.count) || 0;
		if (!byHour.has(hour)) byHour.set(hour, []);
		byHour.get(hour).push({ key, count });
		totals.set(key, (totals.get(key) || 0) + count);
	}

	const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
	const topKeys = sorted.slice(0, PALETTE.length).map(([name]) => name);
	const topIndex = new Map(topKeys.map((name, i) => [name, i]));
	const colorFor = (k) => (topIndex.has(k) ? PALETTE[topIndex.get(k)] : OTHER_COLOR);

	const hours = [...byHour.entries()]
		.map(([hour, entries]) => ({
			hour,
			total: entries.reduce((s, e) => s + e.count, 0),
			entries,
		}))
		.sort((a, b) => a.hour.localeCompare(b.hour));
	const max = Math.max(...hours.map((h) => h.total), 0);

	const bars = hours
		.map(({ hour, total, entries }) => {
			const widthPct = max > 0 ? (total / max) * 100 : 0;
			const segs = entries
				.slice()
				.sort((a, b) => {
					const ai = topIndex.has(a.key) ? topIndex.get(a.key) : Infinity;
					const bi = topIndex.has(b.key) ? topIndex.get(b.key) : Infinity;
					return ai !== bi ? ai - bi : b.count - a.count;
				})
				.map(({ key, count }) => {
					const segPct = total > 0 ? (count / total) * 100 : 0;
					return `<span class="bar-seg" style="width:${segPct.toFixed(2)}%;background:${colorFor(key)}" title="${esc(key)}: ${fmtNum(count)}"></span>`;
				})
				.join('');
			const label = new Date(hour.replace(' ', 'T') + 'Z').toISOString().slice(11, 16) + ' UTC';
			return `<div class="bar-row"><span class="bar-label">${esc(label)}</span><span class="bar"><span class="bar-stack" style="width:${widthPct.toFixed(2)}%">${segs}</span></span><span class="bar-count">${fmtNum(total)}</span></div>`;
		})
		.join('');

	const legendEntries = topKeys.map((name) => ({
		name,
		total: totals.get(name),
		color: colorFor(name),
	}));
	const otherKeys = sorted.slice(PALETTE.length);
	if (otherKeys.length > 0) {
		legendEntries.push({
			name: `other (${otherKeys.length})`,
			total: otherKeys.reduce((s, [, t]) => s + t, 0),
			color: OTHER_COLOR,
		});
	}
	const legend = legendEntries
		.map(
			(e) =>
				`<span class="legend-item"><span class="legend-swatch" style="background:${e.color}"></span>${esc(e.name)} <span class="legend-count">${fmtNum(e.total)}</span></span>`
		)
		.join('');

	return `<div class="bars">${bars}</div><div class="legend">${legend}</div>`;
}

// Single-line chart: total per hour across 24 contiguous UTC hours.
function renderHourLineChart(rows, color, ariaLabel) {
	if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

	const totals = new Map();
	for (const r of rows) {
		const k = String(r.hour);
		totals.set(k, (totals.get(k) || 0) + (Number(r.count) || 0));
	}

	const lastHour = new Date();
	lastHour.setUTCMinutes(0, 0, 0);
	const grid = [];
	for (let i = 23; i >= 0; i--) {
		const t = new Date(lastHour);
		t.setUTCHours(t.getUTCHours() - i);
		const key = t.toISOString().slice(0, 19).replace('T', ' ');
		grid.push({ time: t, value: totals.get(key) || 0 });
	}

	const max = Math.max(...grid.map((p) => p.value), 1);
	const W = 600, H = 200, padL = 40, padR = 8, padT = 12, padB = 26;
	const plotW = W - padL - padR;
	const plotH = H - padT - padB;
	const xFor = (i) => padL + (plotW * i) / Math.max(1, grid.length - 1);
	const yFor = (v) => padT + plotH - (plotH * v) / max;

	const linePts = grid.map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.value).toFixed(1)}`).join(' ');
	const yTicks = max <= 4 ? [0, max] : [0, Math.round(max / 2), max];
	const gridLines = yTicks
		.map(
			(v) =>
				`<line x1="${padL}" x2="${W - padR}" y1="${yFor(v).toFixed(1)}" y2="${yFor(v).toFixed(1)}" stroke="#1c2025" />` +
				`<text x="${padL - 6}" y="${(yFor(v) + 3).toFixed(1)}" text-anchor="end" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${fmtNum(v)}</text>`
		)
		.join('');
	const xLabels = grid
		.map((p, i) => ({ i, t: p.time }))
		.filter(({ i }) => i % 4 === 0 || i === grid.length - 1)
		.map(
			({ i, t }) =>
				`<text x="${xFor(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${t.toISOString().slice(11, 13)}</text>`
		)
		.join('');
	const dots = grid
		.map(
			(p, i) =>
				`<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="2.5" fill="${color}"><title>${esc(p.time.toISOString().slice(0, 16))} UTC: ${fmtNum(p.value)}</title></circle>`
		)
		.join('');

	return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(ariaLabel)}">${gridLines}<polyline points="${linePts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" />${dots}${xLabels}</svg>`;
}

function statCard(label, value) {
	return `<div class="stat"><span class="stat-num">${fmtNum(value)}</span><span class="stat-label">${esc(label)}</span></div>`;
}

// Detection-source breakdown. Each row links to ?source=, the active row
// links back to unfiltered. Always 7d, unfiltered, so it stays a usable
// picker regardless of which source is active.
function renderSourceTable(results, activeSource, activeBot) {
	const rows = [
		{ source: 'signature-agent', count: firstCount(results.src_signatureAgent) },
		{ source: 'ua-match', count: firstCount(results.src_uaMatch) },
		{ source: 'cf-verified', count: firstCount(results.src_cfVerified) },
	].filter((r) => r.count > 0);
	if (rows.length === 0) return `<p class="empty">No data yet.</p>`;
	const body = rows
		.map((r) => {
			const active = r.source === activeSource;
			const params = new URLSearchParams();
			if (!active) params.set('source', r.source);
			if (activeBot) params.set('bot', activeBot);
			const qs = params.toString();
			const href = qs ? `?${qs}` : '?';
			const label = active ? `${r.source} — clear filter` : r.source;
			return `<tr class="${active ? 'src-active' : ''}"><td><a class="src-link" href="${esc(href)}">${esc(label)}</a></td><td class="num">${fmtNum(r.count)}</td></tr>`;
		})
		.join('');
	return `<table><thead><tr><th>source</th><th class="num">count</th></tr></thead><tbody>${body}</tbody></table>`;
}

// --- Page render ----------------------------------------------------------

function renderDashboard(results, errors, source = '', bot = '') {
	const errorBlock =
		Object.keys(errors).length === 0
			? ''
			: `<div class="errors"><h3>Query errors</h3><p class="errors-note">A "table not found" error is expected until the matching dataset has received its first write.</p><pre>${esc(JSON.stringify(errors, null, 2))}</pre></div>`;

	const crawlerBots = new Set(
		rowsOrEmpty(results.agent_topPaths).map((r) => String(r.bot || '')).filter(Boolean)
	);
	// Bot picker uses the unfiltered 30d list so the dropdown stays stable
	// across source/bot selections. If the currently-selected bot is older
	// than 30d (vanishingly unlikely), splice it in so the <select> doesn't
	// lose the active value.
	const pickerBots = rowsOrEmpty(results.agent_botPicker)
		.map((r) => String(r.bot || ''))
		.filter(Boolean);
	if (bot && !pickerBots.includes(bot)) pickerBots.unshift(bot);
	pickerBots.sort((a, b) => a.localeCompare(b));
	const askModes = new Set(
		rowsOrEmpty(results.ask_recent).map((r) => String(r.mode || '')).filter(Boolean)
	);
	const askCountries = new Set(
		rowsOrEmpty(results.ask_recent).map((r) => String(r.country || '')).filter(Boolean)
	);
	const mcpTools = new Set(
		rowsOrEmpty(results.mcp_recent).map((r) => String(r.tool || '')).filter(Boolean)
	);

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<meta name="robots" content="noindex">
	<title>Stats — admin</title>
	<style>
		:root { color-scheme: dark; }
		body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0b0d10; color:#e6e6e6; margin:0; padding:2rem; max-width:1100px; margin-inline:auto; }
		h1 { font-size:1.4rem; margin:0 0 .25rem; }
		h2 { font-size:1.05rem; margin:2rem 0 .75rem; color:#9bb; border-bottom:1px solid #233; padding-bottom:.25rem; }
		.sub { color:#777; margin-bottom:1.5rem; font-size:.85rem; }
		table { width:100%; border-collapse:collapse; font-size:.85rem; }
		th, td { text-align:left; padding:.4rem .6rem; border-bottom:1px solid #1c2025; vertical-align:top; }
		th { color:#9bb; font-weight:normal; text-transform:uppercase; font-size:.7rem; letter-spacing:.05em; }
		td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; }
		.cols { display:grid; grid-template-columns:1fr 1fr; gap:2rem; }
		@media (max-width:800px) { .cols { grid-template-columns:1fr; } }
		.empty { color:#666; font-style:italic; font-size:.85rem; }
		.bars { display:flex; flex-direction:column; gap:.15rem; }
		.bar-row { display:grid; grid-template-columns:6em 1fr 5em; gap:.5rem; align-items:center; font-size:.75rem; }
		.bar-label { color:#9bb; }
		.bar { background:#1c2025; height:1rem; border-radius:2px; overflow:hidden; }
		.bar-stack { display:flex; height:100%; }
		.bar-seg { display:block; height:100%; }
		.bar-count { text-align:right; color:#bbb; font-variant-numeric:tabular-nums; }
		.legend { display:flex; flex-wrap:wrap; gap:.5rem 1rem; margin-top:.75rem; font-size:.75rem; }
		.legend-item { display:inline-flex; align-items:center; gap:.4rem; color:#bbd; }
		.legend-swatch { display:inline-block; width:.7rem; height:.7rem; border-radius:2px; }
		.legend-count { color:#888; font-variant-numeric:tabular-nums; }
		.filter-row { display:flex; gap:.5rem; align-items:center; margin:0 0 .75rem; flex-wrap:wrap; }
		.filter-row input, .filter-row select, .source-bar select { padding:.35rem .6rem; border:1px solid #1c2025; border-radius:3px; background:#0b0d10; color:#e6e6e6; font:inherit; font-size:.8rem; min-width:12rem; }
		.filter-row input:focus, .filter-row select:focus, .source-bar select:focus { outline:none; border-color:#3b82f6; }
		.filter-stats { color:#888; font-size:.75rem; }
		.errors { background:#2a1010; border:1px solid #5a2020; padding:1rem; border-radius:4px; margin:1.5rem 0; }
		.errors h3 { margin:0 0 .25rem; font-size:.9rem; }
		.errors-note { color:#caa; font-size:.75rem; margin:0 0 .5rem; }
		.errors pre { white-space:pre-wrap; word-break:break-word; font-size:.72rem; color:#fbb; margin:0; }
		.path, .query, .args { color:#bbd; word-break:break-all; }
		.line-chart { width:100%; height:auto; max-height:220px; display:block; }
		.panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:1rem; border-bottom:1px solid #233; padding-bottom:.25rem; margin:2rem 0 .75rem; }
		.panel-head h2.panel-title { border:none; margin:0; padding:0; font-size:1.05rem; color:#9bb; text-transform:none; letter-spacing:0; }
		.tabs { display:inline-flex; gap:.25rem; }
		.tab { background:transparent; color:#9bb; border:1px solid #1c2025; padding:.2rem .55rem; border-radius:3px; font:inherit; font-size:.7rem; cursor:pointer; }
		.tab:hover { background:#1c2025; }
		.tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
		.section-nav { display:flex; gap:.4rem; margin:0 0 1.5rem; }
		.section-nav .tab { font-size:.85rem; padding:.4rem 1rem; }
		.stats-row { display:flex; flex-wrap:wrap; gap:1rem; margin:0 0 .5rem; }
		.stat { background:#11141a; border:1px solid #1c2025; border-radius:4px; padding:.6rem 1rem; min-width:7rem; }
		.stat-num { display:block; font-size:1.3rem; font-variant-numeric:tabular-nums; }
		.stat-label { display:block; color:#9bb; font-size:.68rem; text-transform:uppercase; letter-spacing:.05em; margin-top:.15rem; }
		.err-flag { color:#f87171; }
		.source-bar { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin:0 0 2rem; padding:.6rem .75rem; background:#11141a; border:1px solid #1c2025; border-radius:4px; }
		.source-bar label { color:#9bb; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; }
		.source-bar .filter-stats { margin-left:auto; }
		.source-bar .filter-stats strong { color:#3b82f6; }
		a.src-link { color:#bbd; text-decoration:none; }
		a.src-link:hover { color:#fff; text-decoration:underline; }
		tr.src-active { background:#13243b; }
		tr.src-active a.src-link { color:#3b82f6; font-weight:bold; }
		.referer { color:#778; font-size:.7rem; word-break:break-all; }
	</style>
</head>
<body>
	<h1>Stats</h1>
	<p class="sub">All times UTC. Counts are Analytics Engine sample-adjusted totals.</p>

	${errorBlock}

	<div class="section-nav tabs" data-tabs="sections">
		<button type="button" class="tab active" data-tab="section-crawlers">Crawlers</button>
		<button type="button" class="tab" data-tab="section-ask">Ask (REST)</button>
		<button type="button" class="tab" data-tab="section-mcp">MCP</button>
	</div>

	<div id="section-crawlers" class="tab-pane">
		<div class="source-bar">
			<label for="source-filter">Detection source</label>
			<select id="source-filter" data-param="source">
				${['', 'signature-agent', 'ua-match', 'cf-verified']
					.map((v) => `<option value="${esc(v)}"${v === source ? ' selected' : ''}>${v === '' ? 'All sources' : esc(v)}</option>`)
					.join('')}
			</select>
			<label for="bot-filter">Bot</label>
			<select id="bot-filter" data-param="bot">
				<option value=""${bot === '' ? ' selected' : ''}>All bots</option>
				${pickerBots.map((b) => `<option value="${esc(b)}"${b === bot ? ' selected' : ''}>${esc(b)}</option>`).join('')}
			</select>
			${
				source || bot
					? `<span class="filter-stats">Crawler panels filtered${source ? ` to <strong>${esc(source)}</strong>` : ''}${source && bot ? ' &amp;' : ''}${bot ? ` <strong>${esc(bot)}</strong>` : ''}. The Detection source table keeps the full 7d breakdown.</span>`
					: `<span class="filter-stats">Showing all bot traffic. Pick a source or bot to filter.</span>`
			}
		</div>

		<div class="stats-row">
			${statCard('Crawls 24h', sumCounts(results.agent_top24h))}
			${statCard('Crawls 7d', sumCounts(results.agent_top7d))}
			${statCard('Distinct bots 7d', rowsOrEmpty(results.agent_top7d).length)}
		</div>

		<div class="cols">
			<div>
				<h2>Crawls per hour — last 24h</h2>
				${renderHourLineChart(rowsOrEmpty(results.agent_hourly), '#3b82f6', 'Crawls per hour, last 24h')}
			</div>
			<div>
				<div class="panel-head">
					<h2 class="panel-title">Top bots</h2>
					<div class="tabs" data-tabs="agent-top">
						<button type="button" class="tab active" data-tab="bots-24h">24h</button>
						<button type="button" class="tab" data-tab="bots-7d">7d</button>
						<button type="button" class="tab" data-tab="bots-30d">30d</button>
					</div>
				</div>
				<div id="bots-24h" class="tab-pane">${renderTable(['bot', 'count'], rowsOrEmpty(results.agent_top24h), countCol)}</div>
				<div id="bots-7d" class="tab-pane" hidden>${renderTable(['bot', 'count'], rowsOrEmpty(results.agent_top7d), countCol)}</div>
				<div id="bots-30d" class="tab-pane" hidden>${renderTable(['bot', 'count'], rowsOrEmpty(results.agent_top30d), countCol)}</div>
			</div>
		</div>

		<h2>Detection source — last 7d</h2>
		${renderSourceTable(results, source, bot)}

		<h2>Requests per hour — last 24h</h2>
		${renderHourlyStacked(rowsOrEmpty(results.agent_hourly))}

		<h2>Top paths per bot — last 7d</h2>
		<div class="filter-row" data-filter-for="agent-paths-table">
			<select data-col="0">
				<option value="">All bots</option>
				${[...crawlerBots].sort((a, b) => a.localeCompare(b)).map((b) => `<option value="${esc(b)}">${esc(b)}</option>`).join('')}
			</select>
			<input type="search" data-col="1" placeholder="Filter path…" autocomplete="off" spellcheck="false">
			<span class="filter-stats" data-filter-stats></span>
		</div>
		<div id="agent-paths-table">
			${renderTable(['bot', 'path', 'count'], rowsOrEmpty(results.agent_topPaths), {
				numeric: ['count'],
				formatters: {
					path: (v) => `<span class="path">${esc(v)}</span>`,
					count: (v) => fmtNum(v),
				},
			})}
		</div>
	</div>

	<div id="section-ask" class="tab-pane" hidden>
		<div class="stats-row">
			${statCard('/ask 24h', firstCount(results.ask_total24h))}
			${statCard('/ask 7d', firstCount(results.ask_total7d))}
			${statCard('Errors 7d', firstCount(results.ask_errors7d))}
		</div>

		<div class="cols">
			<div>
				<h2>/ask per hour — last 24h</h2>
				${renderHourLineChart(rowsOrEmpty(results.ask_hourly), '#10b981', '/ask per hour, last 24h')}
			</div>
			<div>
				<h2>Modes — last 7d</h2>
				${renderTable(['mode', 'count'], rowsOrEmpty(results.ask_modes7d), countCol)}
			</div>
		</div>

		<h2>Countries — last 7d</h2>
		${renderTable(['country', 'count'], rowsOrEmpty(results.ask_countries7d).map((r) => ({ country: r.country || '(unknown)', count: r.count })), countCol)}

		<h2>Recent queries — last 30d</h2>
		<div class="filter-row" data-filter-for="ask-recent-table">
			<select data-col="1">
				<option value="">All modes</option>
				${[...askModes].sort((a, b) => a.localeCompare(b)).map((m) => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}
			</select>
			<select data-col="5">
				<option value="">All countries</option>
				${[...askCountries].sort((a, b) => a.localeCompare(b)).map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
			</select>
			<input type="search" data-col="2" placeholder="Filter query…" autocomplete="off" spellcheck="false">
			<span class="filter-stats" data-filter-stats></span>
		</div>
		<div id="ask-recent-table">
			${renderTable(['time', 'mode', 'query', 'results', 'error', 'country', 'referer'], rowsOrEmpty(results.ask_recent).map((r) => ({
				time: r.time,
				mode: r.mode || '',
				query: r.query || '',
				results: r.result_count || '',
				error: r.error || '',
				country: r.country || '',
				referer: r.referer || '',
			})), {
				numeric: ['results'],
				formatters: {
					time: (v) => esc(String(v).slice(5, 16)),
					query: (v) => `<span class="query">${esc(v)}</span>`,
					error: (v) => (v === '1' ? '<span class="err-flag" title="returned an error">error</span>' : ''),
					referer: (v) => `<span class="referer">${esc(shortReferer(v))}</span>`,
				},
			})}
		</div>
	</div>

	<div id="section-mcp" class="tab-pane" hidden>
		<div class="stats-row">
			${statCard('MCP calls 24h', firstCount(results.mcp_total24h))}
			${statCard('Tool calls 7d', sumCounts(results.mcp_tools7d))}
			${statCard('Errors 7d', firstCount(results.mcp_errors7d))}
		</div>

		<div class="cols">
			<div>
				<h2>MCP per hour — last 24h</h2>
				${renderHourLineChart(rowsOrEmpty(results.mcp_hourly), '#a855f7', 'MCP calls per hour, last 24h')}
			</div>
			<div>
				<div class="panel-head">
					<h2 class="panel-title">Top tools</h2>
					<div class="tabs" data-tabs="mcp-top">
						<button type="button" class="tab active" data-tab="tools-24h">24h</button>
						<button type="button" class="tab" data-tab="tools-7d">7d</button>
					</div>
				</div>
				<div id="tools-24h" class="tab-pane">${renderTable(['tool', 'count'], rowsOrEmpty(results.mcp_tools24h), countCol)}</div>
				<div id="tools-7d" class="tab-pane" hidden>${renderTable(['tool', 'count'], rowsOrEmpty(results.mcp_tools7d), countCol)}</div>
			</div>
		</div>

		<div class="cols">
			<div>
				<h2>Methods — last 7d</h2>
				${renderTable(['method', 'count'], rowsOrEmpty(results.mcp_methods7d), countCol)}
			</div>
			<div>
				<h2>Protocol versions — last 30d</h2>
				${renderTable(['protocol', 'count'], rowsOrEmpty(results.mcp_protocols30d).map((r) => ({ protocol: r.protocol || '(none)', count: r.count })), countCol)}
			</div>
		</div>

		<h2>MCP clients — identified requests, last 30d</h2>
		${renderTable(['client', 'version', 'count'], rowsOrEmpty(results.mcp_clients30d).map((r) => ({ client: r.client || '(unknown)', version: r.version || '', count: r.count })), countCol)}

		<h2>Recent tool calls — last 30d</h2>
		<div class="filter-row" data-filter-for="mcp-recent-table">
			<select data-col="1">
				<option value="">All tools</option>
				${[...mcpTools].sort((a, b) => a.localeCompare(b)).map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}
			</select>
			<input type="search" data-col="2" placeholder="Filter arguments…" autocomplete="off" spellcheck="false">
			<span class="filter-stats" data-filter-stats></span>
		</div>
		<div id="mcp-recent-table">
			${renderTable(['time', 'tool', 'args', 'error', 'country'], rowsOrEmpty(results.mcp_recent), {
				formatters: {
					time: (v) => esc(String(v).slice(5, 16)),
					args: (v) => `<span class="args">${esc(v)}</span>`,
					error: (v) => (v === '1' ? '<span class="err-flag" title="returned an error">error</span>' : ''),
				},
			})}
		</div>
	</div>

	<script>
		// Tab groups: clicking a .tab toggles .active and shows its data-tab pane.
		document.querySelectorAll('.tabs').forEach((group) => {
			const buttons = group.querySelectorAll('.tab');
			buttons.forEach((btn) => {
				btn.addEventListener('click', () => {
					buttons.forEach((b) => {
						b.classList.toggle('active', b === btn);
						const pane = document.getElementById(b.dataset.tab);
						if (pane) pane.hidden = b !== btn;
					});
				});
			});
		});

		// Section deep-linking via #section-ask / #section-mcp.
		(() => {
			const hash = window.location.hash.slice(1);
			if (!hash) return;
			const target = document.querySelector('.section-nav [data-tab="' + CSS.escape(hash) + '"]');
			if (target) target.click();
		})();

		// Source/bot selects reload the page, updating one URL param each and
		// preserving the others. Any <select data-param="X"> participates.
		document.querySelectorAll('.source-bar select[data-param]').forEach((sel) => {
			sel.addEventListener('change', () => {
				const params = new URLSearchParams(window.location.search);
				const key = sel.dataset.param;
				if (sel.value) params.set(key, sel.value);
				else params.delete(key);
				const qs = params.toString();
				window.location.href = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
			});
		});

		// Generic table filters: a .filter-row[data-filter-for] drives the table
		// with that id. <select data-col> = exact match, <input data-col> = substring.
		document.querySelectorAll('[data-filter-for]').forEach((wrap) => {
			const table = document.getElementById(wrap.dataset.filterFor);
			if (!table) return;
			const controls = Array.from(wrap.querySelectorAll('[data-col]'));
			const stats = wrap.querySelector('[data-filter-stats]');
			const rows = Array.from(table.querySelectorAll('tbody tr'));
			const total = rows.length;
			function apply() {
				let visible = 0;
				for (const r of rows) {
					const cells = r.querySelectorAll('td');
					const show = controls.every((c) => {
						const v = c.value.trim();
						if (!v) return true;
						const cellText = (cells[Number(c.dataset.col)]?.textContent || '').trim();
						return c.tagName === 'SELECT'
							? cellText === v
							: cellText.toLowerCase().includes(v.toLowerCase());
					});
					r.style.display = show ? '' : 'none';
					if (show) visible++;
				}
				if (stats) stats.textContent = visible === total ? total + ' rows' : visible + ' of ' + total + ' rows';
			}
			controls.forEach((c) => {
				c.addEventListener('input', apply);
				c.addEventListener('change', apply);
			});
			apply();
		});
	</script>
</body>
</html>`;
}

// Compresses a long referer URL into hostname + first 60 chars of path.
function shortReferer(v) {
	if (!v) return '';
	try {
		const u = new URL(v);
		const tail = (u.pathname + u.search).slice(0, 60);
		return u.hostname + (tail === '/' ? '' : tail);
	} catch {
		return String(v).slice(0, 80);
	}
}
