#!/usr/bin/env node

/**
 * WordPress-to-Astro Content Migration Script
 *
 * Migrates blog posts, pages, and videos from content-export/ to src/content/
 * with frontmatter transformation, content cleanup, and image downloading.
 *
 * Usage:
 *   node scripts/migrate.mjs --type=posts    # Migrate blog posts
 *   node scripts/migrate.mjs --type=pages    # Migrate pages
 *   node scripts/migrate.mjs --type=videos   # Migrate videos
 *   node scripts/migrate.mjs --type=all      # Migrate everything
 *   node scripts/migrate.mjs --dry-run --type=all  # Preview only
 */

import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const flags = {};
for (const arg of args) {
    if (arg.startsWith('--')) {
        const [key, val] = arg.slice(2).split('=');
        flags[key] = val ?? true;
    }
}

const DRY_RUN = !!flags['dry-run'];
const TYPE = flags['type'] || 'all';

if (!['posts', 'pages', 'videos', 'all'].includes(TYPE)) {
    console.error(`Invalid --type: ${TYPE}. Use posts, pages, videos, or all.`);
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const EXPORT_DIR = path.join(ROOT, 'content-export');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');

const POSTS_SRC = path.join(EXPORT_DIR, 'posts');
const PAGES_SRC = path.join(EXPORT_DIR, 'pages');
const VIDEOS_SRC = path.join(EXPORT_DIR, 'videos');

const BLOG_DEST = path.join(CONTENT_DIR, 'blog');
const PAGES_DEST = path.join(CONTENT_DIR, 'pages');
const VIDEOS_DEST = path.join(CONTENT_DIR, 'videos');

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
const stats = {
    posts: 0,
    pages: 0,
    videos: 0,
    images: 0,
    warnings: [],
};

// ---------------------------------------------------------------------------
// Video metadata lookup (from research / live site JSON-LD)
// ---------------------------------------------------------------------------
const videoMetadata = {
    'wordpress-seo-in-2019': { youtubeId: 'pS-OhpUMC10', duration: 'PT44M14S' },
    '10-years-of-yoast': { youtubeId: '27_iFw_W-HE', duration: 'PT33M46S' },
    'why-timestamping-will-be-good-for-seo': { youtubeId: 'r6T-WuqjGI0', duration: 'PT30M8S' },
    'the-victory-of-the-commons': { videoUrl: 'https://wordpress.tv/2013/12/12/joost-de-valk-the-victory-of-the-commons/' },
    'the-business-of-open-source': { videoUrl: 'https://wordpress.tv/2018/12/27/joost-de-valk-the-business-of-open-source/' },
    'growing-a-multi-million-dollar-business-with-a-plugin': { videoUrl: 'https://wordpress.tv/2020/06/23/joost-de-valk-growing-a-multi-million-dollar-business-with-a-wordpress-plugin/' },
    'sustainable-open-source-is-the-future': { videoUrl: 'https://wordpress.tv/2024/07/03/joost-de-valk-sustainable-open-source-is-the-future/' },
    'improve-the-environment-start-with-your-website': { videoUrl: 'https://wordpress.tv/2022/11/17/joost-de-valk-improve-the-environment-start-with-your-website/' },
};

// ---------------------------------------------------------------------------
// Content cleanup helpers
// ---------------------------------------------------------------------------

/**
 * Phase 1 cleanup: everything EXCEPT internal URL conversion.
 * Run this before image extraction so absolute image URLs are still intact.
 */
function cleanupBodyPhase1(body) {
    let cleaned = body;

    // Strip first H1 line (duplicate of frontmatter title)
    cleaned = cleaned.replace(/^# .+\n+/, '');

    // Remove "Estimated reading time: X minutes" lines
    cleaned = cleaned.replace(/^Estimated reading time: \d+ minutes?\n*/gm, '');

    // Remove "Code language:" suffixes after code blocks
    cleaned = cleaned.replace(/^Code language: .+$/gm, '');

    // Fix HTML entities
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#039;/g, "'");

    // Strip WordPress block comments
    cleaned = cleaned.replace(/<!-- \/?wp:\S*?(?:\s+\{.*?\})? -->\n?/g, '');

    // Remove escaped wp_playground shortcode blocks (entire block from opening to closing tag)
    cleaned = cleaned.replace(/\\\[wp_playground[^\]]*\\\][\s\S]*?\\\[\/wp_playground\\\]\n?/g, '');
    // Also handle the variant with underscores escaped
    cleaned = cleaned.replace(/\\\[wp\\_playground[^\]]*\\\][\s\S]*?\\\[\/wp\\_playground\\\]\n?/g, '');

    // Simplify linked images: [![alt](thumb-url)](full-url) -> ![alt](full-url)
    cleaned = cleaned.replace(/\[!\[([^\]]*)\]\([^)]+\)\]\(([^)]+)\)/g, '![${1}]($2)');

    return cleaned;
}

/**
 * Phase 2 cleanup: internal URL conversion and final whitespace cleanup.
 * Run this AFTER image extraction and URL rewriting.
 */
function cleanupBodyPhase2(body) {
    let cleaned = body;

    // Convert absolute internal links to relative (non-image links remaining)
    // Match https://joost.blog/ followed by a path, preserving trailing slash
    cleaned = cleaned.replace(/https:\/\/joost\.blog\//g, '/');

    // Trim excessive blank lines (3+ consecutive newlines -> 2)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
}

/**
 * Full cleanup for content without image extraction (convenience wrapper).
 */
function cleanupBody(body) {
    return cleanupBodyPhase2(cleanupBodyPhase1(body));
}

/**
 * Flatten categories from {name, url} objects to plain strings.
 * Handles both object format and already-string format.
 */
function flattenCategories(categories) {
    if (!categories || !Array.isArray(categories)) return undefined;
    return categories.map(cat => {
        if (typeof cat === 'string') return cat;
        if (cat && typeof cat === 'object' && cat.name) return cat.name;
        return String(cat);
    });
}

/**
 * Extract first meaningful paragraph for excerpt generation.
 */
function generateExcerpt(body) {
    // Split on double newlines, find first non-heading, non-empty paragraph
    const paragraphs = body.split(/\n\n+/);
    for (const p of paragraphs) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('#')) continue;
        if (trimmed.startsWith('![')) continue;
        if (trimmed.startsWith('```')) continue;
        // Strip markdown links for cleaner excerpt
        const plain = trimmed
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_`]/g, '');
        if (plain.length > 10) {
            return plain.substring(0, 160).trim();
        }
    }
    return undefined;
}

// ---------------------------------------------------------------------------
// Image handling
// ---------------------------------------------------------------------------

/**
 * Extract all image URLs from markdown body.
 * Returns array of { url, alt } objects.
 */
function extractInlineImageUrls(body) {
    const images = [];
    // Match markdown images: ![alt](url)
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imgRegex.exec(body)) !== null) {
        const url = match[2];
        // Only process absolute URLs (not already-local paths)
        if (url.startsWith('http://') || url.startsWith('https://')) {
            images.push({ alt: match[1], url });
        }
    }
    return images;
}

/**
 * Get filename from a URL, handling WordPress upload paths.
 */
function filenameFromUrl(url) {
    try {
        const parsed = new URL(url);
        return path.basename(parsed.pathname);
    } catch {
        return path.basename(url.split('?')[0]);
    }
}

/**
 * Download an image to a local path. Skip if already exists.
 * Returns true on success, false on failure.
 */
async function downloadImage(url, destPath) {
    if (existsSync(destPath)) {
        return true; // already downloaded
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'JoostBlog-Migration/1.0' },
            redirect: 'follow',
        });
        if (!response.ok) {
            const warn = `[WARN] Failed to download ${url}: HTTP ${response.status}`;
            console.warn(warn);
            stats.warnings.push(warn);
            return false;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, buffer);
        console.log(`  [IMG] downloaded ${url} -> ${path.relative(ROOT, destPath)}`);
        stats.images++;
        return true;
    } catch (err) {
        const warn = `[WARN] Error downloading ${url}: ${err.message}`;
        console.warn(warn);
        stats.warnings.push(warn);
        return false;
    }
}

/**
 * Download images with concurrency limit.
 */
async function downloadBatch(items, concurrency = 5) {
    const results = [];
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(({ url, dest }) => downloadImage(url, dest))
        );
        results.push(...batchResults);
    }
    return results;
}

// ---------------------------------------------------------------------------
// Blog post migration
// ---------------------------------------------------------------------------

async function migratePosts() {
    const files = (await fs.readdir(POSTS_SRC)).filter(f => f.endsWith('.md'));
    console.log(`\n--- Migrating ${files.length} blog posts ---\n`);

    for (const file of files) {
        const slug = file.replace(/\.md$/, '');
        const srcPath = path.join(POSTS_SRC, file);
        const destDir = path.join(BLOG_DEST, slug);
        const destPath = path.join(destDir, 'index.md');

        const raw = await fs.readFile(srcPath, 'utf-8');
        let parsed;
        try {
            parsed = matter(raw);
        } catch (err) {
            const warn = `[WARN] Malformed frontmatter in ${file}: ${err.message}`;
            console.warn(warn);
            stats.warnings.push(warn);
            continue;
        }

        const { data, content } = parsed;

        // Phase 1 cleanup (before image extraction -- keeps absolute URLs intact)
        let cleanedBody = cleanupBodyPhase1(content);

        // Build transformed frontmatter
        const fm = {
            title: data.title,
            publishDate: data.date,
        };

        // Generate excerpt from cleaned body
        const excerpt = generateExcerpt(cleanedBody);
        if (excerpt) {
            fm.excerpt = excerpt;
        }

        // Flatten categories
        const cats = flattenCategories(data.categories);
        if (cats && cats.length > 0) {
            fm.categories = cats;
        }

        // Collect images to download
        const imagesToDownload = [];

        // Featured image
        if (data.featured_image) {
            const featFilename = filenameFromUrl(data.featured_image);
            fm.featureImage = {
                src: `./images/${featFilename}`,
                alt: '',
            };
            imagesToDownload.push({
                url: data.featured_image,
                dest: path.join(destDir, 'images', featFilename),
            });
        }

        // Inline images -- extract from phase-1 cleaned body (URLs still absolute)
        const inlineImages = extractInlineImageUrls(cleanedBody);
        for (const img of inlineImages) {
            const filename = filenameFromUrl(img.url);
            imagesToDownload.push({
                url: img.url,
                dest: path.join(destDir, 'images', filename),
            });
            // Update body to use local path
            cleanedBody = cleanedBody.split(img.url).join(`./images/${filename}`);
        }

        // Phase 2 cleanup (convert remaining internal links, trim whitespace)
        cleanedBody = cleanupBodyPhase2(cleanedBody);

        // Serialize and write
        const output = matter.stringify(cleanedBody + '\n', fm);

        if (DRY_RUN) {
            console.log(`[POST] ${slug} -> src/content/blog/${slug}/index.md (${imagesToDownload.length} images)`);
        } else {
            await fs.mkdir(destDir, { recursive: true });
            await fs.writeFile(destPath, output, 'utf-8');
            console.log(`[POST] ${slug} -> src/content/blog/${slug}/index.md`);

            // Download images
            if (imagesToDownload.length > 0) {
                await downloadBatch(imagesToDownload);
            }
        }

        stats.posts++;
    }
}

// ---------------------------------------------------------------------------
// Page migration
// ---------------------------------------------------------------------------

// Pages to skip entirely
const SKIP_PAGES = new Set(['blog']);

async function migratePages() {
    const files = (await fs.readdir(PAGES_SRC)).filter(f => f.endsWith('.md'));
    console.log(`\n--- Migrating pages (${files.length} source files) ---\n`);

    for (const file of files) {
        const slug = file.replace(/\.md$/, '');

        // Skip blog listing page
        if (SKIP_PAGES.has(slug)) {
            console.log(`[PAGE] SKIP ${slug} (generated by Astro routing)`);
            continue;
        }

        const srcPath = path.join(PAGES_SRC, file);
        const destPath = path.join(PAGES_DEST, `${slug}.md`);

        const raw = await fs.readFile(srcPath, 'utf-8');
        let parsed;
        try {
            parsed = matter(raw);
        } catch (err) {
            const warn = `[WARN] Malformed frontmatter in pages/${file}: ${err.message}`;
            console.warn(warn);
            stats.warnings.push(warn);
            continue;
        }

        const { data, content } = parsed;

        // Pages schema only requires title
        const fm = { title: data.title };

        // Phase 1 cleanup (keeps absolute URLs intact for image extraction)
        let cleanedBody = cleanupBodyPhase1(content);

        // Special handling for contact-me: strip Gravity Forms remnants
        if (slug === 'contact-me') {
            cleanedBody = cleanContactPage(cleanedBody);
        }

        // Check for inline images in pages (before phase 2 URL conversion)
        const inlineImages = extractInlineImageUrls(cleanedBody);
        const imagesToDownload = [];

        if (inlineImages.length > 0) {
            const pagesImgDir = path.join(PAGES_DEST, 'images');
            for (const img of inlineImages) {
                const filename = filenameFromUrl(img.url);
                imagesToDownload.push({
                    url: img.url,
                    dest: path.join(pagesImgDir, filename),
                });
                cleanedBody = cleanedBody.split(img.url).join(`./images/${filename}`);
            }
        }

        // Phase 2 cleanup (convert remaining internal links, trim whitespace)
        cleanedBody = cleanupBodyPhase2(cleanedBody);

        const output = matter.stringify(cleanedBody + '\n', fm);

        if (DRY_RUN) {
            console.log(`[PAGE] ${slug} -> src/content/pages/${slug}.md${imagesToDownload.length ? ` (${imagesToDownload.length} images)` : ''}`);
        } else {
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.writeFile(destPath, output, 'utf-8');
            console.log(`[PAGE] ${slug} -> src/content/pages/${slug}.md`);

            if (imagesToDownload.length > 0) {
                await downloadBatch(imagesToDownload);
            }
        }

        stats.pages++;
    }
}

/**
 * Clean up contact page: remove Gravity Forms HTML remnants.
 */
function cleanContactPage(body) {
    let cleaned = body;

    // Remove the form section at the bottom (everything from "## Contact me" form
    // section that contains the Gravity Forms artifacts)
    // The form content starts with validation artifacts and field labels
    cleaned = cleaned.replace(/## Contact me\n[\s\S]*$/, '');

    // Remove any stray form-related lines
    cleaned = cleaned.replace(/<div class="gf[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');

    // Trim trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
}

// ---------------------------------------------------------------------------
// Video migration
// ---------------------------------------------------------------------------

async function migrateVideos() {
    const files = (await fs.readdir(VIDEOS_SRC)).filter(f => f.endsWith('.md'));
    console.log(`\n--- Migrating ${files.length} videos ---\n`);

    for (const file of files) {
        const slug = file.replace(/\.md$/, '');
        const srcPath = path.join(VIDEOS_SRC, file);
        const destPath = path.join(VIDEOS_DEST, `${slug}.md`);

        const raw = await fs.readFile(srcPath, 'utf-8');
        let parsed;
        try {
            parsed = matter(raw);
        } catch (err) {
            const warn = `[WARN] Malformed frontmatter in videos/${file}: ${err.message}`;
            console.warn(warn);
            stats.warnings.push(warn);
            continue;
        }

        const { data, content } = parsed;

        // Build transformed frontmatter
        const fm = {
            title: data.title,
            publishDate: data.date,
        };

        // Add video metadata from lookup table
        const meta = videoMetadata[slug];
        if (meta) {
            if (meta.youtubeId) fm.youtubeId = meta.youtubeId;
            if (meta.duration) fm.duration = meta.duration;
            if (meta.videoUrl) fm.videoUrl = meta.videoUrl;
        } else {
            const warn = `[WARN] No video metadata found for ${slug}`;
            console.warn(warn);
            stats.warnings.push(warn);
        }

        // Handle featured image if present
        const imagesToDownload = [];
        if (data.featured_image) {
            const featFilename = filenameFromUrl(data.featured_image);
            fm.featureImage = {
                src: `./images/${featFilename}`,
                alt: '',
            };
            // Videos with featured images get co-located images too
            imagesToDownload.push({
                url: data.featured_image,
                dest: path.join(VIDEOS_DEST, 'images', featFilename),
            });
        }

        // Removed fields: author, source_url, note, categories (not in videos schema)

        // Clean up body
        let cleanedBody = cleanupBody(content);

        // Remove any raw HTML embed markup from video pages
        cleanedBody = cleanedBody.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
        cleanedBody = cleanedBody.replace(/<embed[\s\S]*?\/>/gi, '');
        cleanedBody = cleanedBody.replace(/<object[\s\S]*?<\/object>/gi, '');

        // Remove "Related Information" section if it just repeats metadata
        cleanedBody = cleanedBody.replace(/\*\*Related Information:\*\*\n(- .*\n?)*/g, '').trim();

        // Trim excessive blank lines again after removals
        cleanedBody = cleanedBody.replace(/\n{3,}/g, '\n\n').trim();

        const output = matter.stringify(cleanedBody + '\n', fm);

        if (DRY_RUN) {
            console.log(`[VIDEO] ${slug} -> src/content/videos/${slug}.md${meta ? ` (${meta.youtubeId ? 'YouTube' : 'WordPress.tv'})` : ''}`);
        } else {
            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.writeFile(destPath, output, 'utf-8');
            console.log(`[VIDEO] ${slug} -> src/content/videos/${slug}.md`);

            if (imagesToDownload.length > 0) {
                await downloadBatch(imagesToDownload);
            }
        }

        stats.videos++;
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log(`WordPress -> Astro Content Migration`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no files written)' : 'LIVE'}`);
    console.log(`Type: ${TYPE}`);
    console.log('');

    if (TYPE === 'all' || TYPE === 'posts') {
        await migratePosts();
    }
    if (TYPE === 'all' || TYPE === 'pages') {
        await migratePages();
    }
    if (TYPE === 'all' || TYPE === 'videos') {
        await migrateVideos();
    }

    // Summary
    console.log('\n========================================');
    console.log('Migration Summary');
    console.log('========================================');
    console.log(`Posts migrated:  ${stats.posts}`);
    console.log(`Pages migrated:  ${stats.pages}`);
    console.log(`Videos migrated: ${stats.videos}`);
    if (!DRY_RUN) {
        console.log(`Images downloaded: ${stats.images}`);
    }
    if (stats.warnings.length > 0) {
        console.log(`\nWarnings (${stats.warnings.length}):`);
        for (const w of stats.warnings) {
            console.log(`  ${w}`);
        }
    }
    console.log('========================================');
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
