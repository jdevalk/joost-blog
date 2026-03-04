---
title: Can I safely use AVIF or WebP share images?
publishDate: 2024-12-04T00:00:00.000Z
excerpt: >-
  AVIF and WebP are efficient image storage formats. They are smaller than their
  predecessors, PNG, JPG, and GIF. This leads to smaller images, which means
  faster
categories:
  - Development
featureImage:
  src: ./images/avif-failed-scaled.webp
  alt: ''
---
AVIF and WebP are efficient image storage formats. They are smaller than their predecessors, PNG, JPG, and GIF. This leads to smaller images, which means faster page loads, which is what we all want. So, you should use them everywhere. Ideally, we’d also be able to use these image formats for our OpenGraph image tags (`og:image`) and Twitter image tags (`twitter:image`).

In fact, some platforms, like WhatsApp, limit the size of a share image, so smaller would be *much* better.

**Update December 2024**  
LinkedIn now supports WebP, making all the major platforms support it. I’ve also added Bluesky, it too supports WebP.

## TL;DR

You should use both AVIF and WebP on your website. They’re smaller, they’re better. All browsers support them. As of December 2024, you *can* use WebP share images, but you *can not* use AVIF on social platforms yet. We still have to get quite a few more platforms to support AVIF before it’s safe to use them as share images. However, changed from June 2024, you *can* now safely use WebP everywhere.

## Table of contents

- [Test results](#h-test-results)
- [Methodology: how I tested AVIF and WebP](#h-methodology-how-i-tested-avif-and-webp)
- [How to use AVIF and WebP on your WordPress site](#h-how-to-use-avif-and-webp-on-your-wordpress-site)
    - [Modern images in the <head>](#h-modern-images-in-the-lt-head)

## Test results

I’ve run a quick test across the platforms below, and as you can see, we still have to get multiple platforms to support AVIF:

PlatformAVIFWebPBluesky❌️✅️Discord❌️✅️Facebook✅️✅️iMessage❌️✅️Pinterest✅️✅️LinkedIn❌️✅️Mastodon❌️✅️Slack❌️✅️Threads✅️✅️Twitter / X❌️✅️WhatsApp✅️✅️## Methodology: how I tested AVIF and WebP

I’ve used these two test URLs:

- </research/images/avif-test.html>
- </research/images/webp-test.html>

With these URLs, I checked whether the platform would load the AVIF / WebP `og:image`, or show the fallback.

Below are some examples of what that looks like:

![AVIF (negative) and WebP (positive) test results on LinkedIn.](./images/linkedin-avif-webp-test-png.avif)    ![AVIF (positive) and WebP (positive) test results on WhatsApp.](./images/whatsapp-avif-webp-test-791x1200.avif)    ![AVIF (negative) and WebP (positive) test results on Discord.](./images/discord-avif-webp-test-png.avif)    ![WebP (positive) and AVIF (negative) test results on Slack.](./images/slack-avif-webp-test-1-png.avif)![AVIF (negative) and WebP (positive) test results on iMessage.](./images/imessage-avif-webp-test-png.avif)![AVIF (negative) and WebP (positive) test results on Bluesky.](./images/bluesky-avif-webp-test-845x1200.avif)## How to use AVIF and WebP on your WordPress site

To use these modern image formats on your site you can install the [Modern Image Formats plugin](https://wordpress.org/plugins/webp-uploads/). This plugin has been built and is maintained by the WordPress Performance team, which includes some of the very best performance engineers on the web.

When you install this plugin, go into its settings, and set them like this if you want to make sure your images are always recognized by social platforms:

![](./images/modern-image-formats-setting-webp-1600x596.avif)### Modern images in the <head>

Alternatively, if you set this to AVIF, you have to make sure that the output in the `<head>` section of your site always uses the “classic” format, usually PNG or JPG. The Modern Image Formats plugin actually already tries to do this by default, but it unfortunately fails to do that when using Yoast SEO.

The following tiny plugin makes sure that your `og:image` and `twitter:image` tags *do* output GIF, PNG or JPG files:

```php
<?php
/*
Plugin Name: Fix modern image formats for social
Plugin URI: /use-avif-webp-share-images/
Description: Replaces og:image and twitter:image URLs in Yoast SEO output ending in .webp or .avif with the original in the page output, so they work.
Author: Joost de Valk
Version: 1.0
*/

function joost_filter_modern_social_image_url( $image_url ) {
    return preg_replace( '/^(.*)-(gif|jpeg|jpg|png)\.(avif|webp)$/i', '$1.$2', $image_url );
}
add_filter( 'wpseo_twitter_image', 'joost_filter_modern_social_image_url' );
add_filter( 'wpseo_opengraph_image', 'joost_filter_modern_social_image_url' );
```

This small plugin also replaces `WebP` files, just to make sure it works everywhere.
