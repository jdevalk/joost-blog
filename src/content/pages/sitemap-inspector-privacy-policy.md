---
title: Sitemap Inspector privacy policy
seo:
  title: Sitemap Inspector privacy policy
  description: How Sitemap Inspector 0.12.1 handles sitemap data, optional live URL checks, Googlebot rules, and temporary storage without tracking.
toc: true
---
Last updated: September 22, 2026

Sitemap Inspector is a browser extension by Joost de Valk for viewing and checking XML sitemaps. This policy covers version 0.12.1 of the extension.

## Information processed on your device

The extension checks the type of document you open. For a standard XML sitemap or sitemap index, it reads the document and its address to build a searchable table. The data includes listed URLs, modification dates, image counts, alternate language links, news metadata, and video metadata and thumbnail addresses. The XML view can display other information already present in the sitemap.

Sitemap feedback and statistics use the loaded document and the response information available to the browser. They identify issues such as missing dates, duplicate URLs, mixed protocols, unexpected content types, and sitemap limits. These checks do not request the listed pages. Search text and filter choices affect only the table in the current tab.

For a plain-text /robots.txt file, the extension makes HTTP and HTTPS addresses in Sitemap declarations clickable. It preserves the rules, comments, and spacing. Adding these links does not fetch their destinations.

## Requests made by the extension

The destination websites and image hosts receive the requested address, your IP address, and normal browser request information. Requests go directly to those hosts, without a developer-operated proxy. HTTP and HTTPS addresses use the protocol in the URL; the extension does not upgrade HTTP requests to HTTPS.

Clicking the extension button can fetch the current tab's address again to read the original XML behind XSLT styling. Normal browser credentials and cookies for that same website apply, along with the browser's referrer rules. The extension does not read the credentials themselves. It replaces the view only after validating the sitemap. The toolbar action can also add links to robots.txt using text already in the tab.

Video thumbnails load directly from the image addresses in the sitemap as they approach the visible area. These image requests omit referrers, while normal browser cookie, cache, and site settings apply. Video players and files open only when you click their links. The extension does not embed or play them automatically. Its logo and favicon are bundled locally.

Clicking a sitemap entry or another link navigates the browser normally. The destination website and browser handle that request according to their own settings and policies. The extension adds no tracking parameters.

## Optional live URL checks

Live checks run only when you click Check URLs. Each click checks up to 100 distinct URLs matching your filters, with up to three checks in progress. These requests omit cookies, credentials, and referrers. Redirects can lead to another website.

For listed pages, the extension reads HTTP status, response headers, and up to 1 MB of HTML to check redirects, noindex directives, and canonical links. It allows ten seconds per request. Returned HTML is parsed as data; its scripts do not run and its images, styles, and frames do not load.

For sitemap indexes, live checks read child XML files, including gzip archives, to count entries and measure uncompressed size. These checks allow 30 seconds and stop after exceeding 50 MB (52,428,800 bytes) of decoded content. They do not follow child files recursively. The XML parser is bundled locally and does not fetch external resources.

Googlebot checks request robots.txt for each listed URL's origin: its scheme, host, and port. They allow ten seconds and read up to 500 KiB. The extension reuses each policy across batches in the current tab until refresh; a stopped request can be retried. It compares URLs with Googlebot rules and shows the matching rule for blocked URLs. It does not impersonate Googlebot or contact Google to perform these checks. The fetched policy may differ from Google's cached copy, and results do not establish indexing status.

You can stop a batch at any time. An HTTP 429 response pauses new checks. Browser access restrictions, network failures, timeouts, and response limits can prevent a complete check. An unreadable robots.txt policy is marked unverified.

## Storage and retention

Sitemap content, search text, filter choices, live results, and fetched robots.txt policies stay in the open tab. The extension does not write them to persistent extension storage. Live results and cached policies are cleared when you refresh or close the tab.

The storage permission keeps a temporary trail of robots.txt and sitemap addresses in extension-only session memory. This allows breadcrumbs to survive navigation, refresh, and Back/Forward. Each tab retains at most 40 documents, with up to 40 addresses in each trail. Closing a tab clears its record. A new tab opened from a sitemap link can retain its own copy until that tab closes.

Closing the browser, disabling, reloading, or updating the extension clears these session trails. Trails are never synced or uploaded. Normal browser features such as history and caching remain under your browser's control.

## Use and sharing

The extension uses this information only to display, analyze, filter, sort, navigate, and check sitemaps. It does not upload sitemap content, search text, fetched content, results, or trails to the developer. The website and image requests described above are part of the requested viewing and inspection features.

There are no accounts, analytics, advertisements, remote scripts, or background data uploads. The extension does not inspect cookies, read your stored browsing history, or build a browsing profile. The developer cannot see processed content or search terms through the extension.

Sitemap Inspector uses data only for its stated features, in accordance with the Chrome Web Store User Data Policy and its Limited Use requirements. It does not sell data or use it for advertising, creditworthiness, or lending decisions.

## Website access and your controls

Website access lets the extension recognize sitemaps on any HTTP or HTTPS domain or path. It checks the document type and sitemap namespace before rendering. It leaves other XML, feeds, and ordinary pages unchanged. The toolbar action uses temporary active-tab access and the scripting permission to apply the bundled viewer.

You can stop live checks, refresh or close tabs to clear their results, and restrict website access in Chrome's extension settings. You can also disable or uninstall the extension there. Refresh a sitemap styled through the toolbar to restore the website's own view. There is no developer-held extension usage data to delete.

## Questions

Contact Joost de Valk at https://joost.blog/contact-me/ for questions about the extension or this policy. Avoid including private sitemap content in a public support request.
