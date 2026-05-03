---
title: What <em>agent-ready</em> looks like for a static blog
publishDate: 2026-05-03T00:00:00.000Z
excerpt: >-
  I ran joost.blog through Cloudflare's isitagentready.com and got a 25.
  Here's what I built to close the gaps: markdown content negotiation,
  Content Signals, Link headers, an API catalog, an agent skills index,
  WebMCP tools, and a server-side MCP endpoint. Also: where the scoring
  gets it wrong.
categories:
  - Development
  - AI
toc: true
draft: true
password: cloudflare
---

Cloudflare recently launched [isitagentready.com](https://isitagentready.com), a tool that scans your site across five categories and gives you a score out of 100. I ran joost.blog through it, got a 25, and immediately started working through the list.

Worth noting before the list: isitagentready.com itself passes its own test. A GET to `/.well-known/mcp/server-card.json` reveals a stateless MCP server with a single `scan_site` tool at `/mcp`. No browser session required; the scan runs as one POST from any MCP client:

```json
POST https://isitagentready.com/mcp
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"scan_site","arguments":{"url":"https://joost.blog"}},"id":1}
```

That score is a useful forcing function. It surfaces concrete gaps: which standards you're missing, why they matter, and exactly what to add. I spent a few hours working through them. Some were one-liners. A few required actual packages and infrastructure. Here's what I did, organized by the tool's own categories.

One thing worth doing before working through the list: customize the scan. isitagentready lets you enable or disable individual checks, and the default set covers a broad range of standards, more than most sites need. For this blog, the defaults caught the real gaps, but missed one check that was actually relevant: the A2A Agent Card. That only surfaced after I enabled it manually. Customize first, then work through what the scan finds.

## Discoverability

robots.txt and a sitemap were already in place; this blog is built on Astro and both come standard. The gap was link headers.

**Link headers.** HTTP responses can include a `Link` header that points agents to useful resources without requiring them to parse HTML. In Cloudflare Pages, `public/_headers` adds headers by path pattern. I added these to `/*`:

```
Link: </sitemap-index.xml>; rel="sitemap", </llms.txt>; rel="alternate"; type="text/plain", </.well-known/api-catalog>; rel="api-catalog", </.well-known/agent-skills/index.json>; rel="agent-skills"
```

Every response on the site now advertises the sitemap, the llms.txt index, the API catalog, and the agent skills index in the HTTP headers. An agent reading the response headers knows where to look without loading any HTML.

## Content

Content negotiation for posts was already in place: a client sending `Accept: text/markdown` gets the raw markdown instead of an HTML document full of navigation, schema markup, and everything else that browsers need but agents don't. The check failed on the homepage specifically: there was no `/index.md` equivalent.

For WordPress, this is straightforward: PHP runs at request time and can check the header. I wrote about that approach in the [markdown-alternate WordPress plugin](/markdown-alternate/). For a static Astro site deployed on Cloudflare Pages, there's no server to intercept requests. Everything has to happen at build time or at the CDN edge.

It turns out the static approach is cleaner.

### Static `.md` files at build time

On a static site, serving markdown means the file has to exist: there's no runtime to render it on request. An Astro endpoint at `src/pages/[slug].md.ts` generates a pre-built `/my-post.md` file for every published post. [My Astro SEO plugin](/seo-graph/) ships a `createMarkdownEndpoint` route factory that handles this, including a `Content-Type: text/markdown` header, `X-Markdown-Tokens` estimate, and a `Link` header pointing back to the canonical.

### Discoverable `<link rel="alternate">` tags

Agents that parse HTML before fetching anything need a standard signal pointing to the markdown version; without it they have to guess or skip it. Using `seoGraph({ markdownAlternate: true })` in `astro.config.mjs`, the `<Seo>` component emits a `<link rel="alternate" type="text/markdown" href="/my-post.md">` in every page's `<head>`. The integration also runs a post-build pass that strips any links where the `.md` file doesn't actually exist, so no broken alternates make it to production.

If you're not using astro-seo-graph, [`@jdevalk/astro-markdown-alternate`](https://github.com/jdevalk/astro-markdown-alternate) does the same thing as a standalone package.

### Cloudflare Transform Rules for content negotiation

Agents that send `Accept: text/markdown` upfront skip HTML entirely, so they never see the `<link rel="alternate">` tag. For those, a Cloudflare Transform Rule rewrites the path at the CDN layer. No Worker, no function invocation.

Two rules in **Rules → Transform Rules → URL Rewrite**. The first handles all paths except root:

```
Filter: http.request.headers["accept"][0] contains "text/markdown"
        and ends_with(http.request.uri.path, "/")
        and http.request.uri.path ne "/"
Path (dynamic): wildcard_replace(http.request.uri.path, "*/", "${1}.md")
```

`wildcard_replace` captures everything before the trailing slash and appends `.md`, so `/my-post/` becomes `/my-post.md`. The second rule handles root:

```
Filter: http.request.headers["accept"][0] contains "text/markdown"
        and http.request.uri.path eq "/"
Path (static): /index.md
```

You need a static `/index.md` endpoint for the second rule; I added `src/pages/index.md.ts` that generates a homepage overview with the ten most recent post titles and links.

## Bot Access Control

This blog allows all crawlers by default. robots.txt uses `User-agent: * / Allow: /` with no AI-specific blocks; that's the baseline the AI bot rules check looks for.

### Content Signals

robots.txt access rules are binary: can a bot access this URL? They say nothing about what a bot is allowed to *do* with the content. The [Content Signals spec](https://contentsignals.org/) fills that gap: a directive in robots.txt that declares your preferences for AI training, search grounding, and AI input use, independently of whether the bot can crawl at all. The spec is an IETF draft and [adoption is early](/standards-dont-prove-themselves/), but it's one line in a file you already have.

```
Content-Signal: ai-train=yes, search=yes, ai-input=yes
```

This is "my content is public and I'm fine with agents using it." If you have different preferences (training no, grounding yes, for instance), the three fields are independent.

Web Bot Auth request signing is also in this category. It's an emerging standard for cryptographically verified bot identity and the check is currently grayed out on isitagentready, not something worth implementing speculatively.

## API, Auth, MCP & Skill Discovery

### API catalog

Without a catalog, an agent discovering your site's APIs has to guess standard paths or crawl documentation. [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727) (published April 2025) gives every site a standard answer at `/.well-known/api-catalog`: a machine-readable list of what APIs exist and where they are. The RFC is finalized so the format is stable, though real-world adoption is still early. For a static site it's just a JSON file. For this blog, that covers the `/ask` endpoint (the AI Q&A described below), the schema.org graph endpoints at `/schema/post.json`, `/schema/page.json`, and `/schema/video.json`, and the `/schemamap.xml` discovery file. An Astro endpoint at `src/pages/.well-known/api-catalog.ts` returns the `application/linkset+json` format the RFC specifies.

### Agent Skills index

Coding agents (Claude Code, Cursor, GitHub Copilot) can load skill documents that shape how they write code for a specific stack. The [Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc) is a Cloudflare proposal so adoption is nascent, but the upside is real if the pattern takes hold: point an agent at `/.well-known/agent-skills/index.json` and it loads your project's conventions instead of guessing them. That path is the standard the RFC defines for publishing skill documents coding agents can load on demand.

I maintain a set of skills at [github.com/jdevalk/skills](https://github.com/jdevalk/skills): eight skills covering things like Astro SEO, GitHub repo setup, WordPress readme optimization, and readability checking. A build script copies them into `public/.well-known/agent-skills/`, computes SHA-256 digests, and writes the index. When you run `npx skills add jdevalk/skills` or ask any MCP-capable coding agent to check `https://joost.blog/.well-known/agent-skills/index.json`, the skills are there.

### MCP Server Card

An MCP client (Claude Desktop, Claude Code) that doesn't know whether a site has an MCP server has to either be told or guess. [SEP-1649](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) is the standard answer: a static JSON file at `/.well-known/mcp/server-card.json` that declares a site's MCP server name, version, transport endpoint, and capabilities. It's still a draft, but MCP clients are already starting to check for it. Publishing the card now ensures discovery works as adoption grows, and the cost is one JSON file. I added it and wired it into the sitewide Link header alongside the API catalog and agent skills entries:

```
Link: ..., </.well-known/mcp/server-card.json>; rel="mcp-server-card"
```

### A2A Agent Card

The [Agent2Agent (A2A) protocol](https://a2a-protocol.org/) is a separate standard from MCP, aimed at agent-to-agent discovery and interaction rather than host-to-server connections. The discovery mechanism is an Agent Card: a JSON document at `/.well-known/agent-card.json` describing the agent's identity, service endpoints, capabilities, and skills.

This check isn't enabled in the default isitagentready scan; I only found the gap after customizing the scan configuration. Once I did, the fix was a static JSON file.

The card describes Ask Joost with two skills that map directly onto the MCP and WebMCP tools already in place:

```json
{
  "name": "Ask Joost",
  "version": "1.0.0",
  "description": "An AI agent grounded in Joost de Valk's published writing...",
  "url": "https://joost.blog/mcp",
  "provider": { "organization": "Joost de Valk", "url": "https://joost.blog" },
  "supportedInterfaces": [
    { "url": "https://joost.blog/mcp", "transport": "http", "protocol": "MCP/2025-11-25" },
    { "url": "https://joost.blog/ask", "transport": "http", "protocol": "NLWeb" }
  ],
  "capabilities": { "streaming": true, "pushNotifications": false },
  "skills": [
    {
      "id": "ask_joost",
      "name": "Ask Joost",
      "description": "Ask a question about anything Joost de Valk has written...",
      "inputModes": ["text"],
      "outputModes": ["text"]
    },
    {
      "id": "list_recent_content",
      "name": "List recent content",
      "description": "List Joost de Valk's published blog posts, optionally filtered by topic keyword and/or publish date.",
      "inputModes": ["text"],
      "outputModes": ["text"]
    }
  ]
}
```

The card goes in `public/.well-known/agent-card.json`, a static file with no build step. CORS headers and a one-hour cache go in `_headers` so agents can fetch it cross-origin. It's wired into the sitewide Link header alongside the MCP server card:

```
Link: ..., </.well-known/agent-card.json>; rel="agent-card"
```

### WebMCP

Chrome 146 shipped an early preview of [WebMCP](https://developer.chrome.com/blog/webmcp-epp), a browser-native API that lets websites register structured tools that in-browser AI agents can call directly. Edge 147 added support around the same time. The W3C [Web Machine Learning Community Group](https://webmachinelearning.github.io/webmcp/) is incubating the spec.

The name is misleading: WebMCP is not the [Model Context Protocol](https://modelcontextprotocol.io). It borrows MCP's terminology but it's a separate, client-side API: `navigator.modelContext.registerTool({ name, description, inputSchema, annotations, execute })`. No JSON-RPC, no transport layer, no server. When an agent lands on your page, your scripts run as usual, and if they call `registerTool`, the agent sees a list of functions it can call.

The temptation is to wrap everything. Search? Tool. List recent posts? Tool. Get a post by slug? Tool.

This is the wrong instinct, because most of those things are already covered by standards agents understand: RSS for recent posts, sitemap for the URL space, schema.org JSON-LD for structured metadata, and the `<link rel="alternate" type="text/markdown">` on every page that points to a clean markdown version. Adding a parallel tool surface for the same data creates drift between six representations of the same thing without adding value.

The rule I ended up with: WebMCP earns its keep when there's a capability behind the UI that scraping the page won't get you efficiently.

Applied to this blog, that leaves two tools.

#### ask_joost

The [Ask Joost](/ask-joost/) endpoint is RAG over my full corpus: keyword and semantic retrieval over a build-time index, generation by Llama 3.3 70B on Cloudflare Workers AI, with markdown citations parsed into a source list. Without a tool, an in-browser agent would have to scrape the page, parse the SSE stream, and reassemble the answer. With a tool, it calls a function and gets structured output.

Two design choices that matter:

- **Mode `summarize`, not `stream`.** Streaming SSE is for human UI. Tools return one result.
- **Stateless from WebMCP's view.** No `prev` exchanges. The agent maintains its own conversation; duplicating that state in the tool creates two sources of truth.

```ts
navigator.modelContext.registerTool({
    name: 'ask_joost',
    description:
        "Ask a question about anything Joost de Valk has written or spoken about — SEO, WordPress, the open web, AI, open source, his career at Yoast, or his investments via Emilia Capital. Returns an AI-generated answer grounded in his blog posts and video transcripts, with source URLs for every claim.",
    inputSchema: {
        type: 'object',
        properties: { question: { type: 'string', maxLength: 500 } },
        required: ['question']
    },
    annotations: { readOnlyHint: true },
    execute: async ({ question }) => {
        const res = await fetch('/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: question, mode: 'summarize' })
        });
        const { answer, sources } = await res.json();
        return {
            content: [
                { type: 'text', text: answer },
                { type: 'text', text: `Sources:\n${JSON.stringify(sources, null, 2)}` }
            ]
        };
    }
});
```

#### list_recent_content

RSS gives you "the latest N items in publication order," and that's it. An agent asking "what has Joost written about WordPress this year" has to pull the full feed and filter client-side, or call `ask_joost`, which is a generation request for a question that doesn't need generation.

A small filtered listing tool closes that gap. It fetches a lightweight build-time index at `/writing-index.json` (URL, title, publish date, excerpt, and categories for every published post; no embeddings, about 27KB) and applies filters in JavaScript.

```ts
navigator.modelContext.registerTool({
    name: 'list_recent_content',
    description:
        "List Joost de Valk's published blog posts, optionally filtered by topic keyword and/or publish date. Returns entries sorted newest first. For semantic Q&A use ask_joost instead.",
    inputSchema: {
        type: 'object',
        properties: {
            topic: { type: 'string' },
            since: { type: 'string', format: 'date' },
            limit: { type: 'integer', minimum: 1, maximum: 50 }
        }
    },
    annotations: { readOnlyHint: true },
    execute: async ({ topic, since, limit }) => {
        const index = await loadIndex(); // cached promise
        const cap = Math.min(limit ?? 20, 50);
        const sinceTime = since ? Date.parse(since) : NaN;
        const needle = topic?.trim().toLowerCase();
        const matches = index.filter(item => {
            if (!Number.isNaN(sinceTime) && Date.parse(item.publishDate) < sinceTime) return false;
            if (needle) {
                const hay = `${item.title} ${item.excerpt} ${item.categories.join(' ')}`.toLowerCase();
                if (!hay.includes(needle)) return false;
            }
            return true;
        });
        return { content: [{ type: 'text', text: JSON.stringify(matches.slice(0, cap)) }] };
    }
});
```

Topic matching is plain substring. If an agent needs semantic matching it should call `ask_joost`. That separation is the point of having two tools instead of one.

Both tool registrations live in `src/scripts/webmcp.ts` and are loaded site-wide from the base layout. The whole thing is feature-detected:

```ts
if (typeof navigator !== 'undefined' && 'modelContext' in navigator) { ... }
```

In every browser that doesn't support WebMCP (currently all of them except Chrome 146+ and Edge 147+ behind a flag), this is a no-op.

### MCP server

WebMCP tools only work when an agent is actively browsing the page. A server-side MCP endpoint removes that constraint: any MCP client (Claude Desktop, Claude Code, Cursor, any tool that speaks the Model Context Protocol) can call the same tools without a browser session.

The MCP 2025-11-25 spec defines a Streamable HTTP transport. Clients POST JSON-RPC to a single endpoint. The server responds with `application/json`. No session state, no persistent connection required for read-only tools. For a stateless server, the protocol surface is minimal:

- POST `/mcp`: handle `initialize`, `ping`, `tools/list`, and `tools/call`
- GET `/mcp`: return 405 (nothing to stream)
- Notifications like `notifications/initialized`: return 202 with no body

`functions/mcp.js` is a Cloudflare Pages Function that implements this. The two tools, `ask_joost` and `list_recent_content`, carry the same input schemas and descriptions as the WebMCP versions. `ask_joost` imports the same retrieval and generation modules as `functions/ask.js` and runs the full keyword and semantic search pipeline directly, no HTTP hop. `list_recent_content` fetches `/writing-index.json` from `env.ASSETS` and filters in memory.

A protocol-correct implementation is roughly 140 lines; most of that is the tool definitions.

### OAuth

The two remaining failures in the default isitagentready scan for this category are OAuth/OIDC discovery and OAuth Protected Resource metadata, checked via `/.well-known/openid-configuration` and `/.well-known/oauth-protected-resource`.

These checks exist for sites with protected APIs where agents need to obtain tokens before making requests. This blog's MCP server and `/ask` endpoint are intentionally public and unauthenticated. Publishing OAuth discovery metadata for an API that has nothing to protect would actively mislead agents: clients that take the metadata seriously would attempt token acquisition, fail or time out, and potentially give up before trying the open endpoint.

The right answer is to leave those checks failing. The scoring tool doesn't have a way to express "this API is intentionally public" — it treats the absence of OAuth metadata as a gap rather than a deliberate choice. For a public read-only corpus, no auth is the correct design.

## Commerce

isitagentready checks for [x402](https://www.x402.org/), the HTTP 402 micropayment protocol that lets agents pay for API access with stablecoin micropayments instead of obtaining OAuth tokens. But it files x402 under "Commerce" and marks it not applicable for most sites. The odd thing: [EmDash](/emdash-cms/), Cloudflare's own CMS, ships with native x402 support. If x402 is built into the CMS you're promoting, filing it as a commerce edge case rather than a first-class agent authentication model seems like a missed opportunity to say what you actually think about how agents should access paid content.

## The full stack

After all of this, the complete set of surfaces an agent can use to read this blog looks like:

| Surface | What it answers |
| --- | --- |
| HTML with semantic markup | Baseline rendering |
| Schema.org JSON-LD | Structured metadata for every entity |
| `<link rel="alternate" type="text/markdown">` | Where to get the clean content |
| Markdown at `/{slug}.md` | The content itself, no chrome |
| RSS feed | Chronological discovery |
| Sitemap | Full URL space |
| `llms.txt` | Structured reading list |
| `/.well-known/api-catalog` | What APIs exist |
| `/.well-known/agent-skills/index.json` | What coding skills are available |
| NLWeb `/ask` endpoint | Natural-language Q&A over the corpus |
| WebMCP `ask_joost` tool | In-browser Q&A without parsing SSE |
| WebMCP `list_recent_content` tool | Filtered listing without hitting RSS |
| `/.well-known/mcp/server-card.json` | MCP server discovery |
| `/.well-known/agent-card.json` | A2A agent identity and skill discovery |
| MCP endpoint at `/mcp` | Q&A and listing from any MCP client |

Each surface answers a different agent question. WebMCP isn't a replacement for any of the others. It's the answer to "what can this site do that I'd otherwise have to fake by clicking buttons." The MCP server answers the same question from outside the browser.

WebMCP is early. The spec is incubating. The tool registration shape will probably shift before it ships unflagged. But the underlying discipline is durable: is there a capability behind this UI that the existing standards don't cover? That's the question worth asking now, regardless of what the wire format ends up looking like.

Running the same `scan_site` call after all of this work returns 83/100 (Level 5, Agent-Native). None of it required exotic infrastructure. An Astro site on Cloudflare Pages handles most of this at build time: static files, endpoint routes, `_headers`, and a single Pages Function for the MCP server. The hard parts are deciding what to expose and why, not the mechanics of exposing it.
