---
title: 'Ask Joost: AI-powered answers from my blog'
publishDate: 2026-03-26T00:00:00.000Z
excerpt: >-
  I built an AI-powered Q&A feature that lets you ask questions about anything
  I've written. Here's how it works, and why I built it on Cloudflare Workers
  AI.
categories:
  - Development
  - AI
draft: false
---

I have written quite a bit. Over the years, this blog has accumulated posts about WordPress, SEO, open source governance, CMS market share, and plenty more. Finding the right post for a specific question means searching, skimming, and hoping the title matches what you're looking for. That's not great.

So I built [Ask Joost](/ask-joost/): a page where you can ask a natural language question and get a direct answer, sourced from my blog posts.

*Want this on your own site? I've [open sourced it on GitHub](https://github.com/jdevalk/ask-endpoint).*

## How it works

The system has three layers: a build-time index, hybrid retrieval, and an LLM that generates grounded answers.

### 1. A search index built at deploy time

Every time the site builds, a script scans my content directories for blog posts, pages, and videos. It extracts titles, descriptions, categories, publication dates, and full text, then generates a searchable index that ships with the site as a static JavaScript module.

That index also includes embeddings, so there’s no separate database or vector store to maintain. And importantly, it skips `draft: true` content, so unpublished posts never make it into the public Ask index.

For video content, the index can also pull in generated transcripts. That makes videos searchable too, though they’re treated as weaker sources than written posts and pages.

### 2. Hybrid retrieval: keywords + embeddings + a bit of query rewriting

When you ask a question, it hits the `/ask` endpoint — a Cloudflare Pages Function. Retrieval uses a blend of keyword search and semantic search.

**Keyword scoring** tokenizes your query and scores documents based on term frequency, with extra weight for matches in titles, descriptions, keywords, and URLs.

**Semantic search** uses Cloudflare Workers AI’s `bge-base-en-v1.5` embedding model. At build time, each indexed document gets embedded. At query time, the question gets embedded too, and cosine similarity finds content that’s conceptually related even when the exact words differ.

On top of that, the retrieval layer does a little bit of query normalization. It expands common aliases and shorthand, things like `wp` to `WordPress`, or `gutenberg` to `gutenberg block editor` and `block editor` to the same, so short or informal queries still find the right content.

For follow-up questions, it also augments vague queries with the previous turn. So if you ask “what about governance?” after a WordPress question, retrieval gets a bit more context before the model ever sees anything.

Each indexed document also has a search weight. Pages get a slight boost, videos get a slight demotion, and blog posts sit in the middle. That helps the system prefer cleaner, more authoritative written sources without making videos undiscoverable.

Individual posts can also override their default weight by setting `searchWeight` in their frontmatter. A value above `1.0` promotes a page in results; a value below `1.0` demotes it. This is useful when you know a particular post is the canonical answer on a topic, or when an older post has been superseded and shouldn't rank as highly anymore.

### 3. An LLM that generates the answer

When the Ask page calls the endpoint, it uses streaming generation by default. The top search results are packaged up as context and sent to Llama 3.3 70B running on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/).

The prompt keeps the model on a short leash:

- answer **only** from the provided context;
- say so when the site doesn’t contain enough information;
- always cite sources with markdown links;
- prefer newer posts when my thinking has changed over time;
- treat vague follow-up questions as part of the ongoing conversation.

Each source passed to the model includes its content type and publication date. That gives the model enough context to distinguish between “this is what Joost thought in 2021” and “this is probably his current view.”

If the model fails, times out, or returns something unusable, the endpoint falls back to a deterministic summary built from the search results. So the system degrades gracefully instead of just erroring out.

## Better sources, better answers

One thing I cared about a lot was source quality. Not all content is equally good source material. Pages like “[About](/about-me/)” are often more authoritative than an old blog post. Video transcripts are useful for retrieval, but they’re rougher as quoted sources because they’re derived from captions. So the system uses them for discovery, while still preferring cleaner written sources in the final answer when possible.

The source list shown below each answer is also filtered down to the posts the model actually referenced. The function parses the markdown links in the answer and only shows those sources, instead of dumping every item that happened to be in the retrieval context.

Each visible source can also include a content-type label and publication date, which makes it easier to see whether you’re looking at a page, a blog post, or a video, and whether the source is current or old.

## Streaming and conversation support

Answers stream in as they’re generated, so you don’t just sit there waiting for the full response to appear all at once. That improves perceived speed a lot, especially for longer answers.

The page also supports follow-up questions within the same conversation. It keeps a short exchange history client-side, sends it along with new requests, and uses a stable session ID so Cloudflare can keep the conversation pinned to the same model instance.

That last part matters because Workers AI supports [prompt caching](https://developers.cloudflare.com/workers-ai/features/prompt-caching/) via session affinity. In practice, that means the system prompt and recent conversation history can stay hot in memory, making follow-ups faster and cheaper.
## Why this architecture

I wanted something that:

- **Has no ongoing cost at rest.** The search index is static. The function only runs when someone asks a question.
- **Doesn’t require a vector database.** For a site of this size, embeddings can just live in the generated index.
- **Degrades gracefully.** If the AI layer fails, there’s still a deterministic fallback.
- **Stays inspectable.** The retrieval logic is straightforward enough to debug, tune, and reason about.
- **Is NLWeb-compatible.** The `/ask` endpoint follows the [NLWeb protocol](https://github.com/nlweb-ai/NLWeb), so agents and tools that speak NLWeb can query the site directly.

This is one of those cases where “boring architecture” is a feature. There’s no orchestration layer, no separate retrieval service, and no complex storage stack — just a static site, a generated index, a function, and Workers AI.

## The tech stack

- **Astro** for the static site
- **Cloudflare Pages Functions** for the `/ask` endpoint
- **Cloudflare Workers AI**
  - `@cf/baai/bge-base-en-v1.5` for embeddings
  - `@cf/meta/llama-3.3-70b-instruct-fp8-fast` for answer generation
- **A build-time indexing script** that generates the searchable index, embeddings, metadata, and transcript-backed content from markdown

The code is pretty small. The endpoint logic is now split into focused modules for config, retrieval, and generation, but it’s still a lightweight setup rather than a framework-heavy one.

## Observability and tuning

As soon as you build something like this, you start wanting ways to inspect what it’s doing.

So the Ask endpoint also has a debug mode for inspecting retrieval results, score breakdowns, and timing. That makes it easier to tune ranking, understand why a query matched a certain document, and test improvements without guessing.

That’s been useful while tuning things like alias expansion, follow-up handling, source extraction, and weighting between pages, posts, and videos.

## Use it on your own site

I’ve extracted the core into an open source package: [ask-endpoint](https://github.com/jdevalk/ask-endpoint). It gives you a drop-in NLWeb-compatible `/ask` endpoint for markdown-based sites on Cloudflare Pages.

The setup is straightforward: point it at your content, generate the index during build, add the function, and connect a Workers AI binding. The README has the full walkthrough.

## Try it

Head to [/ask-joost/](/ask-joost/) and ask something. Try “do you think I need a CMS?”, “what happened with WordPress governance?”, or “how do you think AI affects SEO?” and see what comes back.

The answers still aren’t perfect. They’re constrained by what I’ve written, and the model can still miss nuance. But for a relatively small, low-cost system layered on top of a static site, it’s remarkably useful, and a lot more usable than making people dig through archives by hand.

