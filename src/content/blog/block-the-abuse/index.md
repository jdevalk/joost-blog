---
title: Block the abuse, <em>not</em> the future
seo:
  description: Anti-AI CAPTCHAs treat every agent as an attacker. They break legitimate automation, punish paying customers, and bet against the way the web is going.
publishDate: 2026-06-02T00:00:00.000Z
excerpt: >-
  This week I shipped an MCP so AI agents could read one of my sites. The
  same week, one of my hosts shipped a CAPTCHA to keep them out. Only one of
  us is reading the room.
categories:
  - AI
  - Strategy
toc: false
---
This week I shipped an MCP so AI agents could read [specification.website](https://specification.website). Also this week, one of my hosts shipped a CAPTCHA on another of my sites. To keep the agents out. Only one of us is reading the room.

## Why I shipped the MCP

Making a site legible to agents is becoming table stakes. Agents are readers, and they act on behalf of readers who are starting to buy through them. An MCP is the cheapest possible front door. If I ask Claude for an MCP to find X, it will find one. If you do not have one, it finds someone else's.

That is the whole reason to ship one. I have been [building it by design](/agent-native/) for a while now. The same stateless server, the same content negotiation on the same URL, the same discovery wired into every response. The cost is small. The payoff is being one of the candidates the agent considers, instead of being absent from the shortlist.

## Why the CAPTCHA enrages me

Anti-AI CAPTCHAs treat every agent as an attacker. They do not distinguish between a script scraping a customer database and a paying user's assistant fetching a page on their behalf. They break legitimate automation, mine included. They punish your own paying customers, who, like the rest of us, are starting to delegate tasks to agents. And they read as a host fighting the tide rather than serving it.

## The "smart blocking" defense

A host might answer to this that they are not blanket-blocking. They are doing it the smart way: scoring requests, challenging only what looks suspicious, letting good actors through.

Except they are not. I get challenged on real requests, on my own sites. Real humans, real customers, sitting in front of a "prove you are not a robot" puzzle before they can read a page they came to read.

The cost of serving a cached page is never higher than the cost of turning a customer away with a CAPTCHA.

## The economic bet

Attention and buying intent are shifting toward agent-mediated traffic. Walling agents out optimizes for the human-only web that is shrinking, not the agent-plus-human web that is growing. It is the same misread that pushed [publishers off the open web](/defending-open-web-not-enough/) into walled platforms. The difference: this time the platform the host is betting against is not a social network. It is software running on the reader's own machine.

## The honest counter

There is a real objection here. Agents do impose cost and abuse risk. Server bills are real. Scraper floods are real. A site getting crawled to death by a model trainer with no business relationship to the owner is a real problem.

The answer is:

- Authenticate agents. There is a standard for this: [Web Bot Auth](https://specification.website/spec/agent-readiness/web-bot-auth/), built on RFC 9421, lets a bot sign each request with a key you can verify. That tells you exactly who is on the other end, which is more information than a CAPTCHA ever produces.
- Give them a sanctioned door: an MCP, an API, a paid tier with higher limits. The agent traffic worth having will use the door. The traffic worth blocking will keep doing what it already does.
- Finally, rate-limit them, per identity, per origin, per route, the same way you rate-limit humans.

Block the abuse, not the future.
