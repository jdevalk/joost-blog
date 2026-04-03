#!/usr/bin/env node
/**
 * Import transcripts into EmDash video entries.
 * Matches YouTube IDs from video entries to transcript files.
 */

import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TRANSCRIPTS_DIR = "/Users/joostdevalk/Code/joost.blog/src/generated/transcripts";

const db = new Database("data.db");

// Get all videos with their youtube_id
const videos = db.prepare("SELECT id, slug, youtube_id FROM ec_videos WHERE youtube_id IS NOT NULL AND youtube_id != ''").all();
console.log(`Found ${videos.length} videos with YouTube IDs`);

// Load available transcripts
const transcriptFiles = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith(".txt"));
const transcripts = new Map();
for (const file of transcriptFiles) {
	const ytId = file.replace(".txt", "");
	const text = readFileSync(join(TRANSCRIPTS_DIR, file), "utf-8").trim();
	transcripts.set(ytId, text);
}
console.log(`Found ${transcripts.size} transcript files`);

// Match and update
const stmt = db.prepare("UPDATE ec_videos SET content = ? WHERE id = ?");
let updated = 0;

for (const video of videos) {
	const transcript = transcripts.get(video.youtube_id);
	if (!transcript) continue;

	// Convert transcript to portable text: split into paragraphs every ~500 chars at sentence boundaries
	const blocks = [];
	const sentences = transcript.split(/(?<=[.!?])\s+/);
	let currentPara = "";

	for (const sentence of sentences) {
		if (currentPara.length + sentence.length > 500 && currentPara.length > 0) {
			blocks.push({
				_type: "block",
				style: "normal",
				children: [{ _type: "span", text: currentPara.trim() }],
			});
			currentPara = "";
		}
		currentPara += sentence + " ";
	}
	if (currentPara.trim()) {
		blocks.push({
			_type: "block",
			style: "normal",
			children: [{ _type: "span", text: currentPara.trim() }],
		});
	}

	// Prepend a "Transcript" heading
	blocks.unshift({
		_type: "block",
		style: "h2",
		children: [{ _type: "span", text: "Transcript" }],
	});

	stmt.run(JSON.stringify(blocks), video.id);
	updated++;
	console.log(`  Updated: ${video.slug} (${blocks.length - 1} paragraphs)`);
}

db.close();
console.log(`\nDone! Updated ${updated} videos with transcripts.`);
