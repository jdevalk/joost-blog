---
title: Great minds think alike? My WordPress take on Markdown for Agents
publishDate: 2026-02-12T00:00:00.000Z
excerpt: >-
  Today, Cloudflare announced Markdown for Agents, a feature that automatically
  converts HTML to markdown at the edge when AI agents request it. Reading their
  ann
categories:
  - Development
  - Open Source
  - WordPress
featureImage:
  src: ./images/markdown-alternate-featured-scaled.webp
  alt: ''
---
Today, Cloudflare announced [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/), a feature that automatically converts HTML to markdown at the edge when AI agents request it. Reading their announcement felt like looking in a mirror. I’ve been building the exact same concept, even up to including frontmatter with metadata, independently, as a WordPress plugin called Markdown Alternate (which has been running on this blog for almost two weeks).

The core insight is identical: the web was built for humans, but AI agents are now a significant — and growing — consumer of web content. Feeding raw HTML to an LLM is wasteful. Cloudflare cites an 80% token reduction when converting their own blog post from HTML to markdown. That matches what I’ve seen.

Both solutions use the same mechanism: HTTP content negotiation via the `Accept: text/markdown` header. When an agent sends that header, it gets markdown back instead of HTML. Tools like Claude Code and OpenCode already send this header. The infrastructure is ready, the content just needs to follow.

Cloudflare’s solution operates at the CDN edge. It’s broad: flip a toggle in your dashboard, and any page on your zone can be served as markdown. The conversion is generic, Cloudflare doesn’t know whether your page is a blog post, a product page, or a documentation article. It converts whatever HTML it sees.

## What `markdown-alternate` does

My plugin operates at the application level, inside WordPress. That makes it narrower in scope but significantly deeper in what it can do. It offers:

### Dedicated `.md` URLs.
Markdown Alternate gives every post and page its own `.md` endpoint. Instead of only relying on content negotiation, you can simply request `/my-post.md` and get markdown back. These URLs are bookmarkable, independently cacheable, and intuitive, just like `.json` or `.xml` endpoints. Cloudflare only supports the `Accept` header approach. Of course they do add `rel="canonical"` HTTP headers back to the HTML source.

### Discoverability.
The plugin adds `<link rel="alternate" type="text/markdown">` tags to every page’s HTML head. An agent visiting the HTML version can programmatically discover that a markdown version exists. Cloudflare doesn’t offer this, agents have to know to ask for markdown upfront. It might actually be a good addition for their solution.

### Richer metadata.
Cloudflare’s frontmatter includes title, description, and image. Because my plugin lives inside WordPress, it has access to the full post object. The frontmatter includes the title, publication date, author, featured image, and categories and tags, each with their own `.md` URLs, so agents can navigate related content.

### WordPress-aware content processing.
The plugin *knows* what type of content it’s processing. It strips syntax highlighting markup that plugins like Highlight.js inject into code blocks, preserving clean code with language hints intact. A generic HTML-to-markdown converter can’t easily know about this.

## “Stealing” the good ideas

Cloudflare’s announcement included one feature I immediately wanted: the `X-Markdown-Tokens` header. It returns an estimated token count for the markdown response, letting agents plan their context window usage or chunking strategy before processing the content.

I added it to Markdown Alternate within minutes of reading their post. The implementation is simple, `strlen / 4` gives a reasonable estimate for English text, but the idea of exposing this as a header is clever. It costs nothing to produce and gives agents useful information they’d otherwise have to calculate themselves.

## Complementary, not competing

These two approaches aren’t in conflict. A WordPress site could use Markdown Alternate for rich, WordPress-aware markdown with dedicated URLs and full metadata, while Cloudflare’s feature provides a baseline for every other site on their network. The plugin gives you control and depth; Cloudflare gives you breadth and zero effort.

The bigger picture is that the web is adapting to a new kind of consumer. HTML isn’t going away, but the expectation that every consumer of web content is a browser is. Markdown is emerging as the lingua franca for AI systems, and the sooner publishers start serving it natively, the better their content will perform in an agent-driven world.

[Markdown Alternate is available on GitHub.](https://github.com/progressplanner/markdown-alternate)
