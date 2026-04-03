---
title: 'WordPress needs to refactor, not redecorate'
publishDate: 2026-04-03T00:00:00.000Z
excerpt: >-
  WordPress's deepest problems aren't cosmetic, they're architectural. The
  responses to EmDash from Matt Mullenweg, Hendrik Luehrsen, and Brian Coords
  crystallize what needs to change: the data model, content storage, and plugin
  permissions.
categories:
  - WordPress
  - Open Source
  - Development
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: WordPress needs to refactor, not redecorate'
draft: true
password: 'april3'
---
When Cloudflare launched [EmDash CMS](/emdash-cms/) two days ago, the reactions came fast — from Matt Mullenweg [himself](https://ma.tt/2026/04/emdash-feedback/), from [Hendrik Luehrsen](https://kraut.press/2026/emdash-cms-shows-gutenberg-limits/) at Kraut.press, and from [Brian Coords](https://www.briancoords.com/emdash-first-thoughts-and-takeaways-for-wordpress/) (who is btw an Automattic employee). Each piece approached EmDash differently, but together they crystallized something I've been thinking about for years: WordPress's deepest technical problems aren't at the surface. They're architectural. And the WordPress project keeps treating them as cosmetic.

A Cloudflare piece on [application modernization](https://www.cloudflare.com/the-net/modernize-applications/) offers a useful way to think about this. When organizations modernize legacy applications, they generally pick from three approaches: cosmetic changes (move to new infrastructure, change nothing underneath), targeted refactoring (rework the architecture in specific areas while preserving what works), or a full rewrite (start from scratch).

Most successful organizations mix and match, picking the right approach for each component based on risk and business value. The worst thing you can do is mistake cosmetic changes for real modernization.

WordPress, right now, is doing exactly that. And the responses to EmDash show why.

## The surface vs. the structure

Matt's [response](https://ma.tt/2026/04/emdash-feedback/) was generous in places. He acknowledged the engineering quality and called the Skills implementation "brilliant." But his architectural arguments were almost entirely defensive. He suggested EmDash should adopt Gutenberg. He framed EmDash's sandboxed plugin model as impractical. He questioned Cloudflare's business motives.

What he didn't do was engage with the structural critique. Not once.

That's telling, because the structural critique is what every other respondent picked up on. Hendrik's piece went straight to the heart of it: Gutenberg maintains a structured block tree while you're editing, then serializes it to HTML comments in `post_content` when it saves. Every system that needs that structure downstream (APIs, headless frontends, AI agents) has to parse it back out again. WordPress VIP built an entire Block Data API just to avoid this. The `parse_blocks()` function exists because the storage model doesn't preserve what the editor already knows.

That's not a content model. That's a workaround for the absence of one.

## The data model WordPress never fixed

The content storage issue goes deeper than Gutenberg. WordPress's fundamental data model dates back to its origins as a blogging platform. Every piece of content (posts, pages, products, courses, events) lives in `wp_posts`. Every piece of metadata lives in `wp_postmeta` as key-value pairs. This is essentially a schema-less design wearing a relational database as a costume.

In EmDash, each content type gets its own typed table. Custom fields become actual columns with proper types and indexes. This isn't exotic — it's how applications have stored data for decades. WordPress's approach made sense when the platform did one thing. It stopped making sense when plugins started turning WordPress into an application framework. And yet, twenty-plus years later, the schema remains essentially unchanged.

The [recent deferral of WordPress 7.0](https://make.wordpress.org/core/2026/03/31/extending-the-7-0-cycle/) illustrates the problem in real time. The release was delayed because the team needs to revisit how real-time collaboration data is stored — the initial approach of stuffing it into postmeta wasn't going to hold up. They're now considering a custom table. This is exactly the pattern: a new feature runs into the limits of the existing data model, and the team has to work around it or pause to rethink.

This is the kind of problem that cosmetic changes can never fix. You can put a React admin on top of `wp_posts` and `wp_postmeta`. You can add a block editor. You can ship full-site editing. The underlying data model doesn't care. It's still the same architecture, just rendered differently.

## The plugin trust problem

Matt argued that plugins having full access to WordPress is a feature, not a bug, and that sandboxing "breaks down as soon as you look at what most WordPress plugins do."

This is like arguing that because some mobile apps need camera access, every app should get root access to the phone. Yes, some plugins need broad capabilities. That's an argument for a granular permission system, not for continuing to give every plugin the keys to the entire database. Every modern platform (iOS, Android, browser extensions, cloud functions) moved to scoped permissions years ago. WordPress's full-trust model isn't a philosophical commitment to openness. It's a security debt that compounds with every plugin install.

## What the insiders see

Perhaps the most telling response came from Brian Coords, an Automattic employee. His observation: WordPress has had the PHP infrastructure for custom post types and fields since version 3.0 in 2010, but has never shipped a core UI for managing them. Sixteen years later, the community still depends on third-party plugins for something that should be a core capability.

Brian framed this as a prioritization problem, not an engineering one. He's right, and that makes it worse. It means WordPress *could* have built this and chose not to. He also identified what he called "decision fatigue": WordPress now offers so many layered approaches to the same problems (core blocks, patterns, block styles, theme.json, custom CSS, classic themes, block themes) that developers spend more time choosing *how* to build something than actually building it. For AI agents, which can't navigate that kind of ambiguity the way experienced developers have learned to, this is a hard wall.

## Refactor, don't redecorate

I didn't write about EmDash because I think WordPress should die. I spent fifteen years building Yoast SEO, and I still run [Post Status](https://poststatus.com/), a community for WordPress professionals. I care about this ecosystem. But caring about it means being honest about where it is.

WordPress doesn't need to become EmDash. A full refactor of the platform that runs over 40% of the web would be reckless. But it does need real refactoring: targeted, meaningful architectural changes that address the structural problems rather than just painting over them.

Three changes would transform WordPress without breaking it.

### Fix the data model

Replace `wp_posts` and `wp_postmeta` with proper typed tables per content type, while preserving the existing APIs. This sounds radical, but it's been done before, in the WordPress ecosystem itself. When we launched [Indexables in Yoast SEO](https://yoast.com/developer-blog/the-exciting-new-technology-that-is-indexables/) in 2020, we replaced a sprawling mess of postmeta queries with a single, properly typed table. All public-facing APIs stayed the same. The data model underneath changed completely. It was hard. But it can be done, and it's easier at the core level, since core controls the schema.

### Store content as structured data

Stop serializing blocks to HTML comments in `post_content`. Store them as JSON instead, or at minimum alongside the HTML. The block editor already maintains a structured tree while editing; the problem is that it throws that structure away on save. Keeping it as JSON means APIs, headless frontends, and AI agents can work with WordPress content natively, without reverse-engineering structure out of markup. This is what EmDash does with Portable Text, and it's the single biggest unlock for making WordPress content machine-readable.

### Scope plugin permissions

Move from a full-trust plugin model to a permission-scoped execution layer. Not every plugin needs access to everything. A contact form plugin doesn't need to read the users table. A caching plugin doesn't need to write to the posts table. Every other modern platform figured this out years ago. WordPress can too.

This is the biggest lift of the three. WordPress's entire plugin ecosystem was built on the assumption of full access, and retrofitting a permission model without breaking thousands of existing plugins is a genuinely hard problem. But hard isn't the same as impossible, and deferring it indefinitely isn't a strategy. It's just accumulating risk.

None of this is theoretical. The community has shown, repeatedly, that it can be done. At Yoast, we didn't just fix the data model with Indexables. Seven years ago, we built a [fully working, backwards-compatible autoloader](https://github.com/Yoast/wordpress-develop-mirror/tree/modernize) for WordPress core, modernizing how it loads PHP classes. In 2024, Ari Stathopoulos proposed an [even simpler approach](https://make.wordpress.org/core/2024/02/01/proposal-implement-a-php-autoloader-in-wordpress-core/) in a formal core proposal. Still not in core. The pattern is always the same: working code, proven approach, no action.

These aren't small changes, but they're not a ground-up rewrite either. They're the refactoring work that WordPress has been deferring for a decade.

The risk isn't that WordPress changes too much. The risk is that it keeps treating cosmetic changes (new editor, new admin, same foundation) as if they were modernization. The environment has changed. The way we build software has changed. WordPress's architecture needs to change with it, or the ecosystem that depends on it will look elsewhere.

And here's the thing: they already are. I wrote recently about how [the CMS market itself may not be growing anymore](/do-you-need-a-cms/). People don't want a CMS — they want a website, and the ways to get one have multiplied far beyond the traditional CMS category. The competitive pressure WordPress faces isn't just from other CMSes. It's from platforms that skip the concept entirely: Shopify, Substack, Squarespace, even AI-generated sites. The market is fragmenting, and consumer expectations are shifting toward simpler, more opinionated tools.

That makes the architectural stagnation doubly dangerous. WordPress isn't just falling behind technically while competitors in its own category innovate. It's falling behind while the category itself is shrinking. When a company the size of Cloudflare looks at the CMS landscape and decides to build a new one from scratch rather than build on top of WordPress, that's not a side project. That's a market signal. They saw an opening that WordPress's architectural stagnation created, and they walked right through it.
