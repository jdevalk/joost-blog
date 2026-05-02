---
title: <em>Defending</em> the open web is not enough
seo:
  description: Anil Dash calls it the endgame for the open web. The collapse has already started. The question isn't how to protect it, but what to build next.
publishDate: 2026-04-07T00:00:00.000Z
excerpt: >-
  Anil Dash calls it the endgame for the open web, and he's right. But the
  structural collapse has already started. The indie web is mostly gone,
  the winners have already left, and defense alone won't fix it. The
  question isn't how to protect what remains. It's what to build next.
categories:
  - Open Source
  - AI
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Defending the open web is not enough'
isFeatured: false
toc: true
---
Anil Dash recently published [Endgame for the Open Web](https://anildash.com/2026/03/27/endgame-open-web/), and it's a piece worth reading. His argument: Big Tech is systematically dismantling the open web through AI scraping, API lockdowns, and the erosion of open source norms. His prescription: defend the institutions. Support the Internet Archive, donate to the EFF, volunteer for Wikipedia.

He's right about the threats. And his title, "endgame," is the right word. We're not in the opening moves. We're deep into a collapse that's already well underway, and the game board looks very different from what most people defending the open web still picture.

Let me start with what we're actually talking about. The open web is the part of the internet anyone can access without permission: websites you can visit without an app or an account, content you can link to, read, and build on. A personal blog is the open web. A Squarespace site is the open web. A WordPress site is the open web. A post that lives primarily inside a walled platform like Facebook or TikTok, where the platform controls who sees it and whether it's linkable, is not. The open web is defined by *access*, not by what software powers it.

That distinction matters, because Anil, and most people in this conversation, conflate the open web with open source. They're related, but they're not the same thing. Open source is about who controls the *tools*. The open web is about who can access the *content*. You can publish to the open web with proprietary software, and you can run open source software behind a login wall.

The two get conflated because for a long time they went hand in hand. If you wanted to really own your content and infrastructure on the open web, self-hosting open source software was the path of least resistance. Open source was how you made the open web yours. But that's a historical pairing, not a definition, and it's worth keeping the concepts separate when what's happening to one isn't what's happening to the other.

And it matters because the *technical* open web is fine. Protocols still work. You can still put up an Astro site. You're reading this on one. What's collapsing is the *economic* open web: the idea that you can publish independently, reach an audience, and build a sustainable business on open standards. That's the part in the endgame. Most people haven't noticed how far it's gone because the URLs still resolve.

## How the endgame started

Anil documents real threats: AI scrapers that take everything and send nothing back. Traffic drops of 50%, 90% for some publishers. Conventions like robots.txt being ignored. Open APIs getting shut down. Open source projects drowning in AI-generated junk contributions.

But he mostly frames these as attacks. They're not just attacks. They're incentives. And publishers are following them exactly where you'd expect:

- Bots scrape content and send no traffic back. Publishers lose their audiences. Then they lose their revenue. Then they paywall or quit.
- Conventions like robots.txt get ignored. Publishers can't set terms anyone respects. Their only options are locking content behind authentication or accepting the loss.
- Revenue collapses. Publishers move to Substack, Spotify, and YouTube, where the platforms monetize for them. They trade ownership for survival.
- Open source projects drown in AI-generated junk contributions. They close to outsiders. Development slows. The tools powering the open web stagnate.

And there's a fifth chain that Anil doesn't mention: AI makes generic content free to produce. Just like generic code is now basically free, generic articles, summaries, and how-to guides cost nothing to generate. That collapses the value of commodity content to zero. Publishers who were already struggling to monetize now have to compete with infinite free alternatives to their work. There's an irony here: SEOs, the people who once helped grow the open web by making content discoverable, [spent years flooding it](/unintended-consequences-seo-for-everyone/#what-we-didnt-see-coming) with content optimized for search engines rather than readers. AI just automated what they were already doing, and made the economics of it collapse.

None of this is a prediction. A lot of it has already happened. [77% of news publishers](https://digitalcontentnext.org/blog/2025/09/25/state-of-subscriptions-2025-pushing-past-the-paywall-plateau/) now focus on subscriptions, and Press Gazette tracks the [100+ outlets with over 100,000 paying digital subscribers](https://pressgazette.co.uk/paywalls/digital-subscribers-100k-club-ranking-worlds-biggest-paywalled-news-publishers-2025/). [Independent journalists are moving to Substack at scale](https://www.axios.com/2024/08/13/independent-journalists-substack-news), from Bari Weiss and Casey Newton to Jim Acosta, Chuck Todd, and Derek Thompson. Podcasters went exclusive on Spotify in [nine-figure deals](https://variety.com/2024/digital/news/joe-rogan-renews-spotify-deal-not-exclusive-1235895424/), leaving the open podcast ecosystem behind. Not because they opposed openness, but because openness stopped paying the bills. The open web isn't being killed by a single dramatic attack. It's emptying out, slowly, as millions of publishers individually and rationally decide that publishing openly is a bad deal.

Anil says we should fight back "with the same ferocity with which we're being attacked." But this isn't a battle. It's an exodus. And you don't stop an exodus by fighting harder.

## The winners already left

Look at who's getting the AI training deals. The Financial Times, News Corp, Axel Springer, The Atlantic, Condé Nast, Reddit. Most of them already paywalled their way out of the open web years ago. They have distribution, they have legal teams, they have leverage. They're getting paid *because* they already left. The open web is fine if you're already not really on it. It's the people who stayed who are losing.

This was never really about the open web broadly. It's about the *indie* web: the solo experts, the niche publishers, the bloggers who knew more about one specific thing than almost anyone else in the world. The indie web is the part that's mostly already gone.

And the dividing line is distribution. If you already have it, you get a deal. If you don't, how do you build one now? Not by ranking in search that increasingly summarizes your content without sending traffic. Not by publishing openly in a market flooded with free AI-generated alternatives.

Maybe by moving to a managed platform that has its own audience. But then you have to ask whether you still own the training rights to your own work, or whether the platform already sold them. In 2024, Automattic [sold WordPress.com and Tumblr user content](https://www.404media.co/tumblr-and-wordpress-to-sell-users-data-to-train-ai-tools/) to OpenAI and Midjourney for AI training. Users had to opt out after the fact, if they noticed. That's the implicit deal on any managed platform: the platform decides what your content is worth, and to whom.

AI companies are the canaries here. They've already figured out the open web isn't producing enough quality to train frontier models on, and they're paying expert contractors directly through [Scale AI](https://scale.com/), [Surge AI](https://surgehq.ai/), and in-house expert networks to fill the gap. That's not a sign the open web is fine. It's a sign the collapse is already priced in, and the survivors are being picked.

## Meanwhile, the biggest open source project on the web is busy suing itself

WordPress powers a huge chunk of the open web. If any project should be leading the response to these threats, it's WordPress. Instead, two of the ecosystem's biggest players have spent years [suing each other](https://www.therepository.email/category/business-enterprise/wp-engine-v-automattic).

While the open web's economics collapse and AI reshapes how content gets consumed, WordPress is still litigating trademark disputes. Not building trust infrastructure. Not making content machine-readable. Not competing with managed platforms on experience. The leadership that should be defending and advancing the open web is too busy fighting to do either, and too distracted to address the [deep architectural problems](/wordpress-refactor-not-redecorate/) that have been holding the platform back for years.

This isn't just a WordPress problem. It's a symptom. The open web's biggest institutions aren't focused on the existential threats. They're distracted by internal politics while the ground shifts beneath them.

## Building what comes next

So: the indie web is mostly gone, the structural collapse of the economic open web is well underway, and defending the remains isn't a strategy. What is?

Not "defend harder" or "fund the Internet Archive more." Those are necessary, but they don't rebuild anything. The real question is what the *next* open web looks like: one that's actually competitive, economically sustainable, and legible to both humans and machines from the start.

Here's what that takes.

**Trust infrastructure.**<br />
The open web has no native way to prove who published something first, or whether content has been modified since publication. Provenance isn't a nice-to-have anymore. When AI can generate content indistinguishable from human writing, cryptographic proof of origin becomes foundational. Author credibility, entity consistency, first-party verification: these are the [signals that platforms are already weighting](/ai-optimization-is-replaying-early-seo-just-faster/) more heavily.

**Machine-readable architecture.**<br />
Content on the open web needs to be [structured for machines](/markdown-alternate/), not just rendered for browsers. Honestly, [clean semantic HTML](/build-websites-like-2005/) would already be a massive improvement over most of what's out there. You don't need exotic formats if your markup is actually readable. From there, proper content models, typed data, and formats that AI agents can consume without reverse-engineering HTML are the next step. And agents need to be able to *act*, not just read. Standards like [WebMCP](https://developer.chrome.com/blog/webmcp-epp) and WordPress's new [Abilities API](https://developer.wordpress.org/news/2025/11/introducing-the-wordpress-abilities-api/) point in the right direction: make open source platforms' capabilities discoverable and composable by machines, not just by humans clicking through admin panels.

**Competitive defaults.**<br />
Open source projects need to ship with sane, performant defaults that compete with managed platforms out of the box. I've been [talking about the devastating power of defaults](/videos/joost-de-valk-the-devastating-power-of-defaults/) for over a decade. Not "you can configure it to be fast," but fast by default. Not "you can add structured data with a plugin," but structured data as a core feature. WordPress became famous for its five-minute install, a defining default that set the bar for its era. But it hasn't grasped what the 2026 version of that looks like.

## Openness has to pay for itself

Everything above is about *how* to build the next open web. But trust infrastructure, machine-readable content, and competitive defaults all assume something that hasn't been true for a while: that openness can sustain itself. It can't, not on its own. And this is the one thing the open web and open source have in common: neither of them works if the economics don't.

Open source is not just code. It is a system of incentives. And right now, those incentives don't align. [FAIR](/fair-wordpress-and-knowing-when-to-stop/), a federated package management system for WordPress built under the Linux Foundation, is a concrete case. The technical project delivered. The problem it solved was real. But when it came to hosting companies actually funding the infrastructure, the answer was no. Not because they disagreed. Because investment means cost, commitment, and risk. The current situation, however uncomfortable, was predictable enough. That's the pattern: companies benefiting enormously from open source infrastructure refusing to pay for its improvement, even when the alternative is quietly losing it.

There's a silver lining, though. At the recent Cloudfest hackathon, the TYPO3 community picked up FAIR, adapted it for their ecosystem, and is now [preparing to release it](https://openchannels.fm/fair-package-management-for-typo3/). The technical work is going to live on, just not in the ecosystem it was built for. Another open source community understood what WordPress hosts wouldn't.

This same tension, of hosting companies extracting value without contributing proportionally, is what set off the WordPress lawsuit. Matt Mullenweg was pointing at a real structural problem. The mistake wasn't seeing the economic misalignment. It was turning the response into a personal and legal fight, ego-driven instead of system-driven. A solvable economic problem became an unwinnable battle of wills.

The next open web needs business models that make openness economically sustainable from day one. And it needs the companies that profit most from it (hosting companies, search engines, ad networks, AI companies) to fund it. Not as charity, but because their businesses quite literally depend on a functioning open ecosystem.

Money alone doesn't fix this, though. Funding has to come with proper governance: foundations, neutral stewardship, clear rules about what a project will and won't do. That's exactly what WordPress lacks and exactly why FAIR was built under the Linux Foundation in the first place. A well-funded project controlled by a single commercial entity isn't shared infrastructure. It's just a product with volunteers.

There are promising signs. [x402](https://www.x402.org/), an open standard for internet-native payments over HTTP backed by Cloudflare, Coinbase, Stripe, AWS and others, is already live and processing real transactions. If bots can pay instead of just scrape, publishing openly stops being charity and starts being a business again. Anthropic is investing $100M in credits and $4M in donations through [Project Glasswing](https://www.anthropic.com/glasswing) to find and fix security vulnerabilities in open source software. That's an AI company putting real money back into the infrastructure it was built on. Two companies isn't a movement. But it's more than nothing, and more than most.

## The open web doesn't need more defenders.<br />It needs builders.

Anil is right that something precious is at stake. Keep supporting the Archive and the EFF and Wikipedia. They matter. But defending the remains of the indie web is not the same thing as reviving it. The thing we actually cared about, independent publishers reaching audiences on their own terms, isn't coming back by being defended harder. It comes back, if it comes back at all, by being rebuilt on better foundations. Managed platforms can't do it: their business models depend on you staying, and none of them let you take your URL, your traffic, and your integrations with you. Only something open can.

None of this is hypothetical. WebMCP is being standardized. x402 is being implemented. New open source CMSs are shipping with structured content and scoped permissions out of the box. The pieces exist. What's missing is the collective will to assemble them, and the funding, with the right governance, to sustain the people doing the work.

Everything Big Tech built was possible because the web was open. Open content and open source trained their models. Open source powers their infrastructure. Open protocols let them scale. And now AI lets them build faster than ever, on the back of the same open ecosystem they've helped hollow out. The anger at that is justified. But anger alone doesn't build anything. A better open web does. Let's build it.
