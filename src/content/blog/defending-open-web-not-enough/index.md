---
title: 'Defending the open web is not enough'
publishDate: 2026-04-07T00:00:00.000Z
excerpt: >-
  Anil Dash is right that the open web is under attack. But defense alone won't
  save it. The open web also needs to fix its own architecture, or it will lose
  to platforms that simply work better.
draft: true
password: 'april7'
categories:
  - Open Source
  - Search Opinion
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Defending the open web is not enough'
---
Anil Dash published [Endgame for the Open Web](https://anildash.com/2026/03/27/endgame-open-web/) last week, and it's a piece worth reading. His argument: Big Tech is systematically dismantling the open web through AI scraping, API lockdowns, and the erosion of open source norms. His prescription: defend the institutions — support the Internet Archive, donate to the EFF, volunteer for Wikipedia.

He's right about the threats. But I think he's telling half the story.

The open web isn't just being attacked from outside. It's also failing from within. And unless we fix that, all the institutional defense in the world won't matter. The open web won't survive by being *protected*. It will survive by becoming *better*.

## The open web made itself easy to exploit

Anil frames AI scraping as an external assault on publishers. That's true. But it leaves out the part where the open web made itself remarkably easy to strip-mine.

WordPress, which still powers a significant chunk of the web, generates [dozens of URL variations](/optimize-crawling-for-the-environment/) for every piece of content by default: author archives, date archives, tag pages, paginated feeds. Most of these serve no user. They exist because nobody thought to question whether they should. Every unnecessary URL is an invitation to a crawler — and a cost, both in server resources and in environmental impact.

Content is stored in formats that machines can scrape but can't meaningfully parse. WordPress serializes its block editor's structured content into HTML comments — a format so hostile to machine reading that WordPress VIP had to build an entire [Block Data API](https://docs.wpvip.com/vip-block-data-api/) just to extract what the editor already knew before it saved. That's not open infrastructure being exploited. That's open infrastructure making exploitation the path of least resistance while making *legitimate* machine use unnecessarily hard.

The open web didn't just get robbed. It left the door open and hid the good china.

## Defense doesn't fix the architecture

Anil's solutions — donate, volunteer, advocate — are necessary. The Internet Archive and Wikipedia and the EFF do essential work. But these are institutions that *preserve* the open web. They don't *improve* it.

The open web's competitive problem isn't that people don't value openness. It's that closed platforms often deliver a better experience. Substack's editor is simpler than WordPress's. Shopify's onboarding is faster. Squarespace's sites perform better out of the box. Wix ships AI features that actually work because the platform controls the full stack.

When someone chooses a closed platform over an open one, it's rarely because they oppose openness. It's because the closed platform solved their problem faster. That's not a battle you win with a donation to the EFF. That's a battle you win by making the open alternative genuinely better.

I [wrote recently](/do-you-need-a-cms/) about how the CMS category itself may be shrinking — people don't want a CMS, they want a website. If the open web doesn't compete on that level, it becomes a niche ideology instead of a practical default.

## The real threat isn't scraping — it's irrelevance

Anil focuses on the extractive threat: AI companies taking content without permission or compensation. That's a real problem, but it's a *current* problem. The *existential* problem is different: the open web is becoming architecturally irrelevant.

AI systems need structured data. They need typed content, machine-readable schemas, clear provenance signals. The open web, by and large, doesn't provide this. Instead, it serves tag soup HTML and hopes that ever-more-sophisticated parsers will figure it out.

I've been [writing about this](/build-websites-like-2005/) for a while now. The irony is sharp: the principles that made the web work in 2005 — clean HTML, semantic markup, machine-readable structure — are exactly what AI systems need today. But two decades of framework bloat, client-side rendering, and architecture-by-accretion mean most of the open web fails at the basics.

Compare this to what's emerging on the other side. When Cloudflare built [EmDash](/wordpress-refactor-not-redecorate/), they stored content as [Portable Text](https://github.com/portabletext/portabletext) — structured JSON that any system can parse natively. Plugin permissions are scoped. Deployment is at the edge. It's not open in the traditional sense, but it's *legible* to machines in ways that most of the open web isn't.

If AI agents can work with closed platforms more easily than open ones, the open web loses not because it was attacked, but because it was bypassed.

## Offense, not just defense

The open web needs an offensive strategy. Not just protecting what exists, but building what's missing.

**Trust infrastructure.** The open web has no native way to prove who published something first, or whether content has been modified since publication. I've been working on this since 2020, when we proposed [blockchain timestamps for Schema.org](/building-a-trusted-web-step-1/). Provenance isn't a nice-to-have anymore. When AI can generate content indistinguishable from human writing, and when platforms can remix and republish at will, cryptographic proof of origin becomes foundational. Author credibility, entity consistency, first-party verification — these are the [signals that platforms are already weighting](/ai-optimization-is-replaying-early-seo-just-faster/) more heavily.

**Machine-readable architecture.** Content on the open web needs to be structured for machines, not just rendered for browsers. That means proper content models, typed data, and formats that AI agents can consume without reverse-engineering HTML. This is what I've been pushing for with [agent-ready plugins](/agent-ready-plugins/) and the Abilities API: make the open web's capabilities discoverable and composable by machines, not just by humans clicking through admin panels.

**Competitive defaults.** Open source projects need to ship with sane, performant defaults that compete with closed platforms out of the box. Not "you can configure it to be fast," but fast by default. Not "you can add structured data with a plugin," but structured data as a core feature. The [pattern I keep seeing in WordPress](/wordpress-refactor-not-redecorate/) — working code exists, proven approaches are available, nothing gets prioritized — is the open web's problem in miniature.

## The incentive problem

Anil highlights the human cost: open source maintainers working for free, Wikipedia editors volunteering without compensation, independent publishers sacrificing income. He's right, and it's real. But framing this as exploitation by Big Tech misses a structural issue.

Open source is a system of incentives, not just ideology. I [learned this the hard way](/fair-wordpress-and-knowing-when-to-stop/) trying to build FAIR, a federated package management system for WordPress. The technical work was straightforward. The community interest was genuine. But without hosting companies and major ecosystem players willing to fund the infrastructure, decentralization remained aspirational. You can't sustain the open web on volunteer labor and moral arguments when the other side has infinite resources and aligned economic incentives.

The open web needs business models that make openness economically sustainable, not just philosophically desirable. That means solving the funding problem, not just lamenting it.

## What the open web could become

Anil's piece ends with a call to fight back "with the same ferocity with which we're being attacked." I'd put it differently. The open web shouldn't try to match Big Tech's ferocity. It should do what the open web has always done best: build something they can't.

Closed platforms are inherently limited by their business models. They can't let users truly own their data, because lock-in is the product. They can't make their systems fully interoperable, because walled gardens are the moat. They can't allow real extensibility, because that means ceding control.

The open web *can* do all of these things. It just hasn't, not because of external attacks, but because it hasn't prioritized the hard architectural work that would make openness a competitive advantage rather than a liability.

Imagine an open web where content is natively structured and machine-readable. Where AI agents can discover, compose, and extend open platforms as easily as they can work with proprietary APIs. Where trust is built into the protocol layer through verifiable provenance, not dependent on platform reputation. Where the default experience is fast, accessible, and better than the closed alternative.

That web is buildable. Much of the groundwork [already exists](/wordpress-refactor-not-redecorate/). What's missing isn't technology or even funding. It's the willingness to treat the open web's *own* shortcomings with the same urgency we bring to the threats from outside.

Defending the open web is necessary. Rebuilding it is what will actually work.
