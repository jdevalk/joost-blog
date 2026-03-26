#!/usr/bin/env node

/**
 * Featured Image Manager for joost.blog
 *
 * A local web UI to:
 * - See image generation prompts per post (with copy button)
 * - Drag & drop generated images onto posts
 * - Automatically saves to the right folder and updates frontmatter
 *
 * Usage: node scripts/image-manager.mjs
 * Then open http://localhost:3456
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import matter from 'gray-matter';
import satori from 'satori';
import sharp from 'sharp';

const PORT = 3456;
const BLOG_DIR = path.resolve('src/content/blog');

// Cloudflare Workers AI config (image generation, localhost only)
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || 'c53e64d218c83cb220b523a637ffd079';
const CF_API_TOKEN = process.env.CF_API_TOKEN || 'cfut_6j0n95cS6YyGuKHIBC8k02gwVYhlOBboAe4z7S4g756be1c8';
const CF_IMAGE_MODEL = '@cf/black-forest-labs/flux-2-dev';

// ============================================================
// Shared prompt logic (same as generate-featured-images.mjs)
// ============================================================

const CATEGORY_STYLES = {
    'WordPress': {
        colors: 'deep navy blue, steel blue, and touches of warm burgundy-crimson',
    },
    'Development': {
        colors: 'teal, dark emerald green, and warm burgundy-crimson accents',
    },
    'Search Opinion': {
        colors: 'warm gold, deep amber, and rich burgundy-brown',
    },
    'Open Source': {
        colors: 'forest green, sage green, and dark burgundy',
    },
    'Market Share Analysis': {
        colors: 'rich purple, violet, and warm burgundy',
    },
    'Productivity hacks': {
        colors: 'warm coral-orange, amber, and deep burgundy',
    },
    'Yoast': {
        colors: 'rich Yoast purple (#A4286A), magenta, and warm burgundy',
    },
    'Personal stuff': {
        colors: 'warm rose, deep burgundy, and soft cream highlights',
    },
    'Post from Joost': {
        colors: 'warm rose, deep burgundy-crimson, and golden highlights',
    },
    'Short': {
        colors: 'warm burgundy, cream, and a single bold accent color',
    },
    'Travel': {
        colors: 'warm terracotta, golden ochre, and deep teal-blue',
    },
};

const DEFAULT_STYLE = {
    colors: 'warm burgundy-crimson, deep rose, and cream highlights',
};

function buildPrompt(title, category, hint) {
    const style = CATEGORY_STYLES[category] || DEFAULT_STYLE;
    let prompt = `Create a bold graphic illustration in the style of classic 1950s-1960s movie posters and Saul Bass film title designs.

STYLE (CRITICAL — follow exactly):
- Flat bold graphic shapes with strong silhouettes, like a vintage screen-printed movie poster
- Limited color palette: ${style.colors}. Background should be dark and moody.
- Dramatic composition with strong diagonal lines, radial bursts, or sweeping curves
- Vintage screen-print aesthetic with subtle grain texture
- Geometric abstraction — convey the concept through bold shapes and silhouettes, NOT literal photorealistic depictions
- Absolutely NO text, NO letters, NO words, NO numbers, NO typography of any kind anywhere in the image
- The image must be full-bleed with NO border, NO frame, NO margin — the artwork should extend to all edges
- High contrast between bold foreground graphic elements and the dark background
- The mood should feel intelligent, sophisticated, and cinematically dramatic
- Think: Saul Bass, Art Deco, Polish movie poster school, mid-century modern graphic design

SUBJECT: Visually represent the concept behind this blog post title: "${title}"

COMPOSITION: Wide banner format (16:9). Distribute visual interest across the frame with an asymmetric focal point. Leave the lower-third relatively less busy (text will be overlaid there later). The upper portion should have the most dramatic graphic elements.`;
    if (hint) prompt += `\n\nADDITIONAL CREATIVE DIRECTION: ${hint}`;
    return prompt;
}

// ============================================================
// Content scanner
// ============================================================

const PAGES_IMAGE_DIR = path.resolve('public/images/pages');

const STANDALONE_PAGES = [
    { slug: 'ask-joost', title: 'Ask Joost' },
    { slug: 'cms-market-share', title: 'CMS Market Share' },
    { slug: 'cms-usage', title: 'CMS Usage Statistics' },
    { slug: 'contact-me', title: 'Contact' },
    { slug: 'search', title: 'Search' },
    { slug: 'code', title: 'Code & Projects' },
];

function scanBlogPosts() {
    const posts = [];
    const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
    for (const entry of entries) {
        let filePath, slug;
        if (entry.isDirectory()) {
            slug = entry.name;
            const indexMd = path.join(BLOG_DIR, entry.name, 'index.md');
            const indexMdx = path.join(BLOG_DIR, entry.name, 'index.mdx');
            if (fs.existsSync(indexMd)) filePath = indexMd;
            else if (fs.existsSync(indexMdx)) filePath = indexMdx;
            else continue;
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
            slug = entry.name.replace(/\.(md|mdx)$/, '');
            filePath = path.join(BLOG_DIR, entry.name);
        } else continue;

        const raw = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(raw);
        const category = (data.categories || [])[0] || '';

        // Check if current feature image file actually exists
        let hasImage = false;
        let currentImagePath = null;
        if (data.featureImage) {
            const imgPath = path.resolve(path.dirname(filePath), data.featureImage);
            hasImage = fs.existsSync(imgPath);
            if (hasImage) currentImagePath = imgPath;
        }

        posts.push({
            slug,
            filePath,
            title: data.title,
            publishDate: data.publishDate,
            category,
            pageType: 'post',
            imageHint: data.imageHint || null,
            hasImage,
            currentImagePath,
            isDirectory: entry.isDirectory(),
        });
    }
    // Sort newest first
    posts.sort((a, b) => new Date(b.publishDate || 0) - new Date(a.publishDate || 0));
    return posts;
}

function scanStandalonePages() {
    return STANDALONE_PAGES.map(({ slug, title }) => {
        const imgPath = path.join(PAGES_IMAGE_DIR, `${slug}.webp`);
        const hasImage = fs.existsSync(imgPath);
        return {
            slug,
            filePath: null,
            title,
            publishDate: null,
            category: 'Page',
            pageType: 'page',
            imageHint: null,
            hasImage,
            currentImagePath: hasImage ? imgPath : null,
            isDirectory: false,
        };
    });
}

function scanAll() {
    return [...scanStandalonePages(), ...scanBlogPosts()];
}

// ============================================================
// OG Image Generation (mirrors src/utils/og-image.ts)
// ============================================================

const OG_WIDTH = 1200;
const OG_HEIGHT = 675;
const OG_DIR = path.resolve('dist/og');
const FONT_PATH = path.resolve('public/fonts/MonaSans-Bold.ttf');

let fontData = null;
function loadFont() {
    if (!fontData) fontData = fs.readFileSync(FONT_PATH);
    return fontData;
}

async function generateOgImage(title, backgroundImagePathOrBuffer) {
    const font = loadFont();

    const markup = {
        type: 'div',
        props: {
            style: { width: OG_WIDTH, height: OG_HEIGHT, display: 'flex', position: 'relative' },
            children: [
                { type: 'div', props: { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))', display: 'flex' } } },
                { type: 'div', props: { style: { position: 'absolute', bottom: 50, left: 60, right: 240, color: 'white', fontSize: 56, lineHeight: 1.2, display: 'flex', fontWeight: 700 }, children: title } },
                { type: 'div', props: { style: { position: 'absolute', bottom: 30, right: 40, color: 'rgba(255,255,255,0.9)', fontSize: 24, display: 'flex', fontWeight: 700 }, children: 'joost.blog' } },
            ],
        },
    };

    const svg = await satori(markup, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [{ name: 'MonaSans', data: font, style: 'normal', weight: 700 }],
    });

    const overlay = Buffer.from(svg);

    if (backgroundImagePathOrBuffer) {
        try {
            const bg = await sharp(backgroundImagePathOrBuffer)
                .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
                .png()
                .toBuffer();

            return await sharp(bg)
                .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
                .jpeg({ quality: 85 })
                .toBuffer();
        } catch {
            // Fall through to gradient fallback
        }
    }

    const gradientSvg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4a1525"/>
            <stop offset="50%" stop-color="#3a1a28"/>
            <stop offset="100%" stop-color="#2e1220"/>
        </linearGradient></defs>
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/>
    </svg>`;

    return await sharp(Buffer.from(gradientSvg))
        .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
        .jpeg({ quality: 85 })
        .toBuffer();
}

async function generateAndSaveOgImage(slug, title, featureImagePathOrBuffer) {
    const ogBuffer = await generateOgImage(title, featureImagePathOrBuffer);
    fs.mkdirSync(OG_DIR, { recursive: true });
    const ogPath = path.join(OG_DIR, `${slug}.jpg`);
    fs.writeFileSync(ogPath, ogBuffer);
    return path.relative('.', ogPath);
}

// ============================================================
// Image upload handler
// ============================================================

async function handleUpload(slug, imageBuffer, filename) {
    const all = scanAll();
    const item = all.find(p => p.slug === slug);
    if (!item) throw new Error(`"${slug}" not found`);

    // Convert to WebP for optimal file size
    imageBuffer = await sharp(imageBuffer)
        .webp({ quality: 85 })
        .toBuffer();

    let imagePath;

    if (item.pageType === 'page') {
        // Standalone pages: save to public/images/pages/
        fs.mkdirSync(PAGES_IMAGE_DIR, { recursive: true });
        imagePath = path.join(PAGES_IMAGE_DIR, `${slug}.webp`);
        fs.writeFileSync(imagePath, imageBuffer);
    } else {
        // Blog posts: save to post's images directory
        const imageFilename = 'featured.webp';
        let imageDir;
        if (item.isDirectory) {
            imageDir = path.join(BLOG_DIR, slug, 'images');
        } else {
            const newDir = path.join(BLOG_DIR, slug);
            if (!fs.existsSync(newDir)) {
                fs.mkdirSync(newDir, { recursive: true });
                const newFilePath = path.join(newDir, 'index.md');
                fs.renameSync(item.filePath, newFilePath);
                item.filePath = newFilePath;
            }
            imageDir = path.join(newDir, 'images');
        }

        fs.mkdirSync(imageDir, { recursive: true });
        imagePath = path.join(imageDir, imageFilename);
        fs.writeFileSync(imagePath, imageBuffer);

        // Update frontmatter
        const raw = fs.readFileSync(item.filePath, 'utf8');
        const { data: frontmatter, content: body } = matter(raw);
        frontmatter.featureImage = `./images/${imageFilename}`;
        frontmatter.featureImageAlt = `Illustration for: ${item.title}`;
        fs.writeFileSync(item.filePath, matter.stringify(body, frontmatter));
    }

    // Generate OG image using the buffer directly (avoids stale file reads)
    const ogPath = await generateAndSaveOgImage(slug, item.title, imageBuffer);

    return { imagePath: path.relative('.', imagePath), ogPath };
}

// ============================================================
// Serve current feature image
// ============================================================

function serveImage(slug) {
    const all = scanAll();
    const post = all.find(p => p.slug === slug);
    if (!post || !post.currentImagePath) return null;
    const ext = path.extname(post.currentImagePath).toLowerCase();
    const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
    return {
        data: fs.readFileSync(post.currentImagePath),
        mime: mimeTypes[ext] || 'application/octet-stream',
    };
}

// ============================================================
// HTML UI
// ============================================================

function renderHTML() {
    const posts = scanAll();
    const postCards = posts.map(post => {
        const prompt = buildPrompt(post.title, post.category, post.imageHint);
        const promptEscaped = prompt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const promptForCopy = JSON.stringify(prompt);
        return `
        <div class="post ${post.hasImage ? 'has-image' : 'needs-image'} type-${post.pageType}" data-slug="${post.slug}">
            <div class="post-header">
                <div class="post-info">
                    <span class="status ${post.hasImage ? 'done' : 'todo'}">${post.hasImage ? 'Has image' : 'Needs image'}</span>
                    <span class="category">${post.category || 'Uncategorized'}</span>
                </div>
                <h2><a href="https://joost.blog/${post.slug}/" target="_blank">${post.title}</a></h2>
            </div>

            <div class="post-body">
                <div class="image-col">
                    <div class="drop-zone" data-slug="${post.slug}">
                        ${post.hasImage
                            ? `<img src="/image/${post.slug}" alt="Current featured image" /><p class="drop-hint">Drop new image to replace</p>`
                            : `<div class="drop-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 16V4m0 0L8 8m4-4l4 4M4 20h16"/></svg><p>Drop image here</p></div>`
                        }
                    </div>
                    <div class="og-preview" data-slug="${post.slug}">
                        <span class="og-label">OG Image</span>
                        <img src="/og/${post.slug}.jpg?${Date.now()}" alt="OG preview" onerror="this.parentElement.classList.add('no-og')" />
                        <button class="regen-btn" onclick="regenerateOg('${post.slug}', this)" title="Regenerate OG image">&#x21bb;</button>
                    </div>
                </div>
                <div class="prompt-col">
                    <div class="prompt-box">
                        <textarea class="prompt-text" data-slug="${post.slug}">${promptEscaped}</textarea>
                    </div>
                    <div class="btn-row">
                        <button class="copy-btn" onclick="copyFromTextarea('${post.slug}')">Copy prompt</button>
                        <button class="generate-btn" onclick="generateImage('${post.slug}', this)">Generate</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Featured Image Manager</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; font-size: 0.9rem; }
    .filters { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
    .filters button { padding: 0.4rem 1rem; border: 1px solid #333; border-radius: 6px; background: #1a1a1a; color: #ccc; cursor: pointer; font-size: 0.85rem; }
    .filters button.active { background: #7c2d4b; border-color: #7c2d4b; color: #fff; }
    .post { border: 1px solid #222; border-radius: 12px; margin-bottom: 1.5rem; background: #161616; overflow: hidden; }
    .post.needs-image { border-color: #4a2030; }
    .post-header { padding: 1rem 1.25rem; border-bottom: 1px solid #222; }
    .post-header h2 { font-size: 1.1rem; margin-top: 0.3rem; }
    .post-header h2 a { color: inherit; text-decoration: none; }
    .post-header h2 a:hover { color: #d4a; }
    .post-info { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem; }
    .status { font-size: 0.75rem; padding: 2px 8px; border-radius: 99px; font-weight: 600; }
    .status.done { background: #1a3a2a; color: #4ade80; }
    .status.todo { background: #3a1a2a; color: #f87171; }
    .category { font-size: 0.75rem; color: #888; }
    .post-body { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; padding: 1rem 1.25rem; }
    @media (max-width: 768px) { .post-body { grid-template-columns: 1fr; } }
    .drop-zone { aspect-ratio: 16/9; border: 2px dashed #333; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #7c2d4b; background: rgba(124,45,75,0.1); }
    .drop-zone img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .drop-zone .drop-hint { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.4rem; text-align: center; background: rgba(0,0,0,0.7); font-size: 0.75rem; color: #aaa; opacity: 0; transition: opacity 0.2s; }
    .drop-zone:hover .drop-hint { opacity: 1; }
    .drop-placeholder { text-align: center; color: #555; }
    .drop-placeholder svg { margin-bottom: 0.5rem; }
    .drop-placeholder p { font-size: 0.85rem; }
    .prompt-col { display: flex; flex-direction: column; gap: 0.5rem; }
    .prompt-box { flex: 1; }
    .prompt-text { width: 100%; height: 180px; background: #0f0f0f; border: 1px solid #222; border-radius: 8px; padding: 0.75rem; font-size: 0.8rem; color: #bbb; font-family: inherit; line-height: 1.5; resize: vertical; }
    .copy-btn { align-self: flex-start; padding: 0.4rem 1rem; border: 1px solid #333; border-radius: 6px; background: #1a1a1a; color: #ccc; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .og-preview { margin-top: 0.5rem; position: relative; border-radius: 6px; overflow: hidden; border: 1px solid #222; }
    .og-preview img { width: 100%; display: block; }
    .og-preview.no-og img, .og-preview.no-og .regen-btn { display: none; }
    .og-preview.no-og .og-label { position: static; display: block; padding: 0.5rem; text-align: center; }
    .og-label { position: absolute; top: 4px; left: 4px; font-size: 0.65rem; background: rgba(0,0,0,0.7); color: #aaa; padding: 1px 6px; border-radius: 4px; z-index: 1; }
    .regen-btn { position: absolute; top: 4px; right: 4px; width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.7); color: #ccc; font-size: 16px; cursor: pointer; z-index: 1; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .regen-btn:hover { background: #7c2d4b; color: #fff; border-color: #7c2d4b; }
    .regen-btn.spinning { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-row { display: flex; gap: 0.5rem; }
    .generate-btn { padding: 0.4rem 1rem; border: 1px solid #2a5a3a; border-radius: 6px; background: #1a3a2a; color: #4ade80; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .generate-btn:hover { background: #2a5a3a; color: #fff; }
    .generate-btn:disabled { opacity: 0.5; cursor: wait; }
    .copy-btn:hover { background: #7c2d4b; border-color: #7c2d4b; color: #fff; }
    .toast { position: fixed; bottom: 2rem; right: 2rem; background: #1a3a2a; color: #4ade80; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 100; }
    .toast.show { transform: translateY(0); opacity: 1; }
</style>
</head>
<body>
    <h1>Featured Image Manager</h1>
    <p class="subtitle">Copy prompts for ChatGPT, then drop the generated images back here.</p>

    <div class="filters">
        <button class="active" onclick="filterPosts('all')">All</button>
        <button onclick="filterPosts('pages')">Pages</button>
        <button onclick="filterPosts('posts')">Posts</button>
        <button onclick="filterPosts('needs')">Needs image</button>
        <button onclick="filterPosts('has')">Has image</button>
    </div>

    ${postCards}

    <div class="toast" id="toast"></div>

<script>
function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Prompt copied!'));
}

function copyFromTextarea(slug) {
    const ta = document.querySelector('.prompt-text[data-slug="' + slug + '"]');
    if (ta) navigator.clipboard.writeText(ta.value).then(() => showToast('Prompt copied!'));
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function filterPosts(filter) {
    document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.post').forEach(p => {
        if (filter === 'all') p.style.display = '';
        else if (filter === 'pages') p.style.display = p.classList.contains('type-page') ? '' : 'none';
        else if (filter === 'posts') p.style.display = p.classList.contains('type-post') ? '' : 'none';
        else if (filter === 'needs') p.style.display = p.classList.contains('needs-image') ? '' : 'none';
        else p.style.display = p.classList.contains('has-image') ? '' : 'none';
    });
}

async function regenerateOg(slug, btn) {
    btn.classList.add('spinning');
    try {
        const res = await fetch('/regenerate-og/' + slug, { method: 'POST' });
        const data = await res.json();
        if (data.ok) {
            showToast('OG image regenerated');
            const ogPreview = btn.closest('.og-preview');
            ogPreview.classList.remove('no-og');
            ogPreview.querySelector('img').src = '/og/' + slug + '.jpg?' + Date.now();
        } else {
            showToast('Error: ' + data.error);
        }
    } catch (err) {
        showToast('Failed: ' + err.message);
    }
    btn.classList.remove('spinning');
}

async function generateImage(slug, btn) {
    btn.disabled = true;
    btn.textContent = 'Generating...';
    try {
        const ta = document.querySelector('.prompt-text[data-slug="' + slug + '"]');
        const prompt = ta ? ta.value : '';
        const res = await fetch('/generate/' + slug, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        if (data.ok) {
            showToast('Image generated + saved');
            // Refresh the post card
            const post = btn.closest('.post');
            const zone = post.querySelector('.drop-zone');
            zone.innerHTML = '<img src="/image/' + slug + '?' + Date.now() + '" alt="Featured image" /><p class="drop-hint">Drop new image to replace</p>';
            post.classList.remove('needs-image');
            post.classList.add('has-image');
            post.querySelector('.status').className = 'status done';
            post.querySelector('.status').textContent = 'Has image';
            const ogPreview = post.querySelector('.og-preview');
            if (ogPreview) {
                ogPreview.classList.remove('no-og');
                ogPreview.querySelector('img').src = '/og/' + slug + '.jpg?' + Date.now();
            }
        } else {
            showToast('Error: ' + data.error);
        }
    } catch (err) {
        showToast('Generate failed: ' + err.message);
    }
    btn.disabled = false;
    btn.textContent = 'Generate';
}

// Drag & drop
document.querySelectorAll('.drop-zone').forEach(zone => {
    const slug = zone.dataset.slug;

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => { if (input.files[0]) uploadFile(slug, input.files[0], zone); };
        input.click();
    });
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) uploadFile(slug, file, zone);
    });
});

async function uploadFile(slug, file, zone) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch('/upload/' + slug, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.ok) {
            showToast('Image saved + OG generated');
            // Update the zone to show the new image
            zone.innerHTML = '<img src="/image/' + slug + '?' + Date.now() + '" alt="Featured image" /><p class="drop-hint">Drop new image to replace</p>';
            zone.closest('.post').classList.remove('needs-image');
            zone.closest('.post').classList.add('has-image');
            zone.closest('.post').querySelector('.status').className = 'status done';
            zone.closest('.post').querySelector('.status').textContent = 'Has image';
            // Refresh OG preview
            const ogPreview = zone.closest('.post').querySelector('.og-preview');
            if (ogPreview) {
                ogPreview.classList.remove('no-og');
                ogPreview.querySelector('img').src = '/og/' + slug + '.jpg?' + Date.now();
            }
        } else {
            showToast('Error: ' + data.error);
        }
    } catch (err) {
        showToast('Upload failed: ' + err.message);
    }
}
</script>
</body>
</html>`;
}

// ============================================================
// HTTP Server
// ============================================================

const server = http.createServer(async (req, res) => {
    // Serve the UI
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderHTML());
        return;
    }

    // Serve current images
    if (req.method === 'GET' && req.url.startsWith('/image/')) {
        const slug = req.url.replace('/image/', '').split('?')[0];
        const img = serveImage(slug);
        if (img) {
            res.writeHead(200, { 'Content-Type': img.mime, 'Cache-Control': 'no-cache' });
            res.end(img.data);
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
        return;
    }

    // Serve OG images
    if (req.method === 'GET' && req.url.startsWith('/og/')) {
        const slug = req.url.replace('/og/', '').split('?')[0].replace(/\.jpg$/, '');
        const ogPath = path.join(OG_DIR, `${slug}.jpg`);
        if (fs.existsSync(ogPath)) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-cache' });
            res.end(fs.readFileSync(ogPath));
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
        return;
    }

    // Regenerate OG image
    if (req.method === 'POST' && req.url.startsWith('/regenerate-og/')) {
        const slug = req.url.replace('/regenerate-og/', '');
        try {
            const all = scanAll();
            const post = all.find(p => p.slug === slug);
            if (!post) throw new Error(`"${slug}" not found`);
            if (!post.currentImagePath) throw new Error('No featured image to use');
            const ogPath = await generateAndSaveOgImage(slug, post.title, post.currentImagePath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, ogPath }));
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
        return;
    }

    // Generate image via Cloudflare Workers AI
    if (req.method === 'POST' && req.url.startsWith('/generate/')) {
        const slug = req.url.replace('/generate/', '');
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                let body = {};
                if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString());

                const all = scanAll();
                const item = all.find(p => p.slug === slug);
                if (!item) throw new Error(`"${slug}" not found`);

                const prompt = body.prompt || buildPrompt(item.title, item.category, item.imageHint);

                console.log(`Generating image for: ${item.title}`);
                console.log(`Prompt (first 200 chars): ${prompt.slice(0, 200)}`);

                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('width', '1536');
                formData.append('height', '864');
                formData.append('steps', '25');

                const cfRes = await fetch(
                    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_IMAGE_MODEL}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${CF_API_TOKEN}`,
                        },
                        body: formData,
                    }
                );

                const cfData = await cfRes.json();
                if (!cfData.success || !cfData.result?.image) {
                    const errMsg = cfData.errors?.[0]?.message || 'Image generation failed';
                    throw new Error(errMsg);
                }

                const imageBuffer = Buffer.from(cfData.result.image, 'base64');
                const result = await handleUpload(slug, imageBuffer, 'generated.png');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, path: result.imagePath, ogPath: result.ogPath }));
            } catch (err) {
                console.error('Generate failed:', err.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        });
        return;
    }

    // Handle image upload
    if (req.method === 'POST' && req.url.startsWith('/upload/')) {
        const slug = req.url.replace('/upload/', '');
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const body = Buffer.concat(chunks);
                // Parse multipart form data (simple parser)
                const boundary = req.headers['content-type'].split('boundary=')[1];
                const parts = parseMultipart(body, boundary);
                const imagePart = parts.find(p => p.name === 'image');
                if (!imagePart) throw new Error('No image in upload');

                const result = await handleUpload(slug, imagePart.data, imagePart.filename);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, path: result.imagePath, ogPath: result.ogPath }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

// Simple multipart parser
function parseMultipart(body, boundary) {
    const parts = [];
    const boundaryBuf = Buffer.from('--' + boundary);
    const lines = [];
    let start = 0;

    // Find all boundary positions
    const positions = [];
    let pos = 0;
    while (pos < body.length) {
        const idx = body.indexOf(boundaryBuf, pos);
        if (idx === -1) break;
        positions.push(idx);
        pos = idx + boundaryBuf.length;
    }

    for (let i = 0; i < positions.length - 1; i++) {
        const partStart = positions[i] + boundaryBuf.length + 2; // skip \r\n
        const partEnd = positions[i + 1] - 2; // skip \r\n before next boundary
        const partData = body.subarray(partStart, partEnd);

        // Find header/body separator
        const headerEnd = partData.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headers = partData.subarray(0, headerEnd).toString();
        const data = partData.subarray(headerEnd + 4);

        const nameMatch = headers.match(/name="([^"]+)"/);
        const filenameMatch = headers.match(/filename="([^"]+)"/);

        parts.push({
            name: nameMatch ? nameMatch[1] : '',
            filename: filenameMatch ? filenameMatch[1] : '',
            data,
        });
    }

    return parts;
}

server.listen(PORT, '127.0.0.1', () => {
    console.log(`\n  Featured Image Manager running at http://localhost:${PORT}\n`);
    console.log(`  - Copy prompts → paste into ChatGPT`);
    console.log(`  - Drop generated images back onto posts`);
    console.log(`  - Frontmatter is updated automatically\n`);
});
