---
title: Agent-ready <em>by design</em>
seo:
  title: Building a site agents can use, from scratch
  description: >-
    How cocktail.glass was built agent-ready from the first commit: one data
    source, Markdown negotiation, a stateless MCP server, and discovery.
publishDate: 2026-05-22T00:00:00.000Z
excerpt: >-
  I retrofitted this blog to be agent-ready, then built cocktail.glass from an
  empty repo with AI agents as a first-class audience from the first commit.
  Here's what changes when agent-ready is a design input instead of a
  renovation: one source of truth, Markdown negotiation, a stateless MCP
  server, and discovery in every response.
categories:
  - Development
  - AI
toc: true
---

Take a photo of your drinks cabinet and hand it to an AI assistant. [cocktail.glass](https://cocktail.glass) will tell you which cocktails you can make tonight. It is a catalogue of 500 cocktails, and that is the fun part. This post is about the other part: cocktail.glass was built, from its first commit, for AI agents to use as easily as people do.

I know what the alternative costs, because I tried it on this blog first. Earlier this month I [ran it through isitagentready.com](/agent-ready/), scored a 25, and spent an afternoon working it up to 83. Every fix on that list was a retrofit. The blog already existed: already static, already built from prose, already deployed a particular way. So each gap I closed was really a workaround for a decision made long before agents were on anyone's mind.

cocktail.glass started from an empty directory. That let me ask a question the blog never could. If AI agents are a first-class audience rather than an afterthought, what do you build differently from the first commit?

Because cocktail.glass has no legacy, it shows the pattern more clearly than the retrofit did. Everything below is live, open source, and free to pull apart.

When I say "agent-ready" I mean something narrow and testable. The site exposes its content and its capabilities through the formats and protocols agents actually use, not only as HTML built for a browser. "By design" means those formats were a constraint on the first commit, not a renovation bolted on at commit nine hundred.

The difference, in one table:

|                     | joost.blog (retrofit)                             | cocktail.glass (by design)               |
| ------------------- | ------------------------------------------------- | ---------------------------------------- |
| Content model       | Prose in MDX files                                | Structured, normalised JSON              |
| Markdown for agents | A pre-built `.md` per page, plus a CDN rewrite    | Rendered from the data by one middleware |
| MCP server          | Added after the fact, over the Ask Joost pipeline | Pure functions over the data, planned in |

The rest of this post is that table in detail, plus two things a table leaves out: where it got hard, and what the exercise doesn't prove.

## One source of truth, many renderings

The blog's content is prose. Each post is an MDX file, and "Markdown for agents" there means taking the rendered HTML and [stripping it back down](/markdown-alternate/) to something an LLM can read cheaply. The Markdown is derived from the HTML, which was derived from the MDX. Three representations, and the agent gets the one at the end of the chain.

cocktail.glass inverts that. It is built from structured data: 500 recipes in `cocktails.json`, and the ingredients they call on in a separate `ingredients.json`. A recipe looks like this.

```json
{
  "name": "Negroni",
  "slug": "negroni",
  "glass": "Tumbler",
  "family": "Spirit-Forward",
  "method": "Stirred",
  "tags": ["classic"],
  "ingredients": [
    { "ref": "gin", "amount": 30, "unit": "ml" },
    { "ref": "campari", "amount": 30, "unit": "ml" },
    { "ref": "sweet-vermouth", "amount": 30, "unit": "ml" }
  ],
  "garnish": ["Orange peel"],
  "preparation": ["Stir all ingredients with ice.", "Strain into a rocks glass over a large ice cube."]
}
```

Each ingredient is a `ref` — an id into `ingredients.json`, the single place an ingredient's name and type are written down. The recipe says how much to pour; the ingredient table says what each one is.

Every surface on the site is a view of that data. The HTML pages render it. The Markdown renders it. `/cocktails.json` is it. The schema.org graph is it, typed. The MCP and in-browser WebMCP tools query it. No surface is a copy of another; each is derived from the data. Change a recipe and every surface, human and agent, changes with it.

This is the change you can only make at the start. Once a site's content lives as prose, modelling it as data afterwards is a migration. Beginning from data costs nothing, and it makes the human site the special case: the HTML is just the rendering with the most chrome.

## Markdown without a build step

The blog serves Markdown to agents, but that Markdown is a build artifact. Each post is a prose file, and an Astro endpoint pre-builds a `.md` for every one of them. An agent that sends `Accept: text/markdown` upfront never sees the HTML. The blog routes those requests with a pair of Cloudflare Transform Rules, the setup the [agent-ready post](/agent-ready/) describes: a CDN-layer rewrite that turns `/some-post/` into the pre-built `/some-post.md`. It works. It is also two rules in a dashboard and one `.md` artifact per page, all of it downstream of content that lives as prose.

cocktail.glass has no `.md` files at all. Because the content is data, Markdown is something you _render_, not something you _store_. One middleware Function does it, on the same URL:

```js
// functions/_middleware.js — same-URL Markdown negotiation
export async function onRequest({ request, next }) {
  if (request.method !== 'GET') return next();

  const accept = (request.headers.get('Accept') || '').toLowerCase();
  if (!accept.includes('text/markdown')) return next(); // browsers fall straight through

  const url = new URL(request.url);
  const markdown = renderMarkdown(url.pathname, url.origin);
  if (markdown === null) return next();

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
      'X-Markdown-Tokens': String(Math.ceil(markdown.length / 4))
    }
  });
}
```

`renderMarkdown` composes the Markdown from the catalogue data on the fly: a heading, an ingredients list, numbered steps. Same URL, negotiated by header, with `Vary: Accept` so caches keep the two representations apart. The `X-Markdown-Tokens` header, an idea I wrote about [when Cloudflare shipped theirs](/markdown-alternate/), hands the agent an estimated token count before it commits to reading.

This is not a hosting difference. Both sites are static Astro builds on Cloudflare Pages, and both run Pages Functions. It is a consequence of the section above: once content is data, any representation of it, Markdown included, can be rendered at request time. "Markdown for agents" stops being a build step and becomes a header check.

## A stateless MCP server

The fastest way for an agent to use cocktail.glass is the Model Context Protocol server at `/mcp`. It is remote, so there is nothing to install. It is stateless in the strict sense: the server issues no session id, and every POST is self-contained. There is no connection to keep alive and no per-client memory, so it scales horizontally with nothing to coordinate. For a read-only catalogue, statelessness is not a limitation, it is the natural design.

It also has no API key, and that was deliberate, the same call the agent-ready post made about OAuth. The data is public and read-only. An auth layer would protect nothing, and it would only give agents a way to fail before they reach the open endpoint. Publishing auth metadata for an API with nothing to protect is worse than publishing none.

The protocol surface is small. A POST carries a JSON-RPC message; a switch over the method handles `initialize`, `ping`, `tools/list`, `tools/call`, `prompts/list`, and `prompts/get`. A GET returns 405, because a stateless server has no stream to open. That plumbing is one switch statement; the tools it dispatches to live in a module of their own, for a reason the next section gets to. Each tool is a plain function over the catalogue:

```js
// cocktail-tools.mjs — one of six tools
{
  name: 'find_cocktails_by_ingredient',
  description: 'Find every cocktail that uses a given ingredient.',
  inputSchema: {
    type: 'object',
    properties: { ingredient: { type: 'string' } },
    required: ['ingredient'],
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  run(cocktails, args) {
    const q = norm(args.ingredient);
    const matches = cocktails
      .filter((c) => c.ingredients.some((i) => norm(i.name).includes(q)))
      .map((c) => summary(c));
    return { count: matches.length, cocktails: matches };
  },
}
```

The whole catalogue is only 500 records, so it sits in memory and the tools run synchronously. Every result carries a real page URL, so the agent can always link a person to the full recipe. The server is listed in the [official MCP registry](https://registry.modelcontextprotocol.io) through a small `server.json`, so a client that browses the registry finds it without being handed the URL.

## Tools, a prompt, and the part that was actually hard

There are six tools:

- search by name
- fetch a full recipe
- find drinks by an ingredient
- find drinks featured in a film or TV show
- find drinks you can make from a list of ingredients
- pick one at random

Tools are model-controlled: the model decides when to call one.

A prompt is different. It is user-controlled, surfaced by clients as a slash command, and chosen deliberately. cocktail.glass ships one, `cocktails_from_my_bar`, and it is the most fun thing on the site. You give it a photo of your liquor shelf, and it walks the model through four steps. Read the labels. Normalise each bottle to a generic ingredient the catalogue knows ("Bombay Sapphire" becomes "gin", "Cointreau" becomes "triple sec"). Call `find_makeable_cocktails` once with the full list. Then report what you can make now, and what you are one bottle short of. The recipe data does the matching; the prompt only puts the steps in order.

The honest answer to "what was hard" is not the protocol. The protocol was easy. What was hard is that those six tools have to run in two completely different places.

The remote MCP server is one runtime: JSON-RPC over HTTP, in a Pages Function. WebMCP (the same six tools, offered to an AI agent running inside the browser through `navigator.modelContext`) is another: a script on the page, no transport, no JSON-RPC. For a while the tools genuinely existed twice, one copy per runtime, kept in step by a comment at the top of each file and a promise. They had already begun to drift.

The fix is the same discipline as the rest of this post: find the one source of truth. The tools are not really a server thing or a browser thing. They are pure functions over the catalogue. So they move into one module, `cocktail-tools.mjs`, that does no I/O and knows no transport. The catalogue is passed in as an argument: the server hands it the copy it `import`ed at build time, the browser hands it the copy it `fetch`ed from `/cocktails.json`. The matching algorithm is now written exactly once. It was never hard code, only tricky: the part that decides whether "gin" should match "sloe gin" but not "ginger beer".

What is left is small, and it is the one part that cannot be merged. Each runtime keeps a transport adapter: the JSON-RPC switch on the server, the `navigator.modelContext` registration in the browser. Those do not share, and they should not, because they are different protocols. The merge cost one thing. The browser script can no longer be inline, because an inline script cannot `import`. It is a bundled module now. On a 500-page site that is lighter, not heavier: the browser downloads it once and caches it, instead of getting a copy inside every page.

That is what building agent-ready in 2026 is really like. The pieces are small and the protocols are reasonable. The hard part is connecting them. But it is easier than it sounds: once you can see where two pieces meet, you can usually share the code between them. A score out of 100 tells you the pieces are there. It cannot tell you how well they fit.

## Discovery: don't make agents guess

Everything so far assumes the agent already knows where to look. The last job is making sure it does not have to be told.

Every page on cocktail.glass carries a `Link` header pointing at three things: an [API catalog](https://cocktail.glass/.well-known/api-catalog), an [MCP server card](https://cocktail.glass/.well-known/mcp/server-card.json), and [`/llms.txt`](https://cocktail.glass/llms.txt). The API catalog follows [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html), a finalised spec. It lists every machine-facing endpoint with a description, a service document, and a health check. The server card follows [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127), still a draft. It tells an MCP client the server's name, transport, and capabilities before it connects. `llms.txt` is the readable site map for language models.

The `/health` endpoint behind the catalog is a real check, not a 200 that always passes. It confirms the cocktail dataset behind the MCP server and the JSON feed is loaded and non-empty, and returns 503 if it is not.

An agent that lands on any URL can read one response header and follow it to the catalog. From there it discovers the MCP server, the JSON feed, the schema graph, and the health check, without parsing a line of HTML. A registry can do the same. Discovery is not a page on the site; it is a property of every response. (All of it is also explained, for humans, at [cocktail.glass/for-agents](https://cocktail.glass/for-agents/).)

## What this doesn't prove

I have to be straight about the limits, because a cocktail database is an easy case and most sites are not.

cocktail.glass is read-only. Every tool is marked `readOnlyHint: true` and means it. Nothing here exercises writes, and an agent that can change state is a much harder design problem: idempotency, confirmation, undo, and the blast radius of a mistake.

It is also small. Five hundred records `import` cleanly into a Function, and the tools scan the array. A real catalogue does not fit in memory, and cannot be a static JSON file. It needs a database, indexes, pagination, and tool results that page rather than return sixty rows at once.

And it is entirely public. There is no private data, so there is no access control, no per-user scoping, no question of which agent is allowed to see what. The agent-ready post could skip OAuth for the same reason. A commercial site usually cannot.

So what transfers? The discipline of one structured source of truth. Content negotiation on the same URL. A stateless, read-only server as the default shape. Discovery documents wired into every response. Those are real and portable. What does not transfer is the comfort of assuming everything is public, small, and read-only. cocktail.glass is a clean teaching example precisely because it gets to make all three of those assumptions. A production site has to give them up one at a time.

## The cheapest moment is before the first commit

Retrofitted, this blog reached 83 out of 100 on [isitagentready.com](https://isitagentready.com). The first time I scanned cocktail.glass, built the way this post describes, it scored 75. Lower than the retrofit.

Not because I cut a corner. The yardstick is younger than the site. cocktail.glass's first commit predates isitagentready's launch by three weeks; it was built before the test existed. So the scan turned up a gap the site never had a chance to plan for: Agent Skills, a discovery document agents look for, which cocktail.glass did not ship. A site built before a standard is a retrofit the moment that standard arrives. Even this one.

Closing the gap took one prompt to a coding agent. The capability already existed as `cocktails_from_my_bar`, and discovery was already wired into every response. Publishing an Agent Skills index was one more well-known file, next to the others cocktail.glass already had. With it live, cocktail.glass passes every isitagentready check that applies to a public, read-only site. That is a score of 100, once the OAuth checks are set aside. They should be. There is nothing here to protect.

That is what designing it in buys. Not a number that stays perfect: the target will move again. It buys cheap adaptation: every new requirement is an addition, not a renovation. "Agent-ready" is cheap to design in, messier to bolt on, and never finished. The blog still has the workarounds from that retrofit. cocktail.glass never needed any.

If you are starting something new, that is the whole takeaway: the cheapest moment to make a site agent-ready is before it exists. The second cheapest is now. The entire thing is open. [Take it apart.](https://github.com/jdevalk/cocktail.glass)
