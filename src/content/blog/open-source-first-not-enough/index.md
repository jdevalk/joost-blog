---
title: Open Source First is right, but <em>not enough</em>.
seo:
  description: Open Source First is the right EU procurement principle. Funding the commons it depends on is the other half. What FAIR taught me about the supply side.
publishDate: 2026-05-24T00:00:00.000Z
updatedDate: 2026-05-25T00:00:00.000Z
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
---
Open Source First is the right principle for EU digital sovereignty. It is also not enough, and I know that because I spent a year trying to build the kind of infrastructure that "open source first" implicitly assumes will be there.

On June 3, the European Commission will put forward the EU Tech Sovereignty Package. Ahead of that, SUSE and a coalition of European open source companies have published [an open letter](https://www.suse.com/eu-tech-sovereignty-letter/). They want one specific addition to the upcoming Cloud and AI Development Act (CAIDA): all public sector procurement of software and digital services should first assess whether a qualified open source alternative exists, before a proprietary one is considered.

I support it. Anyone serious about European digital sovereignty should. But I want to add something the letter does not say.

## The letter is right about the disease

The diagnosis is correct, and the language is sharp. The current default is a "weak sovereignty posture" caused by years of procurement decisions made without any obligation to consider the alternative. The letter frames open source not as ideology but as the precondition for what it calls "pivotability" and "exit velocity": the ability to move infrastructure when the political weather changes.

That is the right frame. Hirschman's [*Exit, Voice and Loyalty*](https://en.wikipedia.org/wiki/Exit,_Voice,_and_Loyalty) names two responses to an institution that disappoints you: leave it (exit), or push to change it (voice). His core point is that voice has weight only when exit is credible. Apply that to digital infrastructure: lock-in is the opposite of sovereignty, whether the lock-in is enforced by a license, an API, or an undocumented integration. Open source is what makes the door work.

## But open source is not the same as sovereign

This is where my own experience starts to matter.

WordPress is fully open source. It runs about 40% of the web. In September 2024, the person who controls its update infrastructure decided to block one company's access to wordpress.org, leaving roughly 200,000 sites unable to receive plugin and theme updates. The license didn't help. The community didn't help. The Foundation didn't help. The infrastructure was the chokepoint, and the chokepoint had a single owner. The pattern is broader than WordPress: I [made the case](/open-source-agency/) recently that institutions discover the value of agency mostly by being mugged.

That is what we built [FAIR](https://fair.pm/) (Federated and Independent Repositories) to address. The Linux Foundation took it on. Ryan McCue, Mika Epstein and Carrie Dils led the technical work. About 300 people contributed. We shipped 1.0 in September 2025. It was, by any reasonable measure, exactly the kind of project the SUSE letter is asking the EU to enable.

In February 2026, [Karim Marucchi and I stepped away](/fair-wordpress-and-knowing-when-to-stop/) from FAIR for WordPress. The reason is the one I keep coming back to whenever I read documents like the SUSE letter:

> If the ecosystem won't fund neutrality, neutrality won't materialize.

I still believe that.

## What the letter is missing

The letter asks the public sector to prefer open source. That creates a demand signal. It does not answer the supply-side question: who pays for the neutral infrastructure underneath?

Open Source First as written, taken to its logical conclusion, sends public money to vendors who ship open source products. That is good. It is not, however, the same as funding the commons those products sit on. A procurement mandate that pays SUSE, Nextcloud, Penpot or Collabora for their work (all of whom I'm glad to see on the letter) does not by itself fund the plumbing underneath:

- Package repositories
- Certificate authorities
- Language registries
- Package managers
- Federated identity layers

All of that is what "open source first" assumes will be there to choose from.

I am not the only one making this argument. Dries Buytaert, the founder of Drupal, has been pressing the supply-side case throughout the same policy window. In ["Funding Open Source like public infrastructure"](https://dri.es/funding-open-source-like-public-infrastructure) he argues that public money currently flows around open source rather than into it. Procurement contracts go to the lowest bidder or to large IT vendors, not to the maintainers who actually build and secure the software. In ["What does 'Buy European' even mean?"](https://euobserver.com/210047/when-it-comes-to-techs-software-dependency-what-does-buy-european-even-mean/), co-authored with Nicholas Gates of OpenForum Europe, he uses Skype as the case study. European ownership, jurisdiction and headquarters are weak tests of long-term independence. Every one of those properties can change in a single board meeting. Gates is also the lead author of a feasibility study for an [EU Sovereign Tech Fund](https://eu-stf.openforumeurope.org/), which I'll come back to below.

That this argument is being made independently from both the WordPress and Drupal worlds is worth noticing. It is also worth acting on.

If we don't fix that, we recreate the FAIR problem at EU scale. We get a market full of qualified open source vendors, each running their own update infrastructure, each with their own single-point-of-failure governance, each one trademark dispute or hostile acquisition away from the same wordpress.org pattern. A single owner of the update infrastructure decides overnight who gets access. That isn't sovereignty. It's the same disease in a more polite jurisdiction.

## What I'd add to the letter

The Open Source First principle should be paired with a second principle: **some share of public procurement spend has to flow into shared, federated infrastructure governed independently of any single vendor.**

To return to Hirschman: Open Source First gives the public sector a credible exit. Funding the commons gives it ongoing voice in the infrastructure that exit depends on. Without exit, voice is a request the vendor can refuse. Without voice in the commons, exit just moves you from one vendor to another, never onto ground that nobody can fence off.

This doesn't have to be complicated. The mechanisms already exist. Germany's [Sovereign Tech Fund](https://www.sovereign.tech/) does a small version of it. The Linux Foundation, Eclipse Foundation, NLnet and others already host the kind of neutral infrastructure projects this would underwrite. What is missing is the policy commitment to direct money there, at scale, as a structural feature of the procurement regime rather than as occasional grant-making.

The good news is that the policy work has already been done. OpenForum Europe's feasibility study for an [EU Sovereign Tech Fund (EU-STF)](https://eu-stf.openforumeurope.org/) lays out a pan-European, mission-driven version of the German STF. It's a dedicated vehicle to fund the maintenance, security, and improvement of the open source infrastructure that the rest of the economy quietly runs on. Its supporters already include SUSE's CSO, Mozilla, Mercedes-Benz, the Sovereign Tech Agency, the cURL project, and GitHub's developer policy lead. The CAIDA is the natural home for a commitment to stand it up. Open Source First creates the demand. The EU-STF funds the supply.

The obvious objection is that EU funding produces EU-flavored forks of what should be global infrastructure. That is a real risk, and the answer is not a parallel European stack. It is EU money flowing into the neutral foundations that already exist, none of which are controlled by any single country. That is the point. EU money in, global infrastructure out.

There is also a reason the commons side is the harder thing to circumvent. The letter asks for a "qualified" open source alternative, but does not say what qualifies. And "open source" as a category is under sustained pressure in 2026. Meta's Llama license, with its usage restrictions and acceptable-use clauses, popularized a definition of "open" that no [OSI](https://opensource.org/)-approved license would permit. Without sharp teeth on what qualifies, vendors will game any procurement preference in a quarter.

Funded commons infrastructure has a different failure mode. You can't fake whether the servers run, but you can fake whether the governance is neutral. So commons funding has to come with governance teeth: federation by default, audited board independence, no single funder above a threshold. License compliance can be re-engineered with a press release. Governance capture, at least, leaves fingerprints.

A version of the CAIDA that included both, Open Source First in procurement and a binding commitment to fund the commons that procurement depends on, would be substantially harder to walk back.

## Sign it anyway

None of this is a reason not to sign the letter. Open Source First is the right principle. The June 3 window is real. The signatories so far, including SUSE, Nextcloud, Element, Collabora, Univention, Penpot, Heinlein, OpenNebula and others, are the right coalition.

Every European company, foundation, or open source project in our space should add their name before June 3. Anyone with a line into the Commission, or to MEPs working on the file, should make the second point above as well. Procurement is the demand side. The commons is the supply side. Sovereignty needs both.

[Sign the letter](https://www.suse.com/eu-tech-sovereignty-letter/), ask for the addition, read [Dries on the same topic](https://dri.es/the-software-sovereignty-scale), and read [the EU-STF proposal](https://eu-stf.openforumeurope.org/) for what the funding side could actually look like. The argument deserves more than one voice.

---

**Update, May 25, 2026:** Added a pointer to OpenForum Europe's feasibility study for an [EU Sovereign Tech Fund](https://eu-stf.openforumeurope.org/), led by Nicholas Gates. It's the concrete proposal that does the policy work for the commons-funding half of the argument, and the natural mechanism the CAIDA could commit to. I added two paragraphs and a link: one foreshadowing it in the Dries/Gates section, one in "What I'd add to the letter," and one in the closing call to action.
