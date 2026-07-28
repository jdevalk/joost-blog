// Usage logging for /ask (REST) and /mcp (MCP server) traffic.
//
// One Analytics Engine dataset, `ask_log`, written via the ASK_LOG binding.
// A `surface` blob distinguishes 'rest' (direct /ask calls — REST API and
// the web UI at /ask-joost) from 'mcp' (calls into the MCP server). The
// /admin/stats dashboard reads from this dataset.
//
// Schema (blobs are 1-indexed in AE SQL — `blob1` = blobs[0]):
//   index1  action     mode for REST, tool name for MCP tools/call,
//                      method name for other MCP calls (initialize, …)
//   blob1   surface    'rest' | 'mcp'
//   blob2   action     same as index1 — duplicated so it can be SELECTed
//                      alongside other blobs without a JOIN
//   blob3   text       raw query (REST) or JSON args (MCP), pre-sanitize,
//                      truncated to 500 chars. The sanitized version is
//                      what reaches the LLM; the raw version is what we
//                      want to see in the dashboard.
//   blob4   client     MCP client name (initialize/server/discover calls;
//                      also on every row from 2026-07-28+ clients, which
//                      carry clientInfo in _meta on each request)
//   blob5   version    MCP client version (same availability as blob4)
//   blob6   protocol   MCP protocol version
//   blob7   ua         user-agent, truncated to 300
//   blob8   country    cf.country
//   blob9   error      '1' if the call returned an error, else ''
//   blob10  count      result count (REST) — string-encoded integer
//   blob11  referer    request referer
//   blob12  query_id   correlation id (REST) — matches the response

// Writes one data point. Never throws — logging must not break a request.
export function logAsk(context, fields) {
	const dataset = context.env?.ASK_LOG;
	if (!dataset) return; // binding not configured (local dev) — silently skip
	try {
		const req = context.request;
		const action = String(fields.action || '');
		dataset.writeDataPoint({
			blobs: [
				String(fields.surface || ''), // blob1
				action, // blob2
				truncate(fields.text, 500), // blob3
				String(fields.client || ''), // blob4
				String(fields.clientVersion || ''), // blob5
				String(fields.protocol || ''), // blob6
				truncate(req.headers.get('user-agent') || '', 300), // blob7
				String(req.cf?.country || ''), // blob8
				fields.isError ? '1' : '', // blob9
				fields.resultCount == null ? '' : String(fields.resultCount), // blob10
				String(req.headers.get('referer') || ''), // blob11
				String(fields.queryId || ''), // blob12
			],
			indexes: [action || 'unknown'],
		});
	} catch {
		// Never break a request because logging failed.
	}
}

function truncate(value, max) {
	if (value == null) return '';
	const s = typeof value === 'string' ? value : String(value);
	return s.length > max ? s.slice(0, max) : s;
}
