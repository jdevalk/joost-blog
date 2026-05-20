// Dashboard for bot/agent traffic captured by `functions/_middleware.js`.
// Access to /admin/* is gated by Cloudflare Access at the edge, so this
// function assumes the caller is already authenticated.
// Queries the Cloudflare Analytics Engine SQL API with a token stored as a Pages secret.

const DATASET = 'agent_log';

export async function onRequest(context) {
	const { env } = context;

	const accountId = env.CF_ACCOUNT_ID;
	const token = env.CF_ANALYTICS_TOKEN;
	if (!accountId || !token) {
		return text('Missing CF_ACCOUNT_ID or CF_ANALYTICS_TOKEN env vars.', 500);
	}

	const queries = {
		top24h: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '1' DAY
			GROUP BY bot
			ORDER BY count DESC
			LIMIT 50
		`,
		top7d: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY
			GROUP BY bot
			ORDER BY count DESC
			LIMIT 50
		`,
		top30d: `
			SELECT index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '30' DAY
			GROUP BY bot
			ORDER BY count DESC
			LIMIT 50
		`,
		topPaths: `
			SELECT index1 AS bot, blob4 AS path, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '7' DAY
			GROUP BY bot, path
			ORDER BY count DESC
			LIMIT 200
		`,
		hourly: `
			SELECT toStartOfHour(timestamp) AS hour, index1 AS bot, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '1' DAY
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
		`,
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

	return new Response(renderDashboard(results, errors), {
		headers: { 'Content-Type': 'text/html;charset=utf-8' },
	});
}

async function queryAE(accountId, token, sql) {
	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'text/plain',
			},
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
	'#a855f7', // purple
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
	const colorFor = (bot) =>
		topBotIndex.has(bot) ? BOT_PALETTE[topBotIndex.get(bot)] : OTHER_COLOR;

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

	const legendEntries = [
		...topBots.map((name) => ({ name, total: botTotals.get(name), color: colorFor(name) })),
	];
	const otherBots = sortedBots.slice(BOT_PALETTE.length);
	if (otherBots.length > 0) {
		const otherTotal = otherBots.reduce((s, [, t]) => s + t, 0);
		legendEntries.push({
			name: `other (${otherBots.length} bot${otherBots.length === 1 ? '' : 's'})`,
			total: otherTotal,
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

function renderDashboard(results, errors) {
	const errorBlock =
		Object.keys(errors).length === 0
			? ''
			: `<div class="errors"><h3>Query errors</h3><pre>${esc(
					JSON.stringify(errors, null, 2)
				)}</pre></div>`;

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
		.errors { background:#2a1010; border:1px solid #5a2020; padding:1rem; border-radius:4px; margin:2rem 0; }
		.errors pre { white-space:pre-wrap; word-break:break-word; font-size:.75rem; color:#fbb; }
		.path { color:#bbd; word-break:break-all; }
	</style>
</head>
<body>
	<h1>Bot traffic</h1>
	<p class="sub">All times UTC. Counts are Analytics Engine sample-adjusted totals.</p>

	${errorBlock}

	<div class="cols">
		<div>
			<h2>Top bots — last 24h</h2>
			${renderTable(
				['bot', 'count'],
				rowsOrEmpty(results.top24h),
				{ count: (v) => `<span class="num">${fmtNum(v)}</span>` }
			)}
		</div>
		<div>
			<h2>Top bots — last 7d</h2>
			${renderTable(
				['bot', 'count'],
				rowsOrEmpty(results.top7d),
				{ count: (v) => `<span class="num">${fmtNum(v)}</span>` }
			)}
		</div>
	</div>

	<h2>Top bots — last 30d</h2>
	${renderTable(
		['bot', 'count'],
		rowsOrEmpty(results.top30d),
		{ count: (v) => `<span class="num">${fmtNum(v)}</span>` }
	)}

	<h2>Detection source — last 7d</h2>
	${renderTable(
		['source', 'count'],
		[
			{ source: 'signature-agent', count: firstCount(results.src_signatureAgent) },
			{ source: 'ua-match', count: firstCount(results.src_uaMatch) },
			{ source: 'cf-verified', count: firstCount(results.src_cfVerified) },
		].filter((r) => r.count > 0),
		{ count: (v) => `<span class="num">${fmtNum(v)}</span>` }
	)}

	<h2>Requests per hour — last 24h</h2>
	${renderHourly(rowsOrEmpty(results.hourly))}

	<h2>Top paths per bot — last 7d</h2>
	${renderTable(
		['bot', 'path', 'count'],
		rowsOrEmpty(results.topPaths),
		{
			path: (v) => `<span class="path">${esc(v)}</span>`,
			count: (v) => `<span class="num">${fmtNum(v)}</span>`,
		}
	)}
</body>
</html>`;
}
