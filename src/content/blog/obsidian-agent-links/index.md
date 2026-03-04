---
title: Share Obsidian links that actually work everywhere
publishDate: 2026-02-25T00:00:00.000Z
excerpt: >-
  I’ve been playing with OpenClaw a lot, and I’m using Obsidian intensely with
  it. All my processes and even my OpenClaw’s core files live in my Obsidian
  vault. I
categories:
  - Development
  - Productivity hacks
featureImage:
  src: ./images/obsidian-scaled.webp
  alt: ''
---
I’ve been playing with OpenClaw a lot, and I’m using [Obsidian](https://obsidian.md/) intensely with it. All my processes and even my OpenClaw’s core files live in my Obsidian vault. I have Obsidian on all machines I work on, so it’s very convenient. There was only one piece missing: a way to get links in WhatsApp from my OpenClaw that point back to Obsidian.

Obsidian links look gorgeous inside your vault, but drop one into WhatsApp or Telegram and you get a dead `obsidian://` URI, useful only inside Obsidian itself. The whole point of [obsid.net](https://obsid.net/) is to make those notes shareable in agent-human conversations: your bot can send a link in WhatsApp to obsid.net, and it redirects you straight into the right Obsidian note.

You don’t need to install anything for it to work. The `obsidian://` URL handler just works, and obsid.net just redirects to it. It’s just a simple `https://obsid.net/?vault=…&file=…` link you can paste into WhatsApp, Slack, email, or any chat that refuses to run custom schemes.

Why care? Because in human + agent chats, the agent often is the one sharing notes to you. Codex, Claude, or any cron job can now output safe obsid.net URLs instead of raw obsidian:// URIs, and you can open them anywhere. obsid.net links also look like (no, *are*) normal HTTPS URLs, so they survive log archives, bookmarking, and every chat frontend you already use.

So, give obsid.net a try! Convert one of your old `obsidian://` links, install the skill or helper for your agent, and then share the note inside WhatsApp or Telegram. No extra installs (well, except for the skills maybe), just a small redirect that keeps every Obsidian link tappable in your agent conversations.
