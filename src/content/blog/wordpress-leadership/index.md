---
title: Breaking the Status Quo
publishDate: 2024-12-20T00:00:00.000Z
excerpt: >-
  WordPress is at a crossroads, now even more clearly then when I wrote my
  previous post on WordPress’s roadmap. I had very much intended to leave this
  topic alon
categories:
  - WordPress
featureImage:
  src: ./images/wordpress-fire-scaled.webp
  alt: ''
---
## A vision for a new WordPress era

WordPress is at a crossroads, now even more clearly then when I wrote my [previous post on WordPress’s roadmap](/wordpress-roadmap/). I had very much intended to leave this topic alone for a bit until after the holiday break, until, last night, Matt [imposed a holiday break on us all](https://wordpress.org/news/2024/12/holiday-break/).

This holiday break [caused issues](https://github.com/WordPress/wordcamp.org/issues/1450) that needed immediate fixing, but also makes more clear that we don’t have the luxury of waiting.

We, the WordPress community, need to decide if we’re ok being led by a single person who controls everything, and might do things we disagree with, or if we want something else. For a project whose tagline is “Democratizing publishing”, we’ve been very low on exactly that: democracy.

I read the recent open letter by [20 signatories on the Repository](https://www.therepository.email/wordpress-contributors-and-community-leaders-call-for-governance-reform-in-rare-open-letter) who say “we stand with you” and make very clear that they object to the current status quo. I agree with most everything they say, and I want us all to take a step further: let’s get to solutions.

You’ll have heard the proverb “it takes a village to raise a child” and that’s *very* much how I think about developing CMSs too. You need many voices, many ideas, many backgrounds. You need to embrace diversity. Unfortunately, those with ideas that don’t follow the same direction as our current leader, are being shut down, quite a few even banned, hence the reason that those 19 signatories mentioned above chose anonymity. I get it and I respect it.

Our [BDFL](https://en.wikipedia.org/wiki/Benevolent_Dictator_for_Life) is no longer Benevolent, and because of that, speaking up in public is a risk. In [an interview with Inc](https://www.inc.com/#:~:text=Is%20Matt%20Mullenweg%20the%20Mad%20King%20of%20WordPress%3F) (which to be fair Matt called a “[hit piece](https://ma.tt/2024/12/inc-hit-piece/)” himself) Matt said he preferred the term “enlightened leader” over “dictator”. I asked ChatGPT what would be qualities of an enlightened leader, it gave me the following:

> An enlightened leader embodies qualities that inspire trust, foster growth, and guide others with wisdom, compassion, and integrity.

I think it’s fair to say that most in the community would disagree with that being an apt description of Matt’s current behavior.

## On contributing & influence

While at Yoast, we always contributed “big”. Mostly because we *wanted* to, but quite often also because we *had to*: if we didn’t build the APIs to integrate into the things we wanted to integrate with (for example: Gutenberg), we simply couldn’t. As owners of Yoast we’ve spent *well* over 5% of revenue over the course of my time there on WordPress core development and that tradition seems to mostly continue there today.

In exchange for our contributions, I did get some say in where WordPress went, though never officially, and never when it went in directions that Matt disagreed with. Over time, that influence became less as Matt tightened his grip on the project. I think that tightening was in part a cramp. Wanting to control more what people were working on, because the project wasn’t progressing fast enough in the direction he wanted it to go in.

A lot has happened over the last few months, that I think all comes down to the above. I’ve often considered how the WordPress world “worked” unhealthy. I’ve spoken to many slightly outside of our industry over the past months about what was happening and several people, independent of each other, described WordPress as “a cult” to me. And I understand why.

I think it’s time to let go of the cult and change project leadership. [I’ve said it before](/transparency-contribution-and-the-future-of-wordpress/): we need a “board”. We can’t wait with doing that for the years it will take for Automattic and WP Engine to fight out this lawsuit. As was [already reported](https://www.404media.co/wordpress-wp-engine-preliminary-injunction/), Matt said recently in Post Status that “it’s hard to imagine wanting to continue working on WordPress after this”. A few days later, he gave a [completely conflicting message](https://x.com/WordPress/status/1868605324229263840) in the State of the Word. Yet he never came back on that first statement or clarified that he’d changed his mind. He also didn’t come back to talk to the community he turned his back on.

Last night, he disabled the registration of new accounts on WordPress.org and said this in his post:

> I hope to find the time, energy, and money to reopen all of this sometime in the new year.

What if Matt *doesn’t* reopen registration? Or only does so for people with an `@automattic.com` email address? Let’s be clear: he *could*.

I’m still, to this day, *very* thankful for what Matt has created. I would love to work *with* him to fix all this. But it’s clear now, that we can no longer have him be our sole leader, although I’d love it if we could get him to be *among* the leaders.

## What should happen now?

In my ideal world, the following things happen:

1. A WordPress foundation like entity becomes the lead of the project, and gets a board of industry people, from diverse backgrounds.
2. WordPress.org and all other important community assets that are currently “Matt’s private property” are handed over to that foundation.
3. The WordPress trademark is given to the public domain or otherwise dealt with in such a way that every company can freely say that they do “WordPress hosting”, “WordPress support” etc. Not just because that’s the right thing to do in my mind, but because doing so means we allow growth of the terms and the concepts.
4. People and companies can become sponsors of this WordPress foundation like entity, and we give some perks to those sponsors (for instance, listing them on a hosting page) and we disclose all of that transparently.
5. We create several small teams responsible for Architecture, Product, Events, etc. and create a proper governance structure around this.

There’s lots more to figure out, but these are steps that must be taken fast. On the code side we need to take steps too, and we can most quickly act on one that has become very clear that we need immediately:

## Federated And Independent Repositories

We need to supplement WordPress.org updates with other sources, so that what happened to Advanced Custom Fields, can’t happen again. Lots of hosts are currently experimenting with or already putting in place mirrors of WordPress.org. This creates issues: download and active install statistics are no longer reliable, for instance.

Just having mirrors of WordPress.org also doesn’t *really* solve the problem of a single party controlling our single update server. For that, we need to make sure that those mirrors federate with each other, and share each others data and, [as Karim suggested](https://marucchi.com/wordpress-leadership-continued/), allow for independent plugins and themes to be hosted there, outside of the wordpress.org repository. I call this: Federated and Independent Repositories, in short: FAIR.

I’m already talking to several hosts about this, and would welcome anyone who wants to join these conversations, so we’re not duplicating work.

Matt might not agree to my first five points above. However: we can still work on the Federated and Independent Repositories without his permission, because frankly, we don’t need it.

**We take back the commons.**

## What is my role in this?

I’ve already been working and talking to lots of people over the last few months trying to find ways out of this. I want to hold this community together. This resulted in several conversations, starting with my conversations with Matt and how to reconcile, to several conversations I’ve initiated with key community people & hosting leaders. This led to a deeper conversation with Karim Marucchi, CEO of [Crowd Favorite](https://crowdfavorite.com/), one of the WordPress world’s first enterprise-grade agencies, about breaking away from the status quo and focusing on the future. I feel this gives me a base for moving the conversation forward with people that I can fall back on and who can help to transition us to what’s next.

Taking back the commons means that we try to hear every voice, be considerate of all the different use cases of that commons and bring us all forward. We may not all agree along the way, but we’ll talk about that openly, without fear. We may make mistakes, and then we’ll set them right, and if needed, apologize.

I’m here, and willing to lead through this transition. I *do* have the time, the energy *and* the money needed to fund myself doing it. I’ve worked in this industry and this community for close to 20 years and it’s very dear to me. Thanks in large part *to* the WordPress project, I have the privileged position to be able to drop and/or delegate some of the stuff I’m working on and start working on this.

Let me be clear though: we should not replace one BDFL with another. This is a moment of transition. I’m also very willing to work with other leadership if it turns out the community wants someone else.

If you haven’t already, go read [Karim’s post](https://marucchi.com/wordpress-leadership-continued/) too and let me know all your thoughts. In the comments here, on [Bluesky](https://bsky.app/profile/joost.blog), [X](https://twitter.com/jdevalk), through DMs somewhere or through my [contact form here](/contact-me/).

## What happens *now*?

Right now, in the next few weeks: nothing. We do, truly, all deserve this holiday break (for those it applies to). I’m going to celebrate the holidays with my wife, children and wider family. I hope everyone can reflect about this throughout the holiday season (or you block it out entirely, and think about it later, fine too!).

We (being Karim and myself) will start 2025 by getting into a (probably virtual) room half way through January with lots of the leaders of this community & industry and decide where we go from here. So, enjoy, rest, and get ready!
