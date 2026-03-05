---
phase: 07-yoast-like-schema
plan: 01
subsystem: seo
tags: [schema.org, json-ld, structured-data, yoast, breadcrumbs]

requires:
  - phase: 01-foundation
    provides: "Site config, navigation links, base types"
  - phase: 03-features
    provides: "slugify utility for category URL generation"
provides:
  - "buildSchemaGraph() function for all page types"
  - "SchemaPageContext interface for page data"
  - "IDS constant with all @id URI patterns"
  - "Complete Person entity data with 12 sameAs, 5 worksFor"
  - "8 piece builders: person, website, webpage, article, video, breadcrumb, image, navigation"
affects: [07-02-template-integration]

tech-stack:
  added: []
  patterns: ["Piece builder pattern for schema.org entities", "Central IDS constant for @id cross-references", "Graph assembler combining pieces per page type"]

key-files:
  created:
    - src/utils/schema/index.ts
    - src/utils/schema/types.ts
    - src/utils/schema/constants.ts
    - src/utils/schema/person-data.ts
    - src/utils/schema/organization-data.ts
    - src/utils/schema/pieces/person.ts
    - src/utils/schema/pieces/website.ts
    - src/utils/schema/pieces/webpage.ts
    - src/utils/schema/pieces/article.ts
    - src/utils/schema/pieces/video.ts
    - src/utils/schema/pieces/breadcrumb.ts
    - src/utils/schema/pieces/image.ts
    - src/utils/schema/pieces/navigation.ts
  modified: []

key-decisions:
  - "WebPage subtypes: ProfilePage for about, CollectionPage for homepage/blog/category/videoListing"
  - "Organization stubs included on all pages (needed for worksFor @id resolution)"
  - "Family members included only on homepage and about page graphs"
  - "Person profile image uses /images/joost-profile.jpg static path"

patterns-established:
  - "Piece builder pattern: each schema type has a dedicated builder function returning Record<string, unknown>"
  - "IDS constant centralizes all @id URI patterns -- no inline string construction in pieces"
  - "Graph assembler uses switch on pageType to compose page-specific graphs"

requirements-completed: [SCHEMA-01, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-07]

duration: 2min
completed: 2026-03-05
---

# Phase 7 Plan 01: Schema Utility Module Summary

**Yoast-style schema.org piece builders with graph assembler handling all 8 page types via centralized IDS cross-references**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T13:44:12Z
- **Completed:** 2026-03-05T13:46:34Z
- **Tasks:** 2
- **Files created:** 13

## Accomplishments
- Complete `src/utils/schema/` module with types, constants, data files, 8 piece builders, and graph assembler
- Person entity with 12 sameAs profiles, 5 worksFor EmployeeRole entries, spouse, 4 children
- All @id patterns use centralized IDS constant matching Yoast SEO conventions
- Breadcrumb builder handles all page types with correct hierarchy (blogPost gets Home > Blog > Category > Post)
- TypeScript compiles cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create schema types, constants, and entity data files** - `5860411` (feat)
2. **Task 2: Create all piece builders and the graph assembler** - `b0849b8` (feat)

## Files Created/Modified
- `src/utils/schema/types.ts` - SchemaPageType union and SchemaPageContext interface
- `src/utils/schema/constants.ts` - SITE_URL and IDS @id pattern constants
- `src/utils/schema/person-data.ts` - Full Joost de Valk entity data, country, family members
- `src/utils/schema/organization-data.ts` - 5 organization stubs for worksFor references
- `src/utils/schema/pieces/person.ts` - Person piece builder
- `src/utils/schema/pieces/website.ts` - WebSite piece builder
- `src/utils/schema/pieces/webpage.ts` - WebPage/ProfilePage/CollectionPage piece builder
- `src/utils/schema/pieces/article.ts` - Article piece builder with categories and wordCount
- `src/utils/schema/pieces/video.ts` - VideoObject piece builder with YouTube embed
- `src/utils/schema/pieces/breadcrumb.ts` - BreadcrumbList builder for all page types
- `src/utils/schema/pieces/image.ts` - ImageObject and Person image piece builders
- `src/utils/schema/pieces/navigation.ts` - SiteNavigationElement from site config
- `src/utils/schema/index.ts` - Graph assembler combining pieces per page type

## Decisions Made
- WebPage subtypes: ProfilePage for about page, CollectionPage for homepage/blog listing/category/video listing pages
- Organization stubs (name, url, @id only) included on all pages since Person.worksFor references them
- Family members (spouse + 4 children as Person stubs) included only on homepage and about page
- Person profile image references `/images/joost-profile.jpg` static path
- SiteNavigationElement uses hasPart array with nav items from siteConfig

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema utility module complete and ready for Plan 02 template integration
- `buildSchemaGraph()` and `SchemaPageContext` exported from `src/utils/schema/index.ts`
- Plan 02 will create SchemaGraph.astro component and wire it into all page templates

---
*Phase: 07-yoast-like-schema*
*Completed: 2026-03-05*
