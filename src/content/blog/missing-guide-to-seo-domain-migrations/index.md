---
title: The missing guide to SEO <em>domain migrations</em>
publishDate: 2026-05-05T00:00:00.000Z
excerpt: >-
  A domain migration has no upside. The best possible outcome is ending up
  exactly where you started. Here is how to plan, prepare, and execute one
  without losing what you already have.
categories:
  - SEO
toc: true
draft: true
password: 'may5'
---
A domain migration has no upside. The best possible outcome is ending up exactly where you started: same traffic, same rankings, same revenue. Everything else is a loss. That asymmetry is the most useful thing to internalise before you begin, because it tells you what to optimise for. You are not aiming for *better*. You are aiming for *intact*.

I've advised on many of these over the years. Some end up at "intact." Plenty don't. The difference is rarely talent. It's almost always preparation.

This post is the written, expanded form of a talk I gave at SMX Munich in 2025, updated for the AI reality of 2026. I wrote it up today because one of our [portfolio companies](https://emilia.capital/investments/) is considering a domain migration and needed the playbook.

A migration touches three disciplines: project management, technical SEO, and engineering. If one of those is unfamiliar to you, that's the discipline you need to bring in.

## What going well and going badly look like

Two real cases, both well-documented:

The Guardian moved from `guardian.co.uk` to `theguardian.com` in 2013. Six months in, the site was still seeing record traffic. I did the SEO on that migration; their software architect [wrote up the engineering side](https://theguardian.engineering/blog/info-developer-blog-2014-feb-18-how-the-guardian-successfully-moved-domain). The short version is that we treated it as engineering work with SEO embedded from day one, not as an SEO task with engineering attached.

When Topshop folded into ASOS in early 2021, `topshop.com` lost roughly [80% of its search visibility](https://www.sistrix.com/blog/topshop-to-asos-80-off-in-search-visibility-migration/) and never got it back. Two decades of brand authority, redirected with a wildcard rather than page-by-page, evaporated into the ASOS subdirectory.

Same operation, opposite outcomes. The Guardian treated the migration as a project with deadlines, owners, and tests. Topshop treated it as a flip of the switch. That is the entire game.

### What does "normal" look like?

Plan for 30–40% traffic loss for three to six months, with a return to baseline after that. If your migration takes longer than that to recover, something went wrong and you should have hired someone who has done this before. The Guardian recovered in months. Topshop, by SISTRIX's measurement, didn't. Most projects sit somewhere in between, and where you sit is mostly a function of how much of Phase 2 you actually did.

### How long does an SEO migration take?

Realistic budget:

- One to three months to plan and scope.
- One month to one year to clean up the existing domain and prepare the new one.
- Six to twelve months for the migration to "come through" in search.

The middle bucket is where the variance lives. A small site with clean URLs migrates fast. A ten-year-old site with three CMSes worth of legacy patterns and a long tail of forgotten subdomains takes a year. Don't kid yourself about which one you are.

When you schedule the cutover itself, aim for a recurring low-traffic window: a weekend for B2C, a quarter-end lull for B2B, off-season for seasonal businesses. Migrating at peak traffic gets you fewer eyes on problems and more revenue at risk if something breaks.

## A four-phase plan

I think about migrations in four phases:

1. **Decision.** Should we do this, and on what terms?
2. **Preparation.** The work that decides whether the migration succeeds.
3. **Cutover.** The day of, which should feel boring if you did Phase 2.
4. **Post-migration.** The year of monitoring nobody warns you about.

Most migrations that go badly went badly in Phase 2. People want to talk about Phase 3 because the day of the move is exciting, but the day of the move is just the moment the bill comes due.

## Phase 1: The decision

Before you write a single redirect rule, answer the hard questions.

### Why are you doing this?

"Because the new domain is better" is not a reason. The reasons that hold up to scrutiny are:

- A genuine rebrand the business has already committed to.
- Escaping a country-code TLD that's hurting you outside its country, or that has registry-stability issues.
- Consolidating multiple domains that are competing with each other in search.

Note that every domain migration is, fundamentally, a brand operation. The SEO work is the cost of executing it. "The founders prefer the new name" isn't a different category from the others on this list. It's just the most honest version of the question every migration eventually faces: is the new name worth the upheaval?

### Who runs the migration?

A migration sits awkwardly across three disciplines. It's part project management (stakeholder timeline, rollback runbook, the call about when to flip DNS), part technical SEO (canonicals, hreflang, sitemap lastmod, Change of Address, the empty-robots.txt rule), and part engineering (edge redirects, the test harness, OAuth callbacks, SDK releases). Most companies don't have one person who covers all three, and that's fine, as long as someone owns the migration end-to-end and can coordinate the rest.

This post is written for that DRI: the *directly responsible individual* who owns the project end-to-end and is the single point of accountability when the disciplines disagree. They might come from any of the three backgrounds; what they have in common is enough cross-functional fluency to recognise which sections describe their own work and which describe work to commission. If you don't have a candidate internally, hire one. A migration without a single empowered owner doesn't fail at cutover. It fails six months later, when you find out an entire subdomain was never redirected, its rankings are gone, and nobody knows whose job it was.

### Can you actually own the new brand?

This is the single most underrated question. If you don't already rank #1 for the new brand name, **make sure you do before you migrate**. Otherwise the migration sets you up for failure. People will search for your new name, find someone else, and you will spend the recovery period explaining to your own customers where you went.

That extends to AI surfaces too. Ask ChatGPT, Claude, Perplexity, and Gemini about your new brand. If they don't recognise it, or confidently describe a different company, your customers asking the same question will get the same wrong answer. You can't update a frozen model's training data, but you can influence what *future* models learn from: a clear Wikipedia presence where you're eligible, `Organization` schema that names the new brand and domain together, consistent self-description across the web, press coverage that pairs the new name with the new domain. Start months before migration. AI memory is slow to update, and you want the ground truth in place before the next training run scrapes the web.

This is also the moment to find your *bonus*: anything that makes the new domain look better to search engines than the old one. A short, clean name. A `.com` or a generic ccTLD. Existing inbound links you can repoint. A cleaner URL structure. A bonus might not save the migration on its own, but it can buy you the most precious resource you have, which is **time**.

### Should you bundle other changes?

[Google's official guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) is to change one thing at a time: don't migrate the domain, swap CMSes, and redesign the site all in the same project. I disagree, with one important caveat. The Guardian, in the migration I worked on, moved from multiple legacy CMSes onto a single new one as part of the same domain move. It worked. Google warns against bundling because most teams that try it get something wrong; if you're confident you can get every piece right, bundling is more efficient than sequencing, because you only pay the SEO recovery curve once. If you're not confident, take Google's advice.

### Decided?

Solid answers to all of the above? OK, decision made: let's do it. Anything still soft, fix it now. Every Phase 1 question you skipped becomes a Phase 2 setback, and the setback always costs more to resolve than the decision would have.

## Phase 2: The preparation

If Phase 1 was about whether to migrate, Phase 2 is about earning the right to. This is where the migration is won or lost. A successful migration is roughly 90% preparation and 10% execution. Cut from execution day if you must. Never cut from preparation.

### Audit your current state

You can't migrate what you can't see. Before you redirect anything, you need a complete inventory:

- **Crawl the site.** Screaming Frog, Sitebulb, or an equivalent. Discover all subdomains. Export every URL with its status code, title, canonical, and inbound internal links.
- **Pull Google Search Console.** Every URL Google has indexed, every query you rank for, and the last 16 months of click and impression data. This is your baseline. Without it you can't prove what you lost or what you gained.
- **Pull Bing Webmaster Tools.** Bing matters more than people think, especially in B2B and enterprise.
- **Get crawl logs.** Don't just look at Googlebot. Bingbot, the AI crawlers, your own monitoring bots, and ad-tech crawlers all show up here. Logs tell you which URLs the world actually cares about, as opposed to which ones you think it does.
- **List every subdomain that resolves.** Marketing, docs, app, blog, status, support, staging, dev, demo. Some won't be in any crawl. Get them from the DNS config.

If you run any kind of platform with an API, the inventory extends well past the website: API endpoints, webhooks, SDKs, OAuth callbacks, CORS allowlists, package registries, status pages, every email address on the old domain. I'll come back to those.

### Audit the new domain's history

If your new domain had a previous owner, treat the audit as two-sided. Verify the new domain in Search Console and check three things specifically: any prior manual action against the domain (resolve anything outstanding before launch, and file a reconsideration request if needed), leftover URL removals that might still apply site-wide, and any disavow file uploaded by a prior team. A clean record is fine. The failure mode is launching on a domain that's invisibly penalised, and finding out three months later when the rankings never come.

Also pull the list of inbound links pointing at the new domain. Many of them will be from the previous owner's era and now resolve to 404s. Triage them: legitimate links from sites you'd be happy to receive traffic from get 301'd to the closest relevant page on your new site, spammy ones go in the disavow file, genuinely irrelevant ones can stay as 404s. The 301'd ones are part of your *bonus* from earlier: the new domain showing up better to search engines than the old one ever did.

### Clean up before you move

You don't want to drag junk across. The cheapest moment in a website's lifetime to fix things is the moment you're already about to redirect every URL anyway. Specifically:

- Fix internal links pointing to 404s or redirect chains.
- Resolve every 404 in Search Console: restore, redirect, or accept.
- De-duplicate near-identical pages so you're not mapping two old URLs to the same new one for no reason.
- Get your XML sitemaps and `robots.txt` into a known-good state.
- Find the URLs that should never have been indexed in the first place. The trick is to do `site:olddomain.com` queries in Google and click to the very last page; the junk lives there. Combine with negative filters to surface the ugly stuff faster: `site:olddomain.com -site:https://olddomain.com` finds HTTP URLs that should be HTTPS, `site:olddomain.com -site:www.olddomain.com` finds bare-domain or subdomain URLs that escaped your canonical strategy. Whatever filter exposes the ugly corners of your index, use it. Don't bring any of it across.

### Improve site speed

Speed impacts crawling heavily, and during a migration crawling is the thing search engines have to do *more* of than usual. They have to fetch the old URL, follow the redirect, fetch the new URL, parse it, and decide whether the move is real. If your origin is slow, that whole loop slows down, and your migration takes longer to "come through."

If you've been putting off a speed-improvement project, do it before the migration, not after.

### URL mapping: the spreadsheet that runs the migration

This is the single most load-bearing artifact of the entire project. One row per old URL:

- Old URL on the source domain.
- Status code (200, 301, 404).
- Target URL on the destination domain.
- Action: redirect, merge, or drop.
- Notes (e.g. "merged with /pricing-eu").
- Owner / verified-by.

The rule is: every URL that returns 200 on the old domain has a 1:1 mapping on the new domain unless you've made a deliberate decision to drop it. No exceptions, no "we'll figure it out later." Patterns are fine for repetitive structures like blog posts or product pages, but every pattern needs an automated test that proves it works for a sample of real URLs.

Don't redirect a bunch of old URLs to your homepage just because there's no obvious target. Google explicitly treats that pattern as a soft 404, and the URLs you "saved" by redirecting them lose their search equity anyway. If a page has no real counterpart on the new site, 410 it (or 404 it) cleanly. That's an honest signal to crawlers; a redirect to nowhere is a lie.

### Where to bring an LLM in

One thing has changed since I first put a talk about this subject together: LLMs are now good enough to take meaningful work off your plate during a migration, but only in places where a mistake would be visible. The clearest use case is fuzzy URL mapping at scale.

On a site with thousands of URLs, the mapping spreadsheet is the bottleneck of preparation. Feed an LLM each old URL with its title, H1, and excerpt, along with the full new sitemap, and it will pre-fill the great majority of rows with a confident best-match suggestion and flag the uncertain ones for human review. Two years ago this was a regex job that broke on every edge case. Now it's a few hours of pipeline work for what used to be a multi-week manual exercise.

There's one catch, and it matters: false matches (200-but-wrong-page) are *worse* than 404s, because they're invisible in your QA. A page that 404s shows up immediately. A page that 301s to the wrong URL passes the smoke test, gets indexed, and ranks for the wrong queries. Every LLM-suggested mapping needs a confidence score, and the low-confidence rows still need human eyes.

The same logic applies everywhere else AI tempts you during a migration. Don't let an LLM generate redirect rules without `curl`-validating every one. Don't let it draft your Change of Address filing. Don't trust its judgment on whether a URL is still valuable enough to migrate. The model surfaces candidates. You draw conclusions.

### Develop a redirect strategy

Three rules and one recommendation:

- **301, always.** Never 302. Never JavaScript redirects. Never meta refresh.
- **No chains.** If today `/old → /interim → /new` exists, collapse it to `/old → /new` *before* migrating, then map straight to the new domain.
- **Make them fast.** Run redirects at the edge: Cloudflare, your CDN, a dedicated redirect server. Edge redirects are faster than origin redirects, and your origin doesn't need to wake up to serve them. During a migration the redirect layer is hit hard, often by every crawler at once.

The recommendation: implement a [`Redirect-By` header](/redirect-by-http-headers/) on every redirect, identifying which system issued it. When something goes wrong post-cutover (and something will), you want to know in one `curl` which layer is responsible. I came up with this header during the Guardian migration for exactly this reason; it's now [used by a large portion of sites](https://webtechsurvey.com/response-header/x-redirect-by) and is hopefully on its way to becoming a proper standard.

### Technical SEO prep

The boring stuff that wins the migration:

- **DNS TTL.** Lower it on the old zone to 300 seconds about 48 hours before cutover, so changes propagate fast.
- **SSL.** Valid certificates on the new domain and every subdomain you're moving. Test with [SSL Labs](https://www.ssllabs.com/ssltest/).
- **Sitemaps.** Generate fresh ones for the new domain. Keep the old domain's sitemap available for a few weeks post-cutover so search engines can discover the redirects faster. Get `<lastmod>` right, and only change it when content actually changes. Nothing destroys a sitemap's signal value faster than touching every `<lastmod>` on every deploy.
- **Canonicals.** Every page on the new domain self-canonicalises to its new URL. Never to the old one.
- **hreflang.** If you have localisation, every `hreflang` tag points to its counterpart on the new domain.
- **Structured data.** Update `Organization` and `WebSite` schema, and any `sameAs` links, to reflect the new domain.
- **Email.** Don't forget that domain change affects email sending. Set up MX, SPF, DKIM, DMARC on the new domain, and warm up sender reputation gradually if you do high-volume marketing email.
- **Google Search Console.** Verify both domains, including all subdomains under each, well before cutover. Verify with DNS records, not with HTML files, meta tags, or Google Analytics. Those can all break or quietly stop working during the migration; a DNS TXT record keeps verifying as long as it stays in the zone. The [Change of Address tool](https://support.google.com/webmasters/answer/9370220) needs both verified to work.

### Write tests for everything

Every URL transformation, every canonical, every hreflang pair, every sitemap entry is an assumption you're now making about how your domain works. Write tests that prove those assumptions hold on every deploy, forever.

The mechanics are easy now: feed your URL-mapping CSV to an LLM and it will write the harness in seconds. Crawl every old URL, assert it 301s to the right target, check for the `Redirect-By` header, fail loudly. While you're already in test-writing mode, generate parallel tests for the things you'd otherwise never check: canonicals point at the right URL on every key page, hreflang pairs are symmetric, structured data parses, sitemaps don't contain 404s, internal links never route through your own redirect layer.

Don't run those tests once and walk away. Wire them into CI. A CMS update or a routing refactor a year later can quietly break a redirect, and you won't notice until your rankings drop. The migration is a one-time event. The tests it forces you to write should outlive it.

### The bits that aren't on the website

If you run anything beyond a marketing site, the migration touches a lot more than your CMS. The list that catches teams off-guard:

- **API endpoints.** Customers calling `api.olddomain.com` cannot just be 301'd. POST bodies and `Authorization` headers don't survive 301s in every client. Plan an explicit API migration window: keep the old hostname serving the API for a defined period, communicate the deprecation date, get every customer onto the new hostname before you sunset the old.
- **Webhooks.** Customer firewalls and IP allowlists may be configured against your old hostname. Tell them, in writing, before you change the source.
- **SDKs and CLIs.** Hardcoded base URLs in your client libraries need a release that defaults to the new domain. Ship that release before cutover. Bump the major version if the change is breaking.
- **Auth and SSO callbacks.** OAuth, SAML, and magic-link redirect URIs are registered with identity providers, sometimes on every customer's IdP. Update them in advance.
- **CORS allowlists.** Anywhere your app or any embed accepts cross-origin requests, the new domain has to be added.
- **Package registries.** Update homepage URLs on PyPI, npm, Docker Hub, Helm charts. New releases should reflect the new homepage.
- **External listings.** LinkedIn, X, GitHub org, Crunchbase, G2, Capterra, ProductHunt, AI tool aggregators, conference sponsorship pages, partner co-marketing, press releases. None of these update themselves.
- **Internal systems.** CRM, analytics, marketing automation, ad accounts, retargeting pixels, internal SSO. All of these have references to the old domain that quietly break if you don't audit them.

None of this is hard. All of it is easy to forget.

### Stakeholder communication

People who find out from a 404 will not be your friends afterwards. A workable timeline:

- **T-6 weeks:** internal all-hands. Everyone in the company hears it from leadership before they hear it anywhere else.
- **T-4 weeks:** customer success briefs key accounts 1:1, especially anyone with API integrations.
- **T-3 weeks:** public announcement. A blog post and an email. Soft tone: "we're moving over the coming weeks."
- **T-1 week:** reminder email to customers, with technical migration notes for those with integrations.
- **T-0:** cutover. Internal announcement to the team when the redirects are live.
- **T+1 day, +1 week, +1 month:** status updates to the team and stakeholders.

Drafting these is templated work that LLMs handle well. Give the model the context, the audience, and the timeline. Edit for your voice.

### Risk management

The rollback plan is the most important artefact you hope you'll never use. Document the exact steps to revert: DNS records, redirect layer, email routing, the public comms template, and the decision criteria that would trigger a rollback in the first place. Keep the runbook somewhere everyone on-call can find it fast. Make sure someone has DNS access at 11pm on a Friday.

Rollback isn't theoretical. Companies you'd assume got every box ticked have launched, watched the new domain go badly wrong, and reverted to the old one within weeks, or worse, months. The half-life of rollback options is short: in the first hours after cutover the cost is small, but a few days in, search engines have started learning the new URLs, and reverting becomes its own migration in reverse. Decide in advance what numbers you'd have to see to pull the trigger, so the call isn't made under pressure for the first time at 2am.

The other piece is on-call. Have someone owning the migration for the first 72 hours, with the authority to escalate to whoever can flip DNS or revert at the edge.

## Phase 3: Cutover day

If you did Phase 2 well, this should feel almost boring. If it feels exciting, your prep was incomplete.

### Pre-flight checks

Before you flip anything:

- SSL valid on every host on the new domain.
- Content on the new domain in final state, with self-canonicals and clean sitemaps.
- Redirect rules deployed and tested at the edge against a sample of 100+ URLs from your crawl.
- Email on the new domain live and tested both directions.
- Baseline metrics snapshotted (traffic, rankings, indexed pages). You want to be able to prove what changed.

### Order of operations

1. **Cut DNS for the marketing site.** Point the new domain at the new host.
2. **Activate the 301 redirect layer** on every old host (apex and subdomains) so every old URL now sends a 301 to its mapped new counterpart.
3. **Empty the `robots.txt`** on the old domain (more on this below).
4. **Submit new sitemaps** for the new domain in Google Search Console and Bing Webmaster Tools.
5. **File the Change of Address** in Google Search Console, from old to new. You need both verified for this to work.
6. **Update internal links across the org.** Find-and-replace pass across the new website and codebase to remove any lingering absolute URLs pointing at the old domain. Internal links should never go through your own redirect layer.
7. **Validate.** Crawl the old domain from outside and confirm every URL returns a 301 to the right target. Crawl the new domain and confirm every internal link, every canonical, every sitemap entry is on the new domain.

### The empty robots.txt rule

This one trips up almost every team that hasn't migrated before. After cutover, the `robots.txt` on the *old* domain must be either empty (allow-all) or 404. **Do not redirect it.**

```
User-agent: *
Disallow:
```

The reason: search engines fetch `robots.txt` to decide whether they're allowed to crawl a domain at all. If you 301 the `robots.txt` itself, some crawlers will treat that as a signal that the old domain is gone, which can suppress crawling of the redirects you so carefully set up. They need to see a permissive `robots.txt` on the old domain, fetch the URLs underneath it, follow the 301s, and discover the new home. An empty allow-all is the documented safe path.

And empty really means empty. If your old `robots.txt` had `Disallow` rules for anything, affiliate redirects under `/go/` or `/out/`, internal search results, faceted commerce URLs, paginated archives, drop those rules on the old domain too. The instinct to keep them is reasonable: you put them there for a reason. But after cutover, those rules become a trap. The blocked URLs are still in search engines' indexes. Crawlers can't fetch them, which means they can't see the 301s, which means they can't update. Worse, those URLs sit there with no content but with whatever link authority points at them, and can start ranking against you on the *old* domain's authority. Authority without content is the worst possible state. Apply your `Disallow` rules on the *new* domain instead, where they belong.

### Don't give up the old domain

Renew the old domain for the longest term your registrar supports, and put a calendar reminder in someone's diary to renew it again before that term is up. Treat its sole job, from cutover onwards, as serving 301 redirects. The day it stops resolving is the day every legacy email signature, archived link, third-party reference and customer integration breaks, all at once. The old domain should stay around forever.

### Reading the logs in real time

In the first hours after cutover, you're watching server and edge logs for 4xx and 5xx spikes. Thousands of log lines per minute, sometimes more. This is one of the better uses of AI assistance during a migration: paste a log slice into the LLM of your choice and ask "what URL patterns are 404'ing most often?", "are there any user agents I don't recognise?", "are crawlers being blocked anywhere unexpected?". Conversational log analysis turns the first four hours of cutover from a grep exercise into a much faster review.

The same trick keeps paying off in the days and weeks afterwards. Ask "what URLs are in our logs but not in our sitemap?" and you'll surface the forgotten test pages, orphan PDFs, and legacy subdomain endpoints that should have been part of the redirect plan. Almost every migration I've worked on has turned up at least a dozen URLs nobody remembered until logs proved they were getting traffic.

The caveat is the same as in Phase 2: don't trust the model's "everything looks fine" without checking the numbers it cites against the actual log file. LLMs will sometimes hallucinate a count or invent a pattern that isn't there. Use them to surface candidates. Draw conclusions yourself.

## Phase 4: After the move

You're not done at cutover. You're done in twelve months.

### Weeks 1–4

- **Daily:** traffic, rankings, GSC coverage, error rates.
- **Weekly:** redirect-layer log review. Any 404s being served? Patterns?
- **Weekly:** GSC "Pages" report. Anything in "Discovered, not indexed" or "Crawled, not indexed" that should be indexed?
- **Customer support:** any tickets mentioning the old domain or broken integrations?

Reach out to the top 50 referring domains and ask for the link to be updated to the new domain. The 301s pass equity, but a clean direct link is always better.

### Months 2–6

- Move from daily to weekly cadence.
- Compare year-over-year traffic carefully. By this point you're looking for sustained recovery, not noise.
- Continue chasing high-value backlink updates.
- Sunset any temporary parallel infrastructure (old API hostnames, transitional subdomains) on the timeline you pre-announced.

### The training-data tail

Another change since I first put a talk about this subject together: search engines aren't the only systems with a memory of your old domain anymore. Your old domain lives in LLM training data. ChatGPT, Claude, Gemini, Perplexity, and every model that crawled or licensed the web before your cutover all carry it. When those models surface your company in an answer, they may surface the *old* hostname for years after you've migrated. And unlike with search engines, there's no tool you can file with a model to tell it you've moved:

> There is no Change of Address form for a model that finished training a year before your move.

This doesn't change the cutover mechanics. It does change the long view. Keep the old domain registered, the redirects live, and the email tenant warm not just for SEO recovery, but because AI surfaces are referring to your old domain in answers right now, and will continue to for years. The half-life of a hostname in model memory is much longer than its half-life in a search index.

### Year 1 and beyond

- **Keep the old domain registered. Forever.** This is not negotiable, and not bounded. The cost is rounding error against the risk, and the risk now lasts longer than search alone would suggest.
- **Keep the redirect layer up.** Same logic.
- **Keep the old email tenant warm** for at least twelve months. Old contacts, old vendors, and old contracts will keep using old addresses for longer than you expect.

You're never really done. Keep both domains verified in Google Search Console and Bing Webmaster Tools for at least a year.

## The one-page checklist

If your team only reads one page of this post, this is the one. Print it, work through it, tick things off.

### Decision

- [ ] Single named DRI for the migration who can compel engineering, marketing, and customer success.
- [ ] Cutover date locked, communicated, no conflicts with major releases or events.
- [ ] Old domain renewed for the maximum term, with a renewal reminder set. The old domain stays forever.

### Preparation

- [ ] Full crawl of the old domain plus all subdomains exported.
- [ ] GSC and Bing Webmaster Tools data exported as baseline.
- [ ] Top 50 backlinks identified.
- [ ] URL mapping spreadsheet complete and reviewed.
- [ ] Old-site cleanup done (404s, chains, sitemap, robots).
- [ ] Redirect rules built, tested at the edge.
- [ ] `Redirect-By` headers implemented.
- [ ] SSL valid on every new host.
- [ ] DNS TTL lowered 48h before cutover.
- [ ] Email on the new domain live, tested both directions, SPF/DKIM/DMARC in place.
- [ ] API migration path defined and announced (if applicable).
- [ ] SDK/CLI release shipped with the new default (if applicable).
- [ ] OAuth/SSO/CORS allowlists updated.
- [ ] GitHub/npm/PyPI/Docker references updated.
- [ ] External listings (LinkedIn, G2, etc.) queued.
- [ ] Analytics on the new domain live, baselined.
- [ ] Customer comms sent (T-3w, T-1w).
- [ ] Rollback runbook written and shared.

### Cutover

- [ ] DNS flipped.
- [ ] 301 layer live on the old apex and subdomains.
- [ ] `robots.txt` on the old domain emptied (NOT redirected).
- [ ] Sitemaps submitted in GSC and Bing.
- [ ] Change of Address filed in GSC.
- [ ] 20+ key URLs spot-checked by hand.
- [ ] External crawl confirms 100% 301s.

### After

- [ ] Daily monitoring for 14 days.
- [ ] Top backlinks contacted for direct update.
- [ ] GSC coverage clean within 30 days.
- [ ] Traffic recovery tracked at 30, 60, 90 days.

## A final word

The instinct, when a migration goes well, is to congratulate the team for "pulling it off." The instinct, when it goes badly, is to blame Google.

Neither is right. Migrations that work are the ones where someone insisted, three months out, that the URL mapping spreadsheet have an owner for every row. Where someone asked, two weeks out, "what does the `robots.txt` on the old domain look like the morning after?" Where someone, six months in, was still pulling redirect-layer logs to make sure nothing had quietly drifted.

It's not that domain migrations are hard. It's that they're tedious in a way that punishes you for skipping steps. The good news is that the steps are knowable and the work is finite. Do them, and you end up where you started. Which, in this game, is the win.

If you need help thinking through one, [I'm reachable](/contact-me/).
