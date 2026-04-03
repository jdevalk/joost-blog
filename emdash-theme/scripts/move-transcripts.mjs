#!/usr/bin/env node
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TRANSCRIPTS_DIR = "/Users/joostdevalk/Code/joost.blog/src/generated/transcripts";
const db = new Database("data.db");

// Get all videos with YouTube IDs
const videos = db.prepare("SELECT id, slug, youtube_id FROM ec_videos WHERE youtube_id IS NOT NULL AND youtube_id != ''").all();

// Load transcripts
const transcriptFiles = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith(".txt"));
const transcripts = new Map();
for (const file of transcriptFiles) {
	transcripts.set(file.replace(".txt", ""), readFileSync(join(TRANSCRIPTS_DIR, file), "utf-8").trim());
}

// Move transcript text to the transcript field, restore content to simple description
const updateStmt = db.prepare("UPDATE ec_videos SET transcript = ?, content = NULL WHERE id = ?");
let updated = 0;

for (const video of videos) {
	const text = transcripts.get(video.youtube_id);
	if (!text) continue;
	updateStmt.run(text, video.id);
	updated++;
	console.log(`  Moved: ${video.slug}`);
}

db.close();
console.log(`\nDone! Moved ${updated} transcripts to separate field.`);
