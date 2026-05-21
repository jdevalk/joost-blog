---
title: What's a <em>visitor</em> in the age of AI?
publishDate: 2026-05-21T00:00:00.000Z
excerpt: >-
  In the 24 hours before I started writing this post, Plausible told me
  joost.blog had 254 visitors. My server logs told me 536 fetches over the
  same window came from on-demand AI bots like ChatGPT-User and Claude-User.
  Those bots only fire because a human, in real time, asked an AI a
  question. Is the real number 254, 790, or something else? I genuinely
  don't know, and I think that's the more interesting story.
categories:
  - AI
  - SEO
toc: true
---

In the 24 hours before I started writing this post, Plausible told me joost.blog had 254 visitors.

My own server-side bot logs told me something different. They counted 1,777 bot crawls over the same window. 536 of those came from a specific category I want to talk about: on-demand AI bots like `ChatGPT-User` (487) and `Claude-User` (49).

So which number is true? Was it 254 visitors, or closer to 800? Or somewhere in between? Or neither?

The honest answer is that I don't know. And I think the *reason* I don't know is the more interesting story.

## What -User bots actually are

There are roughly three categories of AI-related bot traffic, and lumping them together hides the part that matters.

### Training crawlers

`GPTBot`, `ClaudeBot`, `Google-Extended`. These run in the background, on the bot operator's schedule, to build or refresh a model's training corpus. Whether you want them on your site is a real question, but it's a different question from this one.

### AI search crawlers

`OAI-SearchBot`, `Claude-SearchBot`, Perplexity's index bots. These build search indexes that an AI assistant can later cite. Still scheduled, still operator-driven, but the output is a lookup table that AI assistants query, rather than model weights.

### On-demand user fetches

`ChatGPT-User`, `Claude-User`, `PerplexityBot` in user-driven mode, and a growing list of others. These bots only fire because a specific human, right now, asked an AI assistant a question that the assistant decided to answer by reading a specific URL.

[OpenAI documents](https://platform.openai.com/docs/bots) `ChatGPT-User` as "used when users ask ChatGPT or a Custom GPT to visit a URL." Explicitly not training, explicitly not scheduled crawling. [Anthropic describes](https://www.anthropic.com/legal/crawler-policy) `Claude-User` the same way: a fetch made to answer the current user's question, with the data not retained for training.

That third category is where the definition of "visitor" starts to crack.

## What Plausible sees, and what it doesn't

I use [Plausible](https://plausible.io/) for visitor analytics on this blog. It's privacy-friendly, doesn't need a cookie banner, and ships as a small JavaScript snippet that fires a pageview when a browser loads a page.

Plausible's read on that window was 254. Plausible is doing exactly what it's designed to do.

The thing it isn't designed to do is see bots, because bots typically don't execute JavaScript. ChatGPT-User and Claude-User don't run my Plausible script, so they're not in that number. Neither are any of the other bots. From Plausible's point of view, the 1,777 bot crawls simply didn't happen.

That's a feature, not a bug. The whole point of Plausible is to report on humans loading pages in browsers. If it counted GPTBot, the dashboard would be useless for the thing most people use it for.

But I also built a separate bot dashboard for this blog precisely because the other lens matters too. Cloudflare logs every request. A middleware function writes any verified bot or matched UA string to Analytics Engine, and I can slice it by bot, path, hour, and country. Both dashboards are accurate. They're just showing different worlds.

The question is which world counts as "visitors."

## The math is uglier than it looks

If I take the naïve shortcut and add the two numbers, I get 254 plus 536, or 790. That's the high-end framing. More than three times the dashboard number.

The naïve shortcut is wrong in both directions.

It's wrong on the high side because one human asking an AI a question can trigger many -User fetches. When you ask ChatGPT "what does Joost think about X," the model often pulls several of my posts at once to compare them. Five fetches, one question, one human. So those 536 fetches might be 200 distinct human queries, or 100, or 300. I can't tell from my logs, because the requests don't carry a session ID I can group by, and the AI vendors don't publish that mapping.

It's also wrong on the low side, because Plausible itself isn't a clean human count either. It misses people with JavaScript disabled, people using strict privacy tools, and people reading the markdown version of my posts directly. (Something my blog actively encourages, see [agent-ready](/agent-ready/).) Some of "my 254 visitors" are multiple sessions from the same human. Some humans visiting the site never appear in there at all.

So the honest framing is this: an unknown number of humans sit behind those 536 fetches. An unknown number sit behind the 254 visits. The two sets overlap in unknown ways. The true human count is in a wide interval, and the interval gets wider every month as more reading is mediated by AI assistants.

## "Did they actually read it?" is a different question

There's a second crack in the definition.

Even if I knew that those 536 fetches came from 250 distinct humans, I still wouldn't know what those humans experienced. When `ChatGPT-User` fetches one of my posts and the model summarizes it for the user, did the user "visit" my site? They consumed information that came from it. They might never see my name, my design, my newsletter prompt, or my links to other posts. They might never know joost.blog exists.

That's a real shift. In the browser-era web, "visitor" implicitly meant "someone who saw the page as I designed it, in the context I built." In the AI-mediated web, "visitor" can also mean "someone who consumed an extract that an AI thought was relevant, in whatever framing the AI chose."

This is what `not provided` was in 2011, scaled up and made structural. Google hid the keyword that led to a click but you still saw the click. AI assistants are going further: in many cases there is no click, and you only see the fetch.

For analytics dashboards, that matters. For SEO and content strategy, it matters more. The traditional read on a blog post is: did people click in from Google, scroll, click through to another post, sign up for the newsletter. The AI-mediated read on the same post is: did the model find it, did the model trust it, did the model cite it, did the user act on what they read.

Those are not the same loop. You can win the second one and lose the first one. You can also do the inverse, which is what most analytics setups still measure.

## Why this matters

Most decisions about a piece of content get made from analytics dashboards. Was it worth writing, did it land, should I write more like it, is the topic dying. If a meaningful fraction of human attention on a piece is now AI-mediated and invisible by design to those dashboards, the dashboard is lying in a systematic way. Not randomly, not occasionally. It's missing exactly the reads that grew the fastest in the last 18 months.

The fix is not "switch to server-side analytics and count -User fetches as visitors." That's just a different wrong answer. A fetch is a different unit from a pageview, and pretending they're the same will mislead you in the other direction.

The fix, if there is one, probably looks more like:

- **Separate dashboards for separate worlds.** Browser-human visitors, AI-mediated reads, training crawler activity, search-crawler refreshes. Don't try to add them up; you'll lose information either way.
- **New metrics for AI-mediated reads.** "Distinct user sessions in which a model fetched this post and produced an answer that used it" is the metric I actually want. I don't know who exposes that today, and getting it probably requires the AI vendors to publish data they currently keep to themselves.
- **A long-term shift in what we optimise for.** I wrote about this in [What *agent-ready* looks like for a static blog](/agent-ready/). The strategic move is to make content that an AI can read cleanly, attribute properly, and cite confidently. The metric that matches that strategy isn't pageviews, and pretending it is doesn't make it so.

## What would help

If I could get one thing from OpenAI, Anthropic, Google, and Perplexity, it would be a per-publisher report. On a given day, how many distinct user sessions caused my domain to be fetched, and how many of those sessions produced an answer that cited or summarised my content. Aggregated, anonymised, no identifying user data. Just the number that would let me reason about my actual reach.

That number won't be "visitors." It'll be something new, and it'll need a name. But it would at least be honest about what's happening, instead of leaving every publisher to squint at server logs and guess.

Until then, I'll keep watching both dashboards. And I'll keep saying "I don't know" when someone asks how big this blog is, because I really don't, and pretending otherwise is the worse error.
