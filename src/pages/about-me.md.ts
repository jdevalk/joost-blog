import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: About Joost de Valk
description: Internet entrepreneur from the Netherlands. Group Head of AI & Growth at Your.Online, founder of Yoast, and investor through Emilia Capital.
canonical: https://joost.blog/about-me/
---

# About Joost de Valk

I'm an internet entrepreneur from the Netherlands. I'm married to [Marieke](https://marieke.com/); we have four children and live in Wijchen, the Netherlands.

Today I'm Group Head of AI & Growth at [Your.Online](https://your.online/), leading an AI team that builds tools to help entrepreneurs get online and grow. Before that I founded Yoast and its SEO plugin for WordPress, and I have a long history in open source and digital marketing.

## My story

My story starts on the early web. I began blogging in 2004 and ran css3.info, one of the first sites tracking the CSS3 standard as browsers started to support it. Alongside that, I consulted on some of the biggest SEO projects in the world, like the [Guardian's site migration from .co.uk to theguardian.com](https://www.theguardian.com/info/developer-blog/2014/feb/18/how-the-guardian-successfully-moved-domain). I founded Yoast in 2010.

I wore a few different hats there. For almost 9 years I was the CEO, then I became Chief Product Officer when my wife [Marieke](https://marieke.com/) took over as CEO. We sold Yoast to Newfold Digital in August of 2021, after which I became Head of WordPress Strategy at Newfold for a while. I then came back for a 6-month stint as interim CTO (because they were suddenly without one) in 2022-2023. I finally left the company in April 2023.

When we left Yoast, Marieke and I started investing through our company, [Emilia Capital](https://emilia.capital/). We invest in companies that play at least partly in the digital space (and often in WordPress). Because of that, I'm on the board of [Patchstack](https://patchstack.com/) and [Atarim](https://atarim.io/). We also started our own new company, [Progress Planner](https://progressplanner.com/). In June 2026, Progress Planner and our whole team [joined Your.Online](https://joost.blog/progress-planner-joins-your-online/), a hosting group with strong European roots. I'm now Group Head of AI & Growth there, and Marieke is Group Head of Brand & Community.

In my spare time, I can often be found coaching kids' soccer at [AWC](https://svawc.nl/), where I'm also a board member. On holidays, Marieke and I love spending time in our [holiday home in Tuscany](https://limonaia.house/) or traveling to other places in the world.

## Timeline

- **Now** — Group Head of AI & Growth at Your.Online
- **2026** — Progress Planner joins Your.Online
- **2024** — Launched Progress Planner
- **2023** — Left Newfold; started Emilia Capital
- **2022** — Interim CTO for six months
- **2021** — Sold Yoast to Newfold Digital
- **2019** — Stepped down as CEO; Marieke takes over
- **2010** — Founded Yoast
- **2006** — Ran css3.info

## Find me online

- [GitHub](https://github.com/jdevalk)
- [LinkedIn](https://www.linkedin.com/in/jdevalk/)
- [Bluesky](https://bsky.app/profile/joost.blog)
- [Threads](https://www.threads.net/@joostdevalk)
- [WordPress.org](https://profiles.wordpress.org/joostdevalk)
- [Instagram](https://www.instagram.com/joostdevalk)
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            Link: '<https://joost.blog/about-me/>; rel="canonical"'
        }
    });
};
