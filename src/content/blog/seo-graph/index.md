---
title: SEO-graph - for the <em>machine-readable web</em>
seo:
  description: I built a piece of the machine-readable web — seo-graph, a schema.org JSON-LD graph engine that now powers four sites and a CMS plugin.
publishDate: 2026-04-10T00:00:00.000Z
excerpt: >-
  I've been arguing that the next open web needs machine-readable architecture.
  So I built a piece: seo-graph, a schema.org JSON-LD graph engine that now
  powers four sites and a CMS plugin. Built in a single session with Claude
  Code.
categories:
  - Development
  - AI
  - Open Source
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Shipping pieces of the machine-readable web'
isFeatured: false
---
Recently I wrote that the open web doesn't need more defenders, it needs [builders](/defending-open-web-not-enough/). That the next open web needs machine-readable architecture: content structured for machines, not just rendered for browsers. Linked knowledge graphs that search engines and AI agents can consume without reverse-engineering HTML.

That's the argument. Here's what I actually built.

## The problem that started it

I was building an SEO plugin for [EmDash](/emdash-cms/), and the core problem was generating a valid schema.org `@graph` for every page. Not just a flat snippet, but a proper linked graph: `WebSite`, `WebPage`, `Article`, `Person`, `BreadcrumbList`, all wired together with `@id` references so an agent or search engine can walk the relationships.

I'd already written that logic for this blog. It worked, but it was tangled into the Astro components. When I needed the same graph logic in EmDash, the choice was: copy it and maintain two versions, or extract it into something shareable.

Before AI, "extract this into a shared library" was a decision you'd defer for months. Set up the monorepo, extract the code, write the tests, publish to npm, migrate the consumers, verify nothing broke. That's a week of work, and it's boring work, the kind that loses every prioritization fight against shipping features. With Claude Code, I went from "I should extract this" to two npm packages shipping with over a hundred tests, four migrated consumers, and CI with provenance in one session. The decision to abstract stopped being "someday" and became "right now, while I'm thinking about it."

That's the real shift AI enables. Not that it writes code faster. That it makes the *right architectural decision* the easy one, instead of the expensive one you keep putting off.

## What seo-graph is

The result is a monorepo with two packages on npm, both MIT-licensed:

[**`@jdevalk/seo-graph-core`**](https://github.com/jdevalk/seo-graph/tree/main/packages/seo-graph-core) is the engine. Pure TypeScript, no framework dependencies. Specialized builders for the most common entities (`buildWebSite`, `buildWebPage`, `buildArticle`, `buildBreadcrumbList`, `buildImageObject`, `buildVideoObject`) and a generic `buildPiece<T>` that handles everything else: `Person`, `Organization`, `Product`, `Blog`, `Recipe`, `Event`, any schema.org type, with full autocomplete via Google's [`schema-dts`](https://github.com/google/schema-dts).

An `IdFactory` keeps `@id` references stable across the graph. `assembleGraph` wraps everything into a proper JSON-LD envelope with deduplication and optional dangling-reference validation.

In plain language: you tell it what's on your page (a blog post, a person, an organization, a product) and it produces a block of structured data that search engines and AI agents can read. Every entity gets a stable identifier so agents can follow the links between them: this article was written by this person, published on this website, filed under this category. That's the knowledge graph.

[**`@jdevalk/astro-seo-graph`**](https://github.com/jdevalk/seo-graph/tree/main/packages/astro-seo-graph) is the Astro integration. It ships a `<Seo>` component that handles `<title>`, meta description, canonical URLs, Open Graph, Twitter cards, hreflang alternates, and the JSON-LD graph in a single component. It also provides route factories for schema endpoints (`createSchemaEndpoint`) and a schema map (`createSchemaMap`) for agent discovery. Plus Zod helpers for content collection schemas.

The third consumer is [`@jdevalk/emdash-plugin-seo`](https://github.com/jdevalk/emdash-plugin-seo), the EmDash SEO plugin that started this whole thing. It imports `assembleGraph` from the core directly, since EmDash contributes metadata through hooks rather than templates.

## Four consumers, one graph

The real test of an abstraction is whether it works for cases you didn't design for. Four consumers now use seo-graph in production:

**This blog** (joost.blog) is an Astro site. It uses the full stack: `<Seo>` in the `<head>`, schema endpoints serving the corpus-wide JSON-LD graph, a schema map for discovery. The `BaseHead.astro` component that used to be 130 lines of hand-written meta tags and JSON-LD is now a clean `<Seo>` call.

**[limonaia.house](https://limonaia.house)** is a vacation rental site, also Astro. Completely different content type: `VacationRental` instead of `Article`. It was the first external consumer, and it plugged in with zero changes to the core or the integration. That's when I knew the abstraction boundary was right.

**[cocktail.glass](https://cocktail.glass)** is a cocktail recipe site. Yet another content type: `Recipe` with ingredients, instructions, and nutrition data. Same graph engine, same `<Seo>` component, different schema.org types.

**The EmDash SEO plugin** runs inside a CMS, not a static site generator. It doesn't use `<Seo>` at all. It uses `assembleGraph` and the `GraphEntity` type from the core, with its own EmDash-specific piece builders. Same graph engine, completely different integration surface.

## What the output looks like

Here's what seo-graph produces for a blog post on this site. You can [visualize the full graph for this post](https://classyschema.org/Visualisation?url=https%3A%2F%2Fjoost.blog%2Fseo-graph%2F) to see how the entities connect:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": ".../#WebSite", "publisher": { "@id": ".../#Person" }, "hasPart": [{ "@id": ".../#Blog" }] },
    { "@type": "Blog", "@id": ".../#Blog", "isPartOf": { "@id": ".../#WebSite" } },
    { "@type": "Person", "@id": ".../#Person", "name": "Joost de Valk", "knowsAbout": ["SEO", "..."], "publishingPrinciples": "..." },
    { "@type": "WebPage", "@id": ".../my-post/", "isPartOf": { "@id": ".../#WebSite" }, "copyrightHolder": { "@id": ".../#Person" } },
    { "@type": "BlogPosting", "isPartOf": [{ "@id": ".../my-post/" }, { "@id": ".../#Blog" }], "author": { "@id": ".../#Person" } },
    { "@type": "BreadcrumbList", "itemListElement": [{ "name": "Home" }, { "name": "Blog", "item": { "@id": ".../#Blog" } }, { "name": "My Post" }] }
  ]
}
```

Every entity links to others via `@id` references. The `WebSite` contains a `Blog`. The `BlogPosting` is part of both its `WebPage` and the `Blog`. The breadcrumb trail links back to the `Blog` entity. An agent or search engine can walk these relationships and understand the full structure of your site.

The [`AGENTS.md`](https://github.com/jdevalk/seo-graph/blob/main/AGENTS.md) in the repo has complete code examples for fourteen different site types, from personal blogs to e-commerce to vacation rentals.

## Built for agents to use, not just humans to read

Schema.org JSON-LD is how the web communicates structured knowledge to machines. It's how Google understands your content. It's increasingly how AI agents will understand it too. But getting it right is tedious: the spec is massive, the `@id` linking is fiddly, and every framework reimplements it from scratch.

That's the problem seo-graph solves for the *publisher*. But there's a second problem: how does the developer's AI agent know which schema.org entities to use? If you ask Claude Code or Cursor to "add structured data to my Astro site," the agent needs to know that a blog post needs `WebSite` + `WebPage` + `BlogPosting` + `BreadcrumbList` + `Person`, that a vacation rental needs a `VacationRental` with a `RentAction`, that a product page needs `Product` with `BuyAction` and `Offer`. That knowledge lives in the schema.org spec, scattered across hundreds of pages.

That's why the repo's [`AGENTS.md`](https://github.com/jdevalk/seo-graph/blob/main/AGENTS.md) is 3,000 lines long. It tells AI coding agents exactly which pieces to pick for every common site type. Fourteen site type recipes (personal blog, e-commerce, local business, vacation rental, podcast, documentation, SaaS, and more), the full API reference, patterns for trust signals like `publishingPrinciples` and copyright metadata, and guidance on actions (`BuyAction`, `RentAction`, `QuoteAction`) that tell agents what they can *do* with your content.

The repo also ships `CLAUDE.md`, `.cursorrules`, and `.github/copilot-instructions.md` as pointers, so whichever AI coding tool you use, it finds the guide automatically.

This is what "agent-ready" looks like at the tooling level. The library makes your content machine-readable. The documentation makes the library itself machine-readable. Agents helping agents.

`seo-graph-core` is deliberately small. Seven specialized builders, one generic typed builder, an ID factory, and a graph assembler. No opinions about your content model, your routing, or your framework. The dispatch logic lives in your code, not in the library. That's what lets the same core drive a blog, a vacation rental, a recipe site, and a CMS plugin without any of them fighting the abstraction.

If you're building on Astro, `astro-seo-graph` gives you the full integration. If you're building on something else, `seo-graph-core` gives you the graph engine and you wire it into your own templates.

## One piece at a time

I don't think any single library fixes the open web. But the machine-readable web gets built the same way anything real gets built: one small, concrete piece at a time. This is one piece. It's [on GitHub](https://github.com/jdevalk/seo-graph), it's on npm, it's MIT-licensed, and it's in production.

If you're building for the web and your pages don't have a linked JSON-LD graph yet, start there. The agents are already reading.
