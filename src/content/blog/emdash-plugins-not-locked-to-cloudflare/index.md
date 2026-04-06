---
title: 'EmDash plugins are not locked to Cloudflare'
publishDate: 2026-04-06T00:00:00.000Z
excerpt: >-
  A common criticism of EmDash is that its plugins are tied to Cloudflare. I
  built one. They're not. Here's what the plugin API actually looks like.
categories:
  - Development
  - Open Source
draft: true
password: 'april6'
---
Since [EmDash launched](/emdash-cms/), I keep seeing the same claim: plugins are locked to Cloudflare. That building on EmDash means buying into Cloudflare's infrastructure entirely. It's a reasonable concern on the surface — Cloudflare built it, and the tightest integration is with their stack. But it's wrong.

I know because I built one.

## The SEO plugin

I wrote an SEO plugin for EmDash that handles meta descriptions, Open Graph tags, Twitter Cards, canonical URLs, robots directives, and a full JSON-LD schema graph. It has a settings panel in the admin for configuring whether your site represents a person or an organization, social profiles, title separators — the kind of thing I've spent fifteen years thinking about.

Here's the entire plugin entry point:

```typescript
export function createPlugin() {
  return definePlugin({
    id: "seo",
    version: "1.0.0",
    capabilities: ["read:content"],

    hooks: {
      "page:metadata": {
        handler: metadataHandler,
        priority: 10,
      },
    },

    admin: {
      settingsSchema,
    },
  });
}
```

That's it. `definePlugin` comes from the `emdash` package. The plugin declares what it needs (`read:content`), registers a hook (`page:metadata`), and provides a settings schema for the admin UI. There is no Cloudflare import. No Workers API. No D1 query. No R2 call. Nothing platform-specific at all.

The metadata handler receives a page context and a plugin context, and returns an array of metadata contributions — meta tags, link elements, JSON-LD blocks. It reads settings from a key-value interface that EmDash provides. That interface works the same whether the underlying storage is Cloudflare D1, SQLite, Turso, or anything else EmDash supports.

## A second example: email delivery via Lettermint

To prove the point further, I built a [second plugin](https://github.com/jdevalk/emdash-plugin-lettermint) — an email provider that sends all EmDash emails through [Lettermint](https://lettermint.co), an EU-based email delivery service. The core is even simpler than the SEO plugin:

```typescript
export function createPlugin() {
  return definePlugin({
    id: "lettermint",
    version: "1.0.0",
    capabilities: ["email:provide", "network:fetch"],
    allowedHosts: ["api.lettermint.co"],

    hooks: {
      "email:deliver": {
        exclusive: true,
        handler: deliverHandler,
      },
    },

    admin: {
      settingsSchema: {
        apiToken: {
          type: "secret",
          label: "API token",
          description: "Your Lettermint API token",
        },
        fromAddress: {
          type: "string",
          label: "From address",
          description: "Default sender address",
        },
      },
    },
  });
}
```

The handler fetches the API token from plugin settings and calls Lettermint's REST API. The `network:fetch` capability is scoped to `api.lettermint.co` via `allowedHosts` — the plugin can't call anything else. No Cloudflare SDK, no Workers API. Just standard HTTP to a third-party service, through EmDash's abstraction layer.

This is a completely different type of plugin — email transport instead of metadata — and the pattern is identical. Same `definePlugin`, same hooks, same settings schema. Same portability.

## What the plugin API actually is

EmDash's plugin system is an abstraction layer. Plugins talk to EmDash's APIs, not to the hosting platform. The key primitives are:

- **Hooks** like `page:metadata` that let you contribute to the page rendering pipeline
- **A KV interface** for plugin settings and state, backed by whatever database EmDash is running on
- **A settings schema** that generates the admin UI from a JSON declaration — no HTML, no JavaScript injection
- **Declared capabilities** that scope what a plugin can access

This is how modern plugin systems work. Browser extensions don't talk to the browser's rendering engine directly. iOS apps don't write to raw disk. EmDash plugins don't talk to Cloudflare.

## Trusted vs. sandboxed: the nuance

There is one thing Cloudflare adds that other platforms don't: sandboxed execution. EmDash has [two plugin modes](https://docs.emdashcms.com/plugins/overview/). In **trusted mode** (the default, available on every platform), plugins run in-process and capabilities are essentially documentation — the plugin declares what it needs, but the runtime doesn't enforce boundaries. In **sandboxed mode** (Cloudflare only), plugins run in isolated V8 workers and capabilities are enforced at the runtime level.

This means the *security model* is stronger on Cloudflare. That's a real advantage, and it's fair to point it out. But the *plugin API* is identical in both modes. My SEO plugin doesn't know or care which mode it's running in. It declares `read:content`, uses the hooks and KV interface, and works the same everywhere.

This is a meaningful architectural choice. In WordPress, plugins can (and regularly do) write raw SQL against the database, manipulate the filesystem, and call platform-specific functions. That's what makes WordPress plugins [powerful and dangerous in equal measure](/wordpress-refactor-not-redecorate/). EmDash's approach trades some of that raw power for portability and security. On Cloudflare, that security is enforced. On other platforms, it's a convention — but the plugin code is still portable by definition.

## How distribution works

EmDash has two distribution channels for plugins. There's a [centralized marketplace](https://marketplace.emdashcms.com) where plugins are downloaded into the sandbox runner — that part does require Cloudflare. But there's also plain npm. My SEO plugin could be published to npm today, and anyone could install it with `npm install` and add it to their Astro config. No marketplace account needed, no Cloudflare required.

The marketplace is for sandboxed third-party plugins where you want the security enforcement. npm is for trusted plugins — your own code, or packages from developers you trust. Both install the same plugin API. The difference is the isolation layer, not the plugin itself.

## Why the misconception exists

I think people conflate two things: EmDash is *built by* Cloudflare, and the deployment story *starts with* Cloudflare. If you spin up EmDash today, the path of least resistance is Cloudflare Workers + D1 + R2. That's real. But that's a deployment choice, not a plugin constraint.

It's like saying WordPress plugins are locked to Apache because most WordPress sites historically ran on Apache. The hosting layer and the plugin layer are different things.

If you're evaluating EmDash and plugin portability is a concern, look at the actual API surface. Read a plugin. Write one. You'll find TypeScript, hooks, and JSON schemas. You won't find a single Cloudflare import.
