---
title: Fixing the <em>plumbing</em> of the web
seo:
  description: I shipped specification.website — the platform-agnostic spec of what every good website should ship. Plus the sitemap PRs that pushed me to build it.
publishDate: 2026-05-29T00:00:00.000Z
excerpt: >-
  I shipped specification.website, a platform-agnostic specification of what
  every good website should ship. Because two recent PRs taught me that
  patches fix one platform at a time, and the open web has no shared target.
categories:
  - SEO
  - Development
toc: true
---
Every framework, CMS, and static-site generator reinvents the same list of defaults from scratch. Most get parts of it wrong. There is no shared target.

So I shipped one. [specification.website](https://specification.website) is a platform-agnostic specification of the technical features a good website should have. Twelve domains: foundations, SEO, accessibility, security, well-known URIs, agent-readiness, performance, privacy, resilience, internationalization, and more. Open source, written in the open.

This is the plumbing of the web. And most platforms ship it incomplete.

## Two PRs, same bug

Two pull requests of mine got merged this month, in two different repositories. The first was [PR #16837](https://github.com/withastro/astro/pull/16837) on Astro's `@astrojs/sitemap` package, shipped in 3.7.3 last week. The second was [PR #431](https://github.com/emdash-cms/emdash/pull/431) on [EmDash](/emdash-cms/), a month earlier. Both did roughly the same thing: make the sitemap index actually carry per-file `<lastmod>` values, so a crawler can tell which child sitemap changed without re-fetching every one of them. The Astro fix was 145 lines including tests. The EmDash one was 270.

Neither was hard. What was rare is not the skill. It was the willingness to spend an hour, maybe, on something that is not a feature, does not have a marketing page, and only matters because it is now correct.

Two unrelated codebases, the same hole in the same default. The individual standards exist — sitemaps.org, schema.org, the OG protocol, Google's documentation — but there is no canonical source that combines them into one target a platform can build against. That is when "I should write a spec" stopped being something to think about and became something to ship.

## Defaults are infrastructure

Google launched the sitemap protocol in June 2005, alongside the tool to submit them. For five years, generating a sitemap was a chore the technical few opted into, one site at a time. Then in October 2010, WordPress SEO by Yoast 1.0 shipped with XML sitemap generation built in. Within a year or two, every WordPress SEO plugin had copied the feature. The same thing happened with Open Graph tags, JSON-LD schema, canonical URLs, robots meta, hreflang. I [wrote about this recently](/standards-dont-prove-themselves/). The multiplier effect of an SEO plugin on a platform with tens of millions of installs: it doesn't add one data point, it creates the supply.

None of those defaults are hard. They are patient work. Most of them are a hundred lines of code, a few tests, and the willingness to read the spec carefully enough to ship the boring correct thing. I [talked about defaults](/joost-de-valk-the-devastating-power-of-defaults/) at WordCamp Europe in 2014 because they shape what a million users do without ever opening a settings panel. They still do.

The web has more platforms than it did in 2010. WordPress is one of them. A serious blog can now also run on Astro, on Eleventy, on Next.js, on any of the headless CMSes, on EmDash. Every one of those needs the same defaults. None of them ship them all out of the box, because the work is unglamorous and the audience that notices is small.

That is the gap I keep finding when I look at SEO across the modern web stack. The pieces are mostly there. They are just not wired up to the defaults. The spec gives anyone wiring them up — an Astro integration, an EmDash module, a Hugo theme, a Next.js starter — something to point at.

## It is still SEO

A correctly stamped sitemap index helps Googlebot decide what to recrawl. It also helps ChatGPT's crawler and Perplexity's decide the same thing. A page that exposes a clean [markdown alternate](/markdown-alternate/) lets an agent read the page without parsing HTML, *if* the agent knows to look for it. JSON-LD schema gives search engines a graph to walk. It also gives agents a graph to walk.

Mike King calls this work [relevance engineering](https://ipullrank.com/relevance-engineering-introduction). Others call it GEO. I get the impulse, but I think it is a mistake. We just spent two decades teaching people to think about SEO when they build a website. That mindshare is hard-won. Throwing it away for a new acronym every six months is a marketing reflex, but not a useful one.

There is also no clean switchover point in the technology. Google deployed BERT for query understanding in 2019. Passage indexing shipped in 2020. The transformer-based ranking models that feed AI Overviews are an evolution of the ones that already powered classic search. The change has been continuous. The rebranding is selling a break that isn't there.

[Agent-readiness](/agent-ready/) is a new trick. There will always be new tricks. A plumber has to keep learning when the industry moves to new pipes, and we still call them a plumber. SEOs learning to expose markdown alternates and JSON-LD graphs for agents are still doing SEO.

## Help build it

[specification.website](https://specification.website) is open. Pull requests welcome.

Agent-readiness is a new trick. There will be more. If you know one — a standard, an endpoint, a header, a default that has been standardized — add it to the spec. So the next person building doesn't have to discover it the slow way.

Renaming SEO does not move the web. Writing the patch does. And when the patch is not enough, writing the spec does.

It is not the fanciest work. But it is the work that gets us the web we want.
