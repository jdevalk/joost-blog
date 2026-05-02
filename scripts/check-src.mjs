#!/usr/bin/env node
/**
 * Source checks that catch patterns that compile fine but break at runtime.
 * Run as part of `npm run build` so CI catches regressions before deploy.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';

let failures = 0;

function fail(file, line, msg) {
    console.error(`  FAIL  ${file}:${line}  ${msg}`);
    failures++;
}

function walk(dir, exts, cb) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            if (entry === 'node_modules' || entry === 'dist' || entry === '.claude') continue;
            walk(full, exts, cb);
        } else if (exts.some((e) => full.endsWith(e))) {
            cb(full);
        }
    }
}

// ---------------------------------------------------------------------------
// Rule: astro:page-load requires ClientRouter
//
// astro:page-load is only dispatched by Astro's ClientRouter. Without it the
// listener never fires and the page silently does nothing. ClientRouter was
// intentionally removed from this project (cf0ce38) — ban the event entirely
// until/unless it is explicitly re-added.
// ---------------------------------------------------------------------------
const CLIENT_ROUTER_EVENTS = ['astro:page-load', 'astro:after-swap', 'astro:before-swap', 'astro:before-preparation'];

// Check whether ClientRouter is present anywhere in the project
let hasClientRouter = false;
walk('src', ['.astro', '.ts', '.js', '.mjs'], (file) => {
    const src = readFileSync(file, 'utf8');
    if (src.includes('ClientRouter') || src.includes('@astrojs/transitions')) {
        hasClientRouter = true;
    }
});

if (!hasClientRouter) {
    walk('src', ['.astro', '.ts', '.js', '.mjs'], (file) => {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
            for (const event of CLIENT_ROUTER_EVENTS) {
                if (line.includes(`'${event}'`) || line.includes(`"${event}"`)) {
                    fail(
                        relative(process.cwd(), file),
                        i + 1,
                        `'${event}' requires Astro's ClientRouter, which is not present. Use 'DOMContentLoaded' instead.`,
                    );
                }
            }
        });
    });
}

// ---------------------------------------------------------------------------
// Rule: latest published post must have a pre-generated OG image
//
// OG images are generated locally via `pnpm generate:og` and committed.
// A missing image means the social share card will 404.
// ---------------------------------------------------------------------------
const BLOG_DIR = 'src/content/blog';
const OG_DIR   = 'public/og';

const blogDirs = readdirSync(BLOG_DIR).filter(name =>
    statSync(join(BLOG_DIR, name)).isDirectory()
);

const posts = blogDirs.flatMap(slug => {
    const mdPath  = join(BLOG_DIR, slug, 'index.md');
    const mdxPath = join(BLOG_DIR, slug, 'index.mdx');
    const filePath = existsSync(mdPath) ? mdPath : existsSync(mdxPath) ? mdxPath : null;
    if (!filePath) return [];
    const { data } = matter(readFileSync(filePath, 'utf8'));
    if (!data.publishDate || data.draft) return [];
    return [{ slug, publishDate: new Date(data.publishDate) }];
});

posts.sort((a, b) => b.publishDate - a.publishDate);
const latest = posts[0];

if (latest) {
    const ogPath = join(OG_DIR, `${latest.slug}.webp`);
    if (!existsSync(ogPath)) {
        fail(
            `${OG_DIR}/${latest.slug}.webp`,
            0,
            `OG image missing for latest post "${latest.slug}". Run: pnpm generate:og --slug ${latest.slug}`,
        );
    }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
if (failures > 0) {
    console.error(`\n${failures} check(s) failed.\n`);
    process.exit(1);
} else {
    console.log('check-src: all checks passed.');
}
