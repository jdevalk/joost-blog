---
title: 'Ecliptic: a WordPress successor built on Astro'
publishDate: 2026-04-01T00:00:00.000Z
excerpt: >-
  Cloudflare just launched Ecliptic, a CMS built on Astro that rethinks
  everything from plugin security to AI integration. Here's why it matters.
categories:
  - WordPress
  - Development
  - Open Source
draft: true
password: eclipticfools
seo:
  title: 'Ecliptic CMS: a WordPress successor built on Astro'
  description: >-
    Cloudflare launched Ecliptic, a CMS built on Astro that rethinks plugin
    security, developer experience, and AI integration. Analysis from Joost de
    Valk.
imageHint: >-
  a modern CMS dashboard interface with Astro and Cloudflare branding,
  futuristic design
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Ecliptic: a WordPress successor built on Astro'
---

I've spent two decades building on WordPress. I've defended it, criticized it, built a company around it, and [written at length](/category/wordpress/) about where it's heading. A few weeks ago I wrote about [not needing a CMS](/do-you-need-a-cms/) anymore, not for every site, but for _this_ site. I moved this blog from WordPress to Astro on Cloudflare Pages and am still excited about it. So when Cloudflare invited me to a call about a new CMS they've been building, one they're explicitly calling a WordPress successor, I paid attention.

Today they launched [Ecliptic](https://ecliptic.build), and it's the most interesting thing to happen to content management in years.

## What Ecliptic actually is

Ecliptic is a full CMS built on [Astro](https://astro.build), led by Matt Taylor from the Astro core team. It's end-to-end TypeScript. It deploys to Cloudflare Workers, Netlify, or Vercel. The database layer defaults to SQLite but can plug into Cloudflare's D1. Images default to the file system but can swap to S3 or R2.

If you've been following my move to Astro, this should sound familiar — it's the same foundation, extended into a full CMS. Ecliptic doesn't try to be WordPress with a fresh coat of paint. It starts from a modern set of assumptions about how the web works in 2026.

Editing happens on the frontend. You see your actual site while you edit it, not a disconnected admin panel (though you can edit there too). The editor uses TipTap and stores content as portable text (structured JSON) rather than HTML strings. Custom content types get their own database tables instead of being crammed into a shared `wp_posts` table. Internationalization is built in from day one. So is redirect management, full-text search, and core SEO functionality.

## The plugin security model is the real story

Any CMS lives or dies by its plugin ecosystem. The challenge has always been balancing extensibility with security — the more a plugin can do, the more damage a bad one can cause.

Ecliptic takes a fundamentally different approach. Each plugin runs in an isolated worker environment with granular permissions. A plugin has to explicitly request access to content, network calls, or specific APIs. The UI layer is defined through a JSON schema similar to Slack's Block Kit, which means plugins can't inject arbitrary HTML or JavaScript into the admin.

There's a plugin marketplace too, though currently API-only. Submissions go through automated security scanning powered by Workers AI, with Llama Guards handling content classification. It's not perfect — automated scanning never catches everything — but it's a meaningful layer of protection built into the platform from the start.

## What I think is genuinely strong

**The developer experience is excellent.**<br>
There's an MCP server for interacting with the CMS programmatically, a CLI that outputs JSON, and documentation specifically designed for AI agents to consume. If you're building with Claude, Cursor, or any other AI coding tool, Ecliptic is designed to meet you where you are. Round-trip markdown support means you can export content, edit it in any tool, and import it back without loss.

**The AI site generation is clever.**<br>
Ecliptic includes a playground system that spins up temporary deployments from a prompt — theme, content structure, sample data, all generated automatically using AI models running on Workers AI. It's a good onboarding story and a genuine differentiator.

**Authentication uses passkeys by default.**<br>
No passwords to leak, no brute-force attacks to defend against. Combined with Cloudflare Access for role-based access control, the security posture is strong out of the box.

**The SEO foundation is solid.**<br>
Built-in SEO controls, metadata hooks for plugins, structured content that search engines can parse cleanly. It's not a full SEO suite, but the architecture makes it straightforward to build one.

## What's still unproven

Let's be honest about the challenges.

Ecliptic was built over two months using AI coding agents at a cost of roughly \$10k in tokens. That's remarkable speed, and it shows what's possible when you build on a modern foundation like Astro without decades of legacy to navigate. But a CMS is a long-term commitment, and two months of AI-assisted development is not the same as two months of battle-testing in production. The real test starts now.

The plugin ecosystem is empty. WordPress has over 60,000 plugins. Ecliptic has a marketplace architecture but no community yet. History shows that CMS adoption is driven more by available plugins and themes than by technical merit. Ghost, Craft, Statamic — all technically excellent, none have built the ecosystem needed for broad adoption. Ecliptic will need to solve that same chicken-and-egg problem.

The open-source story needs clarity. It's MIT-licensed, which is great. Cloudflare says they're open to transitioning it to a foundation. But "open to" is not "committed to", and developers will want firmer guarantees before investing their time.

And while the $5/month Cloudflare plan is cheap, the requirement for a Cloudflare account (with credit card for R2) does tie the "default" deployment to a single vendor. The multi-host story is real in theory — it runs on Netlify and Vercel too — but in practice, Cloudflare is the first-class citizen here for now. We'll want to test that and host it somewhere else quickly too.

## Why I'm going to build on it

When I moved this blog to Astro, I thought I'd found my answer: Markdown files, static HTML, edge deployment. Fast, simple, no moving parts. And for a personal blog, that's still true.

But I also said in that post that CMSes still have legitimate use cases: multi-user workflows, dynamic content, e-commerce, memberships. For agencies building client sites, for creators who need more than a static site generator — a CMS isn't optional. The question was what a *good* one looks like in 2026.

Ecliptic is my answer to that question. It's built on Astro, the same framework I already chose. It deploys to Cloudflare, where I'm already hosting. But it adds the CMS layer — content types, user roles, a plugin system, frontend editing — with the kind of architecture I'd design if I were starting from scratch today. Sandboxed plugins, structured content, TypeScript throughout, edge deployment.

The agent-first developer experience seals it for me. The MCP server, the JSON CLI, the documentation designed for AI agents — this is a CMS built for how we actually write software now. I can see agencies adopting this not just for the tech, but because their developers can build on it faster with the tools they're already using.

I'm planning to develop on and with Ecliptic, and I'll share more about what I'm building as it takes shape. For now, go look at [Ecliptic](https://ecliptic.build) and form your own opinion. The launch is today, and regardless of where it ends up, it's asking the right questions about what a CMS should be in 2026.
