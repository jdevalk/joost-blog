---
title: 'Stewarded open source is not enough: who can <em>cut you off?</em>'
seo:
  title: 'Stewarded open source is not enough: who can cut you off?'
  description: >-
    License-only versus stewarded open source misses a third question: who
    controls the infrastructure you depend on, and can they cut you off?
publishDate: 2026-07-10T00:00:00.000Z
excerpt: >-
  Dries Buytaert split open source into license-only and stewarded. It's a
  useful distinction, but it misses a more dangerous one. Stewardship tells you
  whether someone cares for the code. It doesn't tell you whether that same
  someone can cut you off from it.
categories:
  - Open Source
  - WordPress
toc: true
---

Dries Buytaert wrote a good post this week: [License-only versus Stewarded Open Source](https://dri.es/license-only-versus-stewarded-open-source). His point: the license tells you nothing about what kind of project you're depending on. A weekend hobby project and business-critical infrastructure can ship under the exact same license. What separates them is stewardship: maintainers reviewing contributions, fixing bugs, responding to security issues, managing releases. The license makes code available; stewardship makes it dependable.

He's right, and the vocabulary is useful. But there's a third distinction hiding underneath it, and I'd argue it's the more dangerous one to get wrong: stewardship tells you whether someone cares for the code. It does not tell you whether that same someone can cut you off from it.

## The most stewarded project in the world

Here's the uncomfortable case for Dries's framework: WordPress. By his definition, WordPress is about as stewarded as open source gets. Full-time maintainers, a security team, release management, long-term support, an enormous plugin directory, update infrastructure serving hundreds of millions of sites. Nobody would call it license-only.

And yet in September 2024, WP Engine, a company hosting a meaningful chunk of the WordPress web, was cut off from WordPress.org overnight. No more plugin and theme updates for their customers, no access to the repository, and shortly after, a popular plugin with millions of installs was taken over on the directory itself. The GPL was never violated. The stewardship never stopped. The access simply ended, because one person decided it should, and one person could.

That's the thing Dries's two categories can't see. Stewardship isn't just care; it's concentration. Somebody runs the update servers. Somebody owns the package registry, the plugin directory, the trademark, the domain. The more stewarded a project is, the more of your operational reality flows through infrastructure the steward controls. Stewardship is what makes open source dependable, and it's also what creates the choke point.

## Three questions, not two

So I'd extend the vocabulary. When you evaluate an open source dependency, there are three questions, and they have different answers more often than you'd think.

### May I use it?

That's the license. Legal permission, and as Dries notes, a disclaimer of nearly everything else.

### Will it be cared for?

That's stewardship. Maintenance, security response, releases, the ongoing work that turns shared code into dependable software.

### Can I be cut off?

That's governance. Who controls the infrastructure your dependency actually flows through, and what, if anything, binds them.

Call the third category **accountable stewardship** versus **discretionary stewardship**. In an accountably stewarded project, the steward's power over the infrastructure is constrained by something enforceable: a foundation with bylaws, a constitution, a trademark policy that means what it says, distribution that can be mirrored without permission. In a discretionarily stewarded project, everything works beautifully until it doesn't, and when it doesn't, you have no recourse. You were never a party to anything. You were a guest.

## The steward has a government too

There's a second source of cut-off, and it doesn't care how accountable the stewardship is. A foundation with bylaws is still incorporated somewhere. The Linux Foundation, the CNCF, and the Python Software Foundation are all US non-profits, bound by US law: export controls, sanctions, court orders. The most constitutional governance in the world still answers to the state it lives in.

This isn't hypothetical. In October 2024, about a dozen maintainers with ties to Russia were removed from the Linux kernel's list of trusted developers. The patch cited "various compliance requirements," and when contributors pushed back, [Linus Torvalds tied it to sanctions](https://www.theregister.com/2024/10/23/linus_torvalds_affirms_expulsion_of/) and said it was not getting reverted. The Linux kernel is the most distributed, most mirrorable, most fork-friendly project you can name; git means everyone holds the full history. It still had people removed from positions of trust because of where they lived. Years earlier, GitHub cut off developers in Iran, Syria, and Crimea to comply with US trade law, before eventually winning licenses to restore some of that access.

So the choke point isn't only the steward's whim. It's also the steward's jurisdiction. Federation protects you from a steward who turns hostile; it does nothing for a maintainer whose own government orders the steward to act. When you pick a dependency, you're also picking a legal regime, and you may not share it.

## How to actually test this

The nice thing is that this isn't philosophy. It's checkable. Six questions:

1. **Who owns the distribution infrastructure?**\
   The update servers, the package registry, the plugin or module directory. A person? A company? A foundation with a charter? WordPress.org is personally owned by Matt Mullenweg. Kubernetes' trademark and distribution infrastructure sit with the CNCF, a Linux Foundation project; Google handed over the trademark at founding precisely so no single company could hold the ecosystem hostage. PyPI is run by the Python Software Foundation. These are not the same risk profile.
2. **Who owns the trademark, and under what policy?**\
   Trademarks are the most common lever for cutting someone off while staying inside the license. If the policy can be reinterpreted unilaterally, it's not a policy, it's a mood.
3. **Can you mirror the supply chain without asking?**\
   Debian's apt archive is designed to be mirrored. Linux kernel development is distributed by nature; git means everyone holds the full history. If federation is technically and legally possible, the choke point loses most of its power. If it's forbidden or obstructed, that tells you something too.
4. **Is there a document that binds the steward?**\
   Not a code of conduct for contributors. Rules for the people running the infrastructure, with an actual mechanism when they're broken. Debian has a constitution and general resolutions. The CNCF has a charter that spells out what the foundation may and may not do with the projects it holds. Most projects have vibes.
5. **Has access ever been revoked unilaterally?**\
   Precedent is the best predictor. A steward who has done it once has told you what the governance really is.
6. **Which government can compel the steward?**\
   Every foundation is incorporated somewhere; every maintainer lives somewhere. Sanctions, export controls, and court orders reach the steward whether or not the governance documents mention them. If the whole project sits in one jurisdiction, that jurisdiction is part of your dependency.

## Why this matters more than it seems

I spent a good part of the last two years on exactly this problem. FAIR, the federated repository effort I co-founded, existed because the WordPress ecosystem discovered its stewardship was discretionary, and [the ecosystem ultimately wasn't willing to fund the fix](/fair-wordpress-and-knowing-when-to-stop/). That experience taught me that governance risk is invisible right up until it's existential. Nobody prices it in, because the infrastructure works, the updates flow, and the steward is friendly. Then one dispute changes everything, and you learn that "stewarded" described the care, not the terms.

## Sovereignty is the same question with a flag on it

This isn't only a private buyer's problem. Right now the EU is trying to write "sovereign" into procurement law. The [Cloud and AI Development Act](https://digital-strategy.ec.europa.eu/en/library/proposal-cloud-and-ai-development-act-cada) puts a sovereignty framework at the centre of Europe's effort to depend less on foreign infrastructure, and Reinier van Lanschot is the European Parliament's rapporteur on it. He has said he wants the standard to ["mean what it says"](https://www.linkedin.com/feed/update/urn:li:activity:7479790064902950913/). I wrote to him, because whether it does comes down to this exact distinction.

Test "sovereign" at the level of ownership and headquarters, and it will be gamed: ownership and jurisdiction can change in a single board meeting. Test it at the level of governance, with federation by default, an audited independent board, and no single funder above a set share, and it might hold. Mandate open source but leave the update and identity infrastructure in one set of hands, and you have rebuilt the wordpress.org chokepoint in a friendlier jurisdiction. I made [the longer version of that case](/open-source-first-not-enough/) when the procurement debate opened. It is the same third question, aimed at a legislature instead of a buyer.

So yes: distinguish license-only from stewarded open source. That vocabulary is a real improvement. But before you build a business on the stewarded kind, ask the harder questions. The license tells you what you may do. Stewardship tells you what they do for you. Governance tells you what they can do *to* you. And jurisdiction tells you who can force their hand.

The license is the only one you can always find in writing. Governance is written down where someone insisted on it, and in most projects nobody did. That should worry us more than it does.
