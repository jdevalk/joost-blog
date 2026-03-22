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

## How it works

The system has three parts:

### 1. A search index built at deploy time

Every time the site builds, a script scans all blog posts, pages, and videos. It extracts titles, descriptions, categories, and full text, then generates a searchable index. This index ships as a static JavaScript module alongside the site — no database, no external service.

### 2. A retrieval layer that finds relevant content

When you ask a question, it hits the `/ask` endpoint — a Cloudflare Pages Function. The function tokenizes your query, scores every document in the index by keyword relevance, and returns the top matches. This is fast, deterministic, and works without any AI at all.

The scoring is simple but effective: exact phrase matches get a bonus, keywords in titles and URLs score higher than keywords buried in body text, and stopwords are filtered out.

### 3. An LLM that generates the answer

When you use `mode=generate` (which the Ask Joost page does by default), the top search results are sent as context to an LLM running on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/). The model reads the relevant excerpts from my posts and writes a concise answer to your question, grounded in what I've actually written.

The system prompt keeps the model honest: it can only answer based on the provided context. If my blog doesn't cover your question, it says so instead of making things up.

## Why this architecture

I wanted something that:

- **Has no ongoing cost at rest.** The search index is static. The Cloudflare Function only runs when someone asks a question. Workers AI charges per request, not per month.
- **Degrades gracefully.** If the AI call fails or times out, the endpoint falls back to a deterministic summary built from the search results. You always get something useful.
- **Stays fast.** The retrieval step is pure JavaScript string matching against an in-memory index. The LLM call adds latency, but the context is capped so it stays reasonable.
- **Doesn't require a vector database.** For a personal blog with under 100 posts, keyword scoring works well enough. No embeddings, no Pinecone, no pgvector.
- **Is NLWeb-compatible.** The `/ask` endpoint follows the [NLWeb protocol](https://github.com/nlweb-ai/NLWeb), so AI agents and tools that speak NLWeb can query my blog directly.

## The tech stack

- **Astro** for the static site
- **Cloudflare Pages Functions** for the `/ask` endpoint
- **Cloudflare Workers AI** (Llama 3.1 70B) for answer generation
- **A build-time script** that generates the search index from markdown content

The whole thing is about 200 lines of code in a single Cloudflare Function. No framework, no SDK, no orchestration layer.

## Try it

Head to [/ask-joost/](/ask-joost/) and ask something. Try "do you think I need a CMS?" or "what happened with WordPress governance?" and see what comes back.

The answers aren't perfect — they're limited to what I've written, and the retrieval step sometimes misses relevant posts. But for a zero-cost, zero-maintenance feature on a static site, it's surprisingly useful.

## What's next

A few things I'm considering:

- **Better retrieval.** The keyword scoring works but misses semantic matches. A query about "leaving WordPress" won't find a post titled "Moving to Astro" unless the text overlaps. Embeddings would help here.
- **Conversation context.** The NLWeb protocol supports a `prev` parameter for follow-up questions. Right now each question is independent.
- **Streaming responses.** The current implementation waits for the full answer before displaying it. Streaming would make it feel faster.

But honestly, the current version already does what I wanted: it makes my blog's content more accessible to people who have questions but don't want to browse through archives.
