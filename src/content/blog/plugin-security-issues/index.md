---
title: How to deal with plugin security issues
publishDate: 2023-04-11T00:00:00.000Z
excerpt: >-
  Dealing with security issues for your WordPress plugin can be hard and even a
  bit scary, certainly when it’s happening to you for the first time. In this
  post I
categories:
  - WordPress
featureImage:
  src: ./images/wordpress-plugin-security-issues-jaye-haych-unsplash-scaled.webp
  alt: ''
---
Dealing with security issues for your WordPress plugin can be hard and even a bit scary, certainly when it’s happening to you for the first time. In this post I try to outline all the steps you should take as a plugin developer. So, let’s dive in. This isn’t a short post, so here’s a table of contents:

## Table of contents

- [Having plugin security issues reported to you](#h-having-plugin-security-issues-reported-to-you)
    - [“Advertising” how people can report issues](#h-advertising-how-people-can-report-issues)
    - [Encouraging security reports](#h-encouraging-security-reports)
    - [Learning from others](#h-learning-from-others)
- [Fix the issue](#h-fix-the-issue)
    - [How fast should you fix security issues?](#h-how-fast-should-you-fix-security-issues)
- [Tell your users about your plugin security issue](#h-tell-your-users-about-your-plugin-security-issue)
    - [Changelog](#h-changelog)
    - [Other communication](#h-other-communication)
- [Don’t be too hard on yourself](#h-don-t-be-too-hard-on-yourself)

## Having plugin security issues reported to you

You probably use a platform like GitHub, or even the WordPress.org forums to get bugs reported to you. These are public channels which is super helpful for most of your bug reports. However, this is *not* good for security issues. This is one of the reasons security issues in open source are a bit harder. You’re probably not used to secrecy, but where it comes to plugin security issues, you do need a bit of secrecy sometimes. So, you need a way for security researchers to contact you. And trust me, if your plugin gets popular, they *will* contact you.

You have a couple of options where it comes to receiving security reports. The simplest option is to set up an email address like `security@` on whichever domain it is you use, or a contact form. Know though that you’ll get a lot of reports that you have to vet and not all of them are that useful. You also will find some security researchers will require you to sign emails with keys, functionality not offered by many email providers, which can be a hassle to set up.

A better way (that’s relatively new) is using Patchstack’s – completely free!! – [vulnerability disclosure program](https://patchstack.com/for-plugins/). They deal with validating the issue and only bother you when you actually have to fix something, with a very detailed report. They’ll deal with the security researcher, getting them to follow ethical disclosure policies, and because they’re a CNA (a “CVE numbering authority”), they can assign a so called CVE, a number by which a security issue can be referenced later. If they’re handling your vulnerabilities, it immediately gets you into the process of properly assigning CVEs. I think it’s completely awesome that they offer this service for free, and I’d recommend everyone to use it. I use it for [my own plugins](/plugins/), see for instance [the VDP page for my Comment Hacks plugin](https://patchstack.com/database/vdp/yoast-comment-hacks).

### “Advertising” how people can report issues

You should mention how people can report plugin security issues to you in at least a few of these places:

- On the plugin’s webpage / website.
- On the plugin’s GitHub page (preferably through a [security policy Security.md file](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository)).
- In the plugin’s `readme.txt` and thus on the WordPress.org plugin page.

Make sure that you regularly *test* your contact method. Trust me, you don’t want to miss these emails. They’re important.

### Encouraging security reports

If you make money from your WordPress plugin(s), directly or indirectly, I’d highly suggest setting up a bug bounty program (examples: [WordPress core’s bug bounty program on HackerOne](https://hackerone.com/wordpress?type=team), [Yoast’s bug bountry program](https://yoast.com/security-program/), [Elementor’s on Bugcrowd](https://bugcrowd.com/elementor/)). It’ll encourage security researchers to look at your code a bit more. This might feel counterintuitive, because you don’t *want* security issues, but the fact is that security issues are a fact of life. It’s best to admit that you’re human and benefit from other people scrutinizing your code. Being proactive about security is the *only* way to make sure that you don’t find yourself feeling incredibly bad because lots of sites were hacked through your plugin.

### Learning from others

When other plugins have security issues, you don’t gloat. You don’t think you’re better, trust me, you’re not. Everyone has security issues. What you do is you look at the report, and see what it says. Then you think and *check* whether your own code would be susceptible to such an attack vector as well. If it is, you patch it.

## Fix the issue

Once you’ve identified the problem in your code, you fix it. Of course. Then you go through your code and search for other places where the same thing happens. Then you check your other plugins, if you have any, and check for the same issue. Once you’re sure you’ve fixed all the instances of this particular issue, you submit the update to the plugin repository. I’m not going to go into the technical details of coding securely in this post, [others](https://developer.wordpress.org/apis/security/) [can do](https://patchstack.com/articles/common-plugin-vulnerabilities-how-to-fix-them/) that much better. But I will say this: having a pull request open on your public repository with words like “fix for security issue” in the description is probably not the best idea. This is where you have to keep things a bit of a secret until you’ve actually fixed the issue.

Security researchers are often surprisingly helpful in testing your fixes. Communicate with them. If you do have a company like Patchstack vetting your reports, make sure to stay in touch with them as well.

### How fast should you fix security issues?

I’m frequently baffled when I hear how long people take to fix plugin security issues. I honestly think most vetted security issues for plugins should be fixable within 48 hours. Literally 48 hours from receiving the report, I’d expect a good plugin developer / plugin development team to have shipped the fix. Depending on how severe the issue is, it could be ok to wait a few days if it happens to come in on a weekend. It’s *never* OK to wait for weeks. As your software gets bigger, this might get a bit harder. WordPress bundles its core security releases together, I’m not part of that process but I know that that can take a bit longer. But if you’re one small group of people, just make sure to get that security release out, it’s better for everyone.

## Tell your users about your plugin security issue

The hardest part of every security issues is always: how do we tell our users? I *know* what you’re thinking “they may not trust us anymore”, “what if they switch to another plugin?”, etc. Trust me, I know those thoughts *deeply*, I’ve been there. And trust me when I say: the truth *always* prevails. So, don’t hide your security issues. Be open about them. Be confident enough to say: “We’ve been told about this issue. We’ve fixed it. You can rely on us to fix our security issues in a responsible manner. Please update to the latest version.” Users *will* reward that behavior over time. So, let’s be clear about where we need to communicate:

### Changelog

The most important bit first: of course your fix should be listed in your changelog, which should be in your `readme.txt` and it *should* clearly be identified as a security fix. If someone reported the issue to you, clearly credit the reporter (if they want to be credited). This again validates that you’re happy to receive security reports. You might want to use the `Upgrade notice` functionality in the [`readme.txt` standard](https://wordpress.org/plugins/readme.txt) as well.

### Other communication

Pushing the update out and mentioning it in your `readme.txt` is not enough if the issue is severe. If people’s sites might get hacked because of the issue, you’d better tell them, through Twitter, your newsletter, whatever channel it is you have, that you’ve released a security update.

## Don’t be too hard on yourself

I know that I’ve taken security issues a bit too personal myself in the past. Security issues are a fact of life. Of course you need to think about security as you develop. Of course people can expect some level of basic security “posture”. But beyond that, security issues happen. Good developers / product owners stand out by how well they deal with them. I’d be very wary of any developer that says he never has security issues.

If you have questions, feel free to ask them in the comments. If you need help communicating about a security release, I’m @joostdevalk on the WordPress Slack, and I’m always happy to help.

Thanks to Oliver Sild from Patchstack and [Marius Jensen](https://clorith.net/) for their feedback on early drafts of this post. Photo by [Jaye Haych](https://unsplash.com/es/@jaye_haych?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/s/photos/key-in-door?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText).

**The plugin developers guide to…**

When you build a WordPress plugin, you obviously have to write code. But then, when you release it to the world, especially when you release it open source, there are things you have to do that you didn’t know about before. Things that don’t really show up in code tutorials. I’ve decided that I should share my experience in building one of the most popular plugins in the WordPress world in a series of posts, like this one about plugin security issues.

If you have topics you’d like me to cover in this series, comment on this post or email me and let me know!
