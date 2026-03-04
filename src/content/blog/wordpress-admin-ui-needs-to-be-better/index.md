---
title: WordPress’ admin UI needs to be better
publishDate: 2023-01-25T00:00:00.000Z
excerpt: >-
  The WordPress’ admin UI needs to be drastically improved. It should be
  improved not just for WordPress core itself, but it should implement a simple
  and clearly
categories:
  - WordPress
  - Yoast
featureImage:
  src: ./images/yoast-seo-20.webp
  alt: ''
---
The WordPress’ admin UI needs to be drastically improved. It should be improved not just for WordPress core itself, but it should implement a simple and clearly defined open design system, so that plugins and themes can use it to build their own interfaces. Now that Yoast’s new Settings UI is out in the open for everyone, it’s also clear for everyone that we’ve deviated from what we used to do, which was to use the “standard” WordPress admin UI components. The reason for that is simple: WordPress’ admin components are old fashioned and haven’t progressed as they should. We simply can’t build a modern interface with them. It saddens me enormously though, that we’ve had to take this step.

The problem with us choosing our own path, is exactly that: we’re choosing our own path. *Every* plugin is choosing their own path. For every plugin, users have to learn new UI elements and experience a new UX. Instead of building upon a common UI library, where of course we might change some colors and use our own logos, but we’d all use the same buttons, input fields, etc.

## Every OS needs a design system

I think that if WordPress wants to be the Operating System of the web, as [has been claimed](https://techcrunch.com/2019/09/19/automattic-ceo-matt-mullenweg-about-raising-300-million-and-the-open-web/) by its project leader Matt Mullenweg, it should take a leaf out of the playbook of desktop OS’s. Microsoft has its [Fluent Design System](https://www.microsoft.com/design/fluent/), Apple has its [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/guidelines/overview/) and tons of [design resources](https://developer.apple.com/design/). Apple also hosts yearly, highly prestigious, [Design Awards](https://developer.apple.com/design/awards/) highlighting those who’ve innovated *on top of* their design system.

## WordPress needs a design system and it needs it fast

It’s not that I think the WordPress core designers aren’t aware of this, or maybe even agreeing with it. There are [issues](https://github.com/WordPress/gutenberg/issues/27484) that show that they want to move in the right direction. The last version of the [design experiments plugin](https://wordpress.org/plugins/design-experiments/) (which was a step in the right direction) was released more than 3 years ago. [This issue](https://github.com/WordPress/gutenberg/issues/33447), which has many of the needed components etc in it, is from July 2021, well over 1.5 years ago, and only about half way done. I think we really ought to speed up this design / development. Might be that there are simply not enough people working on this, or we aren’t prioritizing it right as a project.

The current state is simply bad: WordPress core basically has 3 designs now. The edit post page I’m typing this in looks *nothing* like the Posts overview page, which looks nothing like the Site Health page. And then you go into plugins and each has their own UI there too. This makes WordPress as a whole harder to use. This is how we lose CMS market share to companies like [Wix](https://www.wixdesignsystem.com/) and [Shopify](https://polaris.shopify.com/) (who each *do* have their own design system).

Now, of course, we’ve [open sourced our own UI library](https://ui-library.yoast.com/) at Yoast. Of course we’ve shared it with our colleagues at [Newfold Digital](https://newfold.com) and I’ll certainly push for us to use it more across the wider company. Other plugin developers and theme developers shouldn’t need to do all that work again and can use it, and hopefully, contribute back.

I wish this had not been needed, but here we are. Maybe this post can help rally a few more people to work on WordPress core design, Despite all that, I’m super proud of what the new settings UI in Yoast looks like, so go check that out!
