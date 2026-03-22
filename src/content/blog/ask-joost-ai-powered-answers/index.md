---
title: 'Ask Joost: AI-powered answers from my blog'
publishDate: 2026-03-22T00:00:00.000Z
excerpt: >-
  I built an AI-powered Q&A feature that lets you ask questions about anything
  I've written. Here's how it works, and why I built it on Cloudflare Workers
  AI.
categories:
  - Development
draft: true
featureImage:
  src: ./images/featured.webp
  alt: 'Illustration for: Ask Joost: AI-powered answers from my blog'
---

I write a lot. Over the years, this blog has accumulated posts about WordPress, SEO, open source governance, CMS market share, and plenty more. Finding the right post for a specific question means searching, skimming, and hoping the title matches what you're looking for. That's not great.

So I built [Ask Joost](/ask-joost/): a page where you can ask a natural language question and get a direct answer, sourced from my blog posts.

*Want this on your own site? I've [open sourced it on GitHub](https://github.com/jdevalk/nlweb-cloudflare).*

## How it works

The system has three layers: a search index, semantic retrieval, and an LLM that generates the answer.

### 1. A search index built at deploy time

Every time the site builds, a script scans all blog posts, pages, and videos. It extracts titles, descriptions, categories, and full text, then generates a searchable index. This index ships as a static JavaScript module alongside the site — no database, no external service.

### 2. Hybrid retrieval: keywords + embeddings

When you ask a question, it hits the `/ask` endpoint — a Cloudflare Pages Function. The retrieval uses two complementary strategies:

**Keyword scoring** tokenizes your query and scores every document by keyword frequency, with bonuses for matches in titles, URLs, and exact phrases. This handles specific queries well — if you search for "WordPress governance", posts with those exact words rank high.

**Semantic search** goes further. At build time, every post is embedded using Cloudflare Workers AI's `bge-base-en-v1.5` embedding model, producing a 768-dimensional vector per document. At query time, your question gets embedded too, and cosine similarity finds posts that are *conceptually* related even when the words don't overlap. A query about "leaving WordPress" finds a post about moving to Astro, because the embeddings capture semantic proximity.

The two scores are blended, so you get the precision of keyword matching and the recall of semantic search. The embeddings are cached by content hash — subsequent builds only re-embed posts that actually changed.

### 3. An LLM that generates the answer

When you use `mode=generate` (which the Ask Joost page does by default), the top search results are sent as context to Llama 3.1 70B running on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/). The model reads the relevant excerpts from my posts and writes a concise answer to your question, grounded in what I've actually written.

The system prompt keeps the model honest: it can only answer based on the provided context. If my blog doesn't cover your question, it says so instead of making things up.

Each post in the context includes its publication date. When posts contain conflicting or evolving views — which happens when you blog over many years — the model is instructed to prefer the most recent post, and can acknowledge how my thinking has changed.

The page also supports **follow-up questions**. Ask something, then ask a follow-up — the previous exchanges are sent along so the model understands what "that" or "tell me more" refers to. Answers include inline links to the referenced posts, so you can always read the full source.

## Why this architecture

I wanted something that:

- **Has no ongoing cost at rest.** The search index is static. The Cloudflare Function only runs when someone asks a question. Workers AI charges per request, not per month.
- **Degrades gracefully.** If the AI call fails or times out, the endpoint falls back to a deterministic summary built from the search results. You always get something useful.
- **Stays fast.** The embedding lookup is cosine similarity against an in-memory array. The LLM call adds latency, but the context is capped so it stays reasonable.
- **Doesn't require a vector database.** For a blog with ~100 posts, storing embeddings in the index file adds ~2MB. Cosine similarity over 100 vectors is instant. No Pinecone, no pgvector, no Vectorize.
- **Is NLWeb-compatible.** The `/ask` endpoint follows the [NLWeb protocol](https://github.com/nlweb-ai/NLWeb), so AI agents and tools that speak NLWeb can query my blog directly.

## The tech stack

- **Astro** for the static site
- **Cloudflare Pages Functions** for the `/ask` endpoint
- **Cloudflare Workers AI** — `bge-base-en-v1.5` for embeddings, Llama 3.1 70B for answer generation
- **A build-time script** that generates the search index and embeddings from markdown content, with content-hash caching

The whole thing is about 200 lines of code in a single Cloudflare Function, plus a build script. No framework, no SDK, no orchestration layer.

## Use it on your own site

I've extracted the core into an open source package: [nlweb-cloudflare](https://github.com/jdevalk/nlweb-cloudflare). It gives you a drop-in NLWeb-compatible `/ask` endpoint for any markdown-based site on Cloudflare Pages.

The setup is straightforward: configure your content directories and site details, run the index generator as part of your build, drop the function into your `functions/` directory, and add a Workers AI binding. The README has the full walkthrough.

## Try it

Head to [/ask-joost/](/ask-joost/) and ask something. Try "do you think I need a CMS?" or "what happened with WordPress governance?" and see what comes back.

The answers aren't perfect — they're limited to what I've written, and the model sometimes misses nuance. But for a near-zero-cost feature on a static site, it's surprisingly useful.

## What's next

The main thing I'd like to add is **streaming responses** — the current implementation waits for the full answer before displaying it. Streaming would make it feel faster, especially for longer answers.

But honestly, the current version already does what I wanted: it makes my blog's content more accessible to people who have questions but don't want to browse through archives.
