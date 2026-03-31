---
title: "Ecliptic: a WordPress successor built on Astro"
publishDate: 2026-04-01
excerpt: "Cloudflare just launched Ecliptic, a CMS built on Astro that rethinks everything from plugin security to AI integration. Here's why it matters."
categories:
  - "WordPress"
  - "Development"
  - "Open Source"
draft: true
password: "eclipticfools"
seo:
  title: "Ecliptic CMS: a WordPress successor built on Astro"
  description: "Cloudflare launched Ecliptic, a CMS built on Astro that rethinks plugin security, developer experience, and AI integration. Analysis from Joost de Valk."
imageHint: "a modern CMS dashboard interface with Astro and Cloudflare branding, futuristic design"
---

I've spent two decades building on WordPress. I've defended it, criticized it, built a company around it, and [written at length](/category/wordpress/) about where it's heading. A few weeks ago I wrote about [not needing a CMS](/do-you-need-a-cms/) anymore, not for every site, but for _this_ site. I moved this blog from WordPress to Astro on Cloudflare Pages and am still excited about it. So when Cloudflare invited me to a call about a new CMS they've been building, one they're explicitly calling a WordPress successor, I paid attention.

Today they launched [Ecliptic](https://ecliptic.build), and it's the most interesting thing to happen to content management in years.

## What Ecliptic actually is

Ecliptic is a full CMS built on [Astro](https://astro.build), led by Matt Taylor from the Astro core team. It's end-to-end TypeScript, no PHP/JavaScript split, no jQuery legacy, no twenty years of backwards compatibility holding it back. It deploys to Cloudflare Workers, Netlify, or Vercel. The database layer defaults to SQLite but can plug into Cloudflare's D1. Images default to the file system but can swap to S3 or R2.

If that sounds like a clean break from WordPress's architecture, that's because it is. Ecliptic doesn't try to be WordPress with a fresh coat of paint. It starts from a different set of assumptions about how the web works in 2026.

Editing happens on the frontend. You see your actual site while you edit it, not a disconnected admin panel (though you can edit there too). The editor uses TipTap and stores content as portable text (structured JSON) rather than HTML strings. Custom content types get their own database tables instead of being crammed into a shared `wp_posts` table. Internationalization is built in from day one. So is redirect management, full-text search, and core SEO functionality.

## The plugin security model is the real story

WordPress's biggest strength has always been its plugin ecosystem. It's also been its biggest liability. Every plugin runs with full access to your database, your file system, your entire application. A single vulnerable plugin can (and regularly does) compromise an entire site.

Ecliptic takes a fundamentally different approach. Each plugin runs in an isolated worker environment with granular permissions. A plugin has to explicitly request access to content, network calls, or specific APIs. The UI layer is defined through a JSON schema similar to Slack's Block Kit, which means plugins can't inject arbitrary HTML or JavaScript into the admin.

There's a plugin marketplace too, though currently API-only. Submissions go through automated security scanning powered by Workers AI, with Llama Guards handling content classification. It's not perfect, automated scanning never catches everything, but it's a structural improvement over WordPress's model of "upload any zip file and hope for the best".

## What I think is genuinely strong

**The developer experience is excellent.**<br>
There's an MCP server for interacting with the CMS programmatically, a CLI that outputs JSON, and documentation specifically designed for AI agents to consume. If you're building with Claude, Cursor, or any other AI coding tool, Ecliptic is designed to meet you where you are. Round-trip markdown support means you can export content, edit it in any tool, and import it back without loss.

**The AI site generation is clever.**<br>
Ecliptic includes a playground system that spins up temporary deployments from a prompt — theme, content structure, sample data, all generated automatically using Cloudflare's AI models. It's a good onboarding story and a genuine differentiator.

**Authentication uses passkeys by default.**<br>
No passwords to leak, no brute-force attacks to defend against. Combined with Cloudflare Access for role-based access control, the security posture is strong out of the box.

**The SEO foundation is solid.**<br>
Built-in SEO controls, metadata hooks for plugins, structured content that search engines can parse cleanly. It's not a full SEO suite, but the architecture makes it straightforward to build one.

## What's still unproven

Let's be honest about the challenges.

Ecliptic was built over two months using AI coding agents at a cost of roughly \$10k in tokens. That timeline should make every WordPress contributor uncomfortable, not because it means Ecliptic is ready for production (it isn't yet, and the real test starts now), but because of what it says about WordPress.

The WordPress AI team is building the right things. Content generation, smart editing, AI-powered site building: the vision is there. But every feature has to navigate two decades of PHP legacy, backwards compatibility promises, and an architecture that predates modern JavaScript. A small team with AI agents built a full CMS with sandboxed plugins, structured content, and edge deployment in two months. WordPress has been working on full-site editing for *years*. The difference isn't talent or ambition. It's that starting fresh lets you move at the speed that modern tooling actually enables, while WordPress has to drag its history along with every step.

The plugin ecosystem is empty. WordPress has over 60,000 plugins. Ecliptic has a marketplace architecture but no community yet. History shows that CMS adoption is driven more by available plugins and themes than by technical merit. Ghost, Craft, Statamic — all technically excellent, none have dented WordPress's dominance. Ecliptic will need to solve the chicken-and-egg problem that every WordPress alternative has struggled with.

The open-source story needs clarity. It's MIT-licensed, which is great. Cloudflare says they're open to transitioning it to a foundation. But "open to" is not "committed to", and developers who've watched the WordPress governance drama unfold will want firmer guarantees before investing their time.

And while the $5/month Cloudflare plan is cheap, the requirement for a Cloudflare account (with credit card for R2) does tie the "default" deployment to a single vendor. The multi-host story is real in theory — it runs on Netlify and Vercel too — but in practice, Cloudflare is the first-class citizen here for now. We'll want to test that and host it somewhere else quickly too.

## Why I'm going to build on it

As I said in my post about not needing a CMS for this site, CMSes still have legitimate use cases: multi-user workflows, dynamic content, e-commerce, memberships. The question was never "are CMSes dead?" — it was "do most people actually need one?" Especially as when you remove some of the counter arguments about speed and security, the answer might be yes for a few more sites.

Ecliptic is interesting to me precisely because it bridges that gap. It's built on Astro, the same framework I chose for this blog. It deploys to Cloudflare, where I'm already hosting. But it adds the CMS layer — content types, user roles, a plugin system — without the baggage that made me leave WordPress in the first place. Sandboxed plugins, structured content, TypeScript throughout, edge deployment. The architectural decisions are right.

More importantly, the agent-first developer experience aligns with where I think software development is heading. The MCP server, the JSON CLI, the skills documentation — this is a CMS designed for a world where half the code is written by AI. WordPress was designed for a world where you FTP'd PHP files to a shared host. Both were right for their time.

I'm planning to develop on and with Ecliptic, and I'll share more about what I'm building as it takes shape. For now, go look at [Ecliptic](https://ecliptic.build) and form your own opinion. The launch is today, and regardless of where it ends up, it's asking the right questions about what a CMS should be in 2026.
