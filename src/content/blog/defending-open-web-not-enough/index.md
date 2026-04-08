---
title: Defending the open web is not enough
publishDate: 2026-04-07T00:00:00.000Z
excerpt: >-
  The open web we've been arguing about is already dead. The URLs still
  resolve, but the thing we meant when we said "open web" — independent
  publishers reaching audiences on their own terms — has already collapsed.
  The question isn't how to defend it. It's what to build next.
draft: true
password: april7
categories:
  - Open Source
  - Search Opinion
featureImage: ./images/featured.webp
featureImageAlt: 'Illustration for: Defending the open web is not enough'
---
Anil Dash recently published [Endgame for the Open Web](https://anildash.com/2026/03/27/endgame-open-web/), and it's a piece worth reading. His argument: Big Tech is systematically dismantling the open web through AI scraping, API lockdowns, and the erosion of open source norms. His prescription: defend the institutions — support the Internet Archive, donate to the EFF, volunteer for Wikipedia.

He's right about the threats. But I think his argument leads somewhere he doesn't go: the open web we're trying to defend is already dead. What we're arguing about is a corpse.

Let me start with what we're actually talking about. The open web is the part of the internet anyone can access without permission — websites you can visit without an app or an account, content you can link to, read, and build on. A personal blog is the open web. A Squarespace site is the open web. A WordPress site is the open web. A post that lives primarily inside a walled platform like Facebook or TikTok — where the platform controls who sees it and whether it's linkable — is not. The open web is defined by *access*, not by what software powers it.

That distinction matters, because Anil — and most people in this conversation — conflate the open web with open source. They're related, but they're not the same thing. Open source is about who controls the *tools*. The open web is about who can access the *content*. You can publish to the open web with proprietary software, and you can run open source software behind a login wall.

And it matters because when I say the open web is dead, I don't mean the technical open web. Protocols still work. You can still put up an Astro site. You're reading this on one. What's dead is the *economic* open web — the idea that you can publish independently, reach an audience, and build a sustainable business on open standards. That died sometime between 2022 and 2025. Most people haven't noticed because the URLs still resolve.

## How it died

Anil documents real threats: AI scrapers that take everything and send nothing back. Traffic drops of 50%, 90% for some publishers. Conventions like robots.txt being ignored. Open APIs getting shut down. Open source projects drowning in AI-generated junk contributions.

But he frames these as attacks. They weren't just attacks. They were incentives. And publishers followed them exactly where you'd expect:

Bots scraped content and sent no traffic back. Publishers lost their audiences. Then they lost their revenue. Then they paywalled or quit.

Conventions like robots.txt got ignored. Publishers couldn't set terms anyone respected. Their only options were locking content behind authentication or accepting the loss.

Revenue collapsed. Publishers moved to Substack, Spotify, and YouTube, where the platforms monetized for them. They traded ownership for survival.

Open source projects drowned in AI-generated junk contributions. They closed to outsiders. Development slowed. The tools powering the open web stagnated.

And there's a fifth chain that Anil doesn't mention: AI made generic content free to produce. Just like generic code is now basically free, generic articles, summaries, and how-to guides cost nothing to generate. That collapsed the value of commodity content to zero. Publishers who were already struggling to monetize suddenly had to compete with infinite free alternatives to their work. There's an irony here: SEOs, the people who once helped grow the open web by making content discoverable, [spent years flooding it](/unintended-consequences-seo-for-everyone/#what-we-didnt-see-coming) with content optimized for search engines rather than readers. AI just automated what they were already doing — and made the economics of it collapse.

None of this is a prediction. It's already happened. Publishers paywalled. Indie bloggers moved to Substack. Podcasters went exclusive on Spotify. Not because they opposed openness, but because openness stopped paying the bills. The open web didn't die in a single dramatic attack. It emptied out, slowly, as millions of publishers individually and rationally decided that publishing openly was a bad deal.

Anil says we should fight back "with the same ferocity with which we're being attacked." But this wasn't a battle. It was an exodus. And the exodus is already over.

## The winners already left

Look at who's getting the AI training deals. The Financial Times, News Corp, Axel Springer, The Atlantic, Condé Nast, Reddit. Most of them already paywalled their way out of the open web years ago. They have distribution, they have legal teams, they have leverage. They're getting paid *because* they already left. The open web is fine if you're already not really on it. The open web is dying if you're the person who stayed.

This was never really about the open web broadly. It was about the *indie* web — the solo experts, the niche publishers, the bloggers who knew more about one specific thing than almost anyone else in the world. The indie web is what died.

And the dividing line is distribution. If you already had it, you got a deal. If you didn't, how do you build one now? Not by ranking in search that now summarizes your content without sending traffic. Not by publishing openly in a market flooded with free AI-generated alternatives.

Maybe by moving to a managed platform that has its own audience — but then you have to ask whether you still own the training rights to your own work, or whether the platform already sold them. In 2024, Automattic [sold WordPress.com and Tumblr user content](https://www.404media.co/tumblr-and-wordpress-to-sell-users-data-to-train-ai-tools/) to OpenAI and Midjourney for AI training. Users had to opt out after the fact, if they noticed. That's the implicit deal on any managed platform: the platform decides what your content is worth, and to whom.

AI companies are the canaries here. They've already figured out the open web isn't producing enough quality to train frontier models on, and they're paying expert contractors directly — [Scale AI](https://scale.com/), [Surge AI](https://surgehq.ai/), in-house expert networks — to fill the gap. That's not a sign the open web is fine. It's a sign the collapse is already priced in, and the survivors have been picked.

## Meanwhile, the biggest open source project on the web is busy suing itself

WordPress powers a huge chunk of the open web. If any project should have been leading the response to these threats, it was WordPress. Instead, the ecosystem's two biggest players spent the last few years [suing each other](https://www.therepository.email/category/business-enterprise/wp-engine-v-automattic).

While the open web's economics collapsed and AI reshaped how content gets consumed, WordPress was litigating trademark disputes. Not building trust infrastructure. Not making content machine-readable. Not competing with managed platforms on experience. The leadership that should have been defending and advancing the open web was too busy fighting to do either — and too distracted to address the [deep architectural problems](/wordpress-refactor-not-redecorate/) that have been holding the platform back for years.

This isn't just a WordPress problem — it's a symptom. The open web's biggest institutions aren't focused on the existential threats. They're distracted by internal politics while the ground shifts beneath them.

## Building what comes next

So: the old open web is gone. What replaces it?

Not the same thing rebuilt bigger. Not "defend harder" or "fund the Internet Archive more." Those are necessary, but they preserve the corpse. The real question is what the *next* open web looks like — one that's actually competitive, economically sustainable, and legible to both humans and machines from the start.

Here's what that takes.

**Trust infrastructure.**<br />
The open web has no native way to prove who published something first, or whether content has been modified since publication. Provenance isn't a nice-to-have anymore. When AI can generate content indistinguishable from human writing, cryptographic proof of origin becomes foundational. Author credibility, entity consistency, first-party verification — these are the [signals that platforms are already weighting](/ai-optimization-is-replaying-early-seo-just-faster/) more heavily.

**Machine-readable architecture.**<br />
Content on the open web needs to be [structured for machines](/markdown-alternate/), not just rendered for browsers. Honestly, [clean semantic HTML](/build-websites-like-2005/) would already be a massive improvement over most of what's out there — you don't need exotic formats if your markup is actually readable. From there, proper content models, typed data, and formats that AI agents can consume without reverse-engineering HTML are the next step. And agents need to be able to *act*, not just read — standards like [WebMCP](https://developer.chrome.com/blog/webmcp-epp) and WordPress's new [Abilities API](https://developer.wordpress.org/news/2025/11/introducing-the-wordpress-abilities-api/) point in the right direction: make open source platforms' capabilities discoverable and composable by machines, not just by humans clicking through admin panels.

**Competitive defaults.**<br />
Open source projects need to ship with sane, performant defaults that compete with managed platforms out of the box. I've been [talking about the devastating power of defaults](/videos/joost-de-valk-the-devastating-power-of-defaults/) for over a decade. Not "you can configure it to be fast," but fast by default. Not "you can add structured data with a plugin," but structured data as a core feature. WordPress still ships without even the most basic SEO features — in 2026, you still need a plugin to add a meta description.

**Sustainable economics.**<br />
Open source is not just code. It is a system of incentives. And right now, those incentives don't align. [FAIR](/fair-wordpress-and-knowing-when-to-stop/) — a federated package management system for WordPress, built under the Linux Foundation — is a concrete case. The technical project delivered. The problem it solved was real. But when it came to hosting companies actually funding the infrastructure, the answer was no. Not because they disagreed. Because investment means cost, commitment, and risk. The current situation, however uncomfortable, was predictable enough. That's the pattern: companies benefiting enormously from open source infrastructure refusing to pay for its improvement, even when the alternative is quietly losing it.

The next open web needs business models that make openness economically sustainable from day one. And it needs the companies that profit most from it — hosting companies, search engines, ad networks, AI companies — to fund it. Not as charity, but because their businesses quite literally depend on a functioning open ecosystem.

Money alone doesn't fix this, though. Funding has to come with proper governance — foundations, neutral stewardship, clear rules about what a project will and won't do. That's exactly what WordPress lacks and exactly why FAIR was built under the Linux Foundation in the first place. A well-funded project controlled by a single commercial entity isn't shared infrastructure. It's just a product with volunteers.

There are promising signs. Cloudflare and Coinbase recently launched the [x402 Foundation](https://blog.cloudflare.com/x402/), standardizing how AI agents can *pay* for content via HTTP. If bots can pay instead of just scrape, publishing openly stops being charity and starts being a business again. Anthropic is investing $100M in credits and $4M in donations through [Project Glasswing](https://www.anthropic.com/glasswing) to find and fix security vulnerabilities in open source software — an AI company putting real money back into the infrastructure it was built on. Two companies isn't a movement. But it's more than nothing, and more than most.

## Stop defending a corpse.<br />Build its replacement.

Anil is right that something precious has been lost. But grieving a dead open web while defending its remains is not a strategy. The Archive and the EFF and Wikipedia matter — keep supporting them. Those are museums, not hospitals, and that's OK. Museums are worth funding.

But the thing we actually cared about — independent publishers reaching audiences on their own terms — isn't coming back by being defended. It's coming back, if it comes back at all, by being rebuilt on better foundations. Managed platforms can't do it: their business models depend on you staying, and none of them let you take your URL, your traffic, and your integrations with you. Only something open can.

None of this is hypothetical. WebMCP is being standardized. x402 is being implemented. New open source CMSs are shipping with structured content and scoped permissions out of the box. The pieces exist. What's missing is the collective will to assemble them — and the funding, with the right governance, to sustain the people doing the work.

Everything Big Tech built was possible because the web was open. Open content and open source trained their models. Open source powers their infrastructure. Open protocols let them scale. And now AI lets them build faster than ever — on the back of the same open ecosystem they helped kill. The anger at that is justified. But anger doesn't resurrect anything. A better open web might. Let's build it.
