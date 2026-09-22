# Sitemap date sources

The resolver in `src/utils/sitemap.ts` examines every relevant Git revision, follows renames and copies, and compares each file with its parent (or the previous stored version across a delete/restore). It tracks article text, code, links, titles, descriptions and video metadata; homepage-feature flags, categories and generated feature-image metadata do not advance article dates. Import commit `a3f7e33` is not an original modification date. In image-format conversion `bd0591c`, only equivalent image URL extensions are ignored; changes to prose or code still count.

## Original records

`src/data/imported-post-dates.json` contains UTC dates extracted from the owner's `joostblog.WordPress.2025-01-01.xml`: `dates` uses `wp:post_modified_gmt`, and `publicationDates` uses `wp:post_date_gmt`. The raw export is not committed. The October 2025 export contains CMS market-share records rather than blog posts.

Modification dates were retained only for articles whose text and links matched the later saved Markdown export after accounting for export formatting, code-language labels, image alt text, and list/table serialization. Five articles had later differences, so their January modification dates were not treated as current: `blogging-about-not-seo`, `gutenberg-and-yoast-seo`, `optimize-crawling-for-the-environment`, `why-im-stepping-down-from-my-wordpress-marketing-role`, and `wordpress-market-share-shrinking`. Their original publication times remain available for the fallback.

Later editorial commits take precedence over these imported records. Same-day Git evidence takes precedence over a date-only manual field, while an explicit later manual timestamp is preserved. Dates are never earlier than a known publication day.

## Authorized fallback

On 22 September 2026, Joost requested: "Use the saved publication date and use 8PM as the time if we have no time."

For a post without a recoverable modification timestamp, use its publication date and preserve the original publication time when available. Otherwise use 20:00 Europe/Amsterdam, including daylight-saving time (18:00 UTC in summer, 19:00 UTC in winter). Legacy `T00:00:00.000Z` publication values were generated from date-only inputs, so they are treated as missing times. This is an explicit fallback, not a claim that the modification time was recovered. The resolver returns `source: publication-fallback` and `assumedTime` for auditing.

## Verification

Run `pnpm test:sitemap` and `pnpm build`. Inspect every post's resolved date and provenance, then compare all live child-sitemap URL/date pairs with the audited build. A varied distribution or agreement between two runs of the same resolver is insufficient evidence by itself. General routes without an established date omit `lastmod`; they do not inherit the newest blog post's timestamp.
