---
title: If WordPress gets CPTs in Core, we also need <em>custom fields</em>
publishDate: 2026-05-08T00:00:00.000Z
excerpt: >-
  Gutenberg 23.1 ships a native UI for custom post types. Good. But CPTs
  without custom fields are just renamed posts, and the half Core still
  hasn't answered is the half that matters.
categories:
  - WordPress
toc: true
---
In [her piece on Gutenberg 23.1](https://www.therepository.email/gutenberg-23-1-ships-custom-taxonomies-ui-prompting-why-now-from-the-community), Rae Morey quoted [my reaction](https://x.com/jdevalk/status/2051625635773079948) to Jamie Marsland's celebratory tweet about WordPress shipping a native UI for registering custom post types:

> So… how long before we get this for custom fields too?

That was a tweet. This is the longer version.

## Credit where it's due

Shipping native CPT registration in Gutenberg, on its way to Core, is a real step. Nik Tsekouras and Marin Atanasov went from tracking issue to merged PR in under two weeks. That is the kind of velocity WordPress needs more of, not less. The people grumbling that this should have shipped in 5.0 are technically right, but it's here now, and that is good.

The skeptics in Rae's piece (Jonathan Desrosiers, Brad Williams, Paolo Tajani) aren't wrong to ask whether this belongs in plugin territory. [CPT UI](https://wordpress.org/plugins/custom-post-type-ui/) has more than a million active installs. There's a real argument that Core shouldn't compete here.

I, however, disagree. Content modeling is foundational. The job of a CMS in 2026 is to let you describe a content shape and serve it. If you can't do that without installing a plugin, the C in CMS is doing a lot of heavy lifting. So: yes, in Core. Good.

And the install-count argument cuts the other way. A million people installing the same plugin to get a basic capability is the strongest possible signal that the capability belongs in Core, not an argument against putting it there. The same logic applies to SEO plumbing. Yoast, Rank Math, All in One SEO, and a long tail of smaller plugins exist in part because Core never shipped something as basic as a meta description field. A first-class custom-fields primitive opens a clean path to fixing that: meta description becomes a registered field on posts and pages, not yet another plugin's bespoke postmeta key.

But CPTs are the easier half.

## The asymmetry

A custom post type without custom fields is just a renamed post. Every real content model, whether products, recipes, events, properties, podcasts, or courses, lives in the meta. Title and content cover maybe 20% of what an editor needs to fill in. The other 80% is fields: structured, often nested, sometimes repeating, almost always with their own UI expectations.

That is why [Advanced Custom Fields](https://wordpress.org/plugins/advanced-custom-fields/) (ACF) has 2M+ installs. That is why [Meta Box](https://wordpress.org/plugins/meta-box/), [CMB2](https://wordpress.org/plugins/cmb2/), [Pods](https://wordpress.org/plugins/pods/), and a dozen others exist. Core has never had a first-class answer for structured post meta with proper editor UI. The 23.1 release ships exactly half of what a content modeler needs: the half that was already easiest.

WPSoul's Igor Sanz quipped on X: *"2035, WP is getting native UI to add custom meta."* That's the joke. The serious version is that this is the actual roadmap question, and it deserves a serious answer.

## The version-control problem <em>is</em> the AI problem

Matt Beck flagged a real regression in Rae's piece: the new CPT UI stores definitions in the database, not in files. He's right, and ACF's JSON sync was a great pattern: you describe your content model in code, commit it, deploy it.

The fix for Beck's complaint and the answer to my "what about custom fields?" question are the same thing: **declarative config that lives in files, not database rows.**

Once your content model is declarative config, three things become true at once:

- You can put it in version control.
- You can deploy it across environments deterministically.
- An AI agent can generate it.

That last one is not a gimmick. In 2026, "I want a recipe post type with ingredients (list of name + amount + optional flag), nutrition info (object), and tags" should be one prompt and a config file, not a half-day of React. Right now in WordPress, you either install ACF and click through screens, or you write a custom block. Neither survives an MCP call. Both are friction in a world where AI agents are increasingly the entity actually building the site.

The new test for "what belongs in Core" isn't "is this in plugin territory?" anymore. It's: **can an agent configure this end-to-end without installing a plugin first?** CPTs coming to Core just barely pass; a CLI or MCP server can write to the underlying records. Custom fields fail the test completely.

## The storage layer underneath

Declarative config in files is half the answer. The other half is what happens to the data those fields produce. I [wrote last month](/wordpress-refactor-not-redecorate/) about WordPress's schema-less data model: every piece of metadata, regardless of type, gets stuffed into `wp_postmeta` as a key-value row, often serialized. Solve the editor side without solving the storage side and you've moved the workaround, not removed it. Every downstream consumer (REST APIs, headless frontends, AI agents) still has to reverse-engineer the shape on the way out.

The fix has to run the whole way down: typed config in files, typed storage in the database, typed responses on the REST surface. WooCommerce already proved this is doable inside the WordPress ecosystem with [High-Performance Order Storage](https://developer.woocommerce.com/docs/features/high-performance-order-storage/). Custom fields are the next obvious place to apply the same pattern.

The same fix unlocks multilingual, by the way. Typed, translatable fields are far easier to reason about than translating serialized blobs in `wp_postmeta`, which is a big part of why WPML and Polylang live as plugins rather than in Core.

## What good looks like

My developer Filip built [field-kit](https://github.com/emdash-cms/emdash/discussions/571) for EmDash last month. It is a small plugin that does one thing well: it gives EmDash's `json` field type a real editor UI, configured entirely through seed config, no React required. He's already working on a [follow-up](https://github.com/ilicfilip/field-kit/pull/2) adding `visibleWhen`, so fields can show or hide based on the value of other fields in the same record.

Four widgets:

- `object-form`: inline form for flat objects
- `list`: ordered array with add/remove/reorder
- `grid`: rows × columns matrix
- `tags`: chip/tag input

Eight sub-field primitives shared across widgets: text, number, boolean, select, textarea, date, color, url.

A field config looks like this:

```json
{
  "slug": "ingredients",
  "type": "json",
  "widget": "field-kit:list",
  "options": {
    "itemLabel": "Ingredient",
    "fields": [
      { "key": "name", "label": "Name", "type": "text" },
      { "key": "amount", "label": "Amount", "type": "text" },
      { "key": "optional", "label": "Optional", "type": "boolean" }
    ]
  }
}
```

That's it. It's a JSON file. An LLM can produce it. A site builder can read it. Strip the plugin out and the underlying data is still clean, valid JSON in the database.

Three properties matter here, and they're all consequences of the same design choice:

1. **Declarative.** The config describes the shape; no code required to render the editor.
2. **Composable.** Widgets and sub-fields are mix-and-match, so a small number of primitives covers most real content shapes.
3. **Data-shape transparent.** The plugin doesn't own your data. Remove it, your records still parse.

This is the shape WordPress Core should aim for.

## What I'm asking for

The Gutenberg [tracking issue](https://github.com/WordPress/gutenberg/issues/77600) already gestures in this direction: *"introduce a dedicated REST controller, move some fields … to post meta."* Good. Push that further:

- A first-class structured-fields primitive in Core.
- Declarative config persisted to files as the source of truth, not database rows. A UI on top of those files is great, ACF's JSON sync already showed how, but the file is what gets committed and deployed.
- A small set of composable widgets (list, object, grid, tags) that cover 80% of cases.
- An agent-addressable surface (REST, WP-CLI, Abilities-style) so configuration isn't locked behind wp-admin.

EmDash is not a competitor here; it's a reference implementation.

Cloudflare's Matt Taylor said on [WP Product Talk](https://www.youtube.com/live/etL7Ket9om8) that it's "odd" CPTs weren't already in Core. He's right. He'll be right again the next time he says it about custom fields. The question is whether WordPress wants to be the project that ships it, or the project that watches someone else ship it.

WordPress can ship this. The team that turned a tracking issue into merged code in fourteen days can turn the next one around. Let's go.
