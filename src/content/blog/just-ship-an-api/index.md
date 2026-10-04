---
title: If you don't ship an API, your customers will <em>build one</em>
seo:
  title: Why your customers are scraping you
  description: If you only give customers a web interface, they will automate it anyway. Here's why vendors should just ship a proper API instead.
  pageType: article
publishDate: 2026-10-04T00:00:00.000Z
excerpt: >-
  If your software only has a web interface, your customers will automate that
  interface. I've done it twice now. Why make them?
categories:
  - Development
  - AI
---

If your software has a web interface but no API, your customers will automate the web interface. I know, because I've done it. First for Sportlink, the member administration system Dutch football clubs have to use. And today, again, for another system our club runs on.

Neither vendor offers an API for the data we need. Both now have a headless browser logging in to their app several times a day, clicking through screens and pulling data out. That's not a complaint about my code. It's a question for the vendors: why make your customers do this?

## A volunteer with an afternoon

I build [Rondo](https://rondo.club), the club management app my football club uses. It needs member data: names, teams, parents, committees, photos. All of that lives in Sportlink Club, which the KNVB mandates. Sportlink has no way to get that data out programmatically.

So [Rondo Sync](https://github.com/RondoHQ/rondo-sync) uses Playwright to launch a headless Chrome, log in, generate the two-factor code, and walk through Sportlink's screens. It runs four times a day. It has a lock file so runs don't collide, change detection so it only pushes what changed, and an email report after every run. It even works the other way around: when someone corrects their email address in Rondo, the sync opens Sportlink's edit form and types the new value in for them.

None of that took a team. It's one volunteer, working with Claude Code and ChatGPT Codex. That's exactly the point. The barrier to "just automate the UI" used to be high enough that most customers didn't bother. It isn't anymore.

## The API already exists

Here's the part that bothers me most. Sportlink's web app is a JavaScript front end. It talks to its own backend through calls like `SearchMembers`, `MemberHeader` and `MemberFreeFields`, all returning nice structured JSON. Our sync doesn't scrape HTML for most of its data. It lets the browser make those calls and reads the responses.

So the API is there. It's just not offered to the people whose data it is.

To be fair, Sportlink does have a data service. It gives clubs teams, match schedules and standings to show on their website. That's the data Sportlink is happy to see on your site. The member data you're actually responsible for as a club, you can't get out.

Not every system is even that far along. Another one our club uses has no internal API to intercept at all, so the sync reads HTML tables and clicks CSV export buttons. That's worse for everyone.

## Every objection makes it worse

I can guess the reasons vendors give for not shipping an API. None of them survive contact with what happens instead.

### Security

An API is an attack surface, sure. But my automation logs in as a real user, with a real password and a TOTP secret sitting in a config file on a server. It has every permission that user has, not a narrow scope for the one thing it needs. You can't tell it apart from a human, you can't rate-limit it sensibly, and you can't revoke its access without locking out the person. A scoped API token is safer on every one of those counts.

### Support and stability

Vendors don't want to commit to a stable interface. Fine, but the customer now depends on your HTML instead, which is far less stable. Every UI change breaks someone's sync. That someone then files a support ticket, or quietly fixes their selectors at eleven at night. The maintenance cost didn't go away. You moved it to your customers, and multiplied it by every customer who automates.

### Load

A browser session loads the full app, every script, every image, every screen in between, to get at one JSON response. An API call fetches just that response. If you're worried about load, scraping is the expensive option.

### Lock-in

This is the one nobody says out loud. Without an API, the data is harder to move, so the customer is harder to lose. When a federation mandates your software, there's little competitive pressure to change that. But "harder" isn't "impossible" anymore. The data leaves anyway; it just leaves in the most fragile way possible.

## Just ship the API

What I want from vendors isn't complicated. Take the API your own front end already uses. Put authentication with scoped tokens in front of it, write some documentation, and give your customers a key. Add webhooks if you're feeling generous.

I've written before about making sites [ready for agents](/agent-ready/). The same logic applies to business software, only more so. Your customers' tools are getting better at operating software on their behalf. Whether they automate you isn't up to you anymore. You only get to choose whether they do it through a door you built, or through the window.
