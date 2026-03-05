# Phase 7: Yoast-like Schema - Research

**Researched:** 2026-03-05
**Domain:** Schema.org JSON-LD structured data (Yoast SEO format)
**Confidence:** HIGH

## Summary

This phase replaces the existing standalone Article and VideoObject JSON-LD blocks with a comprehensive, interconnected `@graph` array matching the current WordPress/Yoast SEO output on joost.blog. The production site was fetched and analyzed -- it outputs extremely rich schema including Person with full employment history, family members, referenced Organizations (Yoast, Emilia Capital, Post Status, WordProof, Blokjes, Newfold Digital), Places, and a Country entity. Blog posts output Article + WebPage + ImageObject + BreadcrumbList + WebSite + Person. The homepage outputs CollectionPage instead of WebPage.

The implementation is purely data-oriented TypeScript -- no external libraries needed. The core architecture is a set of "piece builder" functions that each produce a schema piece, plus a "graph assembler" that combines the appropriate pieces for each page type. All data is static (single author, known entities), making this a build-time concern with no runtime complexity.

**Primary recommendation:** Build a `src/utils/schema/` module with piece builders for each schema type, a person data file with all the rich entity data, and a single `SchemaGraph.astro` component that replaces the existing `JsonLd.astro` usage across all page templates.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single JSON-LD block per page with `@graph` array
- All pieces reference each other via `@id` URIs (e.g., `"@id": "https://joost.blog/#/schema.org/Person"`)
- Matches the Yoast SEO output format: https://developer.yoast.com/features/schema/
- Schema types: Person, WebSite, WebPage (and subtypes), Article, VideoObject, BreadcrumbList, ImageObject, SiteNavigationElement
- No SearchAction (skip until search exists)
- Person entity: `@type: ["Person", "Organization"]` with full rich data (birthDate, gender, nationality, familyName, knowsLanguage, jobTitle, sameAs with 12 profiles, worksFor with EmployeeRole history, spouse, children, colleague)
- Breadcrumb structure: Blog posts = Home > Blog > Category > Post; Videos = Home > Videos > Video; Category pages = Home > Blog > Category; Other = Home > Page
- Every page gets full schema -- no exceptions
- Blog posts: WebPage + Article + BreadcrumbList + ImageObject
- Video pages: WebPage + VideoObject + BreadcrumbList
- About page: ProfilePage + BreadcrumbList
- Blog listing/category archives: CollectionPage + BreadcrumbList

### Claude's Discretion
- Which WebPage subtypes to use beyond ProfilePage and CollectionPage
- Architecture of the schema generation system (helpers, utilities, component structure)
- How to handle pages without categories in breadcrumbs
- Whether to include referenced Organization entities (Yoast, Emilia Capital, Post Status) inline or as stubs
- ImageObject detail level

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 5.15.3 | Static site framework | Already in use |
| TypeScript | (project) | Type-safe schema builders | Already configured |

### Supporting
No additional libraries needed. Schema.org JSON-LD is pure JSON output -- no parsing, validation, or generation libraries required. The existing `JsonLd.astro` component pattern (renders `<script type="application/ld+json">`) is sufficient and will be reused.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-built schema objects | `schema-dts` (Google's TS types for schema.org) | Adds type safety for schema properties but large dependency for what's essentially static data; not worth it for a single-author blog with known schema shape |
| Custom piece builders | `@vcarl/schema-org` or similar | These are designed for dynamic sites; this blog has static, well-known data |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── utils/schema/
│   ├── index.ts              # Main graph assembler - buildGraphForPage()
│   ├── types.ts              # TypeScript interfaces for schema pieces
│   ├── person-data.ts        # All Joost de Valk entity data (static)
│   ├── organization-data.ts  # Referenced organizations (Yoast, Emilia, etc.)
│   ├── pieces/
│   │   ├── person.ts         # buildPersonPiece()
│   │   ├── website.ts        # buildWebSitePiece()
│   │   ├── webpage.ts        # buildWebPagePiece() with subtype support
│   │   ├── article.ts        # buildArticlePiece()
│   │   ├── video.ts          # buildVideoObjectPiece()
│   │   ├── breadcrumb.ts     # buildBreadcrumbPiece()
│   │   ├── image.ts          # buildImageObjectPiece()
│   │   └── navigation.ts     # buildSiteNavigationElementPiece()
│   └── constants.ts          # Base URL, @id patterns
├── components/
│   ├── JsonLd.astro          # Existing - reuse as-is
│   └── SchemaGraph.astro     # New - orchestrates graph for current page
```

### Pattern 1: Graph Assembler
**What:** A central function that takes page context (type, URL, data) and returns the complete `@graph` array with all relevant pieces.
**When to use:** Every page render.
**Example:**
```typescript
// src/utils/schema/index.ts
import type { SchemaPageContext } from './types';

export function buildSchemaGraph(ctx: SchemaPageContext): object {
  const graph: object[] = [];

  // Always included
  graph.push(buildWebSitePiece());
  graph.push(buildPersonPiece());
  graph.push(buildBreadcrumbPiece(ctx));

  // Page-type specific
  switch (ctx.pageType) {
    case 'blogPost':
      graph.push(buildWebPagePiece(ctx));
      graph.push(buildArticlePiece(ctx));
      if (ctx.featureImage) graph.push(buildImageObjectPiece(ctx));
      break;
    case 'video':
      graph.push(buildWebPagePiece(ctx));
      graph.push(buildVideoObjectPiece(ctx));
      break;
    case 'homepage':
      graph.push(buildCollectionPagePiece(ctx));
      break;
    case 'about':
      graph.push(buildProfilePagePiece(ctx));
      break;
    case 'category':
      graph.push(buildCollectionPagePiece(ctx));
      break;
    case 'blogListing':
      graph.push(buildCollectionPagePiece(ctx));
      break;
    default:
      graph.push(buildWebPagePiece(ctx));
  }

  // Add referenced entities (organizations, family, etc.)
  graph.push(...buildReferencedEntities(ctx));

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
```

### Pattern 2: @id Reference System
**What:** All pieces use consistent `@id` URIs and reference each other by `@id` only.
**When to use:** Every cross-reference between schema pieces.
**Example:**
```typescript
// src/utils/schema/constants.ts
export const SITE_URL = 'https://joost.blog';
export const IDS = {
  person: `${SITE_URL}/about-me/#/schema.org/Person`,
  website: `${SITE_URL}/#/schema.org/WebSite`,
  countryNl: `${SITE_URL}/#/schema.org/Country/nl`,
  // WebPage @id = the canonical URL of the page itself
  webPage: (url: string) => url,
  breadcrumb: (url: string) => `${url}#breadcrumb`,
  article: (url: string) => `${url}#article`,
} as const;

// Usage in Article piece:
{
  "@type": "Article",
  "@id": IDS.article(ctx.canonicalUrl),
  "isPartOf": { "@id": IDS.webPage(ctx.canonicalUrl) },
  "author": { "name": "Joost de Valk", "@id": IDS.person },
  "publisher": { "@id": IDS.person },
}
```

### Pattern 3: Static Data Files
**What:** Person entity data, organization data, and family member data stored in dedicated TypeScript files.
**When to use:** Single source of truth for all the rich entity data.
**Example:**
```typescript
// src/utils/schema/person-data.ts
export const joostPerson = {
  "@id": IDS.person,
  "@type": ["Person", "Organization"] as const,
  "name": "Joost de Valk",
  "familyName": "de Valk",
  "birthDate": "1982-02-16",
  "gender": "https://schema.org/Male",
  "nationality": { "@id": IDS.countryNl },
  "description": "Joost is an internet entrepreneur from Wijchen, the Netherlands...",
  "jobTitle": "Partner",
  "knowsLanguage": ["Dutch", "English", "German", "French", "Italian"],
  "url": "https://joost.blog/about-me/",
  "sameAs": [
    "https://joost.blog/about-me/",
    "https://www.facebook.com/jdevalk",
    "https://www.instagram.com/joostdevalk",
    "https://www.linkedin.com/in/jdevalk",
    "https://x.com/jdevalk",
    "https://bsky.app/profile/joost.blog",
    "https://www.youtube.com/user/jdevalk",
    "https://en.wikipedia.org/wiki/Joost_de_Valk",
    "https://joost.net/@joost",
    "https://github.com/jdevalk",
    "https://profiles.wordpress.org/joostdevalk",
    "https://emilia.capital/joost/"
  ],
  // ... worksFor, spouse, children, colleague
};
```

### Pattern 4: SchemaGraph Component
**What:** Astro component that replaces per-page inline schema, calls the graph assembler.
**When to use:** In every page template, replaces current inline JSON-LD.
**Example:**
```astro
---
// src/components/SchemaGraph.astro
import JsonLd from './JsonLd.astro';
import { buildSchemaGraph, type SchemaPageContext } from '../utils/schema';

interface Props {
  pageContext: SchemaPageContext;
}

const { pageContext } = Astro.props;
const schema = buildSchemaGraph(pageContext);
---
<JsonLd schema={schema} />
```

### Anti-Patterns to Avoid
- **Inline schema construction in page templates:** The current approach of building JSON-LD objects directly in `[slug].astro` frontmatter does not scale to interconnected graphs. Centralize all schema logic.
- **Duplicating entity data across pages:** Person, Organization, WebSite data must come from a single source. Never copy-paste entity objects into multiple templates.
- **Using relative URLs in schema:** All URLs in schema.org must be absolute. Use `Astro.site` or the hardcoded `SITE_URL` constant.
- **Forgetting `@id` on cross-referenced pieces:** Every piece that gets referenced by another piece MUST have an `@id`. Without it, the graph is disconnected.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema.org type definitions | Custom interfaces from scratch | Copy from production output | The production WordPress site IS the reference implementation |
| @id URI generation | Ad-hoc string concatenation | Centralized `IDS` constant object | Consistency across all pieces; typos break cross-references silently |
| Person/Organization entity data | Hardcode in each piece builder | Dedicated data files imported by builders | Single source of truth; data will be identical on every page |
| Breadcrumb path resolution | Custom path parsing | Map page type to known breadcrumb patterns | Only 5-6 patterns exist; no need for generic path parsing |

**Key insight:** This is essentially a data transcription task from WordPress output to TypeScript data structures, not an algorithmic challenge. The production site's output IS the spec.

## Common Pitfalls

### Pitfall 1: Inconsistent @id Patterns
**What goes wrong:** Using `#person` on one page and `#/schema.org/Person` on another breaks cross-references.
**Why it happens:** Multiple developers or copy-paste without centralizing IDs.
**How to avoid:** Single `IDS` constants object, never construct @id strings inline.
**Warning signs:** Schema validation tools showing disconnected entities.

### Pitfall 2: Missing Pieces on Certain Page Types
**What goes wrong:** A page type (e.g., category archive, videos listing) doesn't get schema because it wasn't in the switch statement.
**Why it happens:** New page types added without updating the graph assembler.
**How to avoid:** The context document says "every page gets full schema -- no exceptions." Use a default case that outputs at minimum WebPage + BreadcrumbList + WebSite + Person.
**Warning signs:** Pages without JSON-LD in the rendered HTML.

### Pitfall 3: Homepage vs Blog Listing Confusion
**What goes wrong:** Homepage (`/`) and blog listing (`/blog/`) are different pages but might share page type logic.
**Why it happens:** The homepage shows posts AND has a hero; the blog listing is pure post archive.
**How to avoid:** Both should use CollectionPage but with different metadata (homepage has `about` referencing Person; blog listing is a standard collection).
**Warning signs:** Duplicate or missing schema on either page.

### Pitfall 4: Breadcrumb Category Handling for Posts Without Categories
**What goes wrong:** A blog post without categories can't produce `Home > Blog > Category > Post` breadcrumb.
**Why it happens:** Some posts may not have categories assigned.
**How to avoid:** Fall back to `Home > Blog > Post title` when no category exists. Use the primary (first) category when multiple exist.
**Warning signs:** Empty breadcrumb position or missing category in path.

### Pitfall 5: Production Schema Scope Creep
**What goes wrong:** The production homepage outputs ~25 entities including family members, all organizations with KvK numbers, Places with addresses. Attempting to replicate ALL of this is scope creep.
**Why it happens:** The WordPress site has accumulated very rich schema over years.
**How to avoid:** Include all entities referenced by the Person piece (organizations in worksFor, spouse, children) because they're needed for a complete graph. But simplify: skip Place entities, skip KvK/taxID identifiers, skip Newfold Digital. Focus on entities the CONTEXT.md specifically mentions.
**Warning signs:** Person data file exceeding 300 lines; spending more than 1 wave on data entry.

### Pitfall 6: ImageObject URL Resolution
**What goes wrong:** Featured images in Astro are processed (hashed filenames, different formats), so the URL used in schema won't match the original WordPress URL pattern.
**Why it happens:** Astro's image pipeline transforms image paths at build time.
**How to avoid:** For the Person profile image, reference the known Astro asset path and resolve it. For article featured images, use the OG image URL (`/og/{slug}.png`) which is a known, stable path. Alternatively, resolve the Astro-processed image URL at build time using `getImage()`.
**Warning signs:** Schema pointing to non-existent image URLs.

## Code Examples

### Current Schema Output to Replace

Blog post (`[slug].astro` lines 57-70) -- standalone Article, no graph:
```typescript
const articleSchema = isBlog ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blogData!.title,
    "author": { "@type": "Person", "name": "Joost de Valk", "url": "https://joost.blog" },
    "datePublished": blogData!.publishDate.toISOString(),
    ...(blogData!.updatedDate && { "dateModified": blogData!.updatedDate.toISOString() }),
    "description": blogData!.excerpt ?? blogData!.seo?.description ?? "",
    "image": new URL(`/og/${entry.id}.png`, Astro.site).toString()
} : null;
```

Video page (`videos/[slug].astro` lines 33-42) -- standalone VideoObject, no graph:
```typescript
const videoSchema = video.data.youtubeId ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.data.title,
    // ...
} : null;
```

### Target: Production Blog Post Schema Structure
Source: fetched from `https://joost.blog/healthy-doubt/`

The production output for a blog post contains these 7 pieces in the `@graph`:
1. **Article** -- headline, author (by @id), publisher (by @id), isPartOf (WebPage @id), mainEntityOfPage, dates, wordCount, articleSection, image (by @id)
2. **WebPage** -- url, name, isPartOf (WebSite @id), primaryImageOfPage, dates, breadcrumb (by @id), inLanguage, potentialAction (ReadAction)
3. **ImageObject** -- for the featured image with url, contentUrl, width, height
4. **BreadcrumbList** -- Home > Category > Post title (3 items)
5. **WebSite** -- url, name, description, publisher (Person @id), inLanguage (no SearchAction in Astro version)
6. **Person** -- full rich entity with sameAs, worksFor, spouse, children, etc.
7. **Person profile ImageObject** -- for the Person's image

### Target: Production Homepage Schema Structure
Source: fetched from `https://joost.blog/`

The production output for the homepage contains ~22 pieces including:
1. **CollectionPage** -- with `about` referencing Person
2. **BreadcrumbList** -- just Home (single item)
3. **WebSite** -- with publisher referencing Person
4. **Person (Joost)** -- full entity with 9 EmployeeRoles
5. **Person profile ImageObject**
6. **Person (Marieke)** -- spouse with her own worksFor
7. **Person (Tycho, Wende, Ravi, Borre)** -- children
8. **Organization (Emilia Capital, Yoast, Post Status, WordProof, Blokjes, Newfold Digital)**
9. **Place (Emilia Plaats, Yoast building)**
10. **Country (Netherlands)**

### Recommended Scope for Astro Implementation

Include in every page's graph:
- Person (Joost) -- full entity
- WebSite -- always
- BreadcrumbList -- always
- Page-specific piece (WebPage/Article/VideoObject/CollectionPage/ProfilePage)
- ImageObject -- for featured images and person image
- Country (Netherlands) -- referenced by Person.nationality

Include as referenced organization stubs (name, url, @id only -- not full entities):
- Emilia Capital, Post Status, WordProof, Blokjes, Yoast -- referenced in worksFor EmployeeRoles

Include on about page and homepage only (rich pages):
- Marieke (spouse) -- as a Person stub with name, url, @id
- Children -- as Person stubs with name, @id
- Organizations with richer data (logos, descriptions, sameAs)

This keeps the schema accurate (all @id references resolve within the graph) while avoiding 20+ entities on every blog post page.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Standalone JSON-LD per entity | Single `@graph` array with all entities | ~2019 (Yoast Schema framework) | Google can understand entity relationships |
| Inline Person in Article | Person as separate piece with @id reference | ~2019 | Person data defined once, referenced everywhere |
| Basic Article schema | Article + WebPage + BreadcrumbList + ImageObject | ~2019 | Richer signals for Google rich results |
| Generic `@type: "WebPage"` | Subtype-specific (ProfilePage, CollectionPage) | Ongoing | More precise page type signals |

**Current best practice:** Google recommends a single JSON-LD block per page. Multiple blocks are valid but a single `@graph` is cleaner and ensures entity resolution. Google's structured data testing tool validates `@graph` arrays correctly.

## Open Questions

1. **Organization entity depth**
   - What we know: Production site includes 6+ organizations with logos, KvK numbers, descriptions
   - What's unclear: How much org detail to include on every page vs. only on about/homepage
   - Recommendation: Include Organization stubs (name, url, @id) on all pages since they're referenced by Person.worksFor. Include full org entities (with logos, descriptions) only on about page and homepage. This is Claude's discretion per CONTEXT.md.

2. **SiteNavigationElement implementation**
   - What we know: CONTEXT.md requires it; production WordPress site doesn't appear to output it
   - What's unclear: Whether to output it as a separate piece in the graph or skip
   - Recommendation: Include it -- it's in the CONTEXT.md requirements. Build from `siteConfig.primaryNavLinks`. Output on all pages as part of the graph.

3. **Image URL resolution for schema**
   - What we know: Astro processes images with hashes; OG images are at `/og/{slug}.png`
   - What's unclear: Whether to use OG image URLs or resolved Astro image URLs for ImageObject pieces
   - Recommendation: For Article image, use the OG image path (`/og/{slug}.png`) since it's a stable, known URL. For the Person profile image, resolve through Astro's `getImage()` or use a known static path.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Astro build (static output validation) |
| Config file | astro.config.mjs |
| Quick run command | `npx astro build && node scripts/validate-schema.mjs` |
| Full suite command | `npx astro build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHEMA-01 | Every page has single JSON-LD with @graph | smoke | `npx astro build && grep -r 'application/ld+json' dist/ \| wc -l` | No - Wave 0 |
| SCHEMA-02 | Blog posts have Article + WebPage + BreadcrumbList | smoke | Build + inspect dist/healthy-doubt/index.html | No - Wave 0 |
| SCHEMA-03 | Person entity has all required fields | unit | Validate person data object has all 12 sameAs, worksFor entries | No - Wave 0 |
| SCHEMA-04 | @id references are consistent across pieces | unit | Parse JSON-LD, verify all @id refs resolve within graph | No - Wave 0 |
| SCHEMA-05 | Breadcrumbs follow specified hierarchy | unit | Test breadcrumb builder with each page type | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx astro build` (ensures no build errors)
- **Per wave merge:** Build + spot-check 3 page types' HTML for correct JSON-LD
- **Phase gate:** Full build + validate all page types have correct schema

### Wave 0 Gaps
- [ ] No existing schema validation tests -- all validation will be via build output inspection
- [ ] Consider a simple Node script that parses built HTML and validates JSON-LD structure
- [ ] Framework install: none needed -- use Astro build + manual inspection or simple scripts

## Sources

### Primary (HIGH confidence)
- Production site `https://joost.blog/` -- fetched complete JSON-LD from homepage (22 entities)
- Production site `https://joost.blog/healthy-doubt/` -- fetched complete JSON-LD from blog post (7 entities)
- Production site `https://joost.blog/about-me/` -- fetched complete JSON-LD from about page (14 entities)
- Yoast Developer docs `https://developer.yoast.com/features/schema/` -- schema framework overview
- Yoast Developer docs -- Article, WebPage, Person, BreadcrumbList, WebSite piece specifications
- Existing codebase -- `JsonLd.astro`, `[slug].astro`, `videos/[slug].astro`, `site-config.ts`, `content.config.ts`

### Secondary (MEDIUM confidence)
- Schema.org specifications (WebPage subtypes: ProfilePage, CollectionPage) -- well-established standards

### Tertiary (LOW confidence)
- None -- all findings verified against production output

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no external libraries needed, pure TypeScript
- Architecture: HIGH -- pattern is clear from production output analysis
- Pitfalls: HIGH -- identified from actual production schema comparison
- Data completeness: HIGH -- all entity data extracted from live production site

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable domain, schema.org specs don't change frequently)
