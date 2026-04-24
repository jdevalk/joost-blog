---
title: AI is not magic
publishDate: 2026-04-21T00:00:00.000Z
draft: true
excerpt: >-
  Too many people claim generative AI will fix things it won't fix on its own.
  Understanding what it actually does well — and what it needs from you first —
  changes everything about how you use it.
categories:
  - Post from Joost
---

Earlier this year I was at the KNVB — the royal Dutch football association — and someone said, with full confidence, that AI is going to fix the grass on our football fields.

I didn't laugh. I've heard variations of this in every sector. AI is going to fix the customer service backlog. AI is going to redesign the brand. AI is going to fix the onboarding process. The pattern is always the same: name a problem, add "AI is going to fix it," skip the part about how.

This is AI magical thinking. And it leads, reliably, to expensive disappointment.

A note on terms: when I say AI here, I mean generative AI — the large language models that power ChatGPT, Claude, Gemini, and their peers. Not AI in the broader sense of machine learning systems, which have been quietly useful in spam filters and recommendation engines for years. Generative AI is different: it predicts what should come next based on everything it has seen, and it does so with a fluency that makes it easy to mistake prediction for understanding.

## What generative AI is actually good at

Generative AI is extraordinarily good at one thing: **iterating on an existing foundation**. It is not good at originating. And when the foundation is broken, it won't fix it on its own — you have to direct it deliberately to do that, which requires someone who understands the problem deeply enough to give that direction. Without it, AI builds on top of the cracks and makes them bigger.

Confusing these capabilities is responsible for most of the overclaiming.

When I was building [Rondo](/autonomous-feedback-agent/) — a sports club management platform — I needed a visual identity for it. I didn't prompt my way to a brand. My designer and illustrator spent time understanding what the product is, what it should feel like, and what it needs to communicate. They came back with a design language: a logo, a color palette, a typographic direction.

Only after that existed could AI become useful. Once the design system was in place, AI became an excellent executor. It generates variations, applies the style consistently, adapts assets across contexts — in minutes rather than hours. But it can only do that because the taste and judgment had already been encoded by a human.

Ask AI to invent the design identity from scratch and you get something generic. Competent, sometimes even pretty, but without the specific character that makes a brand distinctive. Generative AI has no taste of its own. It has absorbed everything and averaged it. That produces a particular kind of blandness that is hard to describe and impossible to miss.

This is not a flaw. It is the nature of the tool. As I argued in [Why healthy doubt beats AI confidence theater](/healthy-doubt/): generative AI is a knowing machine. It predicts. It has no capacity for judgment. Every output arrives with the same polished confidence, whether it is right or not.

## The infrastructure problem

The same dynamic plays out at the infrastructure level. WordPress's AI features — the Abilities API, the AI client, the agent-ready plugin architecture — are genuinely good. AI can use them well. But as I described in [The generalization tax](/wordpress-architecture-base-ai/) and [Vibe coding is a trap](/vibe-coding-trap-design-system/), those features were built on top of foundations that were never fully sorted. Which means that when AI starts building on top of them, it keeps running into the cracks underneath. The features work. The problem is what they are standing on.

You can fix those foundations with AI — but only if you direct it deliberately toward that work. That requires someone who understands the architecture well enough to know what needs fixing and in what order. That is not something you can skip by throwing more AI at it.

This is what makes AI magical thinking genuinely dangerous, not just optimistic. Generative AI output is always well-presented. The code compiles. The copy reads smoothly. The analysis looks thorough. That surface confidence makes it easy to miss that the foundation underneath is cracked. You only find out later, when something fails in a way that is hard to trace precisely because it looks so deliberate.

So back to the KNVB and the grass. What would it actually take for AI to improve pitch quality? Systematic data collection on drainage, soil composition, usage patterns, and maintenance schedules. A data infrastructure that does not exist yet. Agronomists who know which questions to ask. Someone who understands the problem well enough to direct the work. And then, once all of that is in place, AI that can surface patterns and make recommendations faster than any human can manually.

That is a real use case. It is also years of unglamorous work before AI adds any value. "AI is going to fix the grass" skips all of it.

## The practical principle

Before applying AI to any problem, ask two questions.

**Does the creative foundation exist?** Has a human done the work of establishing taste, direction, and constraints? If not, do that first. AI will then be an excellent executor. Skip it, and AI will give you something average at speed.

**Is the base layer solid?** Are the underlying systems maintained, documented, and coherent? If not, the first job is directing AI — or humans, or both — to fix that deliberately. AI will not discover the problem on its own. It will build on top of it.

AI is an accelerator. Point it at the right thing and it makes you incredible. Point it at the wrong thing and it helps you waste time at scale.

The hard part is not the AI. It is knowing which thing you are doing before you unleash it. Validate first. Then use AI to move fast.
