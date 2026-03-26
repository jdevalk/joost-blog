/**
 * Evaluation script for Ask Joost retrieval quality.
 *
 * Runs the fixture queries against the /ask endpoint with debug=true
 * and reports top-3 precision (how many expected sources appear in the top 3 results).
 *
 * Usage:
 *   node scripts/eval-ask.mjs                          # against production
 *   node scripts/eval-ask.mjs http://localhost:8788     # against local dev
 *   node scripts/eval-ask.mjs --offline                 # offline mode (no LLM, keyword+embedding only)
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesPath = path.join(__dirname, '..', 'tests', 'ask-eval-fixtures.json');

const BASE_URL = process.argv[2] === '--offline'
	? null
	: (process.argv[2] || 'https://joost.blog');

const OFFLINE = process.argv[2] === '--offline';
const TOP_K = 3;

async function loadFixtures() {
	const raw = await readFile(fixturesPath, 'utf8');
	return JSON.parse(raw);
}

function normalizeUrl(url) {
	return url.replace(/\/$/, '').replace(/^https?:\/\/joost\.blog/, '');
}

async function queryAsk(query) {
	const params = new URLSearchParams({
		q: query,
		mode: 'generate',
		debug: 'true',
	});

	const res = await fetch(`${BASE_URL}/ask?${params}`);
	if (!res.ok) {
		throw new Error(`HTTP ${res.status} for query: ${query}`);
	}
	return res.json();
}

function evaluateResult(fixture, response) {
	const topResults = (response.debug?.retrieval || response.results || []).slice(0, TOP_K);
	const returnedUrls = topResults.map((r) => normalizeUrl(r.url));
	const expectedUrls = fixture.expected_sources.map(normalizeUrl);

	// How many expected sources appear in top-K?
	const hits = expectedUrls.filter((url) => returnedUrls.includes(url));
	const precision = expectedUrls.length > 0 ? hits.length / Math.min(expectedUrls.length, TOP_K) : 0;

	return {
		query: fixture.query,
		category: fixture.category,
		precision,
		hits: hits.length,
		expected: expectedUrls.length,
		top_results: topResults.map((r) => ({
			url: normalizeUrl(r.url),
			name: r.name,
			score: r.score,
			keywordScore: r.keywordScore,
			semanticScore: r.semanticScore,
		})),
		expected_sources: expectedUrls,
		missing: expectedUrls.filter((url) => !returnedUrls.includes(url)),
	};
}

async function runOffline(fixtures) {
	// Import the index directly and run search locally (no network, no LLM)
	const indexPath = path.join(__dirname, '..', 'src', 'generated', 'nlweb-index.mjs');
	const { default: nlwebIndex } = await import(indexPath);

	const STOPWORDS = new Set([
		'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
		'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'what', 'when', 'where', 'which', 'who',
		'why', 'with', 'you', 'your',
	]);

	function tokenize(value = '') {
		return String(value)
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
			.split(/\s+/)
			.map((t) => t.trim())
			.filter((t) => t && t.length > 1 && !STOPWORDS.has(t));
	}

	const QUERY_ALIASES = [
		[/\bwp\b/gi, 'wordpress'],
		[/\bcms share\b/gi, 'cms market share'],
		[/\bseo plugin\b/gi, 'yoast seo plugin'],
		[/\bgutenberg\b/gi, 'gutenberg block editor'],
		[/\bblock editor\b/gi, 'gutenberg block editor'],
		[/\bemilia\b/gi, 'emilia capital'],
		[/\bdev-?rel\b/gi, 'developer relations'],
		[/\bprogress ?planner\b/gi, 'progress planner plugin'],
	];

	function expandAliases(query) {
		let expanded = query;
		for (const [pattern, replacement] of QUERY_ALIASES) {
			expanded = expanded.replace(pattern, replacement);
		}
		return expanded;
	}

	function scoreDocument(doc, tokens, fullQuery) {
		const needle = [doc.name, doc.description, doc.type, ...(doc.keywords || []), doc.text].join(' \n ').toLowerCase();
		const nameLower = doc.name.toLowerCase();
		const descLower = doc.description.toLowerCase();
		const urlLower = doc.url.toLowerCase();
		const keywordsLower = (doc.keywords || []).map((k) => String(k).toLowerCase());
		let score = 0;
		if (fullQuery && needle.includes(fullQuery.toLowerCase())) score += 20;
		for (const token of tokens) {
			const occ = needle.split(token).length - 1;
			if (!occ) continue;
			score += Math.min(occ, 3) + Math.log2(Math.max(occ - 3, 1));
			if (nameLower.includes(token)) score += 10;
			if (descLower.includes(token)) score += 5;
			if (keywordsLower.some((kw) => kw.includes(token))) score += 7;
			if (urlLower.includes(token)) score += 4;
		}
		if (score > 0 && doc.type === 'WebPage') score += 15;
		if (score > 0 && doc.type === 'VideoObject') score = Math.round(score * 0.5);
		return score;
	}

	const results = [];
	for (const fixture of fixtures.queries) {
		const expanded = expandAliases(fixture.query);
		const tokens = tokenize(expanded);
		const scored = nlwebIndex
			.map((doc) => {
				const score = scoreDocument(doc, tokens, expanded);
				return { url: doc.url, name: doc.name, score, keywordScore: score, semanticScore: 0 };
			})
			.filter((r) => r.score > 2)
			.sort((a, b) => b.score - a.score)
			.slice(0, 8);

		const response = { debug: { retrieval: scored } };
		results.push(evaluateResult(fixture, response));
	}
	return results;
}

async function runOnline(fixtures) {
	const results = [];
	for (const fixture of fixtures.queries) {
		try {
			const response = await queryAsk(fixture.query);
			results.push(evaluateResult(fixture, response));
		} catch (err) {
			console.error(`  ERROR: ${fixture.query} — ${err.message}`);
			results.push({
				query: fixture.query,
				category: fixture.category,
				precision: 0,
				hits: 0,
				expected: fixture.expected_sources.length,
				top_results: [],
				expected_sources: fixture.expected_sources,
				missing: fixture.expected_sources,
				error: err.message,
			});
		}
		// Small delay between requests to avoid rate limits
		await new Promise((r) => setTimeout(r, 300));
	}
	return results;
}

async function main() {
	const fixtures = await loadFixtures();
	console.log(`\nAsk Joost Eval — ${fixtures.queries.length} queries`);
	console.log(`Mode: ${OFFLINE ? 'offline (keyword only)' : `online (${BASE_URL})`}`);
	console.log('─'.repeat(60));

	const results = OFFLINE
		? await runOffline(fixtures)
		: await runOnline(fixtures);

	// Print per-query results
	let totalPrecision = 0;
	const byCategory = {};

	for (const r of results) {
		const status = r.precision === 1 ? '✓' : r.precision > 0 ? '~' : '✗';
		const pct = Math.round(r.precision * 100);
		console.log(`\n${status} [${r.category}] "${r.query}" — precision: ${pct}%`);

		if (r.missing.length > 0) {
			console.log(`  Missing: ${r.missing.join(', ')}`);
		}

		console.log(`  Top ${TOP_K}:`);
		for (const tr of r.top_results.slice(0, TOP_K)) {
			const match = r.expected_sources.includes(normalizeUrl(tr.url)) ? '←' : ' ';
			console.log(`    ${match} ${tr.score.toFixed(1).padStart(6)} ${tr.url}`);
		}

		totalPrecision += r.precision;
		if (!byCategory[r.category]) byCategory[r.category] = { total: 0, count: 0 };
		byCategory[r.category].total += r.precision;
		byCategory[r.category].count += 1;
	}

	// Summary
	const avgPrecision = totalPrecision / results.length;
	console.log('\n' + '─'.repeat(60));
	console.log(`\nOverall top-${TOP_K} precision: ${Math.round(avgPrecision * 100)}%`);
	console.log('\nBy category:');
	for (const [cat, data] of Object.entries(byCategory).sort()) {
		const avg = Math.round((data.total / data.count) * 100);
		console.log(`  ${cat.padEnd(25)} ${avg}% (${data.count} queries)`);
	}

	const perfect = results.filter((r) => r.precision === 1).length;
	const partial = results.filter((r) => r.precision > 0 && r.precision < 1).length;
	const missed = results.filter((r) => r.precision === 0).length;
	console.log(`\n  Perfect: ${perfect}  Partial: ${partial}  Missed: ${missed}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
