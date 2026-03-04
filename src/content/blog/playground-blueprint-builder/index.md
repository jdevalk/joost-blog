---
title: Playground Blueprint Builder
publishDate: 2024-03-06T00:00:00.000Z
excerpt: >-
  I have been playing with the WordPress Playground a lot. As I did, I wanted a
  way to quickly make a copy of an existing site to a new Playground. It seems
  an id
categories:
  - WordPress
featureImage:
  src: ./images/playground-blueprint-builder-jpg.webp
  alt: ''
---
I have been playing with the [WordPress Playground](https://wordpress.org/playground/) a lot. As I did, I wanted a way to quickly make a copy of an existing site to a new Playground. It seems an ideal way to test new plugins, themes, and other things you’d want to change.

You do that by making a [Blueprint](https://wordpress.github.io/wordpress-playground/blueprints-api/index) with all the data for the site you want to mimic. So, I started working on a [Blueprint Builder](https://github.com/emilia-Capital/blueprint-builder). It’s far from done and shouldn’t be run on a live site yet. But it has all the concepts of something that could be very useful. It makes a blueprint of the current site’s plugins, themes, and options. It even makes a WXR URL available through the REST API to download a site’s content into your Playground.

If your site is relatively simple, it works (if I haven’t just broken it with my last commit). If you have a custom theme, it doesn’t play nicely yet, because it doesn’t download that (yet). It also ignores any plugins it doesn’t recognize from WordPress.org.

I told [Adam Zielinski](https://github.com/adamziel) about it (he created Playground). He asked me to open-source it, as it could perhaps be used within the project. [Similar ideas existed](https://github.com/WordPress/wordpress-playground/issues/539) there as well, which I think is exciting. So I did, and the code is now [available to all](https://github.com/emilia-Capital/blueprint-builder).
