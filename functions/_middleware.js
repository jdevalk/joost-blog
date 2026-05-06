export async function onRequest(context) {
	const url = new URL(context.request.url);
	const slug = url.pathname.replace(/^\/|\/$/g, '');

	// Dev-only listing — never serve in production.
	if (slug === 'drafts') {
		return new Response('Not found', { status: 404 });
	}

	// Only check blog-post-like paths (no dots, no nested paths with known prefixes)
	if (!slug || slug.includes('.') || slug.startsWith('api/') || slug.startsWith('_ask/')) {
		return context.next();
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
