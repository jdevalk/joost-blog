// User-Agent substrings of known AI / LLM / search crawlers we want to track.
// Match is case-insensitive on the full UA string. Order matters: more specific
// patterns first (e.g. Applebot-Extended before Applebot).
const BOT_UA_MATCHERS = [
	// OpenAI
	['GPTBot', /GPTBot/i],
	['ChatGPT-User', /ChatGPT-User/i],
	['OAI-SearchBot', /OAI-SearchBot/i],
	// Anthropic
	['ClaudeBot', /ClaudeBot/i],
	['Claude-Web', /Claude-Web/i],
	['Claude-User', /Claude-User/i],
	['anthropic-ai', /anthropic-ai/i],
	// Perplexity
	['PerplexityBot', /PerplexityBot/i],
	['Perplexity-User', /Perplexity-User/i],
	// Google AI / search
	['Google-Extended', /Google-Extended/i],
	['GoogleOther', /GoogleOther/i],
	['Googlebot', /Googlebot/i],
	// Meta
	['Meta-ExternalAgent', /Meta-ExternalAgent/i],
	['Meta-ExternalFetcher', /Meta-ExternalFetcher/i],
	['FacebookBot', /FacebookBot/i],
	// Apple
	['Applebot-Extended', /Applebot-Extended/i],
	['Applebot', /Applebot/i],
	// ByteDance
	['Bytespider', /Bytespider/i],
	// Amazon
	['Amazonbot', /Amazonbot/i],
	// Common Crawl (training data for many LLMs)
	['CCBot', /CCBot/i],
	// Cohere
	['cohere-training-data-crawler', /cohere-training-data-crawler/i],
	['cohere-ai', /cohere-ai/i],
	// DuckDuckGo
	['DuckAssistBot', /DuckAssistBot/i],
	// Mistral
	['MistralAI-User', /MistralAI-User/i],
	// You.com
	['YouBot', /YouBot/i],
	// Kagi
	['KagiBot', /KagiBot/i],
	// Webz.io (sells LLM training data)
	['omgilibot', /omgilibot/i],
	['omgili', /omgili/i],
	// Diffbot
	['Diffbot', /Diffbot/i],
	// Allen AI
	['AI2Bot', /AI2Bot/i],
	// Timpi
	['Timpibot', /Timpibot/i],
	// NICT (Japan)
	['ICC-Crawler', /ICC-Crawler/i],
	// Huawei
	['PetalBot', /PetalBot/i],
	// Imagesift (TheHive)
	['ImagesiftBot', /ImagesiftBot/i],
	// Search
	['Bingbot', /Bingbot/i],
	['YandexBot', /YandexBot/i],
];

function matchBotName(ua) {
	if (!ua) return '';
	for (const [name, pattern] of BOT_UA_MATCHERS) {
		if (pattern.test(ua)) return name;
	}
	return '';
}

function logBotIfApplicable(context) {
	const dataset = context.env.AGENT_LOG;
	if (!dataset) return; // binding not configured — silently skip
	try {
		const req = context.request;
		const url = new URL(req.url);
		const sigAgent = req.headers.get('signature-agent') || '';
		const verified = req.cf?.verifiedBot ? 'verified' : '';
		const ua = req.headers.get('user-agent') || '';
		const matchedBot = matchBotName(ua);

		if (!sigAgent && !verified && !matchedBot) return;

		const identity = sigAgent || matchedBot || (verified ? 'verified-other' : 'unknown');

		dataset.writeDataPoint({
			blobs: [
				sigAgent,
				verified,
				matchedBot,
				url.pathname,
				ua.slice(0, 500),
				req.headers.get('referer') || '',
				req.cf?.country || '',
				req.method,
			],
			indexes: [identity],
		});
	} catch {
		// Never break a request because logging failed.
	}
}

// `.md` URLs are machine-readable alternates of their HTML counterparts.
// Point crawlers at the HTML version by adding a canonical Link, preserving
// any existing Link values set globally in `_headers`.
async function withMarkdownCanonical(context, url) {
	const response = await context.next();
	const path = url.pathname;
	if (!path.endsWith('.md') || path.startsWith('/.well-known/')) return response;
	const stripped = path.slice(0, -3);
	const canonicalPath = stripped === '/index' ? '/' : stripped.endsWith('/') ? stripped : `${stripped}/`;
	const canonical = `<https://joost.blog${canonicalPath}>; rel="canonical"`;
	const wrapped = new Response(response.body, response);
	const existing = wrapped.headers.get('Link');
	wrapped.headers.set('Link', existing ? `${canonical}, ${existing}` : canonical);
	return wrapped;
}

export async function onRequest(context) {
	logBotIfApplicable(context);

	const url = new URL(context.request.url);
	const slug = url.pathname.replace(/^\/|\/$/g, '');

	// Only check blog-post-like paths (no dots, no nested paths with known prefixes)
	if (!slug || slug.includes('.') || slug.startsWith('api/') || slug.startsWith('_ask/')) {
		return withMarkdownCanonical(context, url);
	}

	// Fetch the draft slugs map from static assets
	let password;
	try {
		const res = await context.env.ASSETS.fetch(new URL('/_draft-slugs.json', context.request.url));
		if (!res.ok) return context.next();

		const drafts = await res.json();
		password = drafts[slug];
		if (!password) return context.next();
	} catch {
		return context.next();
	}

	// Check for valid password cookie (per-slug)
	const cookieName = `draft_${slug}`;
	const cookies = context.request.headers.get('Cookie') || '';
	const match = cookies.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`));
	if (match && match[1] === password) {
		return context.next();
	}

	// Check for password submission via query param
	if (url.searchParams.get('password') === password) {
		return new Response(null, {
			status: 302,
			headers: {
				'Location': url.pathname,
				'Set-Cookie': `${cookieName}=${password}; Path=/${slug}; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
			}
		});
	}

	// Show password form
	const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Draft post</title>
<style>
body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#111;color:#eee}
form{text-align:center}
h1{font-size:1.2rem;font-weight:normal;margin-bottom:1.5rem;color:#999}
input{padding:.5rem 1rem;border:1px solid #333;border-radius:4px;background:#222;color:#eee;font-size:1rem;margin-right:.5rem}
button{padding:.5rem 1rem;border:none;border-radius:4px;background:#2563eb;color:#fff;font-size:1rem;cursor:pointer}
button:hover{background:#1d4ed8}
</style></head>
<body><form method="get"><h1>This is a draft post.</h1><input type="password" name="password" placeholder="Password" autofocus><button type="submit">View</button></form></body></html>`;

	return new Response(html, {
		status: 401,
		headers: { 'Content-Type': 'text/html;charset=utf-8' }
	});
}
