#!/usr/bin/env node

/**
 * Featured Image Generator for joost.blog
 *
 * Generates poster-style featured images using OpenAI's gpt-image-1 API.
 * Style: Bold graphic / early movie poster (Saul Bass, Art Deco, 1930s-1960s film posters)
 *
 * Usage:
 *   # Generate images for all posts missing featured images:
 *   OPENAI_API_KEY=your-key node scripts/generate-featured-images.mjs
 *
 *   # Generate for a specific post:
 *   OPENAI_API_KEY=your-key node scripts/generate-featured-images.mjs --slug my-post-slug
 *
 *   # Force regenerate (even if image exists):
 *   OPENAI_API_KEY=your-key node scripts/generate-featured-images.mjs --slug my-post-slug --force
 *
 *   # Dry run (show what would be generated):
 *   OPENAI_API_KEY=your-key node scripts/generate-featured-images.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// ============================================================
// Configuration
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BLOG_DIR = path.resolve('src/content/blog');
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const API_URL = 'https://api.openai.com/v1/images/generations';

// ============================================================
// Category Style Definitions
// ============================================================

const CATEGORY_STYLES = {
    'WordPress': {
        colors: 'deep navy blue, steel blue, and touches of warm burgundy-crimson',
        motif: 'modular building blocks stacking upward, interconnected panels forming a digital skyline, geometric puzzle pieces clicking together',
    },
    'Development': {
        colors: 'teal, dark emerald green, and warm burgundy-crimson accents',
        motif: 'circuit board pathways with glowing nodes, code brackets as architectural arches, mechanical precision instruments',
    },
    'Search Opinion': {
        colors: 'warm gold, deep amber, and rich burgundy-brown',
        motif: 'a bold magnifying lens with radiating golden search beams, pathways diverging and converging, signal waves propagating outward',
    },
    'Open Source': {
        colors: 'forest green, sage green, and dark burgundy',
        motif: 'branching tree silhouettes forming a network, forking paths spreading outward, collaborative hands or figures reaching together in solidarity',
    },
    'Market Share Analysis': {
        colors: 'rich purple, violet, and warm burgundy',
        motif: 'bold rising bar chart columns forming a dramatic city skyline, pie chart segments as sweeping architectural arcs, data visualization as dramatic landscape',
    },
    'Productivity hacks': {
        colors: 'warm coral-orange, amber, and deep burgundy',
        motif: 'interlocking precision gears in motion, a bold clock face with dramatic hands, lightning bolt silhouettes cutting through geometric shapes',
    },
    'Yoast': {
        colors: 'rich Yoast purple (#A4286A), magenta, and warm burgundy',
        motif: 'a traffic signal turning green as a triumphant moment, a rising score meter reaching its peak, optimization arrows spiraling upward',
    },
    'Personal stuff': {
        colors: 'warm rose, deep burgundy, and soft cream highlights',
        motif: 'a contemplative human silhouette gazing at a horizon, concentric circles radiating outward like ripples, warm abstract landscape',
    },
    'Post from Joost': {
        colors: 'warm rose, deep burgundy-crimson, and golden highlights',
        motif: 'a bold silhouette of a figure at a podium or desk, radiating lines suggesting broadcast or announcement, strong diagonal composition',
    },
    'Short': {
        colors: 'warm burgundy, cream, and a single bold accent color',
        motif: 'a single powerful geometric shape — a circle, triangle, or star — dramatically centered, minimal and striking',
    },
    'Travel': {
        colors: 'warm terracotta, golden ochre, and deep teal-blue',
        motif: 'dramatic landscape silhouettes, a winding road vanishing into dramatic perspective, compass rose or directional elements',
    },
};

const DEFAULT_STYLE = {
    colors: 'warm burgundy-crimson, deep rose, and cream highlights',
    motif: 'bold abstract geometric shapes radiating outward, strong diagonal composition with dramatic silhouettes',
};

// ============================================================
// Prompt Builder
// ============================================================

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
- High contrast between bold foreground graphic elements and the dark background
- The mood should feel intelligent, sophisticated, and cinematically dramatic
- Think: Saul Bass, Art Deco, Polish movie poster school, mid-century modern graphic design

SUBJECT: Visually represent the concept behind this blog post title: "${title}"

Use visual motifs inspired by: ${style.motif}

COMPOSITION: Wide banner format (16:9). Distribute visual interest across the frame with an asymmetric focal point. Leave the lower-third relatively less busy (text will be overlaid there later). The upper portion should have the most dramatic graphic elements.`;

    if (hint) {
        prompt += `\n\nADDITIONAL CREATIVE DIRECTION: ${hint}`;
    }

    return prompt;
}

// ============================================================
// Image Generation
// ============================================================

async function generateImage(prompt) {
    const body = {
        model: MODEL,
        prompt,
        n: 1,
        size: '1536x1024',
        output_format: 'png',
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
        throw new Error('No image generated — the API returned no data.');
    }

    return Buffer.from(data.data[0].b64_json, 'base64');
}

// ============================================================
// Blog Post Scanner
// ============================================================

function scanBlogPosts() {
    const posts = [];
    const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });

    for (const entry of entries) {
        let filePath, slug;

        if (entry.isDirectory()) {
            // Directory-based post: check for index.md or index.mdx
            slug = entry.name;
            const indexMd = path.join(BLOG_DIR, entry.name, 'index.md');
            const indexMdx = path.join(BLOG_DIR, entry.name, 'index.mdx');
            if (fs.existsSync(indexMd)) filePath = indexMd;
            else if (fs.existsSync(indexMdx)) filePath = indexMdx;
            else continue;
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
            // Single-file post
            slug = entry.name.replace(/\.(md|mdx)$/, '');
            filePath = path.join(BLOG_DIR, entry.name);
        } else {
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter } = matter(content);

        posts.push({
            slug,
            filePath,
            title: frontmatter.title,
            categories: frontmatter.categories || [],
            featureImage: frontmatter.featureImage,
            imageHint: frontmatter.imageHint || null,
            isDirectory: entry.isDirectory(),
        });
    }

    return posts;
}

// ============================================================
// Main
// ============================================================

async function main() {
    const args = process.argv.slice(2);
    const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
    const force = args.includes('--force');
    const dryRun = args.includes('--dry-run');

    if (!OPENAI_API_KEY) {
        console.error('Error: OPENAI_API_KEY environment variable is required.');
        console.error('Usage: OPENAI_API_KEY=your-key node scripts/generate-featured-images.mjs');
        process.exit(1);
    }

    console.log(`Using model: ${MODEL}`);
    console.log('Scanning blog posts...');
    const posts = scanBlogPosts();
    console.log(`Found ${posts.length} posts.\n`);

    // Filter posts that need images
    let toGenerate = posts.filter(post => {
        if (targetSlug) return post.slug === targetSlug;
        if (force) return true;
        // Generate if no feature image exists
        return !post.featureImage;
    });

    if (targetSlug && toGenerate.length === 0) {
        console.error(`Post with slug "${targetSlug}" not found.`);
        process.exit(1);
    }

    console.log(`Posts to generate images for: ${toGenerate.length}\n`);

    if (dryRun) {
        for (const post of toGenerate) {
            const cat = post.categories[0] || 'Uncategorized';
            console.log(`  [DRY RUN] ${post.slug}`);
            console.log(`            Title: ${post.title}`);
            console.log(`            Category: ${cat}`);
            console.log(`            Hint: ${post.imageHint || '(none)'}`);
            console.log(`            Has image: ${!!post.featureImage}\n`);
        }
        return;
    }

    let generated = 0;
    let failed = 0;

    for (const post of toGenerate) {
        const category = post.categories[0] || '';
        const prompt = buildPrompt(post.title, category, post.imageHint);

        console.log(`Generating: ${post.title}`);
        console.log(`  Category: ${category || '(none)'}`);
        console.log(`  Hint: ${post.imageHint || '(none)'}`);

        try {
            const imageBuffer = await generateImage(prompt);

            // Determine output path
            let imagePath, imageDir;
            if (post.isDirectory) {
                imageDir = path.join(BLOG_DIR, post.slug, 'images');
                imagePath = path.join(imageDir, 'featured.png');
            } else {
                // Single-file posts: create a directory structure
                const newDir = path.join(BLOG_DIR, post.slug);
                imageDir = path.join(newDir, 'images');
                imagePath = path.join(imageDir, 'featured.png');

                // Move .md file into directory as index.md
                if (!fs.existsSync(newDir)) {
                    fs.mkdirSync(newDir, { recursive: true });
                    const newFilePath = path.join(newDir, 'index.md');
                    fs.renameSync(post.filePath, newFilePath);
                    post.filePath = newFilePath;
                    console.log(`  Converted to directory-based post: ${post.slug}/`);
                }
            }

            fs.mkdirSync(imageDir, { recursive: true });
            fs.writeFileSync(imagePath, imageBuffer);
            console.log(`  Image saved: ${path.relative('.', imagePath)}`);

            // Update frontmatter to reference the new image
            const content = fs.readFileSync(post.filePath, 'utf8');
            const { data: frontmatter, content: body } = matter(content);

            frontmatter.featureImage = {
                src: './images/featured.png',
                alt: `Illustration for: ${post.title}`,
            };

            const updatedContent = matter.stringify(body, frontmatter);
            fs.writeFileSync(post.filePath, updatedContent);
            console.log(`  Frontmatter updated.`);

            generated++;
        } catch (err) {
            console.error(`  FAILED: ${err.message}`);
            failed++;
        }

        console.log();

        // Rate limiting: 1 request per 2 seconds to stay within quotas
        if (toGenerate.indexOf(post) < toGenerate.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log(`\nDone! Generated: ${generated}, Failed: ${failed}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
