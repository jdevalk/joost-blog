---
title: 'FAQ schema <em>died twice</em>. The fix is FAQSection.'
seo:
  description: Google killed FAQ rich results on May 7, 2026. The lesson isn't that schema is dead. It's that GEO is starting the same cycle in AI search.
publishDate: 2026-05-11T00:00:00.000Z
excerpt: >-
  Google killed FAQ rich results entirely on May 7, 2026. FAQ schema spam killed
  it once in 2023, and finished it off this month. The "FAQ schema is critical
  for GEO" advice now flooding LinkedIn is starting the same cycle in AI search.
categories:
  - SEO
toc: true
---

*Google killed FAQ rich results entirely on May 7, 2026. FAQ schema spam killed it once in 2023, and finished it off this month. The "FAQ schema is critical for GEO" advice now flooding LinkedIn is starting the same cycle in AI search.*

Google [stopped showing FAQ rich results](https://searchengineland.com/google-to-no-longer-support-faq-rich-results-476957) in search. The deprecation banner on the [developer documentation](https://developers.google.com/search/docs/appearance/structured-data/faqpage) now reads:

> As of May 7, 2026, FAQ rich results are no longer appearing in Google Search. We will be dropping the FAQ search appearance, rich result report, and support in the Rich results test in June 2026.

Notice what isn't in that note: any guidance to remove the markup. Google's [2023 post](https://developers.google.com/search/blog/2023/08/howto-faq-changes), which first cut FAQ rich results back to government and health sites, was explicit: *"there's no need to proactively remove it."* The 2026 banner repeats that silence. The interesting question isn't what Google said. It's *why* this happened, *now*, and what we should learn from it.

## Why FAQ schema kept dying

Lily Ray helped popularize FAQ schema with an [influential 2019 Moz article](https://moz.com/blog/new-schema-types-to-create-interactive-rich-results). She [pointed out something sharp](https://www.linkedin.com/posts/lily-ray-44755615_interesting-timing-google-is-dropping-rich-activity-7458552788135092224-nuZd) about the timing of this deprecation. Back then she included a section in her piece called "Risks involved with implementing Schema," warning that misuse could cost the whole industry the rich result. Years later, that's exactly what happened. Her phrasing for it is the line I keep coming back to: *anything that can be spammed in SEO, will be spammed.*

That isn't cynicism. It's the operating principle of the field. I [wrote about this in March](/ai-optimization-is-replaying-early-seo-just-faster/): when distribution is cheap and ranking signals are gameable, people will scale exploitation before they scale usefulness. FAQ schema fit that pattern perfectly. It was easy to add and it produced a visible reward in the SERP. Almost nobody checked whether the questions on the page were actually questions the page was about. Product pages got fake FAQs at the bottom. Essays got fake FAQs at the bottom. Service pages got fake FAQs at the bottom. The format was abused into uselessness, and then it was abused into oblivion.

I'm not innocent, but I wasn't silent either. When `FAQPage` was introduced in 2019, [Jono Alderson](https://www.jonoalderson.com/) and I heavily objected to the `mainEntity` design, for exactly the reason this post is about. The schema implementation Jono and I built for Yoast SEO still runs on millions of WordPress sites, and a lot of those sites went on to add FAQ schema in two clicks without thinking about whether the markup was accurate. Yoast was part of how SEO got democratized, and democratization made over-optimization easy. I've [written about that](/unintended-consequences-seo-for-everyone/) too. That's not a defect in the tool, it's a defect in the incentive landscape the tool sits in.

## What's actually happening in 2026

Lily's half-joking theory about the timing is that there's now a flood of "FAQ schema is critical for GEO" content out there, much of it claiming that LLMs and AI search engines specifically favor FAQPage markup. Hundreds of thousands of articles, by her count. Whether that *caused* Google to act now or just coincided with it, the underlying pattern is exactly what I was describing in the AI-optimization piece. The GEO industry is replaying early SEO, just faster. And the FAQ schema deprecation is the first concrete proof point that the cycle is back on.

Here's where the claim deserves scrutiny: there is no primary source from OpenAI, Anthropic, Google AI Overviews, or Perplexity confirming that they specifically favor JSON-LD over rendered HTML. SEO blogs are asserting it freely, sometimes with confidently specific multipliers. [Frase](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo), a content-optimization tool, claims that *"pages appearing in Google AI Overviews are 3.2x more likely to have FAQ schema implemented,"* citing a Search Engine Land article at a URL that returns a 404. The absence of primary sources isn't an oversight. It's the spam pattern starting again: an unverified claim becomes industry consensus, mass adoption follows, and then someone takes the lever away.

## Content and markup are different things

A lot of the noise around this announcement comes from treating two different things as one:

1. **FAQ content.** Question-and-answer formatting is a perfectly good way to organize information for human readers. It's scannable, it matches how people search, it's easy to write well. None of this changes.
2. **FAQPage schema.** The JSON-LD format for marking up publisher-authored Q&A. The rich result is gone on Google. Bing still uses it. The markup itself isn't deprecated, just unrewarded by the largest consumer.

Killing one of them doesn't kill the other.

## What to actually do

Strip the panic out and there are three sensible moves:

1. **Keep your FAQ content** where it serves readers. Q&A is a useful format. Don't rip it out because Google stopped giving you stars in the SERP.
2. **Mark it up with semantic HTML.** Headings, paragraphs, `<details>` and `<summary>` if it's collapsible. That's HTML's job. Schema is a separate question.
3. **Remove FAQPage schema from pages where the FAQ isn't the point.** A 2,000-word essay with three FAQs at the bottom should never have had `FAQPage` on it, and the `mainEntity` claim that the Q&A is what the page *is about* was never true. Strip it. Where the page genuinely is an FAQ, keep the markup. Bing still rewards it, and Google itself isn't asking you to remove it. If any AI consumer ever does start favoring structured data, you want to be the one whose markup is accurate.

The unifying rule: stop letting Google's reward signals dictate your data hygiene. Schema is a description of what your page is. If the description is accurate, keep it. If it isn't, the rich result was the only reason to keep it, and that's gone.

## Schema.org needs `FAQSection`

Step back from individual sites for a moment, because there's a deeper problem. Schema.org has `FAQPage` for pages whose primary purpose is Q&A. It has nothing for the much more common case: a page that's about a product, an article, or a service, with an FAQ section attached. Publishers who wanted to mark up that section had two choices: declare `FAQPage` with `mainEntity` pointing at the questions (a misrepresentation of what the page is), or skip the markup entirely. Most chose the misrepresentation. That's a lot of why we're here.

The fix is a new type. I've [filed a proposal](https://github.com/schemaorg/schemaorg/issues/4816) for **`FAQSection`** as a subtype of `WebPageElement`, alongside the existing `WPHeader`, `WPFooter`, `WPSideBar`, and `SiteNavigationElement`. A page would reference it via `hasPart`, the section would contain its `Question`s also via `hasPart`, and crucially, `FAQSection` would have no `mainEntity` in idiomatic use. The whole point is that it isn't the main entity of anything. If your FAQ *is* the page's main entity, `FAQPage` is still the right type.

There's a second cleanup needed at the property level. `Question` today uses `acceptedAnswer` to point to its answer, a property [originally designed](https://schema.org/acceptedAnswer) for community Q&A sites where users vote answers up. For publisher-authored FAQs nobody accepts anything; the answer is just the answer. I've [filed a second proposal](https://github.com/schemaorg/schemaorg/issues/4817) to add a clean `answer` property on `Question`. The example below uses it.

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "mainEntity": {
    "@type": "Product",
    "name": "Coffee Grinder X"
  },
  "hasPart": {
    "@type": "FAQSection",
    "name": "Frequently Asked Questions",
    "hasPart": [
      {
        "@type": "Question",
        "name": "What grind size is best for espresso?",
        "answer": { "@type": "Answer", "text": "A fine grind, similar to table salt." }
      }
    ]
  }
}
```

Every claim in this graph is true. The page is a `WebPage` whose main entity is a `Product`. The FAQ is a section within it, not the page's purpose. That's the markup most publishers actually need, and the markup the spec doesn't currently let them write accurately. Until it exists, on most pages the right move is to stop using `FAQPage` and let the FAQ live as plain semantic HTML.

## Schema isn't the problem

The argument here is narrow: FAQPage was abused into a corner, and the SEO industry is currently setting up the same abuse pattern under a new acronym. The fix isn't to abandon structured data, it's to use it the way schema.org always intended: as an accurate description of the page. Stop chasing the next reward signal as if it were the only reason markup exists.

If you're adding schema to your site this year, the question isn't "what does Google reward?" It's "what does my page actually contain, and how do I describe it accurately?" Those are different questions, and the second one survives every cycle.

The cycle keeps repeating because we keep being the ones who repeat it. Don't be the reason something else gets killed in 2028.
