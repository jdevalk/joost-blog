// Dashboard for bot/agent traffic captured by `functions/_middleware.js`.
// Access to /admin/* is gated by Cloudflare Access at the edge, so this
// function assumes the caller is already authenticated.
// Queries the Cloudflare Analytics Engine SQL API with a token stored as a Pages secret.

const DATASET = 'agent_log';

// Detection-source filter fragments. blob1 = signature-agent header,
// blob3 = matched UA name, blob2 = cf-verified flag. Precedence mirrors
// the middleware: signature-agent > ua-match > cf-verified.
const SOURCE_FILTERS = {
    'signature-agent': "blob1 != ''",
    'ua-match': "blob1 = '' AND blob3 != ''",
    'cf-verified': "blob1 = '' AND blob3 = '' AND blob2 != ''"
};

export async function onRequest(context) {
    const { env, request } = context;

    const accountId = env.CF_ACCOUNT_ID;
    const token = env.CF_ANALYTICS_TOKEN;
    if (!accountId || !token) {
        return text('Missing CF_ACCOUNT_ID or CF_ANALYTICS_TOKEN env vars.', 500);
    }

    // `?source=` filters every panel by detection source. Only known keys map
    // to a SQL fragment, so the param can't inject anything.
    const source = new URL(request.url).searchParams.get('source') || '';
    const srcClause = SOURCE_FILTERS[source] ? ` AND (${SOURCE_FILTERS[source]})` : '';

    const queries = {
        top24h: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '1' DAY${srcClause}
			GROUP BY bot
			ORDER BY count DESC
			LIMIT 50
		`,
        top7d: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY${srcClause}
			GROUP BY bot
			ORDER BY count DESC
			LIMIT 50
		`,
        top30d: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '30' DAY${srcClause}
			GROUP BY bot
			ORDER BY count DESC
			LIMIT 50
		`,
        topPaths: `
			SELECT index1 AS bot, blob4 AS path, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY${srcClause}
			GROUP BY bot, path
			ORDER BY count DESC
			LIMIT 200
		`,
        hourly: `
			SELECT toStartOfHour(timestamp) AS hour, index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '1' DAY${srcClause}
			GROUP BY hour, bot
			ORDER BY hour ASC
		`,
        // Analytics Engine SQL doesn't support CASE/IF, so we count each source
        // with separate queries and combine client-side. Precedence matters:
        // signature-agent > ua-match > cf-verified, mirroring the middleware.
        src_signatureAgent: `
			SELECT SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 != ''
		`,
        src_uaMatch: `
			SELECT SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = '' AND blob3 != ''
		`,
        src_cfVerified: `
			SELECT SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob1 = '' AND blob3 = '' AND blob2 != ''
		`
    };

    const results = {};
    const errors = {};
    await Promise.all(
        Object.entries(queries).map(async ([key, sql]) => {
            try {
                const data = await queryAE(accountId, token, sql);
                results[key] = data;
            } catch (err) {
                errors[key] = err.message;
            }
        })
    );

    return new Response(renderDashboard(results, errors, source), {
        headers: { 'Content-Type': 'text/html;charset=utf-8' }
    });
}

async function queryAE(accountId, token, sql) {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain'
        },
        body: sql
    });
    if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
    }
    return await res.json();
}

function text(body, status = 200) {
    return new Response(body, { status, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
}

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
    if (!result || !result.data) return [];
    return result.data;
}

function firstCount(result) {
    const rows = rowsOrEmpty(result);
    if (rows.length === 0) return 0;
    return Number(rows[0].count) || 0;
}

function renderTable(headers, rows, formatters = {}) {
    if (rows.length === 0) {
        return `<p class="empty">No data yet.</p>`;
    }
    const head = headers.map((h) => `<th>${esc(h)}</th>`).join('');
    const body = rows
        .map((row) => {
            const cells = headers
                .map((h) => {
                    const key = h.toLowerCase().replace(/\s+/g, '_');
                    const val = row[h] ?? row[key] ?? row[h.toLowerCase()];
                    const fmt = formatters[h] || ((v) => esc(v));
                    return `<td>${fmt(val)}</td>`;
                })
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

// Stable-ish palette. First N bots by total volume get a color; rest fold
// into 'other' (gray). Order chosen for distinguishability on a dark bg.
const BOT_PALETTE = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#a855f7' // purple
];
const OTHER_COLOR = '#64748b'; // slate

function renderHourly(rows) {
    if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

    // Bucket rows by hour and tally total per bot for color assignment.
    const byHour = new Map();
    const botTotals = new Map();
    for (const r of rows) {
        const hour = String(r.hour);
        const bot = String(r.bot || 'unknown');
        const count = Number(r.count) || 0;
        if (!byHour.has(hour)) byHour.set(hour, []);
        byHour.get(hour).push({ bot, count });
        botTotals.set(bot, (botTotals.get(bot) || 0) + count);
    }

    const sortedBots = [...botTotals.entries()].sort((a, b) => b[1] - a[1]);
    const topBots = sortedBots.slice(0, BOT_PALETTE.length).map(([name]) => name);
    const topBotIndex = new Map(topBots.map((name, i) => [name, i]));
    const colorFor = (bot) => (topBotIndex.has(bot) ? BOT_PALETTE[topBotIndex.get(bot)] : OTHER_COLOR);

    const hours = [...byHour.entries()]
        .map(([hour, entries]) => ({
            hour,
            total: entries.reduce((s, e) => s + e.count, 0),
            entries
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

    const max = Math.max(...hours.map((h) => h.total), 0);

    const bars = hours
        .map(({ hour, total, entries }) => {
            const widthPct = max > 0 ? (total / max) * 100 : 0;
            // Sort segments within a bar: top bots in palette order, then "other"
            // entries by size — so the colored segments group consistently across hours.
            const sortedEntries = entries.slice().sort((a, b) => {
                const ai = topBotIndex.has(a.bot) ? topBotIndex.get(a.bot) : Infinity;
                const bi = topBotIndex.has(b.bot) ? topBotIndex.get(b.bot) : Infinity;
                if (ai !== bi) return ai - bi;
                return b.count - a.count;
            });
            const segments = sortedEntries
                .map(({ bot, count }) => {
                    const segPct = total > 0 ? (count / total) * 100 : 0;
                    return `<span class="bar-seg" style="width:${segPct.toFixed(2)}%;background:${colorFor(bot)}" title="${esc(bot)}: ${fmtNum(count)}"></span>`;
                })
                .join('');
            // ClickHouse returns "YYYY-MM-DD HH:MM:SS" (no T, no Z). Safari parses that
            // as local time, drifting the axis by the viewer's UTC offset — normalize first.
            const iso = hour.replace(' ', 'T') + 'Z';
            const label = new Date(iso).toISOString().slice(11, 16) + ' UTC';
            return `
				<div class="bar-row">
					<span class="bar-label">${esc(label)}</span>
					<span class="bar"><span class="bar-stack" style="width:${widthPct.toFixed(2)}%">${segments}</span></span>
					<span class="bar-count">${fmtNum(total)}</span>
				</div>
			`;
        })
        .join('');

    const legendEntries = topBots.map((name) => ({
        key: name,
        name,
        total: botTotals.get(name),
        color: colorFor(name)
    }));
    const otherBots = sortedBots.slice(BOT_PALETTE.length);
    if (otherBots.length > 0) {
        legendEntries.push({
            key: '__other__',
            name: `other (${otherBots.length} bot${otherBots.length === 1 ? '' : 's'})`,
            total: otherBots.reduce((s, [, t]) => s + t, 0),
            color: OTHER_COLOR
        });
    }
    const legend = legendEntries
        .map(
            (e) =>
                `<span class="legend-item" data-bot="${esc(e.key)}" role="button" tabindex="0" title="Filter chart to ${esc(e.name)}"><span class="legend-swatch" style="background:${e.color}"></span>${esc(e.name)} <span class="legend-count">${fmtNum(e.total)}</span></span>`
        )
        .join('');

    // Per-hour, per-bot counts so the client can redraw the chart for a single
    // bot when its legend item is clicked. The all-bots view is the server-
    // rendered markup, which the script snapshots and restores on reset.
    const chartData = {
        topBots,
        otherColor: OTHER_COLOR,
        colors: Object.fromEntries(topBots.map((name) => [name, colorFor(name)])),
        hours: hours.map(({ hour, entries }) => ({
            label: new Date(hour.replace(' ', 'T') + 'Z').toISOString().slice(11, 16) + ' UTC',
            bots: entries.map(({ bot, count }) => [bot, count])
        }))
    };

    return `<div class="bars" id="hourly-bars">${bars}</div>
<div class="legend" id="hourly-legend">${legend}</div>
<p class="hourly-hint">Click a bot in the legend to filter the chart; click it again to show all.</p>
<script type="application/json" id="hourly-data">${JSON.stringify(chartData).replace(/</g, '\\u003c')}</script>`;
}

function renderHourLineChart(rows) {
    if (rows.length === 0) return `<p class="empty">No data yet.</p>`;

    // rows come back from the hourly query as one entry per (hour, bot);
    // sum across bots to get a per-hour total.
    const totals = new Map();
    for (const r of rows) {
        const k = String(r.hour);
        totals.set(k, (totals.get(k) || 0) + (Number(r.count) || 0));
    }

    // Build 24 contiguous UTC hours ending at the current hour. Zero-fill
    // any hour with no rows so the line doesn't skip over empty slots.
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
    const W = 600;
    const H = 200;
    const padL = 40;
    const padR = 8;
    const padT = 12;
    const padB = 26;
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

    const xTicks = grid.map((p, i) => ({ i, t: p.time })).filter(({ i }) => i % 4 === 0 || i === grid.length - 1);
    const xLabels = xTicks
        .map(
            ({ i, t }) =>
                `<text x="${xFor(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="#9bb" font-size="10" font-family="ui-monospace,monospace">${t.toISOString().slice(11, 13)}</text>`
        )
        .join('');

    const dots = grid
        .map(
            (p, i) =>
                `<circle cx="${xFor(i).toFixed(1)}" cy="${yFor(p.value).toFixed(1)}" r="2.5" fill="#3b82f6"><title>${esc(p.time.toISOString().slice(0, 16))} UTC: ${fmtNum(p.value)}</title></circle>`
        )
        .join('');

    return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Crawls per hour, last 24h">${gridLines}<polyline points="${linePts}" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linejoin="round" />${dots}${xLabels}</svg>`;
}

// Detection-source breakdown, always for the full 7d window (unfiltered) so it
// stays a usable picker. Each row links to ?source=, and the active row links
// back to the unfiltered view.
function renderSourceTable(results, activeSource) {
    const rows = [
        { source: 'signature-agent', count: firstCount(results.src_signatureAgent) },
        { source: 'ua-match', count: firstCount(results.src_uaMatch) },
        { source: 'cf-verified', count: firstCount(results.src_cfVerified) }
    ].filter((r) => r.count > 0);
    if (rows.length === 0) return `<p class="empty">No data yet.</p>`;
    const body = rows
        .map((r) => {
            const active = r.source === activeSource;
            const href = active ? '?' : `?source=${encodeURIComponent(r.source)}`;
            const label = active ? `${r.source} — clear filter` : r.source;
            return `<tr class="${active ? 'src-active' : ''}"><td><a class="src-link" href="${esc(
                href
            )}">${esc(label)}</a></td><td><span class="num">${fmtNum(r.count)}</span></td></tr>`;
        })
        .join('');
    return `<table><thead><tr><th>source</th><th class="num">count</th></tr></thead><tbody>${body}</tbody></table>`;
}

function renderDashboard(results, errors, source = '') {
    const errorBlock =
        Object.keys(errors).length === 0 ? '' : `<div class="errors"><h3>Query errors</h3><pre>${esc(JSON.stringify(errors, null, 2))}</pre></div>`;

    return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<meta name="robots" content="noindex">
	<title>Bot traffic — admin</title>
	<style>
		:root { color-scheme: dark; }
		body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0b0d10; color:#e6e6e6; margin:0; padding:2rem; max-width:1100px; margin-inline:auto; }
		h1 { font-size:1.4rem; margin:0 0 .25rem; }
		h2 { font-size:1.05rem; margin:2rem 0 .75rem; color:#9bb; border-bottom:1px solid #233; padding-bottom:.25rem; }
		.sub { color:#777; margin-bottom:2rem; font-size:.85rem; }
		table { width:100%; border-collapse:collapse; font-size:.85rem; }
		th, td { text-align:left; padding:.4rem .6rem; border-bottom:1px solid #1c2025; }
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
		.errors { background:#2a1010; border:1px solid #5a2020; padding:1rem; border-radius:4px; margin:2rem 0; }
		.errors pre { white-space:pre-wrap; word-break:break-word; font-size:.75rem; color:#fbb; }
		.path { color:#bbd; word-break:break-all; }
		.line-chart { width:100%; height:auto; max-height:220px; display:block; }
		.panel-head { display:flex; align-items:baseline; justify-content:space-between; gap:1rem; border-bottom:1px solid #233; padding-bottom:.25rem; margin:2rem 0 .75rem; }
		.panel-head h2.panel-title { border:none; margin:0; padding:0; font-size:1.05rem; color:#9bb; text-transform:none; letter-spacing:0; }
		.tabs { display:inline-flex; gap:.25rem; }
		.tab { background:transparent; color:#9bb; border:1px solid #1c2025; padding:.2rem .55rem; border-radius:3px; font:inherit; font-size:.7rem; cursor:pointer; }
		.tab:hover { background:#1c2025; }
		.tab.active { background:#3b82f6; color:#fff; border-color:#3b82f6; }
		.source-bar { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin:0 0 2rem; padding:.6rem .75rem; background:#11141a; border:1px solid #1c2025; border-radius:4px; }
		.source-bar label { color:#9bb; font-size:.75rem; text-transform:uppercase; letter-spacing:.05em; }
		.source-bar .filter-stats { margin-left:auto; }
		.source-bar .filter-stats strong { color:#3b82f6; }
		a.src-link { color:#bbd; text-decoration:none; }
		a.src-link:hover { color:#fff; text-decoration:underline; }
		tr.src-active { background:#13243b; }
		tr.src-active a.src-link { color:#3b82f6; font-weight:bold; }
		#hourly-legend .legend-item { cursor:pointer; border-radius:3px; padding:.05rem .3rem; }
		#hourly-legend .legend-item:hover { background:#1c2025; }
		#hourly-legend .legend-item:focus-visible { outline:1px solid #3b82f6; outline-offset:1px; }
		#hourly-legend.filtered .legend-item { opacity:.4; }
		#hourly-legend.filtered .legend-item.active { opacity:1; background:#13243b; }
		.hourly-hint { color:#666; font-size:.72rem; margin:.6rem 0 0; }
	</style>
</head>
<body>
	<h1>Bot traffic</h1>
	<p class="sub">All times UTC. Counts are Analytics Engine sample-adjusted totals.</p>

	<div class="source-bar">
		<label for="source-filter">Detection source</label>
		<select id="source-filter">
			${['', 'signature-agent', 'ua-match', 'cf-verified']
                .map((v) => `<option value="${esc(v)}"${v === source ? ' selected' : ''}>${v === '' ? 'All sources' : esc(v)}</option>`)
                .join('')}
		</select>
		${
            source
                ? `<span class="filter-stats">Every panel below is filtered to <strong>${esc(
                      source
                  )}</strong>. The Detection source table keeps the full 7d breakdown.</span>`
                : `<span class="filter-stats">Showing all bot traffic. Pick a source to filter every panel.</span>`
        }
	</div>

	${errorBlock}

	<div class="cols">
		<div>
			<h2>Crawls per hour — last 24h</h2>
			${renderHourLineChart(rowsOrEmpty(results.hourly))}
		</div>
		<div>
			<div class="panel-head">
				<h2 class="panel-title">Top bots</h2>
				<div class="tabs" data-tabs="top-bots">
					<button type="button" class="tab active" data-tab="bots-24h">24h</button>
					<button type="button" class="tab" data-tab="bots-7d">7d</button>
				</div>
			</div>
			<div id="bots-24h" class="tab-pane">
				${renderTable(['bot', 'count'], rowsOrEmpty(results.top24h), { count: (v) => `<span class="num">${fmtNum(v)}</span>` })}
			</div>
			<div id="bots-7d" class="tab-pane" hidden>
				${renderTable(['bot', 'count'], rowsOrEmpty(results.top7d), { count: (v) => `<span class="num">${fmtNum(v)}</span>` })}
			</div>
		</div>
	</div>

	<h2>Top bots — last 30d</h2>
	${renderTable(['bot', 'count'], rowsOrEmpty(results.top30d), { count: (v) => `<span class="num">${fmtNum(v)}</span>` })}

	<h2>Detection source — last 7d</h2>
	${renderSourceTable(results, source)}

	<h2>Requests per hour — last 24h</h2>
	${renderHourly(rowsOrEmpty(results.hourly))}

	<h2>Top paths per bot — last 7d</h2>
	<div class="filter-row" id="paths-filter">
		<select data-filter="bot">
			<option value="">All bots</option>
			${[...new Set(rowsOrEmpty(results.topPaths).map((r) => String(r.bot || '')))]
                .filter(Boolean)
                .sort((a, b) => a.localeCompare(b))
                .map((b) => `<option value="${esc(b)}">${esc(b)}</option>`)
                .join('')}
		</select>
		<input type="search" data-filter="path" placeholder="Filter path…" autocomplete="off" spellcheck="false">
		<span class="filter-stats" data-filter-stats></span>
	</div>
	<div id="paths-table">
	${renderTable(['bot', 'path', 'count'], rowsOrEmpty(results.topPaths), {
        path: (v) => `<span class="path">${esc(v)}</span>`,
        count: (v) => `<span class="num">${fmtNum(v)}</span>`
    })}
	</div>

	<script>
		(() => {
			const sel = document.getElementById('source-filter');
			if (!sel) return;
			sel.addEventListener('change', () => {
				const params = new URLSearchParams(window.location.search);
				if (sel.value) params.set('source', sel.value);
				else params.delete('source');
				const qs = params.toString();
				window.location.href = window.location.pathname + (qs ? '?' + qs : '');
			});
		})();
		(() => {
			const dataEl = document.getElementById('hourly-data');
			const barsEl = document.getElementById('hourly-bars');
			const legendEl = document.getElementById('hourly-legend');
			if (!dataEl || !barsEl || !legendEl) return;
			let data;
			try {
				data = JSON.parse(dataEl.textContent);
			} catch (e) {
				return;
			}
			const allHTML = barsEl.innerHTML;
			const topSet = new Set(data.topBots);
			const nf = new Intl.NumberFormat('en-US');
			const esc = (s) =>
				String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
			let current = null;

			function drawBot(bot) {
				const isOther = bot === '__other__';
				const color = isOther ? data.otherColor : data.colors[bot] || data.otherColor;
				const series = data.hours.map((h) => {
					let count = 0;
					for (const [b, c] of h.bots) {
						if (isOther ? !topSet.has(b) : b === bot) count += c;
					}
					return { label: h.label, count };
				});
				const max = Math.max(0, ...series.map((s) => s.count));
				barsEl.innerHTML = series
					.map((s) => {
						const widthPct = max > 0 ? (s.count / max) * 100 : 0;
						const seg =
							s.count > 0
								? '<span class="bar-seg" style="width:100%;background:' +
									color +
									'" title="' +
									esc(isOther ? 'other' : bot) +
									': ' +
									nf.format(s.count) +
									'"></span>'
								: '';
						return (
							'<div class="bar-row"><span class="bar-label">' +
							esc(s.label) +
							'</span><span class="bar"><span class="bar-stack" style="width:' +
							widthPct.toFixed(2) +
							'%">' +
							seg +
							'</span></span><span class="bar-count">' +
							nf.format(s.count) +
							'</span></div>'
						);
					})
					.join('');
			}

			function select(bot) {
				current = bot;
				if (bot === null) barsEl.innerHTML = allHTML;
				else drawBot(bot);
				legendEl.classList.toggle('filtered', bot !== null);
				legendEl.querySelectorAll('.legend-item').forEach((it) => {
					it.classList.toggle('active', bot !== null && it.dataset.bot === bot);
				});
			}

			legendEl.querySelectorAll('.legend-item').forEach((it) => {
				const toggle = () => select(it.dataset.bot === current ? null : it.dataset.bot);
				it.addEventListener('click', toggle);
				it.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggle();
					}
				});
			});
		})();
		(() => {
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
		})();
		(() => {
			const wrap = document.getElementById('paths-filter');
			const table = document.getElementById('paths-table');
			if (!wrap || !table) return;
			const botFilter = wrap.querySelector('[data-filter="bot"]');
			const pathFilter = wrap.querySelector('[data-filter="path"]');
			const stats = wrap.querySelector('[data-filter-stats]');
			const rows = Array.from(table.querySelectorAll('tbody tr'));
			const total = rows.length;
			function apply() {
				const bot = botFilter ? botFilter.value.trim() : '';
				const path = pathFilter ? pathFilter.value.trim().toLowerCase() : '';
				let visible = 0;
				for (const r of rows) {
					const cells = r.querySelectorAll('td');
					const rowBot = (cells[0]?.textContent || '').trim();
					const rowPath = (cells[1]?.textContent || '').toLowerCase();
					const show = (!bot || rowBot === bot) && (!path || rowPath.includes(path));
					r.style.display = show ? '' : 'none';
					if (show) visible++;
				}
				if (stats) stats.textContent = visible === total ? total + ' rows' : visible + ' of ' + total + ' rows';
			}
			[botFilter, pathFilter].forEach((el) => {
				if (!el) return;
				el.addEventListener('input', apply);
				el.addEventListener('change', apply);
			});
			apply();
		})();
	</script>
</body>
</html>`;
}
