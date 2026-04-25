---
title: How AI changes (the value of) open source
seo:
  description: Open source spent thirty years winning the cost argument. AI is making that irrelevant. What replaces it (the agency argument) is still open.
publishDate: 2026-04-24T00:00:00.000Z
excerpt: >-
  Open source spent thirty years winning an argument about cost. AI is about to
  make that argument irrelevant. Whether open source can win the argument that
  replaces it (about agency) is an open question. The point of this post is
  to be honest about why.
categories:
  - Open Source
  - AI
isFeatured: false
draft: true
password: baddies
toc: true
---
Open source spent thirty years winning an argument about cost. AI is about to make that argument irrelevant. Whether open source can win the argument that replaces it (about *agency*) is an open question. The point of this post is to be honest about why.

<div class="not-prose rounded-lg border-2 border-primary/20 bg-tertiary px-6 py-5 dark:border-accent/20 dark:bg-stone-900">
<p class="mb-2 text-lg font-semibold text-primary dark:text-accent">A note on "agency"</p>
<p class="text-base leading-relaxed text-stone-700 dark:text-stone-300">I use the word throughout this post to mean the capacity to act on your own terms: to run, inspect, modify, and migrate your software without needing permission from a vendor, government, or infrastructure provider. It's the opposite of dependency. For native English speakers it may feel obvious; it's worth pinning down before we go further.</p>
</div>

To see what's happening, you have to start with classical economics and take a detour through twenty-five years of SaaS. You end up at why the xz backdoor, the European Cyber Resilience Act, and the question of whether you can fork a language model are all the same story. Bear with me. The journey is the point.

## Where price comes from, classically

Adam Smith, in [*Wealth of Nations*](https://www.adamsmithworks.org/documents/eric-schliesser-labor-theory-of-value) (1776), distinguished between *market price* and *natural price*. Market price is what something happens to sell for today. Natural price is what covers the rent of the land, the wages of the labour, and the profits of the stock used to bring it to market. Market price fluctuates around natural price. Competition is the gravitational force pulling them together over time.

David Ricardo, writing forty years later, sharpened the picture with his theory of rent. Imagine farmland of varying quality. The most fertile plots produce more corn per unit of effort than marginal ones. As demand grows, farmers are forced onto worse and worse land. The cost of producing the marginal bushel goes up, and that marginal cost sets the price for *all* corn, including the corn grown cheaply on the best land. The owners of the best land pocket the difference as [rent](https://en.wikipedia.org/wiki/Law_of_rent).

Two things are worth holding onto from this picture. First, price is anchored to the cost of production at the margin. Second, scarce natural factors (fertile land, easy access to coal, a navigable river) earn rent because they are physically located, finite, and not reproducible. Nature is not background scenery in classical economics. It is one of the three factors of production, alongside labour and capital.

I'm using this as a heuristic, not a formal model. Modern economics has more sophisticated tools (endogenous growth, information goods, network effects), and a serious analysis would reach for them. But the classical framing captures something the modern vocabulary often obscures: scarcity is, fundamentally, about physical and institutional facts. Software's long holiday from physical facts is ending.

For most of human history, this is roughly how prices worked. Then software arrived.

## How SaaS broke the picture

The defining property of software, once written, is that it costs essentially nothing to copy. The marginal cost of serving the ten-thousandth user is rounding-error close to zero. There is no fertile-versus-marginal land, no raw material that gets scarcer with each unit produced, no labour required per unit sold. Nature drops out of the equation entirely.

If classical economics says price gravitates toward cost of production, SaaS pricing should race to zero. It didn't. Instead, pricing detached from cost and re-anchored to *value delivered to the customer*. A tool that saves a company $100,000 a year might cost $50 a month or $5,000 a month. The cost of production tells you almost nothing about which it will be. SaaS pricing became a function of willingness to pay, segmented through tiers, seats, usage, and outcomes. The whole vocabulary of land-and-expand, value-based pricing, and price discrimination through packaging only makes sense in a world where price has been unmoored from cost.

The numbers tell the story. The [Benchmarkit 2025 SaaS Performance Metrics report](https://www.benchmarkit.ai/2025benchmarks) puts the median total-revenue gross margin for B2B SaaS at 77%. CloudZero pegs the [healthy range at 70–85%](https://www.cloudzero.com/blog/saas-gross-margin-benchmarks/), with some best-in-class companies clearing 90%. Those margins are not earned through engineering brilliance. They exist because the cost of distributing software was effectively zero for twenty-five years. And the cost of *producing* software was concentrated in a labour pool (engineers) that was hard to access and harder still to scale.

This was the single biggest economic anomaly of my professional lifetime. It made fortunes. It also made the entire SaaS playbook (the venture capital formulas, the rule-of-40, the LTV/CAC obsession) only legible inside that specific cost structure. Take the structure away and the playbook stops working.

AI is taking the structure away. From both sides.

## How AI flips it back

Every AI inference has a real, measurable, non-zero marginal cost. GPU-seconds. Electricity. Cooling water. Bandwidth. Serving the ten-thousandth query is not free the way serving the ten-thousandth SaaS page load basically was. The classical picture reasserts itself.

### The margins

Look at the unit economics of frontier model providers. According to reporting in The Information [summarised by industry analysts](https://medium.com/@adeayoadewale/the-anthropic-irony-the-company-killing-weak-saas-is-on-the-same-pricing-trajectory-9c3f5613e07d), Anthropic is targeting around a 40% gross margin for 2025. That's revised down from a 50% internal estimate, because inference costs on Google and Amazon cloud came in roughly 23% above plan. OpenAI, despite vastly higher revenue, is reportedly running at around 46% gross margin, weighed down by inference for the 95% of weekly ChatGPT users who don't pay. These are not 80%-margin businesses. They are 40%-margin businesses pretending, for now, to be tech companies, when their cost structure looks more like a utility.

Honest caveat: these are early-2026 numbers, and inference costs are falling fast. DeepSeek R1 is already pricing roughly 90% below frontier rates; model efficiency gains of 3-10x per year are common. The specific 40%-gross-margin world may be a transitional phase, with inference commoditising toward something closer to classical SaaS margins within a few years. If so, the "AI brings classical economics back" version of this argument weakens. What doesn't weaken is the physical substrate: compute has a location, electricity has a price, water has a supply. Those facts persist even if the software layer on top recovers its margins. Treat the margin argument as the weaker leg and the geography argument as the stronger one.

### Nature is back

The [International Energy Agency's 2025 *Energy and AI* report](https://www.iea.org/reports/energy-and-ai/executive-summary) projects that data centre electricity consumption will roughly double by 2030. That's from 415 TWh in 2024 to about 945 TWh, comparable to Japan's entire current electricity use. Nearly half of US data centre capacity is concentrated in five regional clusters. Shaolei Ren's group at UC Riverside [has shown](https://news.ucr.edu/articles/2026/03/09/data-center-water-spikes-could-cost-billions) that US data centres may need 700 million to 1.45 billion gallons per day of new water capacity through 2030. That's comparable to New York City's daily supply.

You can see Ricardo's rent theory replaying in real time. The "fertile land" of our era is cheap, abundant, low-carbon electricity. Iceland sits on top of geothermal and hydro and is being [aggressively built out by Verne, atNorth, Crusoe, and Nscale](https://www.datacenterdynamics.com/en/analysis/icelands-ai-moment/). Norway above the Arctic Circle. Quebec and the Pacific Northwest. The Texas Permian Basin, where [stranded natural gas that would otherwise be flared](https://crusoe.ai/newsroom/bitcoin-mining-with-oil-drilled-flared-gas/) is being routed straight into AI training.

As demand grows, marginal capacity gets built on worse "land": more expensive grids, scarcer water, more constrained permitting. The cost curve rises and the price of inference at the margin climbs with it. The owners of the best sites earn rent. This is Ricardo, in 2026, in datacentres.

The customer-facing tells are everywhere. Token-based billing. Rate limits. Tiered access. Pro versus Max versus Team versus Enterprise plans. Anthropic introduced weekly rate caps in mid-2025; OpenAI rations its best models behind subscription walls. None of this is arbitrary product strategy. It's the cost of production bleeding through into price because the margins cannot absorb it the way pure SaaS could.

## The other half: software production also goes to zero

There's a second half to this inversion. AI doesn't just push *operating* costs back up. It also pushes *production* costs down, for software itself.

GitHub's [randomised controlled trial](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/) on Copilot, published in 2023, found developers completed a JavaScript HTTP-server task 55.8% faster with AI assistance (about 71 minutes versus 161 minutes). That was with early tooling and a relatively weak model. The capability gap has widened enormously since. Andrej Karpathy [coined "vibe coding"](https://en.wikipedia.org/wiki/Vibe_coding) in February 2025: a mode where you "fully give in to the vibes" and forget the code even exists. By Y Combinator's Winter 2025 batch, [reportedly 25% of startups](https://en.wikipedia.org/wiki/Vibe_coding) had codebases that were 95% AI-generated. The Collins Dictionary made "vibe coding" a word of the year.

My own experience, and that of most experienced developers I talk to, is that the speedup is real and extends well beyond greenfield work. Things that used to take weeks ship in hours. The ceiling of what a single person can build has moved up by an order of magnitude, and it's still moving. This is not hype; it is the most productive period in software I've ever worked through.

What doesn't get cheaper is verifying, maintaining, and trusting the output. A late-2025 [analysis from CodeRabbit](https://en.wikipedia.org/wiki/Vibe_coding) of nearly 500 OSS pull requests found AI-co-authored code contained roughly 1.7x more major issues and 2.74x higher security vulnerabilities than human-written code. Cheap to produce, expensive to trust. That gap is where the rest of this post lives.

For twenty-five years software was expensive to make and cheap to distribute. AI inverts both. The labour cost of making software is collapsing toward zero. The cost to *run* software, when AI is part of how it runs, is rising. We are not in a small adjustment to the SaaS playbook. We are in a different economy.

## Open source was always an anomaly

Now hold this picture and look at open source.

Open source has always been weird from a classical perspective. The software is free, but it cost real labour to make. How did anyone afford it? The answer was that the *artifact* was free but the *complements* were monetised. Red Hat sold support contracts. WordPress.com sold hosting around WordPress.org. MongoDB sold managed services. Joel Spolsky's [Strategy Letter V](https://www.joelonsoftware.com/2002/06/12/strategy-letter-v/) named the dynamic in 2002: smart companies commoditise their products' complements. IBM funded Linux to commoditise the operating system layer beneath its consulting and hardware business. Google open-sourced Android to commoditise mobile beneath its ad business. Meta open-weights Llama to commoditise foundation models beneath its attention business. Same playbook, same logic.

But underneath the complement strategy was a quieter assumption: producing the software itself was *hard*. Skilled engineers were expensive. Being a core maintainer of a critical project translated into employment, consulting rates, reputational capital. Even when no money changed hands for the software, the implicit subsidy was the value of the labour pool that produced it.

That subsidy is partly evaporating. If anyone with Claude Code or Cursor can fork a project and patch it themselves in an afternoon, why would they pay a maintainer's consulting rate? If your team can ship equivalent functionality in a week, why would you sponsor an upstream foundation? The "this is hard, so the people who do it deserve support" argument weakens at exactly the moment when the maintainers themselves are most needed.

Tidelift's [2024 State of the Open Source Maintainer report](https://www.sonarsource.com/the-2024-tidelift-maintainer-impact-report.pdf) found that 60% of maintainers remain unpaid. 60% have considered quitting their projects. 44% cite burnout as a primary reason. The community is greying: maintainers aged 46–65 have doubled as a share since 2021, while those under 26 have collapsed from 25% to 10%. I can confirm the greying part personally; a look in the mirror settles the empirical question. We were already in a sustainability crisis before the AI question landed on top.

The crisis is not theoretical. The xz utils backdoor was [discovered by Andres Freund in March 2024](https://en.wikipedia.org/wiki/XZ_Utils_backdoor) when he noticed a 500-millisecond SSH login latency spike while benchmarking PostgreSQL. It was the result of a multi-year social engineering campaign against a project with a single overworked maintainer. Log4Shell, [disclosed in December 2021](https://en.wikipedia.org/wiki/Log4Shell), affected 93% of cloud enterprise environments and was sustained for years by unpaid volunteers.

core-js is used on more than half of the top 10,000 websites. It was [maintained by one Russian developer](https://www.theregister.com/2023/02/15/corejs_russia_open_source/) earning a few hundred dollars a month while writing essays about being called a parasite. [xkcd 2347](https://xkcd.com/2347/)'s joke about "all modern digital infrastructure" resting on a project maintained by some random person in Nebraska was funny because it was true.

What AI does to this picture is mixed. It makes maintenance burden easier: triage, dependency updates, changelog generation, and tier-1 support all become tractable for solo maintainers. It makes [security auditing tractable in a way it wasn't before](https://googleprojectzero.blogspot.com/2024/10/from-naptime-to-big-sleep.html). Google's Big Sleep agent found a real zero-day in SQLite in October 2024, the first public example of an AI agent finding a previously unknown exploitable memory-safety bug in widely-used software. The Project Zero/DeepMind team has since caught several more, including one attackers were actively preparing to exploit. Anthropic's [Project Mythos](https://red.anthropic.com/2026/mythos-preview/), announced in April 2026, extended that frontier further still: it found thousands of high and critical-severity vulnerabilities across major operating systems and browsers, including bugs that had survived decades of human review, among them a 27-year-old OpenBSD flaw and a 17-year-old FreeBSD remote code execution vulnerability. AI also collapses onboarding cost for new contributors. These are real wins.

But it also drives [a flood of low-quality contributions](https://daniel.haxx.se/blog/2024/01/02/the-i-in-llm-stands-for-intelligence/). Daniel Stenberg, the maintainer of curl, calls it "death by a thousand slops." His project's HackerOne validity rate collapsed from over 15% historically to under 5% by late 2025. It drowned in AI-generated bug reports that look credible but contain nothing real. In January 2026 [curl ended its bug bounty programme entirely](https://www.theregister.com/2026/01/21/curl_ends_bug_bounty/). Node.js, Python, Ghostty, tldraw: all are wrestling with how to defend maintainer attention against industrialised AI noise. The signal-to-slop ratio is being destroyed faster than the productivity tools can compensate.

So the question becomes: what is the value of open source really *for*? In a world where producing software is cheap, where maintaining it is harder, where running AI-augmented software is expensive again, and where the labour leverage that historically sustained open source is partly disappearing. What remains?

To answer that, it helps to look at moments in history when production costs collapsed before.

## What history actually teaches us

I've been thinking about this in terms of five historical analogies. Each captures a different facet of what's happening now.

### The printing press

Before Gutenberg, producing a book required months of skilled scribal labour. After Gutenberg, a Renaissance press could produce around [3,600 pages a workday](https://en.wikipedia.org/wiki/Printing_press), and by 1500 there were already more than 20 million printed volumes in Western Europe. The scribes, and this is the part everyone forgets, mostly didn't fight back. Jeremiah Dittmar's [research](https://cepr.org/voxeu/columns/information-technology-and-economic-change-impact-printing-press) cites Neddermeyer's classic essay on this: there were no riots of the scribes, because printing fell outside guild regulations and proceeded too quickly to organise against. The scribes' work lost value, almost silently. The elite of them moved up the value chain into editing, typography, and the new profession of printer-publisher. The middle ranks were mostly displaced.

Two things came afterwards that matter here. One was a century-long crisis of trust. Anyone could now print anything. This is what made the Reformation possible, and the religious wars that followed killed [25–40% of Germany's population](https://ssir.org/articles/entry/our_gutenberg_moment) in the Thirty Years' War alone. The other was the slow reinvention of trust infrastructure: licensed printers, the Stationers' Company, eventually the [Statute of Anne in 1710](https://en.wikipedia.org/wiki/Statute_of_Anne). That was the first statutory copyright. It shifted ownership from publishers to authors and set the legal framework that governed publishing for the next three centuries. The cheap-to-produce substrate didn't get rolled back. The world built new institutions on top of it.

### The handloom weavers

By 1802 a skilled handloom weaver in Lancashire could earn 21 shillings a week. By 1817, [under 9 shillings](https://spartacus-educational.com/PRluddites.htm). The Luddite uprisings of 1811–1816 were not generalised technophobia, despite the modern caricature. They were targeted, organised attacks against specific machines (wide knitting frames, shearing frames, steam looms) that were destroying specific livelihoods.

The British government made machine-breaking a capital crime. Seventeen Luddites were executed in 1813. E.P. Thompson [wrote in 1963](https://www.thetedkarchive.com/library/e-p-thompson-the-making-of-the-english-working-class) that he wanted to rescue these people from what he called the enormous condescension of posterity. Their economic position was being genuinely destroyed. Smashing machines was the wrong response, but they weren't wrong about what was happening to them.

The uncomfortable parallel for software developers is real. "AI won't replace developers; developers using AI will replace developers who don't" is basically the weavers' story, retold. Technically true. It glosses over the fact that the total number of weavers collapsed. The survivors did different work, at different wages, under different power structures.

### The enclosure movement

Between 1604 and 1914, [more than 5,200 parliamentary acts of enclosure](https://www.parliament.uk/about/living-heritage/transformingsociety/towncountry/landscape/overview/enclosingland/) covered roughly a fifth of England. They converted commons that had supported a whole class of small holders into the private property of larger landowners. Karl Polanyi called it [a revolution of the rich against the poor](https://en.wikipedia.org/wiki/The_Great_Transformation_(book)). The peasants were not made more productive by enclosure; they were made into wage labourers dependent on whoever owned the now-enclosed land.

This is the parallel for what's happening with the AI training data commons. The web (code, prose, images, the collective output of decades of mostly-unpaid contribution) is being enclosed into proprietary model weights. Most contributors get nothing. Some are actively harmed. The artifacts they produced have been converted into a private factor of production owned by a small number of firms with the compute to train. The license texts haven't changed; the economic effect is enclosure.

### The electrification of manufacturing

The fourth analogy is the most useful for thinking about the productivity question. Paul David's classic 1990 paper [*The Dynamo and the Computer*](https://www.almendron.com/tribuna/wp-content/uploads/2018/03/the-dynamo-and-the-computer-an-historical-perspective-on-the-modern-productivity-paradox.pdf) showed that electrification's productivity gains arrived *decades* after the technology. Early factories replaced central steam engines with central dynamos, kept the same belt-and-shaft architecture, and saw modest gains. The real productivity leap came only when factories were redesigned around distributed motors, one per machine. That let layouts follow the flow of materials rather than the constraints of mechanical power transmission. The redesign took a generation. Full factory electrification didn't reach 50% adoption in the US until the 1920s, more than thirty years after the first commercial dynamos.

David's framework suggests we are still in the steam-engine-replaced-with-dynamo phase. Not because AI isn't making developers faster (it clearly is) but because we haven't redesigned the workflow around it. Terminal-native agentic tools like Claude Code or Cursor's composer mode are more than autocomplete; they delegate tasks. But even they operate on pre-AI primitives: files, repos, pull requests, human-read diffs, tests written to be run once. The unit-drive equivalent for software, where the entire development workflow assumes AI is ambient, hasn't arrived yet. The transformative productivity gains will come from that redesign. The history of electrification says it takes a generation. We are a few years in.

### The medieval guilds

The fifth analogy, maybe the most pointed, is the medieval guilds. Sheilagh Ogilvie's [*The European Guilds*](https://press.princeton.edu/books/hardcover/9780691137544/the-european-guilds) (Princeton 2019) is the definitive study, and it's anti-romantic. Guilds were not primarily quality-assurance institutions for the public benefit. They were rent-extraction mechanisms that benefited insiders (guild members and the political authorities who legitimised them) at the expense of consumers and excluded producers. Their famed "trust marks" worked through pass-fail exclusion: non-guild producers couldn't sell legally, and customers (especially poorer ones) often preferred cheaper black-market goods. Guilds declined when impersonal markets, regulated by impartial states, replaced identity-based privilege.

The function the guilds performed, "a named institution stands behind this quality," never went away. It got distributed across other institutions: brands, regulators, certification bodies, courts, transparency mechanisms. If AI makes it trivial to produce plausible-looking software that may or may not be trustworthy, we need something guild-shaped again. Not the protectionism, but the standing-behind-it function. The question is whether the new trust infrastructure will look like guilds (exclusionary, gatekeeping, rent-extracting) or like impartial states (cryptographic, neutral, jurisdictionally portable).

### The pattern, and the obvious counter-examples

The pattern across all five is consistent. The transition period is uglier than either before or after. Value doesn't disappear; it relocates, usually to whoever controls the new scarce resource: presses, mills, enclosed land, power generation, compute. Trust infrastructure always gets rebuilt, but it lags the production shift by decades. The form it takes is rarely predicted accurately in advance. And the people who do best are the ones who recognised early that the *old* skill was becoming cheap and repositioned toward the *new* scarcity. That recognition is psychologically much harder than it sounds in retrospect.

A sceptical reader will object, fairly, that I've selected five parallels that all support my case. Two obvious counter-examples exist. The Green Revolution concentrated global seed genetics into a handful of corporations without producing any mainstream "seed sovereignty" movement. Electricity became universally necessary and geographically fixed, and nobody demands "electricity sovereignty" for their home. Why should AI go differently?

Looked at closely, both cases reinforce the argument rather than cutting against it. Start with seeds. Four companies now control roughly 60% of the global seed market and 70% of agrichemicals. Several groups tried to build seed sovereignty: Vandana Shiva's Navdanya, various open-source seed initiatives, several national governments. All were largely defeated by the economics of arriving too late. Hybrids don't breed true. Patented seeds can't legally be saved. Pricing power sits permanently with the vendor. That's not a counter-example. It's a warning: when private control over a concentrated essential resource is allowed to set, reversing it becomes nearly impossible.

Electricity went the other way because societies intervened hard and early. The UK nationalised its grid in 1947. France's EDF was state-owned from 1946, and France is now in the middle of fully renationalising it. The Nordic model is largely public. Germany has municipal Stadtwerke. Even the US, where investor-owned utilities dominate, regulates them through public commissions into utility-like behaviour. The lesson is that when a resource becomes universally necessary and geographically concentrated, mature societies do not trust markets alone. They impose public ownership, regulation, or strong public stakes, often all three.

So the real structural question is not "open source or proprietary." It is: what institutional architecture do we build around concentrated AI infrastructure? Open source is a necessary input. Public investment, regulation, and state capacity have to do most of the rest of the work. The Green Revolution shows what happens if you leave concentration unchecked. Electricity shows what mature institutional response eventually looks like, at the cost of a few decades of political fighting. AI today sits somewhere between those two: later than seeds were in the 1960s, earlier than electricity was in the 1940s. Which one we end up resembling is not yet settled.

### The speed problem

The one place the parallels break down is speed. The printing press took a century to remake Europe; electrification took fifty years; enclosure took three. AI is compressing that kind of transition into something like a decade, perhaps less. Institutions don't adapt at that speed. That's a significant part of why the current moment feels so disorienting.

## What's actually left of open source's value

If AI collapses the cost of producing software while reintroducing real cost to running it, what does open source still mean?

Some of the traditional answers get weaker. "You don't have to write it yourself" matters less when writing it yourself is cheap. "Many eyes make bugs shallow" was always partly theoretical, and AI-assisted auditing can happen on closed source too. "You can learn by reading the source" is real but less unique when AI can explain any codebase to you on demand, open or closed. "You avoid vendor lock-in" gets complicated when the practical lock-in is to compute providers.

Four things, however, get *stronger*.

### Verifiability

The first is **verifiability**. You can read the code. You can build it from source. You can confirm that what you're running matches what you thought you were running. In a world where AI can generate plausible-looking software with subtle backdoors, hidden telemetry, or silent drift between versions, the ability to inspect what you're running becomes more valuable, not less. The xz lesson, properly read, is the *positive* one: open source didn't prevent the backdoor, but it made the backdoor *findable* once one person bothered to look. Closed systems do not offer this property at any price.

### Forkability

The second is **forkability as a governance check**. The right to fork is the ultimate answer to a specific question: what happens when the maintainer goes bad, gets acquired, changes the licence, or disappears? We are watching this stress test play out repeatedly.

HashiCorp moved Terraform from MPL to BSL in 2023; the community forked it as [OpenTofu](https://opentofu.org/) under the Linux Foundation within weeks. Redis moved from BSD to dual-licensed RSAL/SSPL in March 2024; AWS and the Linux Foundation forked Valkey. MongoDB went SSPL in 2018. Elastic followed in 2021 and [retreated back to AGPL in August 2024](https://en.wikipedia.org/wiki/Server_Side_Public_License), the first major reversal. Red Hat tried to wall off CentOS in 2020 and again in 2023; Rocky Linux and AlmaLinux were standing within hours.

The pattern is consistent. The value of forkability isn't that forks happen often, or that you'll personally build one. It's twofold. First, the *possibility* of forking disciplines the behaviour of current stewards. Second, when stewards do go bad, a viable fork is a landing pad — somewhere your existing investment can keep running. When HashiCorp relicensed, the thousands of teams with Terraform configs, modules, and CI pipelines didn't build OpenTofu themselves; they didn't have to. The fork existed, their work was portable, they kept going. That's what the property actually buys you, even if you never exercise the right yourself. Closed software offers neither half: no discipline, no landing pad. There's no fork of Microsoft Word.

And here is where the AI story loops back round. Historically, most forks failed not because the licence forbade them but because nobody could afford to carry the maintenance burden against an upstream that kept moving. LibreOffice took a decade to reach parity with what OpenOffice already had. The vast majority of smaller forks died quietly within a year or two.

AI changes this math. The unglamorous work that crushes forks gets dramatically cheaper with AI assistance: onboarding to an unfamiliar codebase, keeping up with upstream, porting features, patching security bugs, writing documentation, triaging issues. OpenTofu reached production parity with Terraform in months, not years. Small teams can now credibly commit to carrying forks that would have required a large organisation to sustain even five years ago. Forkability is becoming less theoretical and more operational, and that may be the single biggest under-appreciated shift in open source governance right now.

Two caveats before we get triumphalist. First: the licence isn't the governance mechanism. The infrastructure is. Whoever controls the package repository, the trademark, and the update server controls the project, regardless of what the LICENSE file says. The WordPress crisis of 2024 made this painfully visible when Matt Mullenweg banned WP Engine from WordPress.org, breaking plugin updates for 200,000 sites. Legal filings claimed WordPress.org as his personal property. (Disclosure: I've been publicly involved in the response, including co-founding the FAIR project at the Linux Foundation; [I've written about it elsewhere](https://joost.blog/fair-wordpress-and-knowing-when-to-stop/).)

Second: forkability is necessary but not sufficient. You need someone willing *and economically able* to fork. That requires foundations, neutral hosting, legal frameworks, and funding: the institutional structure the SaaS-margin era mostly didn't invest in. Cheaper forks lower the bar, but they don't eliminate it.

### Jurisdiction independence

The third enduring value is **jurisdiction independence**. Dries Buytaert, the founder of Drupal, put this [better than I can](https://dri.es/funding-open-source-for-digital-sovereignty) in January 2026: open source is "the only software you can run without permission. You can audit, host, modify, and migrate it yourself. No vendor, no government, and no sanctions regime can ever take it away." That is the whole argument, compressed to one sentence.

Code licensed as open source does not belong to any country, any company, or any legal regime. You can run it under whatever rules you choose. Geopolitics around software is getting more fraught:

- The [US CLOUD Act](https://www.eurojust.europa.eu/publication/cloud-act) compels US providers to produce data regardless of where it's stored.
- The [Schrems II ruling](https://iapp.org/news/a/the-schrems-ii-decision-eu-us-data-transfers-in-question) invalidated the EU-US Privacy Shield.
- The EU Data Act's Chapter VII forbids non-EU government access to data held in the EU.
- The Cyber Resilience Act comes into force in December 2027.

This property becomes existential.

The evidence is already in. The [International Criminal Court dropped Microsoft 365](https://www.theregister.com/2025/10/31/international_criminal_court_ditches_office/) in 2025 after a dispute over access to the chief prosecutor's email. Denmark's Ministry of Digitalisation is [migrating to LibreOffice](https://www.computing.co.uk/news/2025/denmark-digital-ministry-drops-microsoft). The German state of Schleswig-Holstein is [moving 30,000 workstations off Microsoft](https://www.heise.de/en/news/Goodbye-Microsoft-Schleswig-Holstein-relies-on-Open-Source-and-saves-millions-11105459.html). These are not ideological decisions. They are institutions waking up to the fact that a decision taken in Washington can disable services in Brussels overnight.

You cannot achieve digital sovereignty on closed foundations, because the foundations themselves carry the jurisdiction of their owners. A German hospital running Microsoft Azure in Frankfurt is, [for legal purposes, running infrastructure subject to US jurisdiction](https://www.kiteworks.com/gdpr-compliance/cloud-act-european-data-protection/), regardless of where the bits physically sit. A French ministry using a US AI API is exposing its prompts to potential US lawful access. Open source is the only substrate that lets a non-US organisation choose its jurisdiction independently of its stack. This is not an ideological point. It is a structural one.

This argument also exposes the limit of "open weights" AI. You can download Llama or Mistral or DeepSeek, but unless you also have a data centre and tens of millions of dollars in GPUs, you cannot meaningfully fork them. The OSI [released a formal Open Source AI Definition in October 2024](https://opensource.org/blog/metas-llama-license-is-still-not-open-source) requiring training data, source code, and weights. Almost no current model qualifies. Open weights are better than closed weights, but they don't democratise the way open source code did. The compute barrier replaces the IP barrier as the chokepoint.

Worse, "open" often means *less* transparent overall, not more. Amanda King's [*Who Watches the Watchmen?*](https://floq.co/strategy/what-we-dont-know-about-ai-training/) is worth reading in full. It documents how Meta has dropped from first to last on the Stanford/Princeton Foundation Model Transparency Index over three years, from 60 to 31, even as its marketing embraces "openness" ever more loudly. Mistral, Europe's would-be sovereignty champion, dropped 37 points on the same index. The average score across all major AI developers fell from 58 in 2024 to 40 in 2025.

The companies most eager to call themselves open are publishing less about their training data, their human labellers, and their RLHF processes, not more. You cannot verify what you cannot see, and you cannot fork what you cannot reproduce. "Open" has become the new magician's-assistant misdirection.

### Permanent availability

The fourth enduring value is **permanent availability**. Open source code does not get deprecated when a company pivots. It does not disappear when a startup fails. It does not change terms when a CEO changes. The thirty-year-old Unix utilities still work. The SaaS product you built your business on three years ago might not exist anymore. As commercial software gets more turbulent (venture funding cycles, AI-driven consolidation, the relentless deprecation cadence of cloud APIs) this property becomes more, not less, valuable.

### Why people start caring

There's an asymmetry worth naming. Agency is invisible until it's removed. Almost nobody runs a procurement evaluation thinking "what happens when our vendor's home government compels access to our data?" until the day a peer organisation finds out. The International Criminal Court didn't run a sovereignty audit on Microsoft 365 in advance. They ran one after the chief prosecutor's email got cut off. The 200,000 WordPress sites that lost plugin updates in 2024 were not run by people who'd been worrying about update-server governance the week before.

This is the pattern across every example in this post. Schleswig-Holstein, Denmark's Ministry of Digitalisation, the ICC, the WordPress community, the teams scrambling after Terraform and Redis relicensed: none of them were thinking about agency in advance. They got mugged. Each case in isolation looks like a vendor dispute or a political ruling. The pattern, viewed from above, is institutions discovering one by one that they had less control than they thought, and discovering it at the worst possible moment.

So "do people care about agency?" is the wrong question to argue about. Most people don't, until they do, and then they care urgently and retrospectively. The better question is whether the AI era will produce more of these moments, faster, across more institutions, than the SaaS era did. I think it obviously will. Every closed-model API is a new jurisdictional exposure. Every AI-assisted workflow is a new vendor relationship. Every agentic system is new infrastructure that can be turned off. It isn't that the underlying compute will stay scarce; inference is getting cheaper and will keep getting cheaper. It's that the dependency layer is expanding and turning over faster than any institution can audit it, and each layer is a new place where agency can be removed without warning.

That reframes the argument. It isn't "you should value agency"; that's tautological and persuades nobody who isn't already convinced. It's structural: more institutions are going to find out, the hard way, that they needed it. The only question that matters is whether the substrate to provide it (open source code, neutral foundations, sovereign infrastructure, verifiable models) will exist when they go looking for it.

### The honest problem with this argument

These four properties (verifiability, forkability, jurisdiction independence, permanent availability) have something important in common. They are not about cost. They are about *agency*.

But I have to stop here and call out a problem with my own argument. "Open source has the agency properties; agency matters more now; therefore open source wins" is close to a tautology. The four properties I listed are definitional features of open source: of course they become more valuable when agency matters more, because they *are* agency. Arguing open source wins on agency is partly arguing that water is wet.

The real question, harder and less comfortable, is whether those definitional properties translate into *operational* reality. The honest answer is that they often don't. Most developers never read their dependencies; "verifiability" for most users is the theoretical possibility of inspection, not actual inspection. Most forks never achieve critical mass. LibreOffice took a decade to reach parity with what OpenOffice already had, and MySQL still dominates its own descendants. Most "open source AI" is open weights with undisclosed training data and uninspectable labelling pipelines. Most governments still buy closed infrastructure, because the procurement frameworks to do otherwise mostly don't exist yet. The gap between "open source offers X in principle" and "open source delivers X in practice" is enormous.

So whether open source *actually* wins the agency argument in the AI era is not a foregone conclusion. It is an open question. The honest answer today: it depends on whether we build the institutions, the verification infrastructure, the procurement frameworks, and the funding mechanisms that turn agency-in-principle into agency-in-practice.

If we do, open source is the only substrate that makes those outcomes possible. If we don't, it will end up meaning roughly what "democracy" means in a country with suppressed voter turnout: a formal property without operational force. Saying "open source gives you agency" is a claim about a substrate, not a guarantee about an outcome. The outcome has to be built, and most of the building is ahead of us.

### The cost of staying closed

Everything above is about what open source preserves: agency, verifiability, the right to fork. There's an offensive case too, and Marieke pointed it out when we were arguing through this post. There has always been an opportunity cost to *not* doing open source, and AI has made it bigger.

The classical version was straightforward. Closed software didn't get free contributions, didn't get third-party plugins, didn't get scrutinised by external eyes, didn't attract developers who wanted to learn from the code. Companies paid for those forgone benefits in slower iteration, smaller ecosystems, and harder hiring. They paid willingly because IP felt like the moat.

AI changes the math from several angles. Coding agents are markedly better at working with code they've already trained on, which means open projects accrue tooling support that closed ones don't. The cost of forking and adapting an open project has collapsed, so the ecosystem multiplier of going open is bigger than it was. Talent increasingly expects to work in the open. And every closed product now competes against open AI-generated alternatives that didn't exist two years ago.

The upside argument used to read as nice-to-have. It's becoming a structural disadvantage to ignore.

## What this means in practice

If I'm right, several things follow.

### Stop arguing about price

Advocacy needs to stop arguing about price and start arguing about agency. The question isn't "why would you pay for something you can get for free?" It's a different one. Why would you build your business, your government, or your critical infrastructure on software you cannot inspect, cannot fork, cannot run where you choose, and cannot guarantee will exist next year? That argument gets stronger as AI makes the production side cheaper, not weaker.

### Fund trust, not just code

Funding needs to move toward institutions that produce *trust*, not only code. Foundations, certifications, cryptographic provenance through projects like [Sigstore and SLSA](https://slsa.dev/), software bills of materials, reproducible builds. The OpenSSF investments are right. They are also under-funded relative to the value they create. Trust at scale is precisely the thing the SaaS-margin era never had to pay for.

### Pay maintainers structurally

Maintainer compensation has to be structural, not charitable. Tidelift's 2024 data showed paid maintainers were [55% more likely](https://www.sonarsource.com/the-2024-tidelift-maintainer-impact-report.pdf) to implement critical security and maintenance practices than unpaid ones. That's a useful baseline, but it was collected before AI tooling changed the leverage of every individual maintainer. Speaking from experience: at Yoast I had five full-time employees contributing to WordPress core at one point. The same five people with today's tooling could move mountains.

That cuts both ways. The marginal return on funding any one maintainer has gone up sharply, but the total number of maintainers a given project actually needs has gone down. WordPress core probably needs less human engineering capacity than it did a decade ago, not more, and the same is true across most large OSS projects. People — including project leadership — should get used to shipping faster with smaller teams. For WordPress specifically, unlocking that speed depends on structural refactoring rather than cosmetic change; [I've written about that elsewhere](https://joost.blog/wordpress-refactor-not-redecorate/). The case for structural funding is stronger now, not weaker; the headline number it adds up to may well be smaller.

That's the Luddite parallel from earlier, applied honestly to open source. In OSS too, maintainers using AI should largely replace maintainers who don't, and structural funding should follow the leverage. Uncomfortable to say out loud, but it's the direct corollary of the leverage argument. Pretending otherwise spreads too little money across too many maintainers too thinly to sustain any of them — which is roughly where we are now.

The EU Cyber Resilience Act, taking full effect in December 2027, will create the first real legal incentive for vendors to fund their upstream dependencies. That's a feature, not a bug. We should welcome the regulation and pressure it to do more.

### Fix procurement

Dries makes a related point worth amplifying. Public procurement is where a lot of this money lives, and right now it flows *around* open source rather than *into* it. Governments buying open-source-based services overwhelmingly contract with large system integrators who package and resell someone else's work. The maintainers who built the software get nothing.

His suggested fix is to make upstream contribution count in procurement scoring, using projects' own transparent credit systems to verify it. That's one of the most actionable policy ideas I've seen on open source funding in years. APELL and EuroStack are pushing versions of this for the EU. If you work in public-sector procurement and read this blog, it's probably the single highest-leverage thing you can change.

The European Commission provided the template on the cloud side. In April 2026 it [awarded a €180 million sovereign cloud tender](https://ec.europa.eu/commission/presscorner/detail/en/ip_26_833) to four European providers under a new Cloud Sovereignty Framework. The framework grades bidders on eight concrete objectives, from legal control to supply-chain transparency to technological openness, and scores them from SEAL-0 to SEAL-4. SEAL-4 requires a full EU supply chain from chips to software. What was abstract is now measurable. The same template, translating sovereignty into specific auditable criteria and making bidders earn a score, maps directly onto upstream open source contribution and onto AI model transparency. The machinery now exists. It needs to extend further.

### Treat sovereignty as structural

European digital sovereignty stops being a niche policy concern and becomes a first-class economic question. Let me state my bias openly: I am European, and I think European digital sovereignty is the right frame for Europe right now. That's a partisan position.

A Brazilian, Indonesian, or Nigerian reader could fairly read this post as one imperial stack arguing against another. The "digital sovereignty" I'm arguing for would still leave their governments dependent on European cloud providers, European regulation, and European legal frameworks. They'd be partly right. What's universal in this argument is agency: the right to run software under rules you choose. What's particular is which bloc's rules I'd prefer Europe to be under, which is its own question. If you're not European, the same argument structure still applies; you need to substitute your own jurisdiction for mine.

With that caveat on the table, here is the structural argument. Compute has to run somewhere, and somewhere is always governed by someone. Even as inference gets cheaper, the providers running it sit overwhelmingly under US or Chinese jurisdiction, and jurisdictional law follows the provider rather than the data location. The only path to genuine sovereignty for everyone else runs through open source software running on infrastructure under domestic legal control. This is not a cultural project. It is a structural one. And the EU is, finally, beginning to take it seriously.

### Expect more WordPress-style crises

This is the one I keep returning to: the WordPress crisis was a preview, not an aberration. Every open source ecosystem with significant central infrastructure, significant commercial dependency, and significant single-point governance is going to face some version of it over the next decade.

The mechanism is structural, not specific to WordPress. The first generation of major OSS founders are aging into their 50s and 60s, having built their projects when "BDFL plus a permissive trademark policy" felt like sufficient governance. The commercial layers that have grown on top are now worth tens of billions of dollars, and the friction between trademark holders, infrastructure operators, and commercial users has scaled correspondingly. Add ideological drift, acquisition pressure, founder fatigue with no clear succession, and the economic regime shift this post is about, and you get the same conditions in a dozen other places.

The ones with credible exit options and institutional backing will absorb the shock. The ones without will fragment painfully. We need the institutional answers (federation, neutral foundations, multi-stakeholder governance) built *before* the next crisis, not during it.

## Closing

The classical economists understood that price reflects scarcity, and that scarcity is mostly about physical and institutional facts. SaaS made us forget that for a generation, by inhabiting an unusual economic regime where software was scarce to produce but abundant to copy. AI is ending that regime from both ends. The artifact is becoming abundant. The running is becoming expensive again. Compute, trust, attention, and institutional capacity are becoming the scarce resources.

In that new regime, open source's *potential* value proposition is that the agency is yours. Whether that potential becomes operational reality depends on the institutions, funding mechanisms, and procurement frameworks we build around it. The artifacts alone won't do it. The licences alone won't do it. What will do it is the unglamorous work of converting theoretical agency into practiced agency: paying maintainers, funding verification infrastructure, writing procurement rules that reward contribution, building neutral foundations that can catch forks when they happen.

Open source is the only substrate that makes this possible. It is not, by itself, sufficient. That is a more modest claim than "open source wins," and it's the honest one. The argument is older than free software, older than computing. It is, in some real sense, the argument the printing press eventually settled in favour of authors over publishers, the argument the enclosures lost on behalf of commoners, the argument the guilds eventually lost to impersonal markets. We are running it again.

This time, with luck and a great deal of work, we get to learn from the parallels.

---

*This post emerged from a long conversation with my wife [Marieke](https://marieke.com) about the economics of software development. The framing here is mine; the sharpest observations are hers.*
