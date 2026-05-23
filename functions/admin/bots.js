// Legacy URL — the dashboard moved to /admin/stats when /ask + /mcp logging
// was added (see functions/admin/stats.js). 302 keeps old bookmarks working.

export function onRequest(context) {
	const url = new URL(context.request.url);
	const search = url.search ? url.search : '';
	return new Response(null, {
		status: 302,
		headers: { Location: '/admin/stats' + search },
	});
}
