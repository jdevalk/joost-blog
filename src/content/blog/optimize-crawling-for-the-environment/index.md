---
title: 'Optimize crawling, for the environment'
publishDate: 2022-05-24T00:00:00.000Z
excerpt: >-
  Search engines rely on spiders / bots to crawl the web and find (new) content.
  Every time they find a URL, they crawl it and if it’s interesting to them,
  they’l
categories:
  - Search Opinion
featureImage:
  src: ./images/isabella-juskova-WLicx3ggC4E-unsplash-scaled.webp
  alt: ''
---
Search engines rely on spiders / bots to crawl the web and find (new) content. Every time they find a URL, they crawl it and if it’s interesting to them, they’ll *keep* crawling it basically forever. The bigger your site, the more URLs you have, the more likely every individual URL is to be hit multiple times per day (or even per hour). Cloudflare’s [Radar](https://radar.cloudflare.com/) estimates that currently 32% of the traffic on the web is bots. That means that 32% of the energy used to serve websites is used by bots.

Search engines are super eager to crawl. They will crawl literally *everything* that looks like a URL to them. This means that every URL you create will be crawled, and therefore every URL you create has an impact. Let that sink in: every URL you add to a website’s source will be crawled. Let’s talk about what that means and how we can optimize crawling.

## The cost of (too much) crawling

We rarely talk about the cost of crawling. It’s costing search engines money to crawl, of course, but it’s costing *you* money too. If 32% of your traffic comes from bots, reducing that traffic might mean you pay less for your hosting. Regardless of whether there is a direct connection to your hosting bill, there is a connection to the electricity your site is using. To reduce crawling means your site uses less electricity which in the end is a win for the environment. Hence: optimize crawling, for the environment!

Let’s have a look at what’s causing all this crawling to begin with. I’m going to assume you know how search engines work at a basic level, if you don’t, [this video](https://www.youtube.com/watch?v=Lg8tmurU1_k) will help you!

To put it simply: search engines are crawling more than we want, because they’re spidering things that are not useful to users. How come they’re crawling more than we want? Because:

## You have a *lot more* than one URL per page 

The problem I’m going to describe is by no means just a WordPress problem. Almost every CMS has this problem to some extent, but let me explain it to you by way of a WordPress example.

When you publish a new post on a WordPress site, you get a URL. Let’s say we’ve just created this URL:

`https://example.com/example-post/`

What most people don’t realize is that WordPress automatically creates a lot of URLs “around” this post, and it links them all in the source. Let’s make a list:

1. An RSS feed for the comments: `https://example.com/example-post/feed/`
2. An oEmbed URL so the page can be embedded: `https://example.com/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fexample.com%2Fexample-post%2F`
3. Another oEmbed URL in an XML format: `https://example.com/wp-json/oembed/1.0/embed?url=https%3A%2F%2Fexample.com%2Fexample-post%2F&#038;format=xml`
4. When you open these oEmbed URLs, you find that there’s an embed URL hidden in them: `https://example.com/example-post/embed/`
5. A JSON version of the post in the WordPress REST API: `https://example.com/wp-json/wp/v2/posts/123`
6. A shortlink of the same post: `https://example.com/?p=123`
7. If you have date archives, you’ve now also created `https://example.com/2022/05/24/` as a URL and `https://example.com/2022/05/` etc. See this date archive on Matt’s blog for instance: <https://ma.tt/2022/03/23/>.
8. If you have threaded comments (on by default in WordPress) and you don’t have Yoast SEO, you’ll have a link like this: `https://example.com/example-post/?replytocom=54321#respond` for *every* comment on your post.

If you look at your server logs (unfortunately, very few people do that), you’ll see that *each and every one of those URLs gets crawled.* None of these URLs add extra information that wasn’t already on the initial URL. None of these URLs should be of interest to search engines. But they don’t know that, so they’ll just crawl them anyway. This means that instead of crawling one single URL, your post, they’ve now got at least 7 versions of that URL to crawl *and they will*.

Simply put, I think developers should consider this far more than they do:

Every URL found in HTML **will be crawled**.  
Every URL you create and put in HTML therefore **has a cost**.

You should ask yourself: is the benefit this URL brings, worth that *cost*?

## Other types of pages

This is not just true for posts and pages in WordPress of course. Tasks that seem very innocuous to the end user actually have far more impact than they realize. If you add a tag to a post, for example, and that tag has never been used before, you’ve now created a new URL on your site. In fact, because WordPress automatically makes RSS feeds for every tag, you’ve created two: `example.com/tag/new-tag/` and `example.com/tag/new-tag/feed/`.

The list goes on:

## Plugins making it worse

Some plugins then add tons of extra URLs to create specific functionality. For example Jetpack’s “Sharedaddy” functionality adds one for every platform / share method you enable:

1. `https://example.com/example-post/?share=tumblr&nb=1`
2. `https://example.com/example-post/?share=twitter&nb=1`
3. `https://example.com/example-post/?share=facebook&nb=1`
4. `https://example.com/example-post/?share=email&nb=1`

Etc. etc.

Let’s be clear: Jetpack is certainly not alone in doing this, in fact, they are nice enough to add `nofollow` attributes to those links which should keep crawlers from following them (surprise: [it doesn’t](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify)). Many plugins create almost infinite amounts of extra URLs (like dates in calendars) leading to infinite crawl “spaces” for search engines, which leads to very heavy crawling with absolutely no benefit.

## Is this just Google?

By no means is this just a Google problem. Bing, Yandex, Neeva, Seznam, Baidu and many, many others crawl your site. Every day. They might not send you any traffic, but they *do* crawl your site.

## What should web developers do?

Web developers, including those working on WordPress core, really should stop adding URLs to the source that don’t absolutely need to be there. You should really consider whether links need to be there for discoverability. Or if the feature is really needed at all.

In WordPress’ case:

- The REST API functions perfectly fine without links pointing to it from every page’s source.
- Adding shortlinks for every site that hardly anyone uses: not needed.
- Comment RSS feeds for every post? In my not so humble opinion, those should go the way of the dodo.

Removing those links from every post would make a very real impact on crawling on the web, and therefore on power consumption by sites.

## What can you do to optimize crawling?

### Everyone: block bots or slow them down

If you’re not getting any traffic from a search engine, but they are heavily crawling your site: block them or slow them down. Bing and Yandex both adhere to the [crawl-delay directive](https://yoast.com/ultimate-guide-robots-txt/#crawl-delay-directive), so you might add something like:

```
Crawl-delay: 30
```

So they will only crawl your site once every 30 seconds or so. Play with the number there to get to something your comfortable with. With this setting they can still crawl 2,880 pages on your site *every* day.

### If you’re on WordPress

Yoast is adding features to Yoast SEO to remove the links to these URLs from the source. In some cases, we’ll allow disabling the functionality entirely. When those features come out, you should enable them (they won’t be on by default because we don’t want to inadvertently break anyone’s site).

Sites that do not use the REST API to fill their pages (so, the vast majority of sites) should probably add this to their robots.txt file:

```
Disallow: /wp-json/
```

This blocks 4 of the 7 URLs I mentioned above and saves a ton of unnecessary crawling. Unfortunately, because some sites rely on using that endpoint for their content, we can’t default to this.

### If you’re not on WordPress

Start looking at your site’s server logs. Find the URLs that are being crawled by search engines that are not useful to end users. Determine how they’re found and then start removing them. To analyze your server logs you can use a tool like [Screaming Frog’s Log file analyzer](https://www.screamingfrog.co.uk/log-file-analyser/).

If you find any other patterns others should know about, share them in the comments, and let’s optimize crawling together!

**Want to read more on this topic? I’ve written a follow up post: [Optimize crawling, let’s turn things around!](/optimize-crawling-lets-turn-things-around/)**
