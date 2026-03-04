---
title: Build websites like it’s 2005 (and win in 2025)
publishDate: 2025-03-26T00:00:00.000Z
excerpt: >-
  Last week was a whirlwind, first diving deep into AI and WordPress while
  working with the WP CLI as MCP host team at Cloudfest, then heading off to SMX
  Munich f
categories:
  - Search Opinion
featureImage:
  src: ./images/websites-like-2005-fi.webp
  alt: ''
---
Last week was a whirlwind, first diving deep into AI and WordPress while working with the WP CLI as MCP host team at Cloudfest, then heading off to SMX Munich for non-stop conversations about SEO, AI, and the future of search. Two very different settings, one clear takeaway:

**The web has come full circle.**

Despite all the advancements in AI, one theme kept surfacing again and again:  
**These systems still struggle to understand the web.**

It’s not just about bad content or spammy sites. Even well-meaning, beautifully designed modern websites are often invisible to AI—and even to traditional search engines—because of how they’re built.

That might sound surprising in 2025, but it really shouldn’t be.

See, for example, [this new experiment](https://x.com/pootlepress/status/1904216642302738586) by Jamie Marsland. He built a headless site with Lovable using WordPress as a backend. My immediate response to his tweet was loading that URL in ChatGPT and it clearly showed it could not see *any* of the contents of that page, which I, of course, [told him too](https://x.com/jdevalk/status/1904231722352316743). Let’s dive into why this doesn’t work.

### What AIs need (and what they’re not getting)

My friend [Jamie Madden](https://randomadult.com/) pointed me to [llmstxt.org](https://llmstxt.org). This is a site pushing for standards that help AIs crawl and understand your content better. And the advice there hits hard, because it shows just how bad the situation really is.

If you want your content to show up in *any* kind of search — be it classic search engines like Google and Bing, or newer AI-driven search tools — it needs to be:

- **Accessible to bots** (so: don’t block it with `robots.txt` or technical barriers)
- **Easy to reach** (no complex JavaScript rendering or tons of chained requests)
- **Easy to parse** (clear, valid HTML, not div soup)
- **Easy to understand** (simple language, good structure, solid readability)

Sure, Google and Bing have gotten better at dealing with #2 and #3 over the years. But the newer crawlers, the ones feeding AI models and tools? They’re still toddlers learning to walk. They do *not* execute JavaScript *at all*.

And now, instead of them getting smarter, we’re being asked to dumb things down for them through new standards like the above mentioned `llms.txt`.

But here’s a thought: **why not just make our sites simpler and better for *everyone*?**

### What this really means

This isn’t just about AI or SEO. It’s a reminder of the principles the web was built on: accessibility, clarity, speed, and user-first design. Somewhere along the way, we traded a lot of that for flashy frameworks and brittle complexity.

You can have the most beautifully designed website in your favorite JavaScript framework, but if the HTML that comes out of it is garbage and your content is buried behind five layers of client-side rendering… you’re invisible. To AI. Often even to Google. And thus: to users.

It doesn’t matter how great your content is, how strong your brand is, or how well you target user intent. **If machines can’t read your site, people won’t find it.**

Funnily enough, if we did this well, accessibility wouldn’t be as much of a challenge and SEO would suddenly be simple.

### Back to basics, forward to the future

This moment feels oddly familiar. Like we’ve been here before. It’s the early 2000s again, but instead of optimizing for search engines, we’re optimizing for LLMs too now. And the fundamentals haven’t changed.

**So maybe it’s time to build for *clarity* again: for humans first, and machines second, with systems that honor the web’s foundations instead of working against them.**

Because in the end, the best content in the world is useless if it’s unreadable by the systems that help people find it.
