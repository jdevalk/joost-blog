---
title: "Vol. XV: out with the <em>AI slop</em>"
publishDate: 2026-05-09T00:00:00.000Z
excerpt: >-
  Why I redesigned joost.blog: getting rid of AI-generated post imagery,
  building the plumbing for longer pieces, and the typography rabbit hole
  that landed on Klim's Domaine and Pitch.
categories:
  - Personal stuff
  - Development
toc: true
---

The driver for this redesign was simple. The old site had a system for generating an AI image for every blog post, with structured prompts that kept everything in the same visual style. At first I liked it. Over a few weeks, that flipped. It was <em>AI slop</em>, and I disliked seeing it on my own site every time I opened the homepage.

I decided I didn't want AI-generated images on my posts at all; the design and the typography should do that work instead. Once that landed, the rest piled on. I've been writing more, and longer. The old layout didn't have a real table of contents on a post. The archive wasn't easy to browse. If I was going to keep posting essays of two or three thousand words, I needed the plumbing for it.

So: redesign.

## A Journal-style direction, courtesy of Claude

I asked [claude.ai/design](https://claude.ai/design) to come up with directions. It returned a Journal-style layout: serif display, numbered sections, generous margins. The shape was right immediately, so I stopped exploring layouts and started exploring color.

Color was the longest part of the process. I went through a lot of palettes before landing on the combination you see now: a warm parchment body, dusk blue with a terracotta accent, and midnight hero panels.

<figure style="display:flex;flex-wrap:wrap;gap:32px;margin:32px 0;padding:0">
  <div style="flex:0 0 150px">
    <div style="background:#e4e2dc;aspect-ratio:1;border:1px solid rgba(0,0,0,.08);border-radius:2px"></div>
    <div style="margin-top:10px;font-size:14px;line-height:1.4"><strong>Parchment</strong><br><code>#e4e2dc</code></div>
  </div>
  <div style="flex:0 0 150px">
    <div style="background:#1f2530;aspect-ratio:1;border:1px solid rgba(0,0,0,.08);border-radius:2px"></div>
    <div style="margin-top:10px;font-size:14px;line-height:1.4"><strong>Ink</strong><br><code>#1f2530</code></div>
  </div>
  <div style="flex:0 0 150px">
    <div style="background:#4a6480;aspect-ratio:1;border:1px solid rgba(0,0,0,.08);border-radius:2px"></div>
    <div style="margin-top:10px;font-size:14px;line-height:1.4"><strong>Dusk</strong><br><code>#4a6480</code></div>
  </div>
  <div style="flex:0 0 150px">
    <div style="background:#e08a5a;aspect-ratio:1;border:1px solid rgba(0,0,0,.08);border-radius:2px"></div>
    <div style="margin-top:10px;font-size:14px;line-height:1.4"><strong>Terracotta</strong><br><code>#e08a5a</code></div>
  </div>
  <div style="flex:0 0 150px">
    <div style="background:#2c3447;aspect-ratio:1;border:1px solid rgba(0,0,0,.08);border-radius:2px"></div>
    <div style="margin-top:10px;font-size:14px;line-height:1.4"><strong>Midnight</strong><br><code>#2c3447</code></div>
  </div>
</figure>

Accessibility kept pulling me back. A combination that looks gorgeous on a mockup falls apart the moment you check contrast at body-text size, or when somebody reads the page on a dim phone screen. I rejected several palettes I liked on aesthetics alone.

## Klim: Domaine and Pitch

With the colors settled, I went looking for fonts. I've been a fan of [Klim Type Foundry](https://klim.co.nz/) for a while. They make some of the very nicest fonts out there, and their [Domaine Display and Domaine Text](https://klim.co.nz/collections/domaine/) are absolutely gorgeous. They were the obvious choice for a Journal-style design.

For code, I went looking for a typewriter font that fit. Browsing Klim's catalogue I ran into [Pitch](https://klim.co.nz/collections/pitch/), and that was that. Domaine for display and reading, Pitch for code.

```css
:root {
  --parchment:  #e4e2dc;
  --ink:        #1f2530;
  --dusk:       #4a6480;
  --terracotta: #e08a5a;
  --midnight:   #2c3447;
}
```

<p style="margin:-20px 0 28px;font-style:italic;color:var(--ink-soft);font-size:14px;text-align:center">↑ A sample of Pitch, doubling as the post's color tokens.</p>

## What was actually hard

The visual direction came together quickly. The boring part was the engineering after the handover. Claude.ai/design produces a polished set of pages, but it likes to drift between them: the header subtly different here, the footer laid out differently there. Forcing one canonical header and footer everywhere, and making the templates actually share them, took more iteration than the visual design itself did.

Design tools are great at "what should this look like." They're not great at "and now make sure every page agrees." That part is still the engineer's job.

## The plumbing

The other half of the project, the part that's harder to screenshot, is the reading infrastructure. Every long post now carries a sticky table of contents on the left, so you can see where you are in a three-thousand-word piece without scrolling back to the top. On mobile, where there's no sidebar, that table of contents collapses into a sticky bar at the top of the screen. The bar stays hidden until you scroll past the hero, then fades in and names the section you're reading as you scroll. Tap it to drop down the full list and jump anywhere. The current-section tracking that powers the mobile bar is the same code that highlights the active item in the desktop sidebar — same data, two layouts.

The [blog archive](/blog/) is now a scannable list of rows, grouped by year, with filters for year and topic so you can narrow down to "everything I wrote about WordPress in 2024" in two clicks. The homepage carries a featured article at the top so the most recent piece isn't buried under everything else.

## The code page

The page that took the most engineering after the blog post template was [/code/](/code/). I do a lot of open source, and it lives across different ecosystems: Astro packages, [EmDash](https://emdashcms.com/) plugins, WordPress plugins, [Rondo](https://rondo.club), and a long tail of contributions elsewhere. The old layout couldn't really show all of that together. It could pin one project at the top and bury the rest, or list everything as one undifferentiated dump.

The new page treats it as a catalog: numbered sections per project family, a contents nav at the top with item counts, and uniform per-package rows underneath. I can point someone there now without having to add "and also...".

## The video pages

One more piece I'm particularly happy with: the [video pages](/videos/). Take [this keynote on sustainable open source](/videos/sustainable-open-source-is-the-future/). Scroll the transcript, click any timestamp, and the video jumps to that point. You can read it like an article and dip into the video for the moments you care about.

## Vol. XV

The kicker on the homepage reads VOL. XV. That's because this is the fifteenth version of my personal blog I could find. I've been writing on my own domain since June 2004, so fifteen iterations is a fair record. Felt worth marking on the page.

The AI imagery is out, the plumbing is in, and the type is doing the work.

I have more writing to do.
