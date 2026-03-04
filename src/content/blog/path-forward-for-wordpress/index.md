---
title: 'A new path forward for WordPress, and for the open web'
publishDate: 2025-06-06T00:00:00.000Z
excerpt: >-
  In December, I wrote about the state of leadership in the WordPress ecosystem.
  I shared how too much power rests with one person, and how the lack of
  transparen
categories:
  - WordPress
featureImage:
  src: ./images/wordpress-path-forward.webp
  alt: ''
---
In December, I wrote about the [state of leadership in the WordPress ecosystem](/wordpress-leadership/). I shared how too much power rests with one person, and how the lack of transparent governance puts contributors and businesses alike in difficult positions. That post ended with a call: *we need to lead*. That wasn’t rhetorical. It was a pivot.

Since then, a lot has happened. Today, I want to share what came next and where it’s going. This is the story of **FAIR**, a project I first named in that same blog post: **Federated and Independent Repositories**. At the time, it was just a placeholder for an idea. Now, it’s real, and it’s running.

### The moment the ecosystem shifted

In October, Sarah Savage [published a post introducing AspirePress](https://aspirepress.org/a-vision-for-aspirepress-and-a-community-run-org-mirror/), a community-run mirror of the WordPress.org plugin and theme repositories. That post was a spark. It showed what was technically possible, and voiced what many of us had been saying in smaller rooms for years: the ecosystem needed options.

Then, in early December, twenty core contributors [wrote an open letter](https://www.therepository.email/wordpress-contributors-and-community-leaders-call-for-governance-reform-in-rare-open-letter) calling for governance reform in WordPress. These weren’t newcomers. They were committers, team leads, people who had spent years helping build the platform. Their message added weight to the concerns many had been feeling in private.

Shortly after, [Karim Marucchi](https://marucchi.com/wordpress-leadership-continued/) and I published our thoughts. We proposed a dual-track forward: one that addressed technical issues like centralization, update bottlenecks, and discoverability, and one that introduced a different approach to governance, governance that would be transparent, accountable, and neutral.

That combination turned out to be a catalyst. Even more so after Matt [blogged about it](https://wordpress.org/news/2025/01/jkpress/) in a sarcastic post on WordPress.org. People began reaching out, and conversations happening in parallel started to overlap.

### From parallel threads to shared momentum

Several groups had been working on related problems, each bringing different perspectives, needs, and capabilities. Rather than announce a new umbrella, we focused on connecting the dots between these parallel efforts. We’re not naming everyone in that alignment publicly yet, but it’s safe to say: this *is* a group of groups, and that’s its strength.

What followed were weeks of collaboration. We mapped out which parts of the ecosystem needed reinforcement. Some things were urgent: plugin update services, the plugin and theme directories, static assets like emojis and avatars, and the dashboard feeds. We began with mirrors and drop-in replacements, but the plan was always broader than that.

We designed a system that could serve as a complete distribution layer for WordPress. It would work with the core as it exists today, stay compatible while removing the bottlenecks created by centralization, and be governed independently of .org.

### FAIR: federated, independent, and live

FAIR is now a technical project under the Linux Foundation. Its technology is governed by a community-led Technical Steering Committee (TSC) and built by contributors from across the WordPress ecosystem. The TSC chose three amazing community leaders as its chairs: Carrie Dils, Mika Epstein, and Ryan McCue. Together, they built a decentralized package management system, federation-ready mirrors, support for commercial plugins, cryptographic signing, and more in a relatively short amount of time.

The goal of FAIR is **not** to fork WordPress. We’re still using the same core software. We’re not building a separate platform. We are adding a new distribution layer and putting our own governance on top of it. It’s a new path within WordPress, not outside it.

You can still install WordPress from WordPress.org, and that won’t change. But if you want more control over how plugins are delivered, or a system that supports decentralization, FAIR gives you that choice.

This work builds on tools like Composer and package managers from the Linux world, but with a clear focus on usability for real WordPress users. Most people won’t even know how it works under the hood. They’ll just know it works.

### Why this matters

When I wrote about WordPress leadership, I meant it. Change in open source doesn’t happen from the outside. It occurs when people show up, do the work, and offer a better option. That’s what we’ve done.

FAIR is not a protest. It’s not a fork. It is a **contribution**. It reflects our belief that WordPress deserves better infrastructure and more accountable governance, and that we can build that together.

This project results from months of collaboration across companies, countries, and communities. Dozens and dozens of people have already worked on it, and more are joining daily.

You can learn more at **[fair.pm](https://fair.pm)**. There’s plenty of work still ahead, but the foundations are in place, and the path is open.

If you believe in the open web, in WordPress as shared infrastructure, and in a future where the people who contribute get a say in how the platform evolves, join us!

Other people we’ve been collaborating with have blogged as well:

- [Karim Marucchi](https://marucchi.com/introducing-the-fair-package-manager-for-wordpress/)
- [Ryan McCue](https://journal.rmccue.io/488/building-a-stronger-ecosystem/)
- [Siobhan McKeown](https://siobhanmckeown.com/a-way-forward-with-fair/)

Plus, the [press release from the Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-fair-package-manager-project-for-open-source-content-management-system-stability).
