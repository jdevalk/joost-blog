#!/usr/bin/env node

/**
 * Preview the image generation prompts without calling the API.
 * Useful for tuning the prompt template.
 *
 * Usage: node scripts/preview-prompts.mjs [--slug post-slug]
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = path.resolve('src/content/blog');

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

    if (hint) {
        prompt += `\n\nADDITIONAL CREATIVE DIRECTION: ${hint}`;
    }

    return prompt;
}

function scanPosts() {
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
        const { data } = matter(fs.readFileSync(filePath, 'utf8'));
        posts.push({ slug, title: data.title, categories: data.categories || [], imageHint: data.imageHint, hasImage: !!data.featureImage });
    }
    return posts;
}

const args = process.argv.slice(2);
const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const posts = scanPosts();

const filtered = targetSlug ? posts.filter(p => p.slug === targetSlug) : posts.filter(p => !p.hasImage).slice(0, 5);

console.log(`\n${'='.repeat(80)}`);
console.log(`  PROMPT PREVIEW — ${filtered.length} posts`);
console.log(`${'='.repeat(80)}\n`);

for (const post of filtered) {
    const cat = post.categories[0] || '(none)';
    const prompt = buildPrompt(post.title, cat, post.imageHint);

    console.log(`POST: ${post.slug}`);
    console.log(`TITLE: ${post.title}`);
    console.log(`CATEGORY: ${cat}`);
    console.log(`HINT: ${post.imageHint || '(none)'}`);
    console.log(`HAS IMAGE: ${post.hasImage}`);
    console.log(`\nPROMPT:\n${prompt}`);
    console.log(`\n${'-'.repeat(80)}\n`);
}
