#!/usr/bin/env node

/**
 * Schema.org JSON-LD validation script
 * Validates that all page types output correct Yoast-style @graph schema
 */

import { readFileSync, existsSync } from 'fs';

const DIST = 'dist';
let passed = 0;
let failed = 0;

function check(label, condition) {
    if (condition) {
        console.log(`  PASS: ${label}`);
        passed++;
    } else {
        console.log(`  FAIL: ${label}`);
        failed++;
    }
}

function extractJsonLd(htmlPath) {
    if (!existsSync(htmlPath)) {
        console.log(`  SKIP: ${htmlPath} does not exist`);
        return null;
    }
    const html = readFileSync(htmlPath, 'utf-8');
    const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    return { count: matches.length, data: matches.map(m => JSON.parse(m[1])) };
}

function findInGraph(graph, typeName) {
    return graph.find(piece => {
        const t = piece['@type'];
        if (Array.isArray(t)) return t.includes(typeName);
        return t === typeName;
    });
}

function validateCommon(label, htmlPath) {
    console.log(`\n--- ${label} (${htmlPath}) ---`);
    const result = extractJsonLd(htmlPath);
    if (!result) return null;

    check('Exactly 1 JSON-LD script tag', result.count === 1);
    if (result.count !== 1) return null;

    const jsonLd = result.data[0];
    check('Has @context schema.org', jsonLd['@context'] === 'https://schema.org');
    check('Has @graph array', Array.isArray(jsonLd['@graph']));
    if (!Array.isArray(jsonLd['@graph'])) return null;

    const graph = jsonLd['@graph'];
    check('Graph has WebSite piece', !!findInGraph(graph, 'WebSite'));
    check('Graph has Person piece', !!graph.find(p => {
        const t = p['@type'];
        return (Array.isArray(t) && t.includes('Person')) || t === 'Person';
    }));
    check('Graph has BreadcrumbList piece', !!findInGraph(graph, 'BreadcrumbList'));

    // Reference integrity: all @id references resolve within the graph
    const allIds = new Set();
    for (const piece of graph) {
        if (piece['@id']) allIds.add(piece['@id']);
    }

    let unresolvedRefs = 0;
    function checkRefs(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            obj.forEach((item, i) => checkRefs(item, `${path}[${i}]`));
            return;
        }
        // An object with only @id (no other data) is a pure reference that must resolve
        const keys = Object.keys(obj);
        if (keys.length === 1 && keys[0] === '@id' && path !== '') {
            if (!allIds.has(obj['@id'])) {
                unresolvedRefs++;
            }
        }
        for (const [key, val] of Object.entries(obj)) {
            if (key !== '@id') checkRefs(val, `${path}.${key}`);
        }
    }

    for (const piece of graph) {
        checkRefs(piece);
    }
    check('@id reference integrity (all refs resolve)', unresolvedRefs === 0);
    if (unresolvedRefs > 0) {
        console.log(`    (${unresolvedRefs} unresolved @id references)`);
    }

    return graph;
}

// Blog post
{
    const graph = validateCommon('Blog Post', `${DIST}/healthy-doubt/index.html`);
    if (graph) {
        check('Has Article piece', !!findInGraph(graph, 'Article'));
        const webPage = findInGraph(graph, 'WebPage');
        check('Has WebPage piece', !!webPage);
        check('Has ImageObject piece', !!findInGraph(graph, 'ImageObject'));
        const article = findInGraph(graph, 'Article');
        if (article) {
            check('Article has author @id ref', !!article.author?.['@id']);
        }
    }
}

// Homepage
{
    const graph = validateCommon('Homepage', `${DIST}/index.html`);
    if (graph) {
        const webPage = graph.find(p => {
            const t = p['@type'];
            return t === 'CollectionPage' || (Array.isArray(t) && t.includes('CollectionPage'));
        });
        check('Has CollectionPage type', !!webPage);
        if (webPage) {
            check('CollectionPage has about ref to Person', !!webPage.about?.['@id']);
        }
    }
}

// About page
{
    const graph = validateCommon('About Page', `${DIST}/about-me/index.html`);
    if (graph) {
        const profilePage = graph.find(p => {
            const t = p['@type'];
            return t === 'ProfilePage' || (Array.isArray(t) && t.includes('ProfilePage'));
        });
        check('Has ProfilePage type', !!profilePage);
    }
}

// Category page
{
    const graph = validateCommon('Category Page', `${DIST}/category/wordpress/index.html`);
    if (graph) {
        const collectionPage = graph.find(p => {
            const t = p['@type'];
            return t === 'CollectionPage' || (Array.isArray(t) && t.includes('CollectionPage'));
        });
        check('Has CollectionPage type', !!collectionPage);
    }
}

// Video listing
{
    const graph = validateCommon('Video Listing', `${DIST}/videos/index.html`);
    if (graph) {
        check('Has WebPage or CollectionPage', !!graph.find(p => {
            const t = p['@type'];
            return ['WebPage', 'CollectionPage'].includes(t) ||
                (Array.isArray(t) && (t.includes('WebPage') || t.includes('CollectionPage')));
        }));
    }
}

// Blog listing
{
    const graph = validateCommon('Blog Listing', `${DIST}/blog/index.html`);
    if (graph) {
        const collectionPage = graph.find(p => {
            const t = p['@type'];
            return t === 'CollectionPage' || (Array.isArray(t) && t.includes('CollectionPage'));
        });
        check('Has CollectionPage type', !!collectionPage);
    }
}

// Summary
console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

process.exit(failed > 0 ? 1 : 0);
