---
title: WordPress’ market share is shrinking
publishDate: 2022-05-11T00:00:00.000Z
excerpt: >-
  There’s no more denying it: if you look at W3Techs CMS market share numbers,
  WordPress’ market share is shrinking, losing 0.4% market share since February.
  I do
categories:
  - Market Share Analysis
  - WordPress
featureImage:
  src: ./images/nrd-D6Tu_L3chLE-unsplash-scaled.webp
  alt: ''
---
There’s no more denying it: if you look at [W3Techs](https://w3techs.com/technologies/history_overview/content_management/all) CMS market share numbers, WordPress’ market share is *shrinking*, losing 0.4% market share since February. I don’t like to be or sound alarmist, so when I first noticed these numbers, I waited a bit to write about it. Shopify, the #2 CMS in my last [CMS market share](/cms-market-share/) report, is also shrinking a bit, though they’ve only lost a single percentage point so far.

If WordPress is shrinking, something else *must* be growing, this is, after all, a zero sum game. The very clear winners at the moment are Wix and Squarespace. Some other notable growers are Adobe, which is more on the enterprise side, and Webflow. Note that Elementor, which [I called out](/elementor-wordpress-secret-growth-driver/) recently as being a major growth driver for WordPress, still [seems to be growing](https://w3techs.com/technologies/details/cm-elementor). So WordPress is shrinking *despite* Elementor doing well.

WooCommerce, on the other hand, seems to be [losing](https://w3techs.com/technologies/details/cm-woocommerce) some market share too.

## WordPress market share over the last months

Let’s look at the raw numbers. Mind you, as long as I’ve been looking at this data, WordPress’ market share has *always* gone up.

MonthMarket shareJan 202243.2%Feb 202243.3%Mar 202243.3%Apr 202243.0%May 202243.0%11 May 202242.9%## Are we comparing apples to apples?

We know that Alexa recently shut down, and W3Techs has always used Alexa to base their top 10 million sites on. I checked with W3Techs [last week](https://x.com/jdevalk/status/1521748709696061446) and their response was clear: the API is still functional and they’re still using that, so the market share data hasn’t changed from that perspective.

## Are these the right numbers to look at?

So, I don’t think this is the best representation of “the web” that can be made. I’m hoping to work with the people at the [HTTP archive](https://httparchive.org/) to make an auto updating version of my CMS market share numbers. I’ve [run the numbers](https://console.cloud.google.com/bigquery?sq=992808990454:93ea02e6e2e14f578e2bd24ad4d263d3) manually today on the HTTP archive dataset and in the last full HTTP archive crawl, which was for April, WordPress’ market share was also shown to be shrinking compared to March. So we’ve verified the shrinkage in two different sources. Both sources however are based on the most popular sites, so whether *new* sites are being built on Wix, SquareSpace or WordPress? We simply don’t know.

## What’s to blame for this?

It’s honestly impossible to look at these numbers and not think “what’s happening here, why is that?”. After looking at it for a while, I’m coming to this conclusion:

- If you look at [cwvtech.report](http://cwvtech.report/) you’ll see that in the last year, sites on Wix and Squarespace on average have improved their site speed more than WordPress sites. WordPress has a performance team now, and it has made some progress. But the reality is that it hasn’t really made big strides yet, and in my opinion, really should. Project leadership still seems unwilling to focus on performance though, which has to do with the next point:
- WordPress’ full site editing project is not done yet. Anecdotally, more and more people are having a hard time deciding how to build their site on WordPress. Wix and Squarespace are simply way simpler tools to build a site. As they improve their SEO tooling, there’s less and less reason to switch over to WordPress.

## WordPress is being out-“innovated”

Conclusion: I think WordPress, for the first time in a decade, is being out-“innovated”. Now I say “innovated” because Squarespace and Wix are not really doing anything that new. They’re just implementing best practices for both site speed and SEO. They are, however, rolling that out for all their users. So all of their users get better and better page speed performance and improved SEO. As a result more and more of their sites are doing well. This means the set of sites that W3Techs is measuring, changes. And thus the top 10 million sites in the world will have more Squarespace and Wix sites. Those sites are *actually* doing better than their WordPress competitors.

This isn’t just on the WordPress core team. WordPress hosts all over the world should be working harder to make their clients’ sites perform better too. In fact, most of them should invest in WordPress more given how much money they make from it. If they don’t, they might see their free ride go up in smoke as the hosted services win.

You see: it’s not that you can’t do this with WordPress. It’s very possible to make super fast sites on WordPress, that perform incredibly well SEO wise. The problem is that *in aggregate*, WordPress sites aren’t doing as well. Too much of what a website needs to do to do well, is left to the people building and running sites. People who don’t know what they don’t know. WordPress, which has “decisions, not options” as one of its [philosophies](https://wordpress.org/about/philosophy/), is not even close to opinionated enough when it comes to performance and SEO.

## How to fix WordPress’ market share?

If WordPress wants to maintain its market share or better yet, grow it, it’ll have to get its act together. That means it should focus on the performance of these sites across the spectrums of site speed and SEO. The Full Site Editing project is simply taking far too long. That’s causing the rest of the platform to lag behind current web trends. Without a drastic change in this approach I think WordPress will continue to lose market share for the next few years.

PS

This is not what I’d like to be seeing, of course. If you have data that proves me wrong I’d honestly love to see it.
