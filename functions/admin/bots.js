// Password-gated dashboard for bot/agent traffic captured by `functions/_middleware.js`.
// Queries the Cloudflare Analytics Engine SQL API with a token stored as a Pages secret.

const COOKIE_NAME = 'admin_bots';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h
const DATASET = 'agent_log';

export async function onRequest(context) {
	const { request, env } = context;
	const url = new URL(request.url);

	const password = env.BOT_DASHBOARD_PASSWORD;
	if (!password) {
		return text('Dashboard not configured: set BOT_DASHBOARD_PASSWORD in Pages env vars.', 500);
	}

	// Accept password via ?password= and set a cookie, then redirect to clean URL.
	if (url.searchParams.get('password') === password) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: url.pathname,
				'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(password)}; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
			},
		});
	}

	// Otherwise require a matching cookie.
	const cookies = request.headers.get('Cookie') || '';
	const m = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
	if (!m || decodeURIComponent(m[1]) !== password) {
		return new Response(LOGIN_HTML, {
			status: 401,
			headers: { 'Content-Type': 'text/html;charset=utf-8' },
		});
	}

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
			SELECT toStartOfHour(timestamp) AS hour, SUM(_sample_interval) AS count
			FROM ${DATASET}
			WHERE timestamp > NOW() - INTERVAL '1' DAY
			GROUP BY hour
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

function renderHourly(rows) {
	if (rows.length === 0) return `<p class="empty">No data yet.</p>`;
	const max = Math.max(...rows.map((r) => Number(r.count) || 0));
	const bars = rows
		.map((r) => {
			const pct = max > 0 ? (Number(r.count) / max) * 100 : 0;
			// ClickHouse returns "YYYY-MM-DD HH:MM:SS" (no T, no Z). Safari parses that
			// as local time, drifting the axis by the viewer's UTC offset — normalize first.
			const iso = String(r.hour).replace(' ', 'T') + 'Z';
			const label = new Date(iso).toISOString().slice(11, 16) + ' UTC';
			return `
				<div class="bar-row">
					<span class="bar-label">${esc(label)}</span>
					<span class="bar"><span class="bar-fill" style="width:${pct.toFixed(1)}%"></span></span>
					<span class="bar-count">${fmtNum(r.count)}</span>
				</div>
			`;
		})
		.join('');
	return `<div class="bars">${bars}</div>`;
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
		.bar-fill { display:block; height:100%; background:#3b82f6; }
		.bar-count { text-align:right; color:#bbb; font-variant-numeric:tabular-nums; }
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

const LOGIN_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Admin</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0b0d10;color:#e6e6e6}
form{text-align:center}
h1{font-size:1.1rem;font-weight:normal;margin-bottom:1.25rem;color:#9bb}
input{padding:.5rem 1rem;border:1px solid #333;border-radius:4px;background:#1c2025;color:#eee;font-size:1rem;margin-right:.5rem}
button{padding:.5rem 1rem;border:none;border-radius:4px;background:#3b82f6;color:#fff;font-size:1rem;cursor:pointer}
button:hover{background:#2563eb}
</style></head>
<body><form method="get"><h1>Password required.</h1><input type="password" name="password" placeholder="Password" autofocus><button type="submit">View</button></form></body></html>`;
