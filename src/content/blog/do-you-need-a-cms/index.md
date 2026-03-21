---
title: "Do you need a CMS?"
publishDate: 2026-03-21T00:00:00.000Z
excerpt: >-
  For twenty years, wanting a website meant needing a CMS. That's no longer true. The real question people ask now is simpler: how do I get my content on the web?
categories:
  - Market Share Analysis
isFeatured: true
featureImage:
  src: ./images/do-you-need-a-cms-fi.jpg
  alt: ''
---
For twenty years, "I want a website" meant "I need a CMS." WordPress, Joomla, Drupal: the conversation was always about *which* one. That framing is outdated. People never wanted a CMS. They want a website.

## The real competitive landscape

The ways to get content on the web have multiplied. Shopify if you're selling something. Squarespace or Wix if you want something that looks good without touching code. Substack if you just want to write. A static site generator if you want performance and control.

CMS market share conversations obsess over WordPress vs. Drupal vs. Joomla. I know, because [I've been tracking those numbers](/cms-market-share/) for years. But looking at those numbers, the real movement isn't between CMSes. It's *away* from CMSes entirely. The competitors that are actually growing are the ones that aren't traditional CMSes at all. I [wrote about this in 2022](/wordpress-market-share-shrinking/) when WordPress' market share first started declining. The winners then were Wix and Squarespace. That trend has only accelerated.

## My own answer: I don't need one

I ran joost.blog on WordPress for years. I built Yoast SEO. I'm probably the last person you'd expect to leave WordPress behind (even if only for a few sites). But when I relaunched this site recently, I moved to [Astro](https://astro.build/) on Cloudflare Pages.

The site is now a collection of Markdown files that get built into static HTML and deployed to a global CDN. No database. No server. No PHP. I still have everything that matters: full-text search, comments, structured data, RSS, auto-generated OG images. What I dropped was the overhead.

### But what about SEO?

I built Yoast SEO, so you'd think this is where a static site falls short. It doesn't. Everything Yoast SEO does on WordPress, I can do in Astro. XML sitemaps, meta tags, canonical URLs, Open Graph tags, structured data with full JSON-LD schema graphs, auto-generated social share images: it's all there. In fact, it's *easier* to get right on a static site because you control the entire HTML output. There's no theme or plugin conflict messing with your head tags. No render-blocking resources injected by something you forgot you installed. What you build is what gets served.

The SEO features that a CMS plugin provides aren't magic. They're HTML output. And any modern static site generator can produce that same HTML, often cleaner.

## What I gained

The result aligns with something I [wrote about last year](/build-websites-like-2005/): the web works best when you keep it simple. Clean HTML that every crawler can read, including AI systems that don't execute JavaScript at all. Near-zero security surface. No updates to manage. No plugins to keep compatible. Hosting costs that round to zero. Page load times that are hard to beat with any dynamic setup.

This isn't about nostalgia for a simpler web. It's about recognizing that for a site like mine, a blog with some static pages, the complexity of a CMS was solving problems I didn't have while creating problems I did.

## Where you genuinely need a CMS

Let me be clear: there are real use cases where a CMS earns its complexity. If you have a team of editors who need to collaborate on content daily, with roles, approval chains, and scheduling. If your content model is highly dynamic and relational. If you're running e-commerce, membership, or LMS functionality where the site *is* the application. If your content needs to change per visitor through personalization.

I'm building [Rondo](https://rondo.club/) on WordPress for exactly this reason. WordPress works well as an [application framework](/wordpress-architecture-base-ai/), and Rondo needs the kind of dynamic, user-facing functionality that a static site simply can't provide. These aren't edge cases. They represent a lot of websites. But they don't represent *most* websites. Most websites are a handful of pages and maybe a blog.

## The editing question

The last real argument for a CMS on simpler sites is the editing experience. "My client can't edit Markdown files and commit them to a git repository." That's a fair point. Today.

But think about what's already changing. If you can tell a chatbot "update the opening hours on my contact page" or "publish a post about our spring menu" and it edits the file, commits, and deploys, what's the admin panel for? I built this entire Astro site with AI assistance. The next step, editing content through conversation, is not a big leap. It's a small one.

The CMS's visual editing interface was a solution to a human limitation: most people can't (or don't want to) write code to update their website. AI is removing that limitation. Not in some theoretical future, but now. When editing a static site becomes as easy as sending a message, the CMS's core advantage for the majority of websites disappears.

## So what's a CMS actually for?

A CMS still has a real future in genuinely complex scenarios: multi-user collaboration, dynamic content, application-level functionality. But for the millions of sites that are essentially "some pages and maybe a blog"? The answer to "do I need a CMS?" is increasingly: no. You need a website. And there are more ways than ever to have one.
