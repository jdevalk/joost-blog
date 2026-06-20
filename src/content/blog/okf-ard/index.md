---
title: "OKF and ARD: complementary by <em>accident</em>"
seo:
  title: Composing OKF and ARD on specification.website
  description: >-
    Two standards landed in a week, both partly Google, neither aware of the
    other. OKF packages knowledge; ARD finds it. I composed both and filed the
    gaps.
publishDate: 2026-06-20T00:00:00.000Z
excerpt: >-
  Two standards for the agentic web shipped within a week, both with Google's
  fingerprints, neither referencing the other, one not even agreeing with itself
  about a field name. They turn out to connect almost perfectly: OKF packages a
  knowledge base, ARD makes it discoverable. I adopted both on
  specification.website and filed the gaps they left.
categories:
  - Development
  - AI
toc: true
---

Two new standards for the agentic web landed within a week of each other this month. Both have Google's fingerprints on them. Neither references the other, and one does not even agree with itself about what to call a field. I adopted both on [specification.website](https://specification.website) this week, bracing for the usual overlap. There is none. They are two separate ideas that happen to connect almost perfectly.

## Two ideas that connect

[Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog) (OKF), out of Google Cloud, is a way to package a knowledge base: a tree of typed Markdown concept files with a little front matter. It is deliberately narrow. Serving the bundle and helping anyone find it are explicit non-goals. A conformant OKF bundle sitting on a server is, by design, undiscoverable.

[Agentic Resource Discovery](https://agenticresourcediscovery.org/) (ARD), announced on Google's developer blog and built on a Linux Foundation base spec, is the discovery layer OKF leaves out. You publish a catalog at `/.well-known/ai-catalog.json` listing what your domain offers, and an entry can point straight at an OKF bundle. On their own, each is partial: OKF packages a knowledge base it deliberately leaves undiscoverable, and ARD is a discovery layer that only pays off when there is something worth pointing at. Composed, they fit exactly, with the catalog sending an agent straight to the bundle. That is why I shipped both instead of picking one.

## Everything derived, nothing hand-written

specification.website, the [platform-agnostic spec I shipped last month](/fixing-the-plumbing/), is already generated from one content collection. The HTML pages, the per-page Markdown mirror, llms.txt, the data the MCP server reads: all derived from the same source. The OKF bundle is one more output of that pipeline, not a second copy to keep in sync.

It comes to 604 Markdown files: 144 check concepts whose paths mirror their canonical URLs, 445 reference concepts (one per distinct cited source), and the index files OKF wants in between. There is also a [`/okf.tar.gz`](https://specification.website/okf.tar.gz) for anyone who wants the whole thing in one fetch. The ARD catalog now lists four entries, all of which already existed: the MCP server, the A2A agent, the Agent Skill, and the new bundle.

## The standard that disagrees with itself

The AI Catalog format is pinned down in two places, a base spec and the ARD layer built on it, and the two use different names for an entry's media-type field:

| Spec                                                                | Media-type field |
| ------------------------------------------------------------------- | ---------------- |
| AI Catalog base ([`Agent-Card/ai-catalog`](https://github.com/Agent-Card/ai-catalog)) | `mediaType`      |
| ARD layer ([`ards-project/ard-spec`](https://github.com/ards-project/ard-spec))       | `type`           |

The ARD layer also added a `representativeQueries` array of sample prompts. My first catalog used `mediaType` and was correct against the base spec; a registry validating against ARD would want `type`.

The pragmatic fix is to do both. Every entry now carries both field names with the same value:

```json
{
  "type": "application/okf-bundle+gzip",
  "mediaType": "application/okf-bundle+gzip",
  "url": "https://specification.website/okf.tar.gz"
}
```

Both specs require consumers to ignore keys they do not recognise, so the dual-field entry validates under either reading. Early adoption sometimes means carrying two spellings of the same field until the base spec and the layer built on it line up.

## The gap nobody registered

The OKF bundle entry exposes a real hole. There is no registered media type for an OKF bundle, so I had to invent one: `application/okf-bundle+gzip`, shipped as a single documented constant marked interim. A catalog can list the bundle, but without a blessed type a consumer cannot recognise it as OKF without opening it. Every publisher will invent a different string, and they will never converge.

So I did the ecosystem-citizen thing and filed the fix in both places, offering the live bundle as a reference adopter: [one issue on OKF](https://github.com/GoogleCloudPlatform/knowledge-catalog/issues/111) to define and register the type, and [one on ARD](https://github.com/ards-project/ard-spec/issues/27) to recognise it, which also flagged the `type` versus `mediaType` split. Being an early adopter is not only implementing the draft. It is finding the gap the draft left and pushing it back upstream.

## Optional, on purpose

[specification.website](https://specification.website) is my platform-agnostic spec of what a good website ships, and it grades every feature it documents as required, recommended, optional, or avoid. Both new spec pages, [ARD](https://specification.website/spec/agent-readiness/agentic-resource-discovery/) and [OKF](https://specification.website/spec/agent-readiness/okf-bundle/), are rated optional, not recommended. They are v0.9 drafts that can still move, and the site's rule is to adopt early but rate honestly. This blog runs ARD too, on top of [the rest of its agent-ready plumbing](/agent-ready/), with a `did:web:joost.blog` identity tied to [my Bluesky account](https://bsky.app/profile/joost.blog), but that is a story for another day.

Two overlapping, half-coordinated standards in a single week is not a scandal. It is the normal texture of a layer that is still forming. The useful response is not to wait for the dust to settle. It is to compose what is already there, ship it where people can see it, and file what is missing.
