---
title: 'Social & Schema images: naming considerations'
publishDate: 2022-07-06T00:00:00.000Z
excerpt: >-
  I’ve been playing a lot with Schema and Social images recently and one thing
  has become clear: we need better naming of these images and we should probably
  impr
categories:
  - Search Opinion
featureImage:
  src: ./images/alice-donovan-rouse-yu68fUQDvOI-unsplash-scaled.webp
  alt: ''
---
I’ve been playing a lot with Schema and Social images recently and one thing has become clear: we need better naming of these images and we should probably improve the Schema.org image standards a bit. In this post I want to briefly discuss the different needs and my proposed (very simple) naming scheme.

As I was looking at [how different social platforms supported WebP](/use-avif-webp-share-images/), I quickly realized that while they’re all using images, they’re using them in very different ways. Shocking, I know.

The problem is that in Schema, we just have one `image` attribute on articles. Well, technically, we also have `thumbnailUrl`, but that’s not even close to descriptive enough.

Let’s go through the two main types of images:

## Poster images

An “OpenGraph image” these days is often the main image of the post with text on it. The title of the post, maybe an author, a site’s name and/or logo. It’s similar to a poster you would create for a movie or a performance in say a theater. So, why not call it that: a “poster image” or short “poster”. There’s precedent of that in HTML actually, where the `video` HTML tag has a `poster` attribute that should be shown until the video has loaded.

Platforms like Facebook, Twitter and LinkedIn use these images when an article is shared on their timeline. Making these images be effective posters is *very* important to your click-through rate from these platforms.

## Featured images

The main image of an article is called the “featured image” in WordPress and many other systems. For some platforms, like Google Discover, this image is *much* more suitable. Note that it doesn’t mean that these are all similar; this can be a good news image, a beautiful image of a travel destination or a great illustration. Important is that there’s no text on it, or at least, the text is not a main feature of the image.

If a platform is going to put text *over* the image or prominently display the title in its vicinity, it’s important that it grabs the featured image, *not* the poster image.

For example, compare this post’s featured image and post image:

![Image showing torn promotional flyers](./images/alice-donovan-rouse-yu68fUQDvOI-unsplash-1600x1068.jpg)This post’s featured image

![](./images/joost.blog-social-schema-images-1.jpg)This posts’s poster image

## So what’s the problem?

Facebook, LinkedIn and Twitter all read OpenGraph metadata. So we can feed them a poster image in the `meta og:image` tag. Discover reads Schema, so we feed it an image in the `Article` schema, and we just feed it the regular featured image (behavior we changed recently in Yoast SEO, coming to you soon).

Pinterest historically read both. My thinking is that for Pinterest’s needs, it’d be much better to have the featured image.

But… I would like *all* social networks to start reading Schema at some point. I think we all want that, because the amount of metadata in a page right now just to say “hey use this image” is bordering on the ridiculous (and don’t even get me started about the platform’s ridiculous behavior around image sizes).

## The solution

To be able to have both poster and featured images in Schema and let platforms pick the right one, we need more specificity in what type of image is what. My suggestion is to introduce an attribute `poster-image` and an attribute `featured-image` on the `Article` Schema, that would both take an `ImageObject`. This would resolve the ambiguity and make it possible for every platform to fully rely on Schema. In an even more perfect world, we could even add an array of `ImageObject`s in both, with different sizes for the different platforms.
