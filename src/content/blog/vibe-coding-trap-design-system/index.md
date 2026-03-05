---
title: 'Vibe coding is a trap: why WordPress needs a design system NOW'
publishDate: 2025-12-23T00:00:00.000Z
excerpt: >-
  In my last post, I argued that WordPress needs to become a “Base AI”: a
  structured foundation that AI can understand and build upon. Before that, I
  wrote about
categories:
  - Development
  - WordPress
featureImage:
  src: ./images/gemini_generated_image_5nvm0e5nvm0e5nvm-scaled.webp
  alt: ''
---
In my [last post](/wordpress-architecture-base-ai/), I argued that WordPress needs to become a “Base AI”: a structured foundation that AI can understand and build upon. Before that, I wrote about [The Rise of the Architect](/rise-architect/), the person who will shift from writing code to orchestrating systems.

But there is a massive obstacle standing in the way of this future: WordPress is currently a “system” without a shared language.

We are seeing this play out in real-time with tools like [Telex](https://telex.automattic.ai/). It’s a glimpse into “Vibe Coding”, the ability to describe a UI and watch the AI manifest it. It’s seductive. It’s fun. And if we aren’t careful, it’s going to lead to a maintenance nightmare that makes the “spaghetti code” of the 2000s look like a masterpiece.

## The seduction of the “vibe”

Tools like Telex allow you to bypass the traditional development process. You want a pricing table with a specific “bounce”? You describe it, the AI generates the React and CSS, and it appears.

To a “Site Builder” persona, this might feel like magic. To an Architect, this feels like a ticking time bomb.

The problem with “vibe-coded” blocks is that they are disposable code. They are isolated islands of logic and style. When an AI generates 20 different blocks and plugins for your site based on 20 different prompts, you haven’t built a website; you’ve built 20 independent technical debt projects.

If you decide to change your brand’s primary blue or adjust your site’s spacing logic, you can’t just update a central variable. You have to “re-vibe” the entire site.

## The missing foundation: a design system

This brings me back to a point I’ve [made before](/wordpress-admin-ui-needs-to-be-better/): WordPress desperately needs a unified design system.

For years, the lack of a standardized Admin UI has hampered WordPress. Every plugin developer had to invent their own buttons, toggles, and layout logic. This was already a bad user experience for humans, but it’s a catastrophic “architectural” failure for AI.

An AI doesn’t need to be “creative” with your layout; it needs constraints.

- **Without a design system:** AI is like a toddler with a bucket of clay. It can mold anything, but nothing it makes will ever fit perfectly with the next thing.
- **With a design system:** AI is an Architect with a box of Legos. Everything snaps together because the rules, the tokens for spacing, color, and typography, are pre-defined.

## System-first vs. prompt-first

The industry is currently obsessed with “prompt-first” development (Telex). But the “Architect” I described in my earlier posts knows that the future must be “system-first.”

In a system-first world, the AI doesn’t write the CSS for a button. Instead, the AI *selects* the “Primary button” component from the WordPress Design System and configures it. The “Base AI” ensures that the output is predictable, maintainable, and, most importantly, updatable.

If WordPress remains a collection of “vibes” rather than a rigid system of components, we are effectively building a web of disposable components. We are trading the long-term health of our sites for the short-term high of watching an AI generate a pretty block in ten seconds.

## The choice

We are at a fork in the road.

We can follow the path of unstructured generation, where AI fills WordPress with an endless stream of unmaintainable, bespoke code. Or, we can finally do the hard work of building a robust design system that provides the “rails” the AI needs. Of course, we’d then also have to ensure plugins and themes use that design system, but I think that with a good carrot approach (in which we promote those that use the design system), we can go a long way.

If we want the “Rise of the Architect” to be a success, we need to stop asking AI to be a painter and start asking it to be an assembler. But first, we have to give it the right base parts.
