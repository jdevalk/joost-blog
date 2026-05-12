---
title: Canvas, Moodle, and the agency you forgot to <em>use</em>
seo:
  description: The Canvas/Instructure breach hit 44 Dutch institutions at once. Switching to Moodle only counts as agency if you actually run it yourself.
publishDate: 2026-05-12T00:00:00.000Z
excerpt: >-
  The May 2026 Canvas/Instructure breach is the latest mugging. 8,800
  institutions, including 44 in the Netherlands, found out at once that they
  did not operationally control their students' data. UBC's response is the
  receipt: they did not switch to managed Moodle. They self-hosted.
categories:
  - Open Source
toc: true
draft: true
password: Marieke
---
Between 29 April and 11 May, the criminal group ShinyHunters broke into [Canvas, the learning management system run by Instructure](https://en.wikipedia.org/wiki/2026_Canvas_security_incident), twice. The first intrusion went on for days before Instructure noticed. The second came in via the *Free-for-Teacher* tier on 7 May, after Instructure had publicly declared the incident contained. 3.65 terabytes of data, around 275 million records, from roughly 8,800 institutions. Names, email addresses, student ID numbers, and the private messages students had exchanged with their teachers. On 11 May, Instructure [paid an undisclosed ransom](https://www.insidehighered.com/news/tech-innovation/administrative-tech/2026/05/11/instructure-pays-ransom-canvas-hackers) and said the stolen data had been destroyed.

In the Netherlands the list reads like the public university directory: [Universiteit van Amsterdam, Vrije Universiteit, Erasmus Rotterdam, Tilburg, TU Eindhoven, Maastricht, Twente, and 37 others](https://nltimes.nl/2026/05/05/canvas-hack-student-data-44-dutch-universities-schools-taken-massive-breach). Forty-four institutions in one country, all finding out at the same moment that they had no operational control over their students' data. Several of them [disconnected Canvas themselves after the second intrusion](https://nltimes.nl/2026/05/09/dutch-universities-disconnect-canvas-hackers-claim-continued-access), because Instructure had been wrong the first time. They had said the incident was contained. It wasn't.

The Next Web compressed the structural point into a headline: ["The largest education data breach in history was not an attack on a school, it was an attack on a vendor."](https://thenextweb.com/news/the-largest-education-data-breach-in-history-was-not-an-attack-on-a-school-it-was-an-attack-on-a-vendor) That sentence is the entire mugging.

## On paper, in practice

Late last month I published [The agency case for open source](/open-source-agency/), in which I argued that institutions discover the value of agency mostly by being mugged: the International Criminal Court, Schleswig-Holstein, Denmark's Ministry of Digitalisation, the WordPress sites that lost their plugin updates in 2024, the teams who scrambled when Terraform and Redis relicensed. Canvas is receipt #6. The argument it makes is the argument that essay already makes. If you want the full version, go read [that one](/open-source-agency/).

But this case exposes a wrinkle I did not pin down clearly enough the first time, and it is worth saying out loud.

Most of the institutions running Canvas were already on what their procurement teams would have called "open standards" or "your data, your terms." Canvas exports LTI. Instructure publishes a REST API. The contracts mention data portability. The Canvas source code itself is [AGPLv3, on GitHub, pushed the same day Instructure deploys it to production](https://github.com/instructure/canvas-lms). On paper, every Dutch university could walk away, including walking away to their own copy of the exact same software.

In practice, on 5 May, they couldn't.

That is the wrinkle. *Agency-in-principle* and *agency-in-practice* are not the same thing, and the gap between them is where the muggings happen.

## The four properties, run through the LMS

In the agency post I argued that open source's enduring value rests on four properties: verifiability, forkability, jurisdiction independence, and permanent availability. The Canvas case lets you read each one with operational eyes instead of theoretical ones.

### Verifiability

Could any Canvas customer have inspected the security boundary that ShinyHunters walked through? Could a single Dutch university, before signing the contract, have looked at how the *Free-for-Teacher* tier was networked to the paid tenants? No. Verifiability requires both source access *and* the institutional capacity to use it. Canvas customers had neither. The ICC, Schleswig-Holstein, and Denmark already figured this out about their stacks the hard way; education's audit is now being conducted in public.

### Forkability

The forkable thing here is Canvas itself. Any of the 44 Dutch institutions had the legal right to clone the AGPL repository, run it in their own data centre, and never speak to Instructure again. Moodle and other open source LMSes were also options. The substrate choice matters less than the question underneath all of them: could the institution actually run the thing in a week? For most of them, no. Forkability without a landing pad is theoretical, and the landing pad is operations capacity, not licence text.

UBC is illuminating because they had that capacity. They installed ["a locally running version of Moodle as a stop gap measure"](https://ltic.ubc.ca/alternative-course-hosting/) and offered urgent course migration. *Locally running.* Not a managed Moodle on someone else's infrastructure. Why Moodle and not a self-hosted Canvas, I do not know; probably whichever they already ran. What matters is that the substrate was theirs. Most of their peers did not have that option, and that was a procurement decision they made years ago without realising they were making it.

### Jurisdiction independence

Instructure is a US company. The data of 44 Dutch universities was held under a jurisdiction that several of those universities' own legal counsel would not have chosen if asked directly. The CLOUD Act applies. Schrems II applies. The fact that this breach was criminal rather than statutory is a stroke of luck, not a structural property. The AGPL licence on Canvas meant any of those universities could have run their own copy in Frankfurt or Amsterdam, under their own jurisdiction, with the exact same software they were already using. That option existed, was legal, and was free in licence terms. None of them took it. Dries Buytaert put the underlying claim more cleanly than I did in the previous post: open source is ["the only software you can run without permission. You can audit, host, modify, and migrate it yourself. No vendor, no government, and no sanctions regime can ever take it away."](https://dri.es/funding-open-source-for-digital-sovereignty) Note the *yourself*. That word is doing all the work.

### Permanent availability

Canvas is, to be fair, not going anywhere. Instructure paid the ransom and the system is back up. But "the vendor is still there" is the wrong availability question for an institution that needs to assess and resit exams the vendor's outage made impossible to grade. UBC's Moodle stop-gap is again the receipt: permanent availability for a university means *you can run your courses when your primary provider is down,* and the only way to be sure of that is to have something else already running before the outage starts.

## Operational, not nominal

UBC operationalised its agency. They hosted the alternative themselves, on their own infrastructure, under their own legal regime, with their own people running it. The substrate happened to be Moodle. It could have been a self-hosted copy of Canvas, or any of half a dozen other open source LMSes. None of those four words, *themselves, own, own, own,* is replaceable by a procurement clause, and none of them are about which LMS you chose.

This is the harder version of the argument I want to make. Agency that lives only in a contract is theatre. Agency that lives in a LICENSE file is a substrate, not a guarantee. Agency that counts is the kind your operations team has already exercised at least once, on something non-trivial. If the answer to "what would we do if our LMS vendor disappeared tomorrow" is a Gantt chart starting with *select a new vendor*, you do not have agency. You have the right to start shopping for a new dependency.

Two things have to be true for this to be operational rather than nominal. First, somebody at the institution has to be able to run the software. That is an FTE, or a partnership, or a contract with a provider under your own jurisdiction. Second, the data has to leave the vendor's system on a schedule the vendor cannot revoke. Nightly export to your own storage is not glamorous, but it is the difference between "we had a bad week" and "we lost the semester."

I made the small-scale version of this argument two years ago, when I migrated off [Help Scout](/helpscout-to-freescout/) and [Docusign](/docusign-to-documenso/). The point of those posts was not the per-month saving. It was that the moment I stopped paying for the SaaS, I was the one running the software, and the economics of running it were trivial compared with the agency that came with it. For an LMS at the scale of TU Eindhoven the costs are not trivial. Neither are the costs of what happened on 5 May.

## The agency the Netherlands forgot to build

The Dutch government runs [KNMI](https://www.knmi.nl/) for weather, [RIVM](https://www.rivm.nl/) for public health and environment, [SCP](https://www.scp.nl/) for social and cultural policy, [CBS](https://www.cbs.nl/) for statistics. Almost every domain the country has agreed it cannot afford to outsource has a national institute behind it. None exists for the digital infrastructure of education. Forty-four schools and universities, in a country with a thirty-year tech reputation, individually pay a US vendor headquartered in Salt Lake City to host their students' grades, course materials, and private messages. The aggregate decision was never made. It was the sum of forty-four separate procurement processes, each rational in isolation.

The [Delta Instituut](https://www.deltainstituut.nl/), formerly *Herprogrammeer de Overheid,* makes the general version of this argument. Their [vision document](https://www.deltainstituut.nl/artikel/onze-visie) puts it directly: *"de overheid is dus meer dan een collectie afspraken en wetten: het is de grootste technologie-operatie van Nederland."* The government is, then, more than a collection of agreements and laws. It is the Netherlands' largest technology operation. And we are running that operation increasingly on top of foreign infrastructure. Education is one of the cleanest cases of the pattern. National curriculum, national accreditation, national funding, forty-four separate LMS contracts with a company in Utah.

This is the policy ask the agency argument lands on. Not "every school should run its own Canvas," which is operational fantasy for a primary school of 300 pupils, but "the country should have an institute that does this on behalf of the schools that cannot." A KNMI for the digital substrate of education. Public infrastructure, public jurisdiction, open source code, professional operations. The model is well established in other domains. It is only in digital that the default became "let an American company run it."

## Education's turn

The pattern in *Why people start caring* is that institutions discover one by one that their agency was nominal. Last year it was governments and the WordPress community. This week it is 8,800 schools and universities, including 44 in the Netherlands. Next week it will be something else. AI has collapsed the cost of finding and exploiting vulnerabilities, and the rate of these breaches is rising to match. A clinical-trial platform, a court e-filing system, a council benefits database. Every closed SaaS layer is a future mugging on someone's calendar, and the calendar is filling up faster than the institutions are noticing.

The reason this matters more than any single breach is that *the institutions losing agency are the ones who least suspected they had lost it.* A university's procurement framework reads "your data, your terms" and stops there. The auditors tick a box. The technical leadership picks the LMS with the best UI. The contract has data portability. By the standards everybody used in 2018, this was an open, portable, well-governed stack.

It was not. It was the same agency-in-principle the WordPress site owners thought they had on 30 September 2024, the morning before Matt Mullenweg cut them off. The same agency-in-principle the ICC thought it had before its chief prosecutor's email went dark. The same agency-in-principle Terraform users thought they had the day HashiCorp moved them to BSL.

The only kind of agency that holds in 2026 is the kind you have actually used, on something real, recently enough to remember how. Everything else is a contract clause living in someone else's data centre, waiting to be tested by someone else's incident response.

---

*My wife [Marieke](https://marieke.com) works at one of the Dutch institutions on the affected list. That is how the story first reached our kitchen table.*
