#!/usr/bin/env node
/**
 * Pre-generates all OG images as WebP files into public/og/.
 *
 * Usage:
 *   node scripts/generate-og-images.mjs            # skip existing
 *   node scripts/generate-og-images.mjs --force    # regenerate all
 *   node scripts/generate-og-images.mjs --slug my-post-slug
 *
 * Requires Playwright Chromium browser:
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import matter from 'gray-matter';

const ROOT      = resolve('.');
const OG_DIR    = join(ROOT, 'public/og');
const BLOG_DIR  = join(ROOT, 'src/content/blog');
const PAGES_DIR = join(ROOT, 'src/content/pages');
const FONTS_DIR = join(ROOT, 'public/fonts');

const args       = process.argv.slice(2);
const forceFlag  = args.includes('--force');
const slugIdx    = args.indexOf('--slug');
const targetSlug = slugIdx !== -1 ? args[slugIdx + 1] : null;

const OG_WIDTH  = 1200;
const OG_HEIGHT = 675;

// Design tokens
const paper   = '#e4e2dc';
const ink     = '#1f2530';
const inkSoft = '#4e5666';
const indigo  = '#2c3447';
const ox      = '#4a6480';

let portraitDataUrl = null;
function getPortrait() {
    if (!portraitDataUrl) {
        const buf = readFileSync(join(ROOT, 'src/assets/images/joost-profile.jpg'));
        portraitDataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
    }
    return portraitDataUrl;
}

function fontFaces() {
    return `
        @font-face {
            font-family: 'DomaineDisplay';
            font-weight: 500;
            font-style: normal;
            src: url('file://${FONTS_DIR}/DomaineDisplay-Medium.otf');
        }
        @font-face {
            font-family: 'DomaineDisplay';
            font-weight: 500;
            font-style: italic;
            src: url('file://${FONTS_DIR}/DomaineDisplay-MediumItalic.otf');
        }
        @font-face {
            font-family: 'Pitch';
            font-weight: 400;
            font-style: normal;
            src: url('file://${FONTS_DIR}/Pitch-Regular.otf');
        }
    `;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y} · ${m} · ${d}`;
}

function getReadingTime(content) {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    return Math.max(1, Math.ceil(words.length / 265));
}

function articleHtml({ title, category, publishDate, readingTime, articleNumber, isFeatured }) {
    const issueLabel  = articleNumber
        ? `No. ${String(articleNumber).padStart(3, '0')}`
        : String(publishDate?.getFullYear() ?? new Date().getFullYear());
    const dateStr     = publishDate ? formatDate(publishDate) : String(new Date().getFullYear());
    const kicker      = (category ?? 'JOOST.BLOG').toUpperCase();
    const isArticle   = !!(publishDate || readingTime || articleNumber);
    const articleType = isFeatured ? 'FEATURED ARTICLE' : 'ARTICLE';
    const readStr     = isArticle
        ? (readingTime ? `${articleType} · ${readingTime} MIN READ` : articleType)
        : null;
    const fontSize    = title.length > 60 ? '78px' : '96px';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${fontFaces()}
    body {
        width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px;
        background: ${paper}; color: ${ink};
        font-family: 'DomaineDisplay', serif;
        position: relative; overflow: hidden;
    }
    .rail {
        position: absolute; top: 0; left: 0; right: 0; height: 54px;
        border-bottom: 1px solid ${ink};
        display: flex; align-items: center; padding: 0 40px;
        font-family: 'Pitch', monospace; font-size: 14px;
        letter-spacing: 0.18em; color: ${ox};
    }
    .rail-center { flex: 1; text-align: center; color: ${ink}; }
    .rail-right  { flex: 1; text-align: right; }
    .rail-left   { flex: 1; }
    .kicker {
        position: absolute; top: 92px; left: 48px;
        display: flex; align-items: center; gap: 14px;
        font-family: 'Pitch', monospace; font-size: 16px;
        letter-spacing: 0.18em; color: ${indigo};
    }
    .kicker-rule { width: 60px; height: 1px; background: ${ink}; flex-shrink: 0; }
    .title {
        position: absolute; top: 148px; left: 48px; width: 952px;
        font-family: 'DomaineDisplay', serif; font-weight: 500;
        font-size: ${fontSize}; line-height: 1.0;
        letter-spacing: -0.03em; color: ${ink};
        text-wrap: balance;
    }
    .byline {
        position: absolute; right: 40px; bottom: 40px;
        display: flex; align-items: flex-end; gap: 18px;
    }
    .byline-text {
        display: flex; flex-direction: column; align-items: flex-end;
        font-family: 'DomaineDisplay', serif; font-weight: 500;
        font-style: italic; font-size: 22px; color: ${ink}; padding-bottom: 6px;
    }
    .byline-name { color: ${indigo}; }
    .byline-url {
        font-family: 'Pitch', monospace; font-style: normal;
        font-size: 14px; letter-spacing: 0.18em;
        color: ${inkSoft}; margin-top: 6px;
    }
    .portrait { width: 120px; height: 150px; border: 1px solid ${ink}; object-fit: cover; display: block; }
</style>
</head>
<body>
    <div class="rail">
        <span class="rail-left">JOOST.BLOG · ${issueLabel.toUpperCase()}</span>
        <span class="rail-center">— ${kicker} —</span>
        <span class="rail-right">${dateStr}</span>
    </div>
    ${readStr ? `<div class="kicker"><div class="kicker-rule"></div><span>${readStr}</span></div>` : ''}
    <div class="title">${title}</div>
    <div class="byline">
        <div class="byline-text">
            <div>by <span class="byline-name">Joost de Valk</span></div>
            <div class="byline-url">JOOST.BLOG / READ →</div>
        </div>
        <img class="portrait" src="${getPortrait()}" />
    </div>
</body>
</html>`;
}

function homepageHtml() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${fontFaces()}
    body {
        width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px;
        background: #2c3447;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative; font-family: 'DomaineDisplay', serif; overflow: hidden;
    }
    .avatar-wrap {
        width: 224px; height: 224px; border-radius: 50%;
        border: 1px solid rgba(232,227,214,0.08);
        display: flex; align-items: center; justify-content: center;
    }
    .avatar-inner {
        width: 202px; height: 202px; border-radius: 50%;
        border: 1px solid rgba(232,227,214,0.15);
        display: flex; align-items: center; justify-content: center;
    }
    .avatar {
        width: 180px; height: 180px; border-radius: 50%;
        border: 3px solid rgba(232,227,214,0.30); object-fit: cover;
    }
    .name { color: #e8e3d6; font-size: 44px; font-weight: 500; margin-top: 28px; }
    .subtitle { color: rgba(232,227,214,0.60); font-size: 22px; font-weight: 500; margin-top: 12px; }
    .domain {
        position: absolute; bottom: 30px; right: 40px;
        color: rgba(232,227,214,0.50); font-size: 20px; font-weight: 500;
    }
</style>
</head>
<body>
    <div class="avatar-wrap">
        <div class="avatar-inner">
            <img class="avatar" src="${getPortrait()}" />
        </div>
    </div>
    <div class="name">Joost de Valk</div>
    <div class="subtitle">Internet entrepreneur · Founder of Yoast · Investor</div>
    <div class="domain">joost.blog</div>
</body>
</html>`;
}

async function renderToWebp(browser, html, outputPath) {
    if (!forceFlag && existsSync(outputPath)) return false;
    const page = await browser.newPage();
    await page.setViewportSize({ width: OG_WIDTH, height: OG_HEIGHT });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 90 });
    await page.close();
    const webp = await sharp(jpeg).webp({ quality: 85 }).toBuffer();
    writeFileSync(outputPath, webp);
    return true;
}

async function main() {
    mkdirSync(OG_DIR, { recursive: true });

    const browser = await chromium.launch();
    let generated = 0;
    let skipped   = 0;

    async function render(html, slug) {
        const out = join(OG_DIR, `${slug}.webp`);
        const did = await renderToWebp(browser, html, out);
        if (did) { generated++; console.log(`  ✓ ${slug}.webp`); }
        else      { skipped++; }
    }

    // Homepage
    if (!targetSlug || targetSlug === 'index') {
        await render(homepageHtml(), 'index');
    }

    // Blog posts — sorted by date for article numbers
    const blogSlugs = readdirSync(BLOG_DIR).filter(name =>
        statSync(join(BLOG_DIR, name)).isDirectory()
    );
    const blogPosts = blogSlugs.flatMap(slug => {
        const mdPath  = join(BLOG_DIR, slug, 'index.md');
        const mdxPath = join(BLOG_DIR, slug, 'index.mdx');
        const filePath = existsSync(mdPath) ? mdPath : existsSync(mdxPath) ? mdxPath : null;
        if (!filePath) return [];
        const { data, content } = matter(readFileSync(filePath, 'utf-8'));
        return [{ slug, data, content }];
    });
    blogPosts.sort((a, b) => new Date(a.data.publishDate) - new Date(b.data.publishDate));

    for (let i = 0; i < blogPosts.length; i++) {
        const { slug, data, content } = blogPosts[i];
        if (targetSlug && targetSlug !== slug) continue;
        await render(articleHtml({
            title:         data.title,
            category:      data.categories?.[0],
            publishDate:   data.publishDate ? new Date(data.publishDate) : undefined,
            readingTime:   getReadingTime(content),
            articleNumber: i + 1,
            isFeatured:    data.isFeatured,
        }), slug);
    }

    // Pages
    const pageFiles = readdirSync(PAGES_DIR).filter(f =>
        (f.endsWith('.md') || f.endsWith('.mdx')) && statSync(join(PAGES_DIR, f)).isFile()
    );
    for (const file of pageFiles) {
        const slug = basename(file, extname(file));
        if (targetSlug && targetSlug !== slug) continue;
        const { data } = matter(readFileSync(join(PAGES_DIR, file), 'utf-8'));
        if (!data.title) continue;
        await render(articleHtml({ title: data.title }), slug);
    }

    // Standalone pages not in content collections
    const standalones = [
        { slug: 'ask-joost',      title: "Ask Joost's AI" },
        { slug: 'cms-market-share', title: 'CMS Market Share' },
        { slug: 'cms-usage',      title: 'CMS Usage Statistics' },
        { slug: 'contact-me',     title: 'Contact' },
        { slug: 'search',         title: 'Search' },
        { slug: '404',            title: 'Page Not Found' },
    ];
    for (const { slug, title } of standalones) {
        if (targetSlug && targetSlug !== slug) continue;
        await render(articleHtml({ title }), slug);
    }

    await browser.close();
    console.log(`\nDone: ${generated} generated, ${skipped} skipped.`);
}

main().catch(err => { console.error(err); process.exit(1); });
