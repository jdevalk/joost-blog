#!/usr/bin/env node
import Database from "better-sqlite3";

const db = new Database("data.db");

const projects = [
	{
		slug: "rondo",
		title: "Rondo",
		description: "From member management and dues to invoicing, VOG, and membership passes: Rondo automates your club processes and keeps everything in sync.",
		url: "https://rondo.club",
		github_url: "https://github.com/rondoclubmanager",
		image_key: "01KN5DS19YF7XTW5QF3C2G94W4.webp",
		featured: true,
		category: "saas",
		sort_order: 0,
	},
	{
		slug: "progress-planner",
		title: "Progress Planner",
		description: "My current main focus. A WordPress plugin that helps you plan and track your content and site maintenance progress.",
		url: "https://progressplanner.com/",
		github_url: "https://github.com/ProgressPlanner/progress-planner",
		image_key: "01KN5DS3WYHSJB6Z5RMYG1C3JP.webp",
		category: "wordpress-plugins",
		sort_order: 1,
	},
	{
		slug: "aaa-option-optimizer",
		title: "AAA Option Optimizer",
		description: "Tracks autoloaded options usage and allows the user to optimize them.",
		url: "https://progressplanner.com/plugins/aaa-option-optimizer/",
		github_url: "https://github.com/ProgressPlanner/aaa-option-optimizer",
		image_key: "01KN5DS1NJ6QDEQF8WY5ACY2AJ.webp",
		category: "wordpress-plugins",
		sort_order: 2,
	},
	{
		slug: "brand-assets",
		title: "Brand Assets",
		description: "Stop chasing down requests for your logo and color codes by creating a Brand Assets page on your site.",
		url: "https://progressplanner.com/plugins/brand-assets/",
		github_url: "https://github.com/ProgressPlanner/brand-assets",
		image_key: "01KN5DS21629DCW8H5KW59Q4QS.webp",
		category: "wordpress-plugins",
		sort_order: 3,
	},
	{
		slug: "comment-experience",
		title: "Comment Experience",
		description: "WordPress' comment system is incomplete. This plugin adds a lot of nifty little tricks to make comments on WordPress a lot more manageable.",
		url: "https://progressplanner.com/plugins/comment-experience/",
		github_url: "https://github.com/ProgressPlanner/comment-experience",
		image_key: "01KN5DS2D2P9DT193CWHBGJR63.webp",
		category: "wordpress-plugins",
		sort_order: 4,
	},
	{
		slug: "comment-free-zone",
		title: "Comment Free Zone",
		description: "Your WordPress site comes with comments enabled in many places by default. But not every site needs them, and if that's the case for you, they can add unnecessary clutter.",
		url: "https://progressplanner.com/plugins/comment-free-zone/",
		github_url: "https://github.com/ProgressPlanner/comment-free-zone",
		image_key: "01KN5DS2RJ8P80BQHQ1WYQV48N.webp",
		category: "wordpress-plugins",
		sort_order: 5,
	},
	{
		slug: "fewer-tags",
		title: "Fewer Tags",
		description: "Make sure tags are only live on your site when they actually add value, so when there's more than a few posts in it.",
		url: "https://progressplanner.com/plugins/fewer-tags/",
		github_url: "https://github.com/ProgressPlanner/fewer-tags",
		image_key: "01KN5DS34DZBHYZZ093FC8C9XF.png",
		category: "wordpress-plugins",
		sort_order: 6,
	},
	{
		slug: "glossary",
		title: "Glossary",
		description: "Make your content easier to understand with clear definitions that show up exactly when and where readers need them.",
		url: "https://progressplanner.com/plugins/glossary/",
		github_url: "https://github.com/ProgressPlanner/flavor-glossary",
		image_key: "01KN5DS3HHN35CCP322K6A2RVP.webp",
		category: "wordpress-plugins",
		sort_order: 7,
	},
	{
		slug: "xml-sitemaps-pdfs",
		title: "XML Sitemaps for PDFs",
		description: "If your site has a lot of PDFs, this add-on to Yoast SEO is what you need to get them indexed.",
		url: "https://progressplanner.com/plugins/xml-sitemap-for-pdfs/",
		github_url: "https://github.com/ProgressPlanner/xml-sitemap-for-pdfs",
		image_key: "01KN5DS48M3VATMXEJS5X661D5.webp",
		category: "wordpress-plugins",
		sort_order: 8,
	},
];

// Get taxonomy term IDs
const terms = db.prepare("SELECT id, slug FROM taxonomies WHERE name = 'project-category'").all();
const termMap = Object.fromEntries(terms.map(t => [t.slug, t.id]));

// Get collection ID
const collection = db.prepare("SELECT id FROM _emdash_collections WHERE slug = 'projects'").get();

let created = 0;
for (const p of projects) {
	const id = `proj-${p.slug}`;
	const imageValue = p.image_key ? JSON.stringify({
		id: p.image_key.split('.')[0],
		alt: p.title,
		meta: { storageKey: p.image_key },
		provider: "local",
	}) : null;

	db.prepare(`
		INSERT OR REPLACE INTO ec_projects (id, slug, status, locale, title, description, url, github_url, featured_image, featured, sort_order, published_at, created_at, updated_at, version)
		VALUES (?, ?, 'published', 'en', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'), 1)
	`).run(id, p.slug, p.title, p.description, p.url, p.github_url, imageValue, p.featured ? 1 : 0, p.sort_order);

	// Assign taxonomy term
	const termId = termMap[p.category];
	if (termId) {
		db.prepare(`INSERT OR IGNORE INTO content_taxonomies (collection, entry_id, taxonomy_id) VALUES ('projects', ?, ?)`).run(id, termId);
	}

	created++;
	console.log(`  Created: ${p.title} [${p.category}]`);
}

db.close();
console.log(`\nDone! ${created} projects created.`);
