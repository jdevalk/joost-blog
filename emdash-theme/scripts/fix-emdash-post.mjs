#!/usr/bin/env node
import Database from "better-sqlite3";

const db = new Database("data.db");

const row = db.prepare("SELECT content FROM ec_posts WHERE slug = 'emdash-cms'").get();
const blocks = JSON.parse(row.content);

// Insert admin image after block 8 (WordPress theme porting paragraph)
const adminImageBlock = {
	_type: "image",
	asset: {
		_type: "reference",
		storageKey: "01KN5FAV5QDGX01JXZ7YA7GA8P.png",
	},
	alt: "EmDash's post editor showing a familiar WordPress-like interface with title, featured image, rich text editor, categories, and publish controls",
};

// Insert SEO panel image after block 17 (SEO foundation paragraph)
// After inserting admin image, SEO foundation will be at index 18
const seoImageBlock = {
	_type: "image",
	asset: {
		_type: "reference",
		storageKey: "01KN5FAVTDX0J5T8EBT1NP6ZGX.png",
	},
	alt: "EmDash's built-in SEO panel showing fields for SEO title, meta description, canonical URL, and a noindex toggle",
};

// Insert admin image after index 8
blocks.splice(9, 0, adminImageBlock);

// Insert SEO image after index 18 (was 17, shifted by 1)
blocks.splice(19, 0, seoImageBlock);

// Remove junk blocks at the end (script/style leftovers from MDX)
// Find and remove blocks that contain script/style content
const cleaned = blocks.filter((b) => {
	if (b._type !== "block") return true;
	const text = (b.children || []).map((c) => c.text || "").join("");
	if (text.includes("document.getElementById") || text.includes("modal.addEventListener") || text.includes("`}</style>") || text.includes("`}</script>")) {
		return false;
	}
	return true;
});

db.prepare("UPDATE ec_posts SET content = ? WHERE slug = 'emdash-cms'").run(JSON.stringify(cleaned));
db.close();

console.log(`Updated emdash-cms post: ${blocks.length} -> ${cleaned.length} blocks (added 2 images, removed junk)`);
