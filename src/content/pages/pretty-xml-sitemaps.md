---
title: <em>Pretty</em> XML Sitemaps
section: code
toc: true
seo:
  title: Pretty XML Sitemaps for Chrome
  description: A free Chrome extension that makes XML sitemaps and sitemap indexes easy to browse. Search addresses, follow links, and switch to the XML view.
---
Pretty XML Sitemaps is a free Chrome extension that turns XML sitemaps and sitemap indexes into clear, searchable tables. It works automatically when you open a sitemap, without XSLT.

[Download Pretty XML Sitemaps 0.2.0](/downloads/pretty-xml-sitemaps-0.2.0.zip)

For now, install it manually using the steps below. The extension is not yet listed in the Chrome Web Store.

## Browse your sitemap

Find the page you need without scrolling through raw XML:

- Search for part of an address across the whole sitemap.
- Click a link to open a page or a child sitemap.
- See the modification dates supplied by the site.
- Click either table header to sort by address or date. Click again to reverse the order.
- Browse long lists in pages of 100 entries.
- Switch between the table and the XML data.

The view follows your browser's light or dark appearance. It only changes XML sitemaps and sitemap indexes. Feeds, other XML documents, and ordinary web pages stay as they are.

![Pretty XML Sitemaps filtering a sitemap to show three matching addresses and their modification dates.](/images/pretty-xml-sitemaps-preview.png)

## Install in Chrome

1. Download the ZIP above and unzip it.
2. Type `chrome://extensions` into Chrome's address bar.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the unzipped folder containing `manifest.json`.
5. Open or refresh a sitemap tab.

Try it on [specification.website's sitemap index](https://specification.website/sitemap-index.xml). Click any sitemap in the table to browse its entries.

## Your data stays in your browser

The extension reads the current sitemap and its address to build the view. It sends nothing to me or an external service, and has no tracking or saved browsing history. The file on the website stays unchanged.

Chrome asks for website access because a sitemap can live on any domain or path. The extension checks that a document is a sitemap before displaying it. It does not request access to local files.

Read the [extension's privacy policy](/pretty-xml-sitemaps-privacy-policy/) for details.

## Questions or feedback

[Contact me](/contact-me/) if you find a problem or have a suggestion. Include the extension version and, if the sitemap is public, its address.
