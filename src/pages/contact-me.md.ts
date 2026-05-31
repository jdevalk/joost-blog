import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
    const body = `---
title: Contact
description: Ways to get in touch with Joost de Valk.
canonical: https://joost.blog/contact-me/
---

# Contact

I love hearing from people, seriously. If you want to get in touch with me, use one of the ways below or the contact form on the page. I usually reply within a few days. If you're looking for investment, it's better to use the [contact form at Emilia Capital](https://emilia.capital/contact/), as it asks more questions and guides you towards [our investment philosophy](https://emilia.capital/about-us/investment-philosophy/).

## Slack

I'm @joostdevalk on the [official WordPress Slack](https://make.wordpress.org/chat/) and @jdevalk on the [Post Status Slack](https://poststatus.com/).

## Postal address

Emilia Capital
Att Joost de Valk
Emilia van Nassaustraat 20
6602 GW Wijchen
The Netherlands

The contact form lives at [joost.blog/contact-me/](https://joost.blog/contact-me/).
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            Link: '<https://joost.blog/contact-me/>; rel="canonical"'
        }
    });
};
