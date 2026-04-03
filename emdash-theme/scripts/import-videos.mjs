#!/usr/bin/env node
/**
 * Import Astro video content into EmDash via CLI.
 * Reads from main branch, creates entries via `emdash content create`.
 */

import { execSync } from "node:child_process";
import Database from "better-sqlite3";

const GIT_OPTS = { encoding: "utf-8", env: { ...process.env, GIT_PAGER: "" }, stdio: ["pipe", "pipe", "pipe"], timeout: 5000 };

function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return { data: {}, body: content };
	const yamlStr = match[1];
	const body = match[2];
	const data = {};
	let inArray = false, arrayKey = null, arrayValues = [];
	let inMultiline = false, currentKey = null, currentValue = "";

	for (const line of yamlStr.split("\n")) {
		if (inArray && /^\s+-\s+(.+)$/.test(line)) {
			arrayValues.push(line.match(/^\s+-\s+(.+)$/)[1].trim());
			continue;
		} else if (inArray && !/^\s+-/.test(line)) {
			data[arrayKey] = arrayValues;
			inArray = false; arrayKey = null; arrayValues = [];
		}
		if (inMultiline && /^\s+/.test(line)) {
			currentValue += " " + line.trim();
			continue;
		} else if (inMultiline) {
			data[currentKey] = currentValue.trim();
			inMultiline = false;
		}
		const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
		if (kvMatch) {
			const key = kvMatch[1];
			let value = kvMatch[2].trim();
			if (value === "") { inArray = true; arrayKey = key; arrayValues = []; continue; }
			if (value === ">" || value === ">-" || value === "|") { inMultiline = true; currentKey = key; currentValue = ""; continue; }
			if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) value = value.slice(1, -1);
			if (value === "true") value = true;
			else if (value === "false") value = false;
			data[key] = value;
		}
	}
	if (inMultiline) data[currentKey] = currentValue.trim();
	if (inArray) data[arrayKey] = arrayValues;
	return { data, body };
}

function markdownToPortableText(md) {
	if (!md.trim()) return [];
	return [{
		_type: "block",
		style: "normal",
		children: [{ _type: "span", text: md.trim() }],
	}];
}

function main() {
	const videoDirs = execSync("git show main:src/content/videos/", GIT_OPTS)
		.split("\n")
		.filter((line) => line.endsWith("/") && !line.startsWith("tree "))
		.map((line) => line.replace(/\/$/, ""));

	console.log(`Found ${videoDirs.length} video directories`);

	const db = new Database("data.db");
	const videos = [];
	let imported = 0;

	for (const dir of videoDirs) {
		let fileContent = null;
		for (const ext of ["index.md", "index.mdx"]) {
			try {
				fileContent = execSync(`git show main:src/content/videos/${dir}/${ext}`, GIT_OPTS);
				break;
			} catch { continue; }
		}
		if (!fileContent) {
			console.log(`  Skipping ${dir}: no index file`);
			continue;
		}

		const { data, body } = parseFrontmatter(fileContent);
		const content = markdownToPortableText(body);

		const entryData = {
			title: data.title || dir,
			content,
			excerpt: body.trim().slice(0, 200),
			video_url: data.videoUrl || "",
			youtube_id: data.youtubeId || "",
			duration: data.duration || "",
			featured: data.featured === true ? 1 : 0,
		};

		// Build thumbnail URL from GitHub
		let thumbnailUrl = null;
		if (data.featureImage) {
			const imgPath = data.featureImage.replace(/^\.\//, "");
			thumbnailUrl = `https://raw.githubusercontent.com/jdevalk/joost-blog/main/src/content/videos/${dir}/${imgPath}`;
		}

		const publishedAt = data.publishDate
			? (String(data.publishDate).includes("T") ? String(data.publishDate) : `${data.publishDate}T00:00:00.000Z`)
			: new Date().toISOString();

		videos.push({ slug: dir, data: entryData, publishedAt, thumbnailUrl, alt: data.featureImageAlt || data.title });
		console.log(`  Prepared: ${data.title || dir}`);
	}

	// Create entries via CLI with --data, then fix dates
	for (const video of videos) {
		const jsonData = JSON.stringify(video.data);
		try {
			const result = execSync(
				`npx emdash content create videos --slug "${video.slug}" --data '${jsonData.replace(/'/g, "'\\''")}'`,
				{ ...GIT_OPTS, timeout: 15000 }
			);
			imported++;
		} catch (e) {
			console.error(`  Failed: ${video.slug}: ${e.message.slice(0, 100)}`);
		}
	}

	console.log(`\nCreated ${imported} videos. Fixing dates...`);

	// Fix dates
	const stmt = db.prepare("UPDATE ec_videos SET published_at = ?, created_at = ? WHERE slug = ?");
	let datesFixed = 0;
	for (const video of videos) {
		const result = stmt.run(video.publishedAt, video.publishedAt, video.slug);
		if (result.changes > 0) datesFixed++;
	}
	console.log(`Fixed ${datesFixed} dates.`);

	// Download thumbnails - use seed-style $media approach via media upload CLI
	let mediaCount = 0;
	for (const video of videos) {
		if (!video.thumbnailUrl) continue;
		try {
			// Download image to temp file
			execSync(`curl -sL "${video.thumbnailUrl}" -o /tmp/emdash-thumb.webp`, { timeout: 10000 });
			// Upload to EmDash
			const uploadResult = execSync(`npx emdash media upload /tmp/emdash-thumb.webp --json`, { encoding: "utf-8", timeout: 15000 });
			const media = JSON.parse(uploadResult.match(/\{[\s\S]*\}/)?.[0] || "{}");
			if (media.storageKey) {
				// Update the video's featured_image field
				const mediaValue = JSON.stringify({ id: media.id, alt: video.alt, meta: { storageKey: media.storageKey } });
				db.prepare("UPDATE ec_videos SET featured_image = ? WHERE slug = ?").run(mediaValue, video.slug);
				mediaCount++;
			}
		} catch (e) {
			console.log(`  Thumbnail failed for ${video.slug}: ${e.message.slice(0, 80)}`);
		}
	}
	console.log(`Uploaded ${mediaCount} thumbnails.`);

	db.close();
	console.log("Done!");
}

main();
