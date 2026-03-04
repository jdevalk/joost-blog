---
title: 'Building a trusted web, step 1.'
publishDate: 2020-10-28T00:00:00.000Z
excerpt: >-
  One of the biggest long-term trust problems of the web is reliably figuring
  out who published something first. Who was first has deep implications for
  ownership
categories:
  - WordPress
  - Yoast
featureImage:
  src: ./images/aleksey-boev-HC2R5chgLMw-unsplash-scaled.webp
  alt: ''
---
One of the biggest long-term trust problems of the web is reliably figuring out who published something *first*. Who was first has deep implications for ownership, and for areas like citation and (Google) news rankings. Today we have submitted [an issue to the Schema.org GitHub](https://github.com/schemaorg/schemaorg/issues/2756) which proposes a solution to *fix* this using timestamps on the blockchain. I view this as a first step in fixing some of the inherent trust issues on the web.

Full disclosure: this is a problem I care about deeply, which is why Marieke and I invested in [WordProof](https://wordproof.com/), a company that set out to fix this problem. We’re not just investing money, I’m actively advising the company and we’re actively collaborating on proposals like this one.

## What is this timestamp proposal?

Let me take the content from the issue:

> The point is to “timestamp” new or modified content as you publish it. You then add the information on that timestamp, including where the hash *lives*, into the markup of a page while optionally also offering the resource used to generate the hash. This way, the hash becomes *verifiable* and optionally will allow for going through previous editions of the content (also *verifiable*).
> 
> A hash in a blockchain transaction indisputably proves that content existed in a specific moment in time (“transparency”). Furthermore, to put a transaction in a blockchain, you use a private key to authenticate. With this private key you can prove that you were the one placing the timestamp (“accountability”).
> 
> Similarly, a timestamp could be added to a *transaction* in combination with a set of terms of service, to prove that a certain set of terms are valid for that transaction. There are numerous applications of this system; this proposal focuses on time-stamping content to explain the basic architecture and provide validating services with the data they need to be able to verify the records.

## **What is a timestamp?**

If you don’t know what a timestamp is, or don’t understand any of the concepts this proposal talks about, this might move a bit fast for you.

In that case, take some time to read about timestamps. Bas van der Lans, founder of WordProof, is much better at explaining it than I am, so see this video:

For me personally, this is one of the first blockchain implementations that has me deeply excited for its possibilities. Fun fact is: turns out blockchain was *invented in 1991 for the specific purpose of timestamping* ([source](https://sebastiaans.blog/blockchain-1991-timestamp/)). The problems timestamping solves are very real, day to day problems of website owners, merchants etc. We can fix those problems.

I hope we’ll look back at this in a few years and see that this schema.org issue was historic. That this is where we started the evolution and started building a trusted web, on top of the open web. And we’re doing that with open source software, an open standard and an open agenda. Let’s build the ***trusted web***, together!
