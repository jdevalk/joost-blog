---
title: Defending the open web is not enough
publishDate: 2026-04-07T00:00:00.000Z
excerpt: >-
  Anil Dash is right that the open web is under attack. But follow his own
  argument to its conclusion: the open web is going to empty out. Fixing that
  takes more than defense — it takes better governance, better technology, and
  better economics.
draft: true
password: april7
categories:
  - Open Source
  - Search Opinion
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Defending the open web is not enough'
---
Anil Dash recently published [Endgame for the Open Web](https://anildash.com/2026/03/27/endgame-open-web/), and it's a piece worth reading. His argument: Big Tech is systematically dismantling the open web through AI scraping, API lockdowns, and the erosion of open source norms. His prescription: defend the institutions — support the Internet Archive, donate to the EFF, volunteer for Wikipedia.

He's right about the threats. But I think his argument leads somewhere he doesn't go — and the open web's own failures deserve a harder look than he gives them.

Let me start with what we're actually talking about. The open web is the part of the internet anyone can access without permission — websites you can visit without an app or an account, content you can link to, read, and build on. A personal blog is the open web. A Squarespace site is the open web. A WordPress site is the open web. A post that lives primarily inside a walled platform like Facebook or TikTok — where the platform controls who sees it and whether it's linkable — is not. The open web is defined by *access*, not by what software powers it.

That distinction matters, because Anil — and most people in this conversation — conflate the open web with open source. They're related, but they're not the same thing. Open source is about who controls the *tools*. The open web is about who can access the *content*. You can publish to the open web with proprietary software, and you can run open source software behind a login wall.

## The open web is going to empty out

Anil documents real threats: AI scrapers that take everything and send nothing back. Traffic drops of 50%, 90% for some publishers. Conventions like robots.txt being ignored. Open APIs getting shut down. Open source projects drowning in AI-generated junk contributions.

But he frames these as attacks. They're not just attacks. They're incentives. Follow each one to where it actually leads:

When bots scrape your content and send no traffic back, you lose your audience. When you lose your audience, you lose your revenue. When you lose your revenue, you paywall or quit.

When conventions like robots.txt get ignored, you can't set terms anyone respects. Your only options are locking content behind authentication or accepting the loss.

When revenue collapses, you move to Substack or Spotify, where the platform monetizes for you. You trade ownership for survival.

When open source projects drown in junk contributions, they close to outsiders. Development slows. The tools powering the open web stagnate.

Every one of these ends the same way: content leaves the open web.

And there's a fifth chain that Anil doesn't mention: AI makes generic content free to produce. Just like generic code is now basically free, generic articles, summaries, and how-to guides cost nothing to generate. That collapses the value of commodity content to zero. If you were already struggling to monetize, you're now competing with infinite free alternatives to your work. There's an irony here: SEOs, the people who once helped grow the open web by making content discoverable, spent years flooding it with content optimized for search engines rather than readers. AI just automated what they were already doing — and made the economics of it collapse.

This isn't hypothetical. It's already happening. Publishers are paywalling. Indie bloggers are moving to Substack. Podcasters are going exclusive on Spotify. Not because they oppose openness, but because openness stopped paying the bills.

The open web won't be killed by a single dramatic attack. It will empty out, slowly, as millions of publishers individually and rationally decide that publishing openly is a bad deal. The web stays technically open. There's just nothing worth reading on it anymore.

Anil says we should fight back "with the same ferocity with which we're being attacked." But this isn't a battle. It's an exodus. You don't stop an exodus by fighting harder. You stop it by making people want to stay.

## Meanwhile, the biggest open source project on the web is busy suing itself

WordPress powers a huge chunk of the open web. If any project should be leading the response to these threats, it's WordPress. Instead, the ecosystem's two biggest players are spending their energy [suing each other](https://www.therepository.email/category/business-enterprise/wp-engine-v-automattic).

While the open web's economics collapse and AI reshapes how content is consumed, WordPress is litigating trademark disputes. Not building trust infrastructure. Not making content machine-readable. Not competing with managed platforms on experience. The leadership that should be defending and advancing the open web is too busy fighting to do either — and too distracted to address the [deep architectural problems](/wordpress-refactor-not-redecorate/) that have been holding the platform back for years.

This isn't just a WordPress problem — it's a symptom. The open web's biggest institutions aren't focused on the existential threats. They're distracted by internal politics while the ground shifts beneath them.

## What building looks like

Regulation helps set the floor: the EU AI Act, the Cyber Resilience Act, and emerging copyright frameworks are starting to put legal teeth behind the norms that voluntary compliance failed to enforce. But regulation doesn't build what's missing. The open web needs an offensive strategy — not just protecting what exists, but building what comes next.

**Trust infrastructure.**<br />
The open web has no native way to prove who published something first, or whether content has been modified since publication. Provenance isn't a nice-to-have anymore. When AI can generate content indistinguishable from human writing, cryptographic proof of origin becomes foundational. Author credibility, entity consistency, first-party verification — these are the [signals that platforms are already weighting](/ai-optimization-is-replaying-early-seo-just-faster/) more heavily.

**Machine-readable architecture.**<br />
Content on the open web needs to be [structured for machines](/markdown-alternate/), not just rendered for browsers. That means proper content models, typed data, and formats that AI agents can consume without reverse-engineering HTML. And agents need to be able to *act*, not just read — standards like [WebMCP](https://developer.chrome.com/blog/webmcp-epp) and WordPress's new [Abilities API](https://developer.wordpress.org/news/2025/11/introducing-the-wordpress-abilities-api/) point in the right direction: make open source platforms' capabilities discoverable and composable by machines, not just by humans clicking through admin panels.

**Competitive defaults.**<br />
Open source projects need to ship with sane, performant defaults that compete with managed platforms out of the box. I've been [talking about the devastating power of defaults](/videos/joost-de-valk-the-devastating-power-of-defaults/) for over a decade. Not "you can configure it to be fast," but fast by default. Not "you can add structured data with a plugin," but structured data as a core feature. WordPress still ships without even the most basic SEO features — in 2026, you still need a plugin to add a meta description.

**Sustainable economics.**<br />
You can't sustain open source on volunteer labor and moral arguments when the other side has infinite resources. [FAIR](/fair-wordpress-and-knowing-when-to-stop/), a federated package management system for WordPress, is a good example: the technical work was straightforward, the community interest was genuine, but without major ecosystem players willing to fund the infrastructure, it stalled.

The open web needs business models that make openness economically sustainable, not just philosophically desirable. And the companies that profit most from it — hosting companies, search engines, ad networks, AI companies — have every reason to fund the rebuild. If the open web empties out, hosting companies have nothing to host, search engines have nothing to index, and AI companies lose the high-quality content they need to train on — they can generate commodity content themselves, but they can't generate expertise. This isn't charity. It's maintaining the ecosystem their revenue depends on. Right now, they're extracting value from infrastructure they're not investing in. That's not sustainable for anyone.

There are promising signs here: Cloudflare and Coinbase recently launched the [x402 Foundation](https://blog.cloudflare.com/x402/), standardizing how AI agents can *pay* for content via HTTP. If bots can pay instead of just scrape, publishing openly stops being charity and starts being a business again. Anthropic is investing $100M in credits and $4M in donations through [Project Glasswing](https://www.anthropic.com/glasswing) to find and fix security vulnerabilities in open source software — an AI company putting real money back into the infrastructure it was built on.

## The open web doesn't need defenders.<br />It needs builders.

Anil is right that something precious is at stake. But framing this as defense — protect the Archive, support the EFF, fight back — treats the open web as a museum piece. It's not. It's a living system, and right now it's losing participants because it's not competitive.

Managed platforms have real constraints. Some offer data export, but none let you take your URL, your traffic, your integrations, your full stack. Their business models depend on you staying. Open source doesn't have that constraint. It *can* offer true portability, full ownership, and real interoperability. It just hasn't prioritized the hard work to make those things easy.

None of this is hypothetical. WebMCP is being standardized. x402 is being implemented. New open source CMSs are shipping with structured content and scoped permissions out of the box. The pieces exist. What's missing is the collective will to assemble them — and the funding to sustain the people doing the work.

Everything Big Tech built was possible because the web was open. Open content and open source trained their models. Open source powers their infrastructure. Open protocols let them scale. And now AI lets them build faster than ever — on the back of the same open ecosystem they're undermining. The anger at that is justified. But anger doesn't keep publishers online. A better open web does. Let's build it.
