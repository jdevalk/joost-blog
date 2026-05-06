import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: About Joost de Valk
description: Internet entrepreneur, founder of Yoast, WordPress contributor, and digital marketing consultant from the Netherlands.
canonical: https://joost.blog/about-me/
---

# About Joost de Valk

I'm an internet entrepreneur from the Netherlands. I'm married to [Marieke](https://marieke.com/); we have four children and live in Wijchen, the Netherlands.

I have a long history in open source and digital marketing. I founded Yoast and its Yoast SEO plugin for WordPress.

## My story

I have worn a couple of different hats in my time at Yoast. First, for almost 9 years, I was the CEO, then I became Chief Product Officer when Marieke took over as CEO. We sold Yoast to Newfold Digital in August of 2021, after which I became Head of WordPress Strategy at Newfold for a while. I then came back for a 6-month stint as interim CTO in 2022-2023. I finally left the company in April 2023.

When we left Yoast, Marieke and I started investing through our company, [Emilia Capital](https://emilia.capital/). We invest in companies that play at least partly in the digital space (and often in WordPress). Because of that, I'm on the board of [PatchStack](https://patchstack.com/) and [Atarim](https://atarim.io/). We also started our own new company; we're working hard on [Progress Planner](https://progressplanner.com/).

I founded Yoast in 2010 after working as a digital marketing consultant in several different companies. I've worked on some of the biggest SEO projects in the world, like the [Guardian's site migration from .co.uk to theguardian.com](https://www.theguardian.com/info/developer-blog/2014/feb/18/how-the-guardian-successfully-moved-domain).

In my spare time, I can often be found coaching kids' soccer at [AWC](https://svawc.nl/), where I'm also a board member. This is also why I started working on [Rondo](https://rondo.club/).

## Timeline

- **2010** — Founded Yoast
- **2019** — Stepped down as CEO; Marieke takes over
- **2021** — Sold Yoast to Newfold Digital
- **2022** — Interim CTO for six months
- **2023** — Left Newfold; started Emilia Capital
- **2024** — Launched Progress Planner
- **2025** — Building Rondo for clubs
- **Now** — Writing here; contributing to EmDash & Astro

## Find me online

- [GitHub](https://github.com/jdevalk)
- [LinkedIn](https://www.linkedin.com/in/jdevalk/)
- [Bluesky](https://bsky.app/profile/joost.blog)
- [Threads](https://www.threads.net/@joostdevalk)
- [WordPress.org](https://profiles.wordpress.org/joostdevalk)
- [Instagram](https://www.instagram.com/joostdevalk)
`;

    return new Response(body, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
};
