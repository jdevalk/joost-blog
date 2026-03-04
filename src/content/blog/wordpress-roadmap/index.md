---
title: 'WordPress, and what should be on its roadmap'
publishDate: 2024-12-12T00:00:00.000Z
excerpt: >-
  I was reading Hendrik Luehrsen’s excellent post “WordPress isn’t WordPress
  anymore“, and I decided I had to write more about this. I recently spoke at
  WordCamp
categories:
  - Market Share Analysis
  - WordPress
featureImage:
  src: ./images/roadmap-1-scaled.webp
  alt: ''
---
I was reading Hendrik Luehrsen’s excellent post “[WordPress isn’t WordPress anymore](https://kraut.press/2024/wordpress-isnt-wordpress-anymore/)“, and I decided I had to write more about this. I recently spoke at WordCamp NL about “The missing features of WordPress”, and these two things “touch”, in an important way. I love WordPress. I love WordPress plugins. I don’t love some of the recent developments in WordPress and that’s not *just* talking about the recent Automattic – WP Engine drama.

When I started writing this, there had been no decision on the injunction yet. Now there is, and as a community we have to figure out how we deal with all this. I don’t think we can separate that entirely from looking at what we all want from (and for) WordPress. Good discussions about where WordPress should be headed have been lacking from the community for a while.

So: let me share my thoughts, first by looking at WordPress’s market share and the trends in the wider market, then by discussing what WordPress is, or should be.

## Looking at WordPress’s market share

If we look at WordPress’s market share, we have to admit that it’s stable at best. WordPress, which has been growing for the longest time since it was created, is now stagnant. The current market share (as of November 2024) is slightly below what we started the year at:

  

 This means there’s also hardly any growth since early 2023, which should be (and probably *is* to everyone who’s aware) concerning to everyone in the WordPress industry.

To make things worse, *all* other open source, self-hosted technologies are losing:

  

 If you’re now thinking “but then other projects must be winning”, you’re 100% right: SaaS tools are winning. Just look at the numbers:

  

 I’ll give my sharper analysis: if WordPress hadn’t had [Elementor](/cms/elementor/), it would have shrunk ([something I’ve been saying for a while](/elementor-wordpress-secret-growth-driver/)). This is definitely *also* true, though with less big of an impact, for [WooCommerce](/cms/woocommerce/), the other driver for WordPress growth. Which shows that it’s not that people don’t want Open Source. Let me show this with a graph too:

  

 So, it’s not that people dislike or don’t want Open Source. I honestly think people don’t care that much about this *at all*. I think we have other problems. Let’s dive deeper.

## Why is this happening?

The question we have to ask ourselves of course is: why is this happening? What are people and companies looking for that WordPress is not providing? I think there are several important factors to discuss around this. Many of the arguments that people use against WordPress, we are very often quick to dismiss: WordPress is old, not modern. WordPress is insecure. WordPress is slow. There are certainly more pain points, but let’s try to cover these for now.

### WordPress is slow & technically stagnant

WordPress is often ridiculed by developers in the wider web ecosystem. It’s considered backward, slow and bloated. And the truth is harsh but simple: this is *true*. We have failed to modernize large parts of our codebase over the last decade, especially on the PHP side. Many projects [and](https://make.wordpress.org/core/2016/05/03/proposal-next-generation-rewrites/) [potential](https://make.wordpress.org/core/2024/02/01/proposal-implement-a-php-autoloader-in-wordpress-core/) [improvements](https://make.wordpress.org/core/2019/08/05/feature-project-proposal-wp-notify/) have been discussed, but we focused instead on building features (like the duotone filters Hendrik mentioned). Fantastic work has been done to keep WordPress working with modern versions of PHP, but we’ve failed to truly deal with our technical debt and with that also failed to make WordPress that much faster.

On the JavaScript side, we’re doing the opposite: we’re churning through code harder than we should. The speed of development is outpacing what even some of the best developers can follow if they’re not on the project full time. We bring new JavaScript APIs very often, developing [our own](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/) instead of integrating [existing projects](https://alpinejs.dev/).

WordPress is also at the absolute forefront of some of the web’s development though. The Performance team includes some of the world’s very best frontend performance engineers, who jointly made WordPress [much, much faster over the last few years](https://lookerstudio.google.com/u/0/reporting/55bc8fad-44c2-4280-aa0b-5f3f0cd3d2be/page/M6ZPC). The problem is: our competitors are doing the same. Shopify improved more than we did. Part of the problem here is that we’re simply not merging the fantastic work the Performance team is doing into WordPress core fast enough.

### WordPress is insecure

WordPress is very often dubbed insecure by its competitors. The standard response to this is “WordPress core has hardly had any security issues the last few years”. We have to be honest here: WordPress is often considered insecure because it gets hacked a lot. It doesn’t get hacked through WordPress core, it gets hacked through plugins most of the time. But we don’t have the luxury of saying that those plugins are not WordPress. They *very much* are. Plugins are, as Hendrik so poignantly discussed in his post too, the reason for WordPress’s popularity, this easy extensibility is also its challenge. You can’t look away from their shortcomings yet benefit from what they do.

Recently PatchStack (disclosure: we’re an investor as [Emilia Capital](https://emilia.capital/) and I’m on their board) held a special event in their Bug Bounty program for Cyber Security Month and they [closed 1,000 plugins](https://patchstack.com/articles/nearly-1000-plugins-closed-during-wordpress-security-cleanup/) on WordPress.org as a result. Now that is a herculean effort, but it also leaves everyone wondering: what would happen if we looked at *all* plugins a bit more deeply?

It also makes you wonder: why can’t we see in our WordPress admins that those plugins are closed on WordPress.org? Why is WordPress, the software, not telling us that plugins we’re using that we installed from WordPress.org, have been closed for security reasons? [The ticket requesting this](https://core.trac.wordpress.org/ticket/30465) is now officially over a decade old.

A step further would even be to say: this set of plugins hasn’t been updated in the last year. The [plugin directory](https://wordpress.org/plugins/) talks about 59,000 plugins. The [XML sitemap for the plugin directory](https://wordpress.org/plugins/sitemap-index-1.xml) tells me that only 14,648 of them have been updated in the last year or so.

### WordPress is too hard to use

The last, most painful argument that I want to cover is that WordPress is too hard to use. Currently, WordPress forces users to learn several different admin UIs, with different design languages. WordPress has for years tried to get people to use the Block Editor and more recently the Full Site Editor, and the harsh truth is that the editor that has grown the most in that time is a third: Elementor. See for yourself:

  

 Note that the Block Editor was released December 6th, 2018, now 6 years ago, but wasn’t tracked in this data until earlier this year, and that the drop in Elementor’s growth is the result of a measurement change.

One of the best additions to WordPress’s marketing recently has been the flurry of activity on the WordPress Youtube channel mostly by Jamie Marsland. I have to admit to have been utterly dismayed when I saw [Matt Mullenweg battle Jessica Lyschik recently](https://www.youtube.com/watch?v=EqY5bje8D2o), because it showed so clearly what many people have been saying for a while now: the block editor is too hard to use. Matt resorted to use AI to help him create patterns but that didn’t help him all that much. If Matt, who leads this project and *should* be pretty well versed in it, can’t figure this stuff out faster, shouldn’t we take that as a sign?

### So what to do?

Instead of dismissing this feedback, we should take it head on. If the WordPress performance team has shown us one thing, it’s that we *can* improve. Now, we must. But to do that, we must solve our existential crisis first:

## What *is* WordPress?

Hendrik in his post, underneath a heading asking “[Who is WordPress for](https://kraut.press/2024/wordpress-isnt-wordpress-anymore/#bigger-picture)” says this:

> Historically, WordPress didn’t try to be everything for everyone. Its lean core and robust ecosystem allowed it to meet a wide range of needs without dictating how it should be used. Developers could tailor it to clients. Hobbyists could start small and scale up. Agencies could rely on its flexibility to create bespoke solutions. WordPress provided the tools, but the user always defined the experience.

The “user” over the years have ranged from individuals, small & large businesses up to large enterprises. The power of WordPress is exactly that: it is what you want (and dare to dream) it to be. The problem is that the last few years, new features that went into core didn’t always seem to fit that “lean core” idea.

Of course there are features the enterprise would want, like personalization, logging, A/B testing, etc. There are features that not just enterprise but more sites would like to see, like multilingual support, custom fields, better admin UIs and many, many things. Most of those things do *not* need to be in core. Plugins have *always* been a source of innovation and they should continue to be just that.

WordPress core needs to provide the underlying APIs that allow for extension and force some regularity in how we do these things. I was a big proponent of the REST API when it was developed. In the same way, I’m now a big proponent of merging the fantastic work Felix has done on the [AI services plugin](https://wordpress.org/plugins/ai-services/) into core, or at least make that a canonical plugin. I think multilingual support should definitely be built into core, at the very least the underlying APIs.

We also need a new admin UI and a design language that we force on plugins (and themes) a bit harder. Plugins simply should not have (to develop) their own admin UI, a [point I’ve been stressing for years](/wordpress-admin-ui-needs-to-be-better/). More broadly speaking, we need to work on UX *everywhere* and make more logical decisions. For example: “Edit site” does not need to be a button in my admin bar. Nobody edits their site’s templates every day, and nor should they.

I’d love to have more of these thoughtful conversations, where we all openly and freely discuss where WordPress should go. So: let’s see your blog posts, outlining *your* wishes for the project!

**Update Dec 20th: I followed up this post with another one with [a vision for a new WordPress era](/wordpress-leadership/).**
