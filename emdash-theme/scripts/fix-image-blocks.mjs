#!/usr/bin/env node
/**
 * Fix image blocks in all posts to use _ref instead of storageKey
 */
import Database from "better-sqlite3";

const db = new Database("data.db");
const posts = db.prepare("SELECT id, slug, content FROM ec_posts WHERE content IS NOT NULL").all();

let fixed = 0;
for (const post of posts) {
	let blocks;
	try { blocks = JSON.parse(post.content); } catch { continue; }
	if (!Array.isArray(blocks)) continue;

	let changed = false;
	for (const block of blocks) {
		if (block._type === "image" && block.asset?.storageKey) {
			block.asset._ref = block.asset.storageKey;
			block.asset.url = `/_emdash/api/media/file/${block.asset.storageKey}`;
			delete block.asset.storageKey;
			changed = true;
		}
	}

	if (changed) {
		db.prepare("UPDATE ec_posts SET content = ? WHERE id = ?").run(JSON.stringify(blocks), post.id);
		fixed++;
		console.log(`  Fixed: ${post.slug}`);
	}
}

db.close();
console.log(`\nDone! Fixed ${fixed} posts.`);
