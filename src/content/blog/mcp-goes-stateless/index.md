---
title: "MCP goes <em>stateless</em>"
seo:
  title: "MCP 2026-07-28: the spec catches up with the static web"
  description: >-
    The new MCP spec drops the handshake and sessions. What that changes in a
    hand-rolled endpoint on a static blog, and why tools/list can now live on
    the CDN.
publishDate: 2026-07-28T00:00:00.000Z
excerpt: >-
  MCP 2026-07-28 shipped today, and the headline change is a stateless core:
  no more initialize handshake, no more sessions. That's the exact shape I
  built joost.blog's MCP endpoint in back in May, when it was a tolerated
  corner of the spec rather than the spec itself. Here's what changed in my
  hand-rolled endpoint, why most of an MCP server on a static site can now
  be CDN, and why my agent skills now ship over MCP too.
categories:
  - Development
  - AI
toc: true
---

The Model Context Protocol shipped its fifth spec release today: [MCP 2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/). If you serve MCP from a static site, this is the release where the spec catches up with you. The headline change is a stateless core: the protocol drops from a bidirectional, session-based design to plain request/response. Anthropic's [announcement](https://claude.com/blog/bringing-mcp-2026-07-28-to-claude) frames this as making MCP servers easier to build and scale, and it does. It also makes the smallest possible MCP server, a static site with one function, the shape the protocol now assumes.

## Pages for humans, tools for agents

Last week I argued that [the website is becoming a bundle of interfaces](/future-of-the-website/): one for humans, several for machines, and the machine ones don't just answer questions, they take actions. An MCP server is one of those machine interfaces: the plug through which AI assistants use a site rather than just read it.

The distinction matters. Everything else I've done to make this blog agent-friendly helps agents *read*: markdown versions of every page, structured data, feeds. But reading only gets an agent so far. If you ask your AI assistant what I think about the future of websites, "go read a couple hundred blog posts and work it out" is a terrible answer. The MCP server turns that into one question: the assistant calls a tool, gets back a cited answer, and is done. For a shop the equivalent is checking stock or booking a slot; for a blog, it's answering questions about twenty years of writing.

The standard objection for a site like this one: it's static. There is no server. The whole appeal of a static site is that it's just files: nothing running, nothing to babysit, nothing that falls over at 3am. A protocol that expected a long-lived, stateful connection, something that stays awake and remembers who's connected, sounded like re-adopting exactly the infrastructure static sites exist to avoid. As of today, that objection is gone: the protocol now works like the rest of the web. Ask, answer, done.

## No handshake, no sessions

In May I wrote about [making this blog agent-ready](/agent-ready/). Part of that work was an MCP endpoint: a single Cloudflare Pages Function speaking Streamable HTTP against the 2025-11-25 spec, no sessions, no SSE, roughly 140 lines. That was allowed, but it was the exception the spec permitted, not the shape it assumed. As of today it's the core protocol. Statelessness went from tolerated to canonical.

The `initialize` / `initialized` exchange is gone, and so is the `Mcp-Session-Id` header. Every request now travels on its own, carrying its protocol version, client identity, and capabilities in `_meta`. A client that wants to know what a server supports up front can call the new `server/discover` RPC. It doesn't have to: it can fire a `tools/call` cold and handle a version error if one comes back.

For a read-only server, the protocol surface is now three methods: `server/discover`, `tools/list`, and `tools/call`. One POST is one tool call. The removals tell the same story: `ping` is gone, the GET stream endpoint is gone, SSE resumability is gone. All three managed a long-lived connection a static site never wanted.

## What changed

Updating my endpoint, a single Cloudflare Pages Function, took Claude about two minutes, working from the changelog while I read the announcement. The changes are a decent summary of the spec. The endpoint gained a `server/discover` handler that returns supported versions, capabilities, and server identity. Results now carry a required `resultType: "complete"`. The server also identifies itself in each result's `_meta`, since there's no handshake left to do that once. The `tools/list` response gained `ttlMs` and `cacheScope` fields, which the new spec requires. Two new headers, `Mcp-Method` and `Mcp-Name`, joined the CORS allowlist. And `initialize` stays: the spec's compatibility matrix defines a dual-era server that answers both kinds of client, and legacy clients won't disappear overnight.

The nicest side effect is in the analytics. My [traffic dashboard](/agent-ready/) got its MCP client mix from `initialize` calls, because that was the only place clients identified themselves. Modern clients send `clientInfo` in `_meta` on every request, so every `tools/call` row now says which client made it. Statelessness made the logging better, not worse.

The same diff applies to [cocktail.glass](https://cocktail.glass/), which runs the identical pattern. When a breaking protocol release is a two-minute agent task per server, "breaking" stops being a scary word.

## tools/list can live on the CDN

This part is easy to overlook, because it only matters if your MCP server sits behind a CDN. The spec now requires clients to mirror the JSON-RPC method into an `Mcp-Method` HTTP header, and the tool name into `Mcp-Name`, so that gateways can route without parsing bodies. Separately, `tools/list` responses must declare `ttlMs` and `cacheScope`, and servers should return tools in a deterministic order.

Put those together. A `tools/list` response on this blog is static content: the catalog only changes on deploy, the order never changes, and `cacheScope: "public"` says shared caches may hold it. A cache rule keyed on `Mcp-Method: tools/list` lets the CDN answer the catalog request without invoking the function at all. It's the same move as the [Transform Rules trick](/agent-ready/) that serves markdown to agents without a Worker: the CDN does the boring part, the function does the thinking. What's left of "running an MCP server" on a static site is one function that answers `tools/call`.

## Same skills, second transport

Alongside the spec release, a working group is figuring out how agent skills should travel over MCP. [SEP-2640](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2640), the draft Skills extension, is pleasantly small. A server serves each skill as plain MCP resources under `skill://` URIs and hands the format itself off to the [Agent Skills spec](https://agentskills.io/). The catalog lives at `skill://index.json`, in almost exactly the format of the well-known index [I already publish](/agent-ready/). There's no domain in a `skill://` URI; the connection you read it over supplies the server, the way a relative link's page supplies the site. My endpoint now implements the draft: it declares the extension in its capabilities, lists my eight skills at `skill://index.json`, and serves every `SKILL.md` as a readable resource. That adds `resources/list` and `resources/read` to the three-method surface from earlier.

The part I care about is what this did not require: a second copy of anything. The same build step that writes the well-known skills directory feeds both surfaces, so the well-known URI and the MCP endpoint cannot drift apart. [Parallel versions of a website always drift out of sync, and then they die](/future-of-the-website/). The way out is one source of truth with multiple renderings. That holds for skills as much as for pages.

It is a draft, and drafts change. But [standards don't prove themselves](/standards-dont-prove-themselves/): somebody has to run them in production to find out where they pinch. Implementing it cost Claude a few more minutes.

## Twelve months of both

The release also ships MCP's first formal deprecation policy: a twelve-month minimum window, with a registry of what's on the way out. Roots, sampling, and logging are deprecated. I never implemented any of them, and the reasons given for their deprecation read like the reasons I skipped them.

The auth hardening (RFC 9207 issuer validation, and the move from Dynamic Client Registration to client metadata documents) is real work for servers with something to protect. This blog's MCP server stays deliberately public and unauthenticated. [The argument from May](/agent-ready/) for why that's correct for a public corpus hasn't moved.

One gap worth naming: the `initialize` handshake itself is not on that registry. It wasn't deprecated, it was removed. It only exists in earlier protocol revisions now, and nothing in the spec says how long servers should keep answering those. Every dual-era server picks its own timeline, and clients have no way to see it. So my endpoints announce theirs on the wire: responses to legacy `initialize` calls carry `Deprecation` and `Sunset` headers, following [the pattern from specification.website](https://specification.website/spec/resilience/deprecation-and-sunset/). The handshake keeps working here until 28 July 2027, borrowing the spec's twelve-month window as a floor, and a `rel="deprecation"` link explains why. The spec supplies the precedent, my server supplies the dates, and the HTTP RFCs put them where a client can see them.

The policy itself might be the most important line in the release. In [last week's post](/future-of-the-website/) I wrote that the specific standards will churn: MCP is today's answer, and something else will come after it. This is what responsible churn looks like: breaking changes with a dated offramp, not perpetual backwards compatibility and not surprise removals. A standard that can shed its early mistakes on a published schedule is one you can build a business interface on.

## The hard part hasn't moved

The May post ended by noting that the hard parts are deciding what to expose and why, not the mechanics of exposing it. The new spec makes the mechanics smaller still: less ceremony, fewer methods, and a CDN doing half the serving. But this blog's MCP server still exposes exactly two tools. Two is how many capabilities this site has that scraping doesn't cover. The protocol got simpler. The editorial question is untouched, and it was always the real work.
