---
title: Redirect-By HTTP headers
publishDate: 2025-03-13T00:00:00.000Z
excerpt: >-
  One of the things one runs into when you’re doing large migrations (between
  domains, or within a domain) is that you run into redirects that go “wrong”. A
  syste
categories:
  - Search Opinion
featureImage:
  src: ./images/redirect-by-http-header-fi-png.webp
  alt: ''
---
One of the things one runs into when you’re doing large migrations (between domains, or within a domain) is that you run into redirects that go “wrong”. A system somewhere is doing a redirect, and you don’t know which system you need to change that redirect in. A “Redirect-By” header helps you find out which system did the redirect.

## Origin story

I ran into this problem while doing the migration of the Guardian from guardian .co.uk to the theguardian .com. Multiple systems were doing redirects, making it hard to find the source. So, I came up with the X-Redirect-By header, this header was sent along with each redirect. This helped me identify which system was doing the redirect.

In 2017 I wrote [this blog post on Yoast.com](https://yoast.com/developer-blog/x-redirect-by-header/) to propose the `X-Redirect-By` header. We then implemented that, first in Yoast SEO, later on also in WordPress, and other systems like Typo3 followed suit.

![Screenshot of the blog post on yoast.com proposing the X-Redirect-By header.](./images/yoast-com-redirect-by-png.webp)    

## Usage of x-redirect-by

Currently, a [large portion of sites in the world](https://webtechsurvey.com/response-header/x-redirect-by) uses the X-Redirect-By header to indicate which system created a redirect. The [Wikipedia page about HTTP headers](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Common_non-standard_response_fields) lists it as a “Common non-standard response field”.

## Should we standardize redirect-by?

As I was preparing [my presentation](https://smxmuenchen.de/en/session/the-missing-seo-guide-to-domain-migrations-2/) for SMX Munich next week, where I’ll be presenting “The missing guide to SEO domain migrations”, I was discussing this with John Mueller. He kindly informed me that `x-` prefixed headers are [actually discouraged](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#:~:text=Custom%20proprietary%20headers,their%20status.). In fact, Google has been trying this for `x-robots-tag`, see [this IETF draft](https://datatracker.ietf.org/doc/html/draft-illyes-repext-00).

Which got me thinking: should we take the next step, and standardize this properly? I’ve been going over the existing standard HTTP headers, and while I think that you *could* use `Via` or `Server` headers for this same purpose, it’s not the same. A proposal for an official `Redirect-By` header would have the benefit of getting more people to notice it and probably implement it, which would potentially help *every* SEO and web developer. Lots of them have told me they have spent many hours finding the source of a redirect.

I’d love feedback on this. What do you think? Should we standardize this as `redirect-by`? Am I missing an obvious, already existing, standard header that could be used for this? Let me know in the comments!
