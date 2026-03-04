---
title: 'Optimize crawling: let’s turn things around!'
publishDate: 2022-06-02T00:00:00.000Z
excerpt: >-
  I wrote about crawl optimization last week, mostly about getting stuff that
  you don’t want crawled to not be crawled. There’s more to say about that, and
  I will
categories:
  - Search Opinion
featureImage:
  src: ./images/priscilla-du-preez-4E4AccyhWZo-unsplash-scaled.webp
  alt: ''
---
I wrote about [crawl optimization](/optimize-crawling-for-the-environment/) last week, mostly about getting stuff that you don’t want crawled to not be crawled. There’s more to say about that, and I will in follow up posts, but first we need to talk about how to get the stuff that you *do* want indexed, crawled and indexed by search engines. To that end we’ll have to talk about XML sitemaps and the new kid in town, IndexNow.

At the end of this post I’ll propose a *radical* change to how we approach indexing. One that might not come into existence anytime soon, but that I’d love to discuss with everyone in the industry.

## XML Sitemaps

XML sitemaps are meant to give search engines a list of all the URLs on a site. Ideally, they’d also include the images on those URLs and the last modification date. We’ve had [XML sitemaps in Yoast SEO](https://yoast.com/features/xml-sitemaps/) for years. In 2020, the Yoast team and Google team and some others collaborated on getting [XML sitemaps in WordPress core](https://make.wordpress.org/core/2020/07/22/new-xml-sitemaps-functionality-in-wordpress-5-5/). The WordPress core sitemaps are *really* just a list of URLs, the Yoast SEO ones are slightly more sophisticated.

All search engines use XML sitemaps, and almost all of them use the last modified date as well as the image extensions. Notable **non**-user of the last modified date? Google, as noted in [this recent podcast](https://search-off-the-record.libsyn.com/lets-talk-sitemaps). This honestly actually surprised me as that seemed like a bit of information that would be fairly reliable in a lot of cases. But this might actually have to do with the definition of a “change”, something I’ll talk about below.

## IndexNow

A recent addition to the website toolkit of ways to inform search engines is [IndexNow](https://www.indexnow.org/). It’s a fairly simple protocol that allows you to ping search engines a URL that has changed on your site, or a list of URLs that has changed, and they say they’ll spider them quickly.

This new standard is supported by Bing, Yandex and Seznam, so far, and I’ve heard rumors of other search engines joining their ranks. This might not be useful for everybody with this current set of search engines, but the idea in general isn’t a bad one, especially as they “echo” pings to each other. This means you only have to ping one endpoint and they’ll send them along to all. We’ll be adding support for it to Yoast SEO Premium soon and we look forward to seeing the impact it makes, if any.

## What is a “change”?

The problem with notifications of changes is that the definition of a “change” is extremely cumbersome. If you change a single typo in a page, does that require a re-crawl? Probably not. Or was that typo in the title? That might change things.

Whether something is a big or a small change is actually better judged by a human than by code, for now. That’s why I’d suggest actually making this a toggle in your CMS of choice, where a “small change” would not change the last modified date, and thus not cause a ping.

## Could we turn this model around?

So I’ve been thinking about this topic for years. And something bothers me. Search engine crawlers are built on a very old concept: they follow links from one page to another, assuming that sites themselves don’t know which content lives on them. This simply isn’t true anymore for lots and lots of sites. A site purely built on WordPress, which SEO is managed by a tool like Yoast SEO, knows *exactly* which content is on it and what should be crawled and indexed. Yet, on sites like yoast.com, search engines crawl about 10x more URLs than we *know* are relevant.

> What if search engines *only* crawled URLs that we explicitly allowed?

So: what if we turned the model around? What if search engines *only* crawled URLs that we explicitly allowed? What if we created a robots directive that played together with XML sitemaps. One where I could add the following lines to my `robots.txt`:

```
Disallow: /Allow-Sitemap: /sitemap_index.xml
```

And this would allow crawlers to *only* crawl URLs that are in those XML sitemaps. Sites should then explicitly set `Allow` rules for their assets too, for instance `/wp-content/` and the like. For most, if not all sites this would mean a drastic reduction in the amounts of URLs that are being crawled. It would also mean a *huge* boost in efficiency in terms of caching and would thus be a great improvement for the environment, as sites would use less resources.

## How to deal with canonicalization?

Now, I know you’ll say “but people link to URLs with parameters, we need to canonicalize those”. Yes, I know. Let’s say someone links to:

https://example.com/example-post/?gclid=2

And the XML sitemap only has:

https://example.com/example-post/

In this case, search engines / crawlers should simply canonicalize all URLs to the longest match they can find in the XML sitemap. Google, Facebook, Twitter and many others create random parameters they add to URLs *all the time*, and in doing so, create “e-waste” of giant proportions. Site owners should not be burdened with this. Crawlers should simply stop crawling nonsense URLs.

## What’s missing from this idea?

This is where I turn it to the search engines and the SEO community: what’s missing from this idea. What would make this *not* work? What could we do differently if a site could be relied upon to know about its URLs, instead of search engines having to guess? I’d love to hear from you, on Twitter, or in the comments below.
