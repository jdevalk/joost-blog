---
title: 'Google’s robots changes, the web & the law'
publishDate: 2019-09-12T00:00:00.000Z
excerpt: >-
  Google announced a few days ago that they would change the way rel="nofollow"
  works for them. They would start treating nofollow as a “hint” instead of a
  “direc
categories:
  - Search Opinion
featureImage:
  src: ./images/Robots_FI.png
  alt: ''
---
Google [announced a few days ago](https://webmasters.googleblog.com/2019/09/evolving-nofollow-new-ways-to-identify.html) that they would change the way `rel="nofollow"` works *for them*. They would start treating `nofollow` as a “hint” instead of a “directive”. This means they go from “oh you don’t want us to go into that room? ok” to “oh you don’t want us to go into that room? We’ll see about that”. Basically, they went from friendly neighbor to annoying parent real quick.

Now `rel="nofollow"` is something you’d attach to links on your site. So I could nofollow one link and not nofollow another. There is also a `meta robots` directive, used like this:

```
<meta name="robots" content="noindex,nofollow"/>
```

This would historically *direct* Google to not show that page in its index, and not follow its links. Now Gary Ilyes tweeted this last night:

> 1\. There's no meta robots ugc and sponsored, it won't do anything if you add that.  
> 2\. Meta robots nofollow is a hint now, like rel-nofollow.  
> 3\. I'll update the docs tonight to say this explicitly.
> 
> — Gary 鯨理／경리 Illyes (so official, trust me) (@methode) [September 12, 2019](https://twitter.com/methode/status/1171951127916699648?ref_src=twsrc%5Etfw)

Gary tweeting about rel nofollow and meta nofollow. #2 is important in this context: “meta robots nofollow is a hint now”When Gary says “meta robots nofollow is a hint now”, I become slightly nervous. Because if `nofollow` in a meta robots element is a *hint*, what is `noindex`? Do they now want to treat that as a hint? or as a directive? Turns out, `noindex` remains a directive:

<https://web.archive.org/web/20190927174635/https://twitter.com/dannysullivan/status/1171769802354057218>

But, even if Google now says “`noindex` will remain a directive”, won’t that lead to years and years of discussion? In my experience, even many experienced SEOs don’t always understand the difference between directives and hints, and think they’ve excluded something when they haven’t. This change will only make this worse.

## Google unilaterally makes changes

My biggest gripe with this is that Google is making these changes unilaterally. Bing, Yandex, Baidu: all support `rel="nofollow"` and other search engines probably do too. The same is true for `meta robots nofollow`. I don’t think it’s a good idea when Google decides on its own that it changes the “laws” of the web.

Google were the ones to introduce `rel="nofollow"`, which gives them *some* rights to change that “standard”. However, `meta robots nofollow` has been [around since 1996](https://www.robotstxt.org/meta.html). In fact, this part of the meta robots page made me chuckle:

> robots can ignore your `<META>` tag. Especially malware robots that scan the web for security vulnerabilities, and email address harvesters used by spammers will pay no attention.
> 
> Taken from the [Robots pages](https://www.robotstxt.org/meta.html)

Apparently, I should consider Googlebot malware from now on 😉

## Real world implications

Let’s look at real world implications: a link in a comment on a WordPress site used to have `rel="nofollow"` added to it automatically. We’ll now have to change `rel="nofollow"` to `rel="nofollow ugc"`. We can’t take out the `nofollow`, because other search engines don’t support the `ugc` part, but Google, with its market domination, will urge us to make that `ugc` change.

Now Google’s first reply to this will be “you don’t have to change anything if you don’t want to, we even said that in our post”. And they did:

> There’s absolutely no need to change any nofollow links that you already have.
> 
> Google’s Danny Sullivan in [their announcement blog post on the nofollow changes](https://webmasters.googleblog.com/2019/09/evolving-nofollow-new-ways-to-identify.html)

I read this and chuckled. Obviously Google needs to read up [on the murder of Thomas Becket](https://en.wikipedia.org/wiki/Will_no_one_rid_me_of_this_turbulent_priest%3F). Because of Google’s market dominance, people will do anything to get into their favor. They *can* make changes like this and the web *will* follow. The real question here is: shouldn’t we have legislation that prevents them from making these changes unilaterally?

In fact I’d say it’s time to go one step further: the web needs to have true standards for this. Standards that are preferably turned into law by the European Union, the US and China. But I dream too much perhaps. They at least need to be standards. Standards that all non-malware crawlers, *including Google*, will adhere too.
