---
title: CMS Market share measured “right”
publishDate: 2024-07-02T00:00:00.000Z
excerpt: >-
  Today, I’m introducing a new CMS market share report on this site based on the
  HTTP Archive’s dataset. This report will be updated – automatically – every
  month
categories:
  - Market Share Analysis
featureImage:
  src: ./images/cms-market-share-measuring-right-png.webp
  alt: ''
---
Today, I’m introducing a new [CMS market share report](/cms-market-share/) on this site based on the [HTTP Archive’s dataset](https://httparchive.org/). This report will be updated – automatically – every month. It doesn’t just contain CMSes; it also contains the most popular eCommerce platforms, WordPress page builders, and SEO plugins. Over time, we might expand this to more; suggestions are most certainly welcome.

I had been slacking for more than a year in publishing a new version of the CMS market share statistics, partly because of time but mostly because I was unhappy with the data I was dealing with. In the last few weeks, I sat down and thought about it and discussed it with [Jono Alderson](https://www.jonoalderson.com/) (whom I owe massive thanks for his help as he was always the one helping me with my previous CMS market share reports). The conclusion was that we need to build this better. So we did.

The report now also contains a list of all the technologies we track, allowing you to click on pages for each.

## Separating data from commentary

In my previous reports, I added my commentary throughout the report. However, as this report will now be updated automatically every month, that’s no longer possible. So, instead, I will post more regularly on this blog in this category.

The first post is straight after this one: [CMS market share June 2024 commentary](/cms-market-share-june-2024-commentary/).

## On measuring market share

Measuring market share on the web is incredibly difficult: you need to define what “the market” is, and even the definition of a “CMS” is being discussed in some places. This report now assumes that the Chrome UX dataset, which is the basis for the HTTP Archive’s dataset, makes the right decisions to get a statistically reasonable “view” of the web. This does mean, however, that very small sites (in terms of traffic) are *not* included in this dataset, which in itself leads to some bias.

### WordPress

The biggest visible change in all of this is that WordPress has a lower market share than the numbers we’ve previously shared, which were based on [W3Techs dataset](https://w3techs.com/). The difference is due to many things, including choosing whether to count subdomains (W3Techs counts all subdomains of a domain as 1 site).

**As always, with data like this, you should watch the trend and its direction.**

This is the data we have for WordPress in this dataset:

  

 ### Measurement fixes

While rebuilding this report, I made several pull requests on the [HTTP Archive’s clone of the Wappalyzer](https://github.com/HTTPArchive/wappalyzer/) project to improve measurements and fix categorization.

For instance, the SEO plugins report shows that All in One SEO is incorrectly measured. It’s been consistently going down, and I know from other sources (including talking to Syed) that while it did go down for a while, it’s been going up again. It turns out that its measurement was broken, so I [made a pull request](https://github.com/HTTPArchive/wappalyzer/pull/35) to fix that.

Enjoy the new report, my first analysis post and let me know in the comments or on Twitter or elsewhere what you think!
