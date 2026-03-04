---
title: 'From installation to integration: Making plugins “agent-ready”'
publishDate: 2025-12-24T00:00:00.000Z
excerpt: >-
  In my last post, I discussed why a design system is the “visual rail” AI
  needs. But the “Architect” I’ve been describing doesn’t just care about how a
  site look
categories:
  - Development
  - WordPress
featureImage:
  src: ./images/gemini_generated_image_4un6sn4un6sn4un6-scaled.webp
  alt: ''
---
In my [last post](/vibe-coding-trap-design-system/), I discussed why a design system is the “visual rail” AI needs. But the “Architect” I’ve [been describing](/rise-architect/) doesn’t just care about how a site looks; they care about how it functions.

The problem today is that even the smartest AI is often a “clueless” collaborator. You ask a coding assistant to “add a contact form to the sidebar,” and instead of using the powerful form plugin you already have installed, it starts writing a custom database table and a raw PHP `mail()` function from scratch. It’s not being “creative”, it’s just unaware that the tools for the job are already sitting in your site’s plugins folder.

To fix this, we have to stop treating plugins like “black boxes” and start treating them as **self-advertising modules**.

### The communication gap is (mostly) solved

The good news is that we already have the “telephone line” for this conversation. The WordPress AI team recently introduced the [Abilities API](https://make.wordpress.org/ai/2025/07/17/abilities-api/) and the [MCP adapter](https://make.wordpress.org/ai/2025/07/17/mcp-adapter/).

The Abilities API creates a centralized registry where plugins can formally register their functionalities with well-defined schemas. This means that, once installed, a plugin can “hand a menu” to an AI. But for an Architect to plan a site, they need to see that menu *before* the plugin is ever installed.

### The discovery layer: AGENTS.md

The emerging **[AGENTS.md](https://agents.md/)** standard is the right choice for our ecosystem. It isn’t just a text file for a crawler; it’s a briefing document for the AI agents that will be doing the building.

By placing an `AGENTS.md` file in the root of a plugin, we provide a human-and-AI-readable introduction that links directly to a more technical **`abilities.yml`**. This YAML file acts as a static export of what the plugin’s registered abilities do, following the same schema as the Abilities API:

```yaml
abilities:
  - id: "my-seo-plugin/analyze-content-seo"
    label: "Analyze content SEO"
    description: "Analyzes post content for SEO improvements."
    input_schema:
      type: "object"
      properties:
        post_id:
          type: "integer"
          description: "The post identifier."
          required: true
    output_schema:
      type: "number"
      description: "The SEO score in percentage."

```

With this pairing, the Architect can scan a dozen plugins on a remote repository and know exactly which ones fit the site’s requirements, down to the exact data types required, without downloading a single byte of PHP.

### Discovery via the FAIR.pm supply chain

This vision requires a trusted way to query and distribute this information. This is where [FAIR.pm](https://fair.pm/) comes in.

If the FAIR network indexes these `AGENTS.md` and `abilities.yml` files, the global supply chain for WordPress becomes machine-readable. An Architect can query FAIR to ask: *“Find me a trusted package that exposes an ability to analyze a post’s SEO, preferably with an output schema of ‘percentage’.”* FAIR provides both the trust and the map, while the `AGENTS.md` ecosystem provides the technical contract.

Of course, this could be done on the WordPress.org plugin directory too, and it would be nice if it did, but that currently does not include any commercial plugins. FAIR is planning on allowing for *all* plugins from every host, which would make this a lot more inclusive of every plugin out there.

### The “agent-first” developer experience (AX)

For twenty years, plugin developers have obsessed over the user experience (UX). In the “Rise of the Architect” era, developers must at least *also* prioritize the agent experience (AX).

If we don’t create a standard like this, plugins may provide a beautiful settings page, but they are invisible to the modern architect. We have to find a way for plugins to be considered in AI assembly/development processes *before* they’re installed.

### Conclusion: legibility is the new portability

Plugins aren’t going away, but they are changing from being “destination apps” inside the WordPress admin to being “service providers” for an AI-driven assembly process.

By adopting a shared manifest of capabilities and plugging into decentralized networks like FAIR.pm, we ensure that the WordPress ecosystem remains a coherent library of tools, even if they’re spread across many different repositories. If we give the AI a map of our abilities, it can finally stop reinventing the wheel and start helping us build the house we want using already existing parts.
