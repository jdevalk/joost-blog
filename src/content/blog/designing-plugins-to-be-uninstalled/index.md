---
title: Designing plugins to be uninstalled
publishDate: 2024-02-02T00:00:00.000Z
excerpt: >-
  I feel a particular class of plugins in the WordPress world should be more
  prominent. Plugins that help you do something, which you then delete when
  you’re done
categories:
  - WordPress
featureImage:
  src: ./images/Designing-plugins-to-be-uninstalled-1-jpg.webp
  alt: ''
---
I feel a particular class of plugins in the WordPress world should be more prominent. Plugins that help you do something, which you then delete when you’re done. There are a lot of these, and they’re super useful. I’d probably call them *utility plugins*.

Let me explain with an example: say you’ve been bitten by the Tags bug and have too many tags. (This is something I’ve been [publishing about on the Fewer Tags site](https://fewertags.com/research/)). You have too many tags; you need to do an audit, merge some of them, delete some, and you’re done. Fewer Tags Pro can help you do that. And then, because of how it’s designed, you can remove it! This is a superb thing for site owners because it means you don’t clutter your site. Not yet another plugin you have to update every other week, but it does help you perform your task faster.

## Designing for uninstallation

It’s not something plugin developers do often: designing their plugins to be uninstalled. In the case of Fewer Tags Pro, it was clear that this plugin needed to create redirects. But that doesn’t mean I want it to *do* redirects. That would mean building a redirect maintenance system and other annoying things they already have. I don’t want this plugin to add yet another one of those things. So, instead, it integrates with Yoast SEO Premium and Redirection. If you use either one, it will create the redirects in their redirect system. This means the plugin can be safely uninstalled.

*Aside: this did mean those plugins needed to have APIs that allow integration. To be fair, both could have been better in that case, but I managed.*

There are quite a few plugins like this, and we’ve probably all used some of them:

- Migration plugins like [All in one WP migration](https://wordpress.org/plugins/all-in-one-wp-migration/);
- The famous [regenerate thumbnails](https://wordpress.org/plugins/regenerate-thumbnails/) plugin,
- [Find my Blocks](https://wordpress.org/plugins/find-my-blocks/), awesome to find where you’re using blocks you’re trying to get rid of

But you know what’s funny? Two of the above plugins have more than a million installs. Why are these plugins staying installed on sites? Because we don’t have an active system saying: “Hey, this is a type of plugin that should maybe not be on your site for months.” Maybe we should change that. Maybe we should add a flag in the plugin header or the readme that means: “This plugin is meant to be used for a short period.” We could then warn a site owner if a plugin like that has been installed on their site for more than a month and urge them to uninstall it.

## Other metrics

We could give the developers of these plugins something in return if they set that flag! We could give them stats on the number of activations and de-activations they had on WordPress.org. They’d get this data instead of (or maybe next to) data on the number of active installations. That data is not normally available to plugin developers and would actually show these developers how often their plugin is being used.

What do you think? Good idea? Suggestions for improvements?
