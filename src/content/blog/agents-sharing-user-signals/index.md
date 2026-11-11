---
title: OpenAI wants agents to tell websites <em>where you are</em>
seo:
  title: OpenAI's draft lets AI agents share your network with websites
  description: An OpenAI draft lets AI agents pass your network, country and time zone to websites. The agent's operator decides, not you. Here's what's wrong with it.
  pageType: article
publishDate: 2026-11-11T00:00:00.000Z
toc: true
excerpt: >-
  When an AI agent browses for you, websites see the agent, not you. Two OpenAI
  engineers want agents to share your network, country and time zone. The
  operator decides what gets shared. You don't.
categories:
  - AI
  - Development
---

When an AI agent or a cloud browser visits a website for you, the site sees the agent's IP address and user agent, not yours. Two engineers at OpenAI want to change that. Their Internet-Draft, [shared with the IETF's HTTP Working Group](https://lists.w3.org/Archives/Public/ietf-http-wg/2026OctDec/0179.html) today, lets an agent pass along your network, your country, a masked version of your IP address, your locale, your time zone and the browser or app you used.

The problem behind it is real. This draft is the wrong fix, and I've [sent that feedback to the mailing list](https://lists.w3.org/Archives/Public/ietf-http-wg/2026OctDec/0180.html). Here's the longer version.

## Six new parameters

The draft is called `draft-panero-httpbis-forwarded-user-signals`. It adds six optional parameters to the existing `Forwarded` header: `asn`, `ip-country`, `ip-prefix`, `locale`, `tz` and `user-agent`. A request from an agent could then carry something like this:

```http
Forwarded: asn=64496;ip-prefix="192.0.2.0/24";user-agent="Example/1"
```

To be fair to the authors: the draft bans persistent user and device IDs, tells senders to share as little as possible, and says plainly that a masked IP address is not anonymous. It's also an individual draft. It hasn't been formally submitted yet, and no working group has adopted it.

## Less than a browser, more than today

A normal browser visit gives a site your full IP address, your full user agent, your language and, through JavaScript, your time zone. This draft shares less than that.

But that's not the right comparison. Today, when an agent browses for you, the site learns almost nothing about you. That's a side effect, not a feature anyone designed, but it is a privacy gain. This draft hands part of it back.

## Not getting blocked

The draft says the signals are for "fraud detection and risk assessment". I read that differently. Sites block or challenge agent traffic, because thousands of users arrive from the same few data centre addresses. These signals make an agent's request look like a normal visitor again.

That's a legitimate problem for anyone running an agent, and for you when your agent hits a wall of CAPTCHAs. But the draft should say so, because it changes who benefits. The company running the agent gains the most from sharing your data, and that same company decides what gets shared. You're not asked. The site can't ask either: there's no way for it to request specific signals or say why it needs them. [Client Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints) solved that years ago, with a header in which the server lists what it wants.

## Unsigned means worthless

Anyone can send these parameters. The draft knows this. It tells sites not to treat a signal as authenticated unless they've verified a signature that covers it. But it also says, in so many words, that sending the signals doesn't require signing. If a clean residential network in the header gets you past a block, every fraudster will send one.

Signals meant for fraud detection only work when the site can check who vouches for them. [Web Bot Auth](https://specification.website/spec/agent-readiness/web-bot-auth/) exists for exactly that. Signing shouldn't be optional. The draft should require a signature, and tell sites to ignore any signals that arrive without one.

## The GDPR question

I'm not a lawyer, but this is how I read it. Your network, a masked IP prefix, your time zone, your locale and your browser together are personal data. The operator of the agent becomes the party that decides to disclose it to a third party, mostly for its own benefit and the site's.

Time zone, locale and user agent are also read from your device, which brings in the ePrivacy rules. That's fine when you want a site to show times in your time zone. It's much harder to defend when the purpose is risk scoring.

The signals also leak each other. A time zone of `Europe/Amsterdam` with a locale of `nl-NL` tells a site which country you're in, even when the agent holds back the country.

## Two already have a home

An agent sets its own request headers, so it can already send your language in `Accept-Language`. For time zones there's the [`Prefer` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Prefer). [MDN's own example](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Prefer#custom_preference) of a custom preference is `Prefer: timezone=America/Los_Angeles`, and the server can confirm it used it with `Preference-Applied`.

The draft says `locale` is something else than language: it's for formatting dates and numbers. But a language tag like `en-NL` already says "English, formatted the Dutch way", and it fits in `Accept-Language` today. What's left is a description of how your device is set up, and that's a fingerprint, not a preference.

`Forwarded` is the wrong place for any of this. It describes the hops in a proxy chain. An agent doesn't forward your request, it makes its own.

## Who gets the cached copy?

Say someone in New York asks an agent a question, and an hour later you ask the same one. There's a good chance the agent fetches the page only once. Operators cache, because fetching every page again for every user is slow and expensive. The draft doesn't mention caching at all.

That first fetch carried the New Yorker's signals. You get the copy made for New York, and the site never sees you. A site that wants to prevent that has to tell caches with a `Vary` header. But `Vary` works on whole headers, so the site would have to send `Vary: Forwarded`. That header also holds the IP prefix, the network and the user agent, so almost every request becomes unique and caching agent traffic stops working. Client Hints solved this too: each hint is its own header, so the server can name exactly the ones it uses.

You could answer that caching doesn't matter here. Fraud checks happen when you log in, pay or place an order, and those requests are never cached. I agree, and it proves the point. The network signals have no business on ordinary page fetches. They only make sense on a handful of requests that each belong to exactly one user.

## Split it, and ask first

There are two drafts hiding in this one. The first registers a time zone preference for `Prefer`, and maybe tells agents to pass on your language in `Accept-Language`. That's small, useful and hard to object to.

The second covers the network signals, and I'm not sure it should exist at all. If it does, it should be much narrower than this. It should only apply to the requests where a site has a real fraud question: logging in, paying, placing an order. It needs signatures and a hard limit on how precise the IP prefix can be.

It also needs a way for the site to ask, and [Client Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Client_hints) is the obvious model. The site asks for the signals on its login or checkout page, and only then does the agent send them, on the request that follows. Sites that never ask never get them. One thing would have to change: with Client Hints today, a site opts in for its entire origin, not for specific URLs. For this, the request should be limited to the pages that need it.

Above all, it needs you. When the site asks, the agent can stop and ask you in turn: "This shop wants to know which country you're in before it takes your payment. Share it?" That's an explicit opt-in, per site, at the moment it matters. The draft leaves the decision to the operator's policy instead.

Agents are going to make up a big share of web traffic. What they tell sites about us shouldn't be up to the company that built the agent alone.
