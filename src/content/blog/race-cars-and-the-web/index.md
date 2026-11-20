---
title: Race cars and the web
publishDate: 2026-11-20T00:00:00.000Z
excerpt: >-
  Jono Alderson's house analogy is good, but race cars explain more: features start in the extreme machine, break, get reliable, and end up in every car. On the web, JavaScript is the race car and HTML is the road car.
draft: true
password: samalderson
categories:
  - Development
seo:
  title: Race cars and the web
  description: Features start in the extreme machine, break, get reliable, and end up in every car. On the web, JavaScript is the race car and HTML is the road car.
---

Jono Alderson wrote a lovely post this week about [the house that JavaScript built](https://www.jonoalderson.com/misc/the-house-that-javascript-built/). A house where the lights take eight seconds to come on because the switch has to ask three boxes for permission, where the Wi-Fi drops when you boil the kettle, and where every repair costs a fortune because you can't change one thing without disturbing three others. It's a good analogy. It captures what it feels like to live in a JavaScript framework.

But I think there's a more natural one. Race cars.

## The pattern is always the same

In motorsport, the pattern is always the same. Someone wants to do something a normal car can't do. Go faster round a corner, brake later, use less fuel. So it gets built first in the extreme machine, where cost doesn't matter and breaking is acceptable. Early turbo engines in Formula 1 blew up constantly. The first paddle-shift gearboxes were fragile. The first carbon fibre monocoques were exotic and terrifying.

Then it starts working. Then it becomes the norm. Disc brakes, turbocharging, paddle shifters, hybrid power units: all of them started in racing, broke a lot, got reliable, and ended up in the car you drive to the supermarket.

## JavaScript is the race car

The web works the same way, except the race car is JavaScript and the road car is HTML.

When someone wants something the platform can't do yet, it gets built in JavaScript first. That's the race car: fast, fragile, expensive to run. An accordion built in JS works until JS is slow, or off, or the screen reader can't find it. A modal built in JS works until the focus trap breaks. It breaks, at first, because it's doing something the platform was never designed to do.

## The road car gets it for free

Then the platform catches up, and the feature moves down into HTML, where it becomes the norm. Accordions became details and summary. Modals became dialog. Tooltips became the popover API. Lazy loading became loading="lazy". Focus trapping became inert. Tooltip positioning became CSS anchor positioning. Page transitions became the View Transitions API. The road car gets it for free, and it just works.

## The one difference that matters

There's one difference, and it matters. In racing, the trickle down is driven by cost coming down. On the web it's driven by standardisation, which needs consensus and takes years. And unlike a race car, the JavaScript version doesn't get retired when the native one arrives. The framework keeps rebuilding the thing that the platform now does for free.

Which is exactly how you end up living in Jono's house.
