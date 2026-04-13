---
title: Standards don't prove themselves
publishDate: 2026-04-13T00:00:00.000Z
excerpt: >-
  The SEO Framework analyzed 180,000 AI bot requests and found zero llms.txt
  lookups. Their conclusion: not worth implementing. That conclusion reveals a
  misunderstanding of how web standards work, and a willingness to only pick
  sides after the debate is settled.
categories:
  - SEO
  - AI
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Standards don''t prove themselves'
toc: true
---
Measuring whether a standard works by checking if anyone uses it before it exists is backward. And yet that's exactly what The SEO Framework just did.

They [published data](https://github.com/sybrew/the-seo-framework/issues/732#issuecomment-4226935622) showing that across six months, 57 AI bots, and 180,000 AI-related requests to their site, not a single bot requested `llms.txt`. [Their conclusion](https://x.com/TheSEOFramework/status/2042723331049136341): implementing it would be "a waste of resources." Yoast SEO and Rank Math, they imply, are selling a feature that doesn't do what it promises.

The data is solid. I have no reason to doubt the methodology. The conclusion is where it breaks.

## How standards actually get adopted

Web standards don't get adopted because bots start requesting something that doesn't exist yet. They get adopted because publishers start serving something, which gives crawlers a reason to look for it, which gives more publishers a reason to serve it. That's the cycle. Someone has to go first.

XML sitemaps followed exactly this path. Google launched the protocol in June 2005. For over a year, Google was the only search engine using it. Yahoo and Microsoft didn't join until November 2006. Ask.com waited until April 2007. If you'd analyzed server logs in early 2006 and concluded "only one search engine uses sitemaps, not worth implementing," you'd have been right about the data and completely wrong about the trajectory.

IndexNow is an even more recent example. Bing and Yandex launched it in October 2021. By August 2022, [over 16 million websites](https://blogs.bing.com/webmaster/august-2022/IndexNow-adoption-gains-momentum) were publishing 1.2 billion URLs per day through it. By September 2023, that grew to 60 million websites and 1.4 billion URLs daily. Google still hasn't adopted it. If you'd waited for Google to adopt IndexNow before implementing it, you'd still be waiting. Meanwhile, Bing serves a significant and growing share of AI-powered search through Copilot and ChatGPT.

The pattern is always the same: someone builds it, someone else adopts it, adoption creates incentive, incentive creates more adoption. At no point does a standard prove itself to an empty room.

## The multiplier effect

Here's what makes this particularly relevant for SEO plugins. Yoast SEO runs on [over 10 million WordPress sites](https://wordpress.org/plugins/wordpress-seo/). Rank Math runs on a few million more. When those plugins ship a feature, it doesn't create one data point. It creates millions of endpoints overnight.

That's the multiplier effect. SEO plugins don't just implement standards. They *create the supply* that gives crawlers a reason to consume them. When Yoast shipped XML sitemaps, it didn't help a few individual sites get indexed. It made sitemaps ubiquitous enough that every search engine had to support them. When Yoast added IndexNow, it turned a niche protocol into infrastructure overnight.

The SEO Framework has around 200,000 active installs. That's a solid user base, and the plugin has earned its reputation for being lightweight and well-built. But 200,000 sites choosing not to serve `llms.txt` has negligible impact on whether AI bots will ever look for it. The adoption question will be decided by the plugins with 10 million installs, not 200,000.

Which makes the framing of their tweet odd. They're not saying "we're choosing not to implement this yet." They're implying Yoast and Rank Math are misleading their users by shipping a feature no AI bot actually uses. And honestly, there's something to that: both Yoast and Rank Math market `llms.txt` with stronger claims about its current usefulness than the evidence supports.

Shipping the feature is the right call. Overselling it isn't. But The SEO Framework's response overcorrects in the other direction, dismissing the concept entirely based on the absence of adoption that hasn't had time to materialize. And it's a strong implication to make from a position that has essentially no influence on the outcome they're measuring.

## The cost of waiting vs. the cost of trying

Implementing `llms.txt` in a WordPress plugin is trivial. You're generating a markdown file from data the plugin already has: titles, URLs, descriptions. The cost is measured in hours, not weeks. The ongoing maintenance cost is near zero. Arguably, the time spent analyzing six months of server logs to prove `llms.txt` is a "waste of resources" could have been spent implementing it.

The potential upside? If AI systems start consuming `llms.txt` (and they might, precisely because millions of sites now serve one), your users benefit immediately. If they don't, you've lost almost nothing.

Compare that to the cost of waiting. If you wait until `llms.txt` is proven, your users are late. They don't get the early-mover advantage. And you've contributed nothing to the ecosystem that might have made it succeed.

This isn't unique to `llms.txt`. The same logic applies to every emerging standard in this space.

## It's not just llms.txt

The broader question isn't whether `llms.txt` specifically will win. It's whether we're building toward machine-readable architecture at all. And there are multiple complementary approaches, each solving a different piece of the puzzle.

### Content negotiation

Cloudflare launched [Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/) in February 2026, serving markdown instead of HTML when an agent sends an `Accept: text/markdown` header. I [built the same thing independently](/markdown-alternate/) as a WordPress plugin, with richer metadata and dedicated `.md` URLs. Claude Code and other AI coding tools already send this header. The infrastructure is ready. The 80% token reduction over HTML is real and measurable.

### Schema endpoints and schema maps

Instead of requiring agents to crawl every page to understand your site, you can serve your entire structured data graph through a single endpoint. Yoast launched [Schema Aggregation](https://yoast.com/yoast-seo-march-3-2026/) in March 2026, in collaboration with Microsoft's NLWeb project, bringing this to millions of WordPress sites. I'm proud that the company I co-founded is doing this, though I wish they'd moved faster. I've [built the same concept](/seo-graph/) into my Astro SEO library and have it running on [this site](/schemamap.xml). The approach is sound: give agents a complete, deduplicated map of your content in one request instead of making them reverse-engineer it from thousands of HTML pages.

### NLWeb

Microsoft's open protocol for connecting websites with AI systems. It builds on schema.org, which LLMs already understand well. Still early, but the pieces are falling into place. A `<link rel="nlweb">` tag in your HTML head, a conversational endpoint, and your existing structured data. One line of HTML and you're discoverable.

### llms.txt itself

A curated, markdown-formatted index of your most important content, placed at a well-known URL. Simple, low-cost, and easy to generate automatically.

These aren't competing standards. They're layers. `llms.txt` helps agents find your content. Content negotiation helps them consume it efficiently. Schema endpoints help them understand its structure and relationships. NLWeb lets them query it conversationally. You don't pick one. You build toward all of them.

## I've been writing about this for a while

Back in 2022, [optimizing crawling for the environment](/optimize-crawling-for-the-environment/) showed how WordPress creates seven or more URLs for every single post, all of which get crawled, none of which add information. The [follow-up proposed inverting the crawling model entirely](/optimize-crawling-lets-turn-things-around/): what if search engines only crawled URLs that sites explicitly listed in their sitemaps?

By 2025, [AI systems were struggling to understand the modern web](/build-websites-like-2005/) because so much of it is buried behind JavaScript rendering and div soup. The irony: `llmstxt.org` was already pushing for exactly the kind of machine-readable content that post argued for.

This year, the pieces are getting built. [Markdown Alternate](/markdown-alternate/) for serving markdown to agents. [seo-graph](/seo-graph/) for linked JSON-LD knowledge graphs. Schema endpoints and schema maps for agent discovery. NLWeb integration. Each piece is small. None of them have won yet. But they're all attempts to answer the same question: how do we make the web readable by machines, not just browsers?

The thread connecting all of this is simple: everyone who understands crawling can see that there's an opportunity to optimize how search engines and LLMs retrieve data from websites. That optimization is in the interest of the crawlers, those being crawled, and everyone in between (hosts, CDNs, the environment). The question has never been *whether* to build machine-readable architecture. It's *how*, and *how fast*.

## Picking sides after the debate is settled

What bothers me about The SEO Framework's position isn't the decision not to implement `llms.txt`. Plenty of reasonable people could look at the current state and decide to wait. That's a legitimate technical judgment.

What bothers me is the framing. They're not saying "we're watching this space." They're implying the plugins that *did* implement it are misleading their users, positioning "we only pick sides when the data is clear" as the principled stance.

But there's nothing principled about only joining a debate after it's been settled. That's just showing up to the victory party. Standards need early adopters who are willing to invest before the returns are obvious. That's what moves the ecosystem forward. Measuring traffic to a file that barely exists yet and concluding the concept is flawed is like checking how many people show up to a restaurant before you've opened it. And concluding nobody wants to eat there.

I've been [arguing](/ai-optimization-is-replaying-early-seo-just-faster/) that the SEO community should be playing a role in building better standards for AI systems, not waiting for the platforms to figure it out. We should be giving them clear feedback on how this *could* all work better. SEOs have always played a role in bettering (and worsening) the web. We should keep playing that role, preferably the first one.

The SEO Framework makes a good plugin. Their data analysis was thorough. But their conclusion says more about their approach to the industry than it does about `llms.txt`.

Standards don't prove themselves. People prove them by building.
