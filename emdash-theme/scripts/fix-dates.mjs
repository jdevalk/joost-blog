#!/usr/bin/env node
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("seed/imported.json", "utf-8"));
const db = new Database("data.db");

const stmt = db.prepare("UPDATE ec_posts SET published_at = ?, created_at = ? WHERE slug = ?");

let updated = 0;
for (const post of seed.content.posts) {
	if (post.publishedAt) {
		const result = stmt.run(post.publishedAt, post.publishedAt, post.slug);
		if (result.changes > 0) updated++;
	}
}

db.close();
console.log(`Updated ${updated} post dates.`);
