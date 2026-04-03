#!/usr/bin/env node
import Database from "better-sqlite3";

const db = new Database("data.db");
const posts = db.prepare("SELECT id, slug, content FROM ec_posts WHERE content IS NOT NULL").all();

let fixed = 0;
for (const post of posts) {
	let blocks;
	try { blocks = JSON.parse(post.content); } catch { continue; }
	if (!Array.isArray(blocks)) continue;

	let changed = false;
	const newBlocks = [];

	for (const block of blocks) {
		if (block._type !== "block" || !block.children) {
			newBlocks.push(block);
			continue;
		}

		// Check if any child has <br /> in its text
		const hasBr = block.children.some(c => (c.text || "").includes("<br"));
		if (!hasBr) {
			newBlocks.push(block);
			continue;
		}

		// Split on <br /> — first part becomes h3 (bold subheading), rest becomes paragraph
		const fullText = block.children.map(c => c.text || "").join("");
		const parts = fullText.split(/<br\s*\/?>\s*/);

		if (parts.length >= 2) {
			// First part is the bold subheading
			const heading = parts[0].replace(/^\*\*|\*\*$/g, "").trim();
			const body = parts.slice(1).join(" ").trim();

			newBlocks.push({
				_type: "block",
				style: "h3",
				children: [{ _type: "span", text: heading, marks: ["strong"] }],
			});

			if (body) {
				// Rebuild children preserving marks from original
				newBlocks.push({
					_type: "block",
					style: "normal",
					children: [{ _type: "span", text: body }],
					markDefs: block.markDefs,
				});
			}
			changed = true;
		} else {
			// Just strip the br tags
			for (const child of block.children) {
				if (child.text) {
					child.text = child.text.replace(/<br\s*\/?>\s*/g, " ").trim();
				}
			}
			newBlocks.push(block);
			changed = true;
		}
	}

	if (changed) {
		db.prepare("UPDATE ec_posts SET content = ? WHERE id = ?").run(JSON.stringify(newBlocks), post.id);
		fixed++;
		console.log(`  Fixed: ${post.slug}`);
	}
}

db.close();
console.log(`\nDone! Fixed ${fixed} posts.`);
