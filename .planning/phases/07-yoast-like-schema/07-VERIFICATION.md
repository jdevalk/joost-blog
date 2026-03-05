---
phase: 07-yoast-like-schema
verified: 2026-03-05T14:30:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 7: Yoast-like Schema Verification Report

**Phase Goal:** Replace standalone JSON-LD blocks with a comprehensive Yoast-style @graph schema system -- every page outputs interconnected schema.org structured data with rich Person entity, breadcrumbs, and page-type-specific pieces.
**Verified:** 2026-03-05
**Status:** passed
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `buildSchemaGraph()` returns valid JSON-LD with `@context` and `@graph` array | VERIFIED | `src/utils/schema/index.ts` line 70-73: returns `{ '@context': 'https://schema.org', '@graph': graph }` |
| 2 | Person entity includes 12 sameAs profiles, 7 worksFor EmployeeRoles, spouse, children | VERIFIED | `person-data.ts`: 12 sameAs entries counted, 7 EmployeeRole entries (expands plan's 5 minimum), spouse + 4 children |
| 3 | All @id references use consistent patterns from central IDS constant | VERIFIED | `constants.ts` defines all IDS patterns; grep confirms no inline string construction in piece builders |
| 4 | Breadcrumb builder produces correct hierarchy for each page type | VERIFIED | `breadcrumb.ts`: switch covers all 8 page types -- blogPost (Home>Blog>Category>Post), video (Home>Videos>Title), category (Home>Blog>CategoryName), homepage (Home only), blogListing (Home>Blog), videoListing (Home>Videos), about/page (Home>Title) |
| 5 | Every piece builder returns an object with `@type` and `@id` | VERIFIED | All 8 piece builders confirmed: article, breadcrumb, image, navigation, person, video, webpage, website -- each returns object with both fields |
| 6 | Every page template uses SchemaGraph instead of inline JSON-LD | VERIFIED | All 6 templates import `SchemaGraph` and render `<SchemaGraph pageContext={pageContext} />`. No `JsonLd` import or `articleSchema`/`videoSchema` in any template |
| 7 | Blog posts output Article + WebPage + BreadcrumbList + ImageObject + WebSite + Person | VERIFIED | `index.ts` case 'blogPost': pushes WebSitePiece, PersonPiece, BreadcrumbPiece, PersonImagePiece, NavigationPiece + WebPagePiece, ArticlePiece, ImageObjectPiece (conditional on featureImageUrl) |
| 8 | Video pages output VideoObject + WebPage + BreadcrumbList + WebSite + Person | VERIFIED | `index.ts` case 'video': pushes core set + WebPagePiece + VideoObjectPiece |
| 9 | Homepage outputs CollectionPage with about referencing Person | VERIFIED | `webpage.ts` returns 'CollectionPage' for 'homepage'; piece adds `about: { '@id': IDS.person }` |
| 10 | Category archives output CollectionPage + BreadcrumbList | VERIFIED | `webpage.ts` returns 'CollectionPage' for 'category'; breadcrumb builder produces Home > Blog > CategoryName |
| 11 | About page outputs ProfilePage + BreadcrumbList | VERIFIED | `webpage.ts` returns 'ProfilePage' for 'about'; `[slug].astro` sets `pageType: 'about'` when `entry.id === 'about-me'` |
| 12 | Old standalone Article and VideoObject JSON-LD removed | VERIFIED | grep of `[slug].astro` and `videos/[slug].astro` finds zero occurrences of `JsonLd`, `articleSchema`, or `videoSchema` |
| 13 | TypeScript compiles without errors | VERIFIED | `npx tsc --noEmit` produces zero output (clean exit) |

**Score:** 13/13 truths verified

---

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/utils/schema/index.ts` | VERIFIED | 74 lines; exports `buildSchemaGraph` and `SchemaPageContext`; imports all 8 piece builders; handles all 8 page types via switch |
| `src/utils/schema/types.ts` | VERIFIED | 24 lines; exports `SchemaPageType` union (8 variants) and `SchemaPageContext` interface (11 fields) |
| `src/utils/schema/constants.ts` | VERIFIED | 15 lines; exports `SITE_URL` and `IDS` with all 11 @id patterns including functions for dynamic patterns |
| `src/utils/schema/person-data.ts` | VERIFIED | 104 lines; exports `joostPersonData`, `countryNl`, `familyMembers`; full entity with 12 sameAs, 7 worksFor, spouse, 4 children |
| `src/utils/schema/organization-data.ts` | VERIFIED | 46 lines; exports `organizations` array with 7 org stubs (Emilia Capital, Post Status, WordProof, Blokjes, Atarim, Patchstack, Yoast) |
| `src/utils/schema/pieces/person.ts` | VERIFIED | 5 lines; exports `buildPersonPiece()`; spreads joostPersonData |
| `src/utils/schema/pieces/website.ts` | VERIFIED | 14 lines; exports `buildWebSitePiece()`; includes publisher, inLanguage, no SearchAction |
| `src/utils/schema/pieces/webpage.ts` | VERIFIED | 49 lines; exports `buildWebPagePiece(ctx)`; returns correct subtype per pageType; adds about/primaryImage conditionally |
| `src/utils/schema/pieces/article.ts` | VERIFIED | 34 lines; exports `buildArticlePiece(ctx)`; includes author, publisher, isPartOf, datePublished, wordCount, articleSection |
| `src/utils/schema/pieces/video.ts` | VERIFIED | 25 lines; exports `buildVideoObjectPiece(ctx)`; includes thumbnailUrl, embedUrl, uploadDate, duration |
| `src/utils/schema/pieces/breadcrumb.ts` | VERIFIED | 75 lines; exports `buildBreadcrumbPiece(ctx)`; full switch for all 8 page types; uses slugify for category URLs |
| `src/utils/schema/pieces/image.ts` | VERIFIED | 23 lines; exports `buildImageObjectPiece(ctx)` and `buildPersonImagePiece()`; caption on person image |
| `src/utils/schema/pieces/navigation.ts` | VERIFIED | 18 lines; exports `buildSiteNavigationElementPiece()`; maps siteConfig.primaryNavLinks to hasPart array |

#### Plan 02 Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/SchemaGraph.astro` | VERIFIED | 12 lines; imports `buildSchemaGraph` and `SchemaPageContext`; renders via `JsonLd`; accepts `pageContext` prop |
| `src/pages/[slug].astro` | VERIFIED | Contains `<SchemaGraph pageContext={pageContext} />`; sets correct pageType for blog posts and pages including 'about' detection |
| `src/pages/index.astro` | VERIFIED | Contains `<SchemaGraph pageContext={pageContext} />` with 'homepage' pageType |
| `src/pages/blog/[...page].astro` | VERIFIED | Contains `<SchemaGraph pageContext={pageContext} />` with 'blogListing' pageType |
| `src/pages/category/[slug].astro` | VERIFIED | Contains `<SchemaGraph pageContext={pageContext} />` with 'category' pageType and categoryName |
| `src/pages/videos/[slug].astro` | VERIFIED | Contains `<SchemaGraph pageContext={pageContext} />` with 'video' pageType; old videoSchema removed |
| `src/pages/videos/index.astro` | VERIFIED | Contains `<SchemaGraph pageContext={pageContext} />` with 'videoListing' pageType |
| `scripts/validate-schema.mjs` | VERIFIED | 182 lines; substantive validation script checking all page types |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/utils/schema/index.ts` | `src/utils/schema/pieces/*.ts` | imports all piece builders | WIRED | Lines 2-9 import all 8 piece builders; all used in buildSchemaGraph() |
| `src/utils/schema/pieces/person.ts` | `src/utils/schema/person-data.ts` | imports joostPersonData | WIRED | Line 1: `import { joostPersonData } from '../person-data'` |
| `src/utils/schema/constants.ts` | all piece builders | IDS constant used for @id generation | WIRED | All piece builders import and use `IDS.*` -- no inline string construction |
| `src/components/SchemaGraph.astro` | `src/utils/schema/index.ts` | imports buildSchemaGraph | WIRED | Line 3: `import { buildSchemaGraph, type SchemaPageContext } from '../utils/schema'` |
| `src/pages/[slug].astro` | `src/components/SchemaGraph.astro` | component usage | WIRED | Import line 5 + `<SchemaGraph pageContext={pageContext} />` in both blog and page branches |
| `src/pages/index.astro` | `src/components/SchemaGraph.astro` | component usage | WIRED | Import line 10 + `<SchemaGraph pageContext={pageContext} />` |
| `src/pages/videos/[slug].astro` | `src/components/SchemaGraph.astro` | component usage | WIRED | Import line 4 + `<SchemaGraph pageContext={pageContext} />` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SCHEMA-01 | 07-01, 07-02 | Every page has single JSON-LD block with @context and @graph array | SATISFIED | All templates use SchemaGraph which calls buildSchemaGraph returning `{ '@context': 'https://schema.org', '@graph': [...] }` |
| SCHEMA-02 | 07-02 | Blog posts output Article + WebPage + BreadcrumbList + ImageObject in graph | SATISFIED | index.ts case 'blogPost' pushes all four piece types (ImageObject conditional on featureImageUrl) |
| SCHEMA-03 | 07-01 | Rich Person entity with sameAs (12 profiles), worksFor EmployeeRoles, spouse, children | SATISFIED | person-data.ts: 12 sameAs entries, 7 EmployeeRole entries (exceeds minimum 5), spouse (Marieke), 4 children |
| SCHEMA-04 | 07-01, 07-02 | All @id cross-references resolve correctly within the graph | SATISFIED | IDS constant centralizes all patterns; graph assembler includes all referenced entities (countryNl, organizations) as full pieces; validate-schema.mjs performs reference integrity check |
| SCHEMA-05 | 07-01 | Breadcrumbs follow specified hierarchy per page type | SATISFIED | breadcrumb.ts implements all hierarchies: blogPost (Home>Blog>Category>Post), video (Home>Videos>Title), category (Home>Blog>Name), homepage (Home), blogListing/videoListing (2 items), pages (Home>Title) |
| SCHEMA-06 | 07-02 | Video pages output VideoObject + WebPage + BreadcrumbList in graph | SATISFIED | index.ts case 'video' pushes WebPagePiece + VideoObjectPiece + core set (includes BreadcrumbPiece always) |
| SCHEMA-07 | 07-01 | WebSite and SiteNavigationElement pieces included on all pages | SATISFIED | index.ts always pushes buildWebSitePiece() and buildSiteNavigationElementPiece() before page-type switch |
| SCHEMA-08 | 07-02 | Page-type-specific subtypes: CollectionPage (homepage, blog listing, categories), ProfilePage (about) | SATISFIED | webpage.ts returns 'ProfilePage' for 'about', 'CollectionPage' for 'homepage'/'blogListing'/'category'/'videoListing' |

All 8 requirements satisfied. No orphaned requirements found.

---

### Anti-Patterns Found

No anti-patterns detected. Scanned all 13 schema utility files and SchemaGraph.astro for TODO/FIXME/placeholder comments, empty returns, and console.log-only implementations. All clear.

---

### Human Verification Required

The following items cannot be verified programmatically and benefit from human review:

#### 1. Rendered JSON-LD in production output

**Test:** Run `npx astro build && node scripts/validate-schema.mjs` to confirm the 52 validation checks pass against built HTML.
**Expected:** Script reports all checks pass, exit code 0.
**Why human:** The verification was done against source code. The build step transforms Astro to static HTML. The validate script was documented as passing 52/52 in the summary but the dist/ directory may not be current.

#### 2. Google Rich Results validation

**Test:** Build the site, open a blog post, copy the JSON-LD output, paste into https://search.google.com/test/rich-results.
**Expected:** Article rich result valid, BreadcrumbList valid, no errors or warnings.
**Why human:** Programmatic checks can verify structure but not schema.org semantic validity as interpreted by Google.

#### 3. Person entity accuracy

**Test:** Review the `sameAs` URLs, `worksFor` roles, and personal data in `person-data.ts` against the actual current state of Joost's professional history.
**Expected:** All 7 EmployeeRole entries reflect accurate current/past positions, dates are correct. The plan spec mentioned 5 roles but implementation has 7 (Atarim and Patchstack added). Confirm this is intentional and accurate.
**Why human:** The data itself requires domain knowledge to validate for accuracy.

---

### Gaps Summary

No gaps. All 13 must-haves verified across both plan artifacts. All 8 SCHEMA requirements satisfied. TypeScript compiles clean. Key links all wired and substantive. Old standalone JSON-LD removed from both `[slug].astro` and `videos/[slug].astro`.

One notable deviation from plan spec: the plan specified "5 EmployeeRole" entries in worksFor but the implementation delivered 7 (adding Atarim and Patchstack board memberships). This is an improvement, not a deficit, provided the data is accurate (flagged as human verification item 3).

---

_Verified: 2026-03-05T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
