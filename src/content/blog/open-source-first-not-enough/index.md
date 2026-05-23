---
title: Open Source First isn't <em>enough</em>. FAIR taught me why.
seo:
  description: Open Source First is the right EU procurement principle. Funding the commons it depends on is the other half. What FAIR taught me about the supply side.
publishDate: 2026-05-23T00:00:00.000Z
excerpt: >-
  SUSE and a coalition of European open source companies are asking the
  EU to make Open Source First a binding procurement principle ahead of
  the June 3 Tech Sovereignty Package. They're right. But after FAIR, I
  know procurement preference alone recreates the same lock-in problem at
  EU scale. Sovereignty needs both the demand side and the supply side.
categories:
  - Open Source
isFeatured: false
toc: true
draft: true
password: dries
---
On June 3, the European Commission is expected to put forward the EU Tech Sovereignty Package. Ahead of that, SUSE and a coalition of European open source companies have published [an open letter](https://www.suse.com/eu-tech-sovereignty-letter/) calling for one specific addition to the upcoming Cloud and AI Development Act: a binding requirement that all public sector procurement of software and digital services must first assess whether a qualified open source alternative exists before a proprietary one is considered.

The principle has a name: **Open Source First.**

I support it. I think anyone serious about European digital sovereignty should. But I want to add something the letter does not say, something I learned the hard way by trying to build the kind of infrastructure that "open source first" implicitly assumes will be there to choose from.

## The letter is right about the disease

The diagnosis is correct, and the language is sharp. The current default is a "weak sovereignty posture" caused by years of procurement decisions made without any obligation to consider the alternative. The letter frames open source not as ideology but as the precondition for what it calls "pivotability" and "exit velocity": the ability to move infrastructure when the political weather changes.

That is the right frame. It is Hirschman's *Exit, Voice and Loyalty* applied to digital infrastructure: voice only works when exit is actually possible. Lock-in is the negation of sovereignty whether the lock-in is enforced by a license, an API, or an undocumented integration. Open source is what makes the door work.

## But open source is not the same as sovereign

This is where my own experience starts to matter.

WordPress is fully open source. It runs about 40% of the web. In September 2024, the person who controls its update infrastructure decided to block one company's access to wordpress.org, leaving roughly 200,000 sites unable to receive plugin and theme updates. The license didn't help. The community didn't help. The Foundation didn't help. The infrastructure was the chokepoint, and the chokepoint had a single owner.

That is what we built [FAIR](https://fair.pm/) (Federated and Independent Repositories) to address. The Linux Foundation took it on. Ryan McCue, Mika Epstein and Carrie Dils led the technical work. About 300 people contributed. We shipped 1.0 in September 2025. It was, by any reasonable measure, exactly the kind of project the SUSE letter is asking the EU to enable.

In February 2026, [Karim Marucchi and I stepped away](/fair-wordpress-and-knowing-when-to-stop/) from FAIR for WordPress. The reason is the one I keep coming back to whenever I read documents like the SUSE letter:

> If the ecosystem won't fund neutrality, neutrality won't materialize.

I still believe that.

## What the letter is missing

The letter asks the public sector to prefer open source. That creates a demand signal. It does not answer the supply-side question: who pays for the neutral infrastructure underneath?

Open Source First as written, taken to its logical conclusion, sends public money to vendors who ship open source products. That is good. It is not, however, the same as funding the commons those products sit on. A procurement mandate that pays SUSE, Nextcloud, Penpot or Collabora for their work (all of whom I'm glad to see on the letter) does not by itself fund the package repositories, the certificate authorities, the language registries, the package managers, the federated identity layers, or any of the rest of the plumbing that "open source first" implicitly assumes will be there to choose from.

I am not the only one making this argument. Dries Buytaert, the founder of Drupal, has been pressing the supply-side case throughout the same policy window. In ["Funding Open Source like public infrastructure"](https://dri.es/funding-open-source-like-public-infrastructure) he argues that public money currently flows around open source rather than into it, with procurement contracts going to the lowest bidder or to large IT vendors rather than to the maintainers who actually build and secure the software. In ["What does 'Buy European' even mean?"](https://euobserver.com/210047/when-it-comes-to-techs-software-dependency-what-does-buy-european-even-mean/), co-authored with Nicholas Gates of OpenForum Europe, he uses Skype as the case study for why European ownership, jurisdiction and headquarters are weak tests of long-term independence: every one of those properties can change in a single board meeting.

That this argument is being made independently from both the WordPress and Drupal worlds is worth noticing. It is also worth acting on.

If we don't fix that, we recreate the FAIR problem at EU scale. We get a market full of qualified open source vendors, each running their own update infrastructure, each with their own single-point-of-failure governance, each one trademark dispute or hostile acquisition away from the next wordpress.org. That isn't sovereignty. It's the same disease in a more polite jurisdiction.

## What I'd add to the letter

The Open Source First principle should be paired with a second principle: **some share of public procurement spend has to flow into shared, federated infrastructure governed independently of any single vendor.**

To return to Hirschman: Open Source First gives the public sector a credible exit. Funding the commons gives it ongoing voice in the infrastructure that exit depends on. Without exit, voice is pleading. Without voice in the commons, exit just moves you from one vendor to another, never onto ground that nobody can fence off.

This doesn't have to be complicated. The mechanisms already exist. Germany's Sovereign Tech Fund does a small version of it. The Linux Foundation, Eclipse Foundation, NLnet and others already host the kind of neutral infrastructure projects this would underwrite. What is missing is the policy commitment to direct money there, at scale, as a structural feature of the procurement regime rather than as occasional grant-making.

The obvious objection is that EU funding produces EU-flavored forks of what should be global infrastructure. That is a real risk, and the answer is not a parallel European stack. It is EU money flowing into the neutral foundations that already exist, none of which are European institutions in the narrow sense. That is the point. EU money in, global infrastructure out.

There is also a reason the commons side is the harder thing to circumvent. The letter asks for a "qualified" open source alternative, but does not say what qualifies. And "open source" as a category is under sustained pressure in 2026. Meta's Llama license, with its usage restrictions and acceptable-use clauses, popularized a definition of "open" that no OSI-approved license would permit. A procurement preference without sharp teeth on what qualifies will get gamed in a quarter. Funded commons infrastructure is harder to fake. It either runs or it doesn't. You can't ship a press release version of a package registry.

A version of the CAIDA that included both, Open Source First in procurement and a binding commitment to fund the commons that procurement depends on, would be substantially harder to walk back.

## Sign it anyway

None of this is a reason not to sign the letter. Open Source First is the right principle. The June 3 window is real. The signatories so far, including SUSE, Nextcloud, Element, Collabora, Univention, Penpot, Heinlein, OpenNebula and others, are the right coalition.

Every European company in our space should add their name before June 3. Anyone with a line into the Commission, or to MEPs working on the file, should make the second point above as well. Procurement is the demand side. The commons is the supply side. Sovereignty needs both.

I'll be writing more about this in the coming weeks. For now: sign the letter, ask for the addition, and read [Dries on the same topic](https://dri.es/the-software-sovereignty-scale). The argument deserves more than one voice.
