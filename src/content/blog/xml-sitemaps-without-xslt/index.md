---
title: Why XML sitemaps are losing their pretty view
seo:
  title: Why XML sitemaps are losing their pretty view
  description: XML sitemaps still help search engines find your pages. Browsers are removing XSLT, the feature that makes some sitemaps look pretty. Here is what to do.
  pageType: article
publishDate: 2026-09-10T00:00:00.000Z
excerpt: >-
  Your XML sitemap still helps search engines find your pages. The thing going
  away is the browser feature that makes it look pretty.
categories:
  - SEO
  - Development
---
Browsers are removing support for XSLT, a feature that turns XML files into readable web pages. If your sitemap uses it, the neat table you see when you open that sitemap will disappear. The sitemap itself will still help search engines find your pages.

## What makes a sitemap look pretty

An XML sitemap is a list of page addresses, often with dates showing when those pages changed. It is a file for search engines to read.

[XSLT](https://www.w3.org/TR/xslt-10/) lets a browser turn that file into a neat table for you. You can scan the addresses and click the links. The table is a view of the data; the sitemap underneath stays the same.

## Why browsers are removing it

The code browsers use to run XSLT has security problems. Bugs in how it handles memory can let attackers harm browser users. The [HTML Standard now advises against using it](https://html.spec.whatwg.org/multipage/infrastructure.html#interactions-with-xpath-and-xslt).

[Chrome plans to switch it off in November 2026](https://developer.chrome.com/docs/web-platform/deprecating-xslt), with temporary exceptions for some users. Firefox and WebKit also support removal, though they have their own schedules. XML itself will keep working, and browsers can still style it with CSS.

## Keep your sitemap

You still need to help search engines find your pages, and [XML sitemaps still do that job](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). Keep yours. Only the XSLT view that makes it look pretty is going away.

## What I did, and what you can do

On [specification.website](/fixing-the-plumbing/), I [removed the XSLT view](https://github.com/jdevalk/specification.website/pull/198). All 12 sitemap files still worked and listed the same addresses. The site already has a [normal web page for browsing the content](https://specification.website/spec/).

I also built [Pretty XML Sitemaps](/code/pretty-xml-sitemaps/), a free Chrome extension that makes sitemaps and sitemap indexes easy to browse and search, without XSLT.

If an SEO plugin or your CMS makes your sitemap, check what its developers plan to do. Keep the sitemap enabled.

If you build your own, remove the XSLT reference and keep the XML file. If people need a readable list too, give them a separate HTML page. You can generate both from the same list of pages.
