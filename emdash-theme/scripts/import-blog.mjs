#!/usr/bin/env node
/**
 * Import Astro markdown blog posts into EmDash via seed file.
 * Reads posts from the main branch's src/content/blog/ directory,
 * converts markdown content to Portable Text, and generates a seed file.
 *
 * Usage: node scripts/import-blog.mjs
 * Then:  npx emdash seed seed/imported.json
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// --- Markdown to Portable Text converter ---

function markdownToPortableText(markdown) {
	const blocks = [];
	const lines = markdown.split("\n");
	let i = 0;

	while (i < lines.length) {
		const prevI = i;
		const line = lines[i];

		// Skip empty lines
		if (line.trim() === "") {
			i++;
			continue;
		}

		// Code blocks
		if (line.startsWith("```")) {
			const lang = line.slice(3).trim() || undefined;
			const codeLines = [];
			i++;
			while (i < lines.length && !lines[i].startsWith("```")) {
				codeLines.push(lines[i]);
				i++;
			}
			i++; // skip closing ```
			blocks.push({
				_type: "code",
				language: lang,
				code: codeLines.join("\n"),
			});
			continue;
		}

		// Headings
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			blocks.push({
				_type: "block",
				style: `h${level}`,
				children: parseInline(headingMatch[2]),
			});
			i++;
			continue;
		}

		// Horizontal rule
		if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
			blocks.push({ _type: "break", style: "lineBreak" });
			i++;
			continue;
		}

		// Blockquote
		if (line.startsWith(">")) {
			const quoteLines = [];
			while (i < lines.length && lines[i].startsWith(">")) {
				quoteLines.push(lines[i].replace(/^>\s?/, ""));
				i++;
			}
			blocks.push({
				_type: "block",
				style: "blockquote",
				children: parseInline(quoteLines.join(" ")),
			});
			continue;
		}

		// Unordered list
		if (/^[-*+]\s/.test(line)) {
			const listItems = [];
			while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
				listItems.push(lines[i].replace(/^[-*+]\s+/, ""));
				i++;
			}
			for (const item of listItems) {
				blocks.push({
					_type: "block",
					style: "normal",
					listItem: "bullet",
					level: 1,
					children: parseInline(item),
				});
			}
			continue;
		}

		// Ordered list
		if (/^\d+\.\s/.test(line)) {
			const listItems = [];
			while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
				listItems.push(lines[i].replace(/^\d+\.\s+/, ""));
				i++;
			}
			for (const item of listItems) {
				blocks.push({
					_type: "block",
					style: "normal",
					listItem: "number",
					level: 1,
					children: parseInline(item),
				});
			}
			continue;
		}

		// HTML blocks / MDX components — skip until closing tag or empty line
		if (line.startsWith("<") && !line.startsWith("<a") && !line.startsWith("<img")) {
			i++;
			// Skip multi-line HTML/JSX blocks
			while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].startsWith("```")) {
				if (lines[i].startsWith("<") || /^\s/.test(lines[i]) || lines[i].includes("{`") || lines[i].includes("`}")) {
					i++;
				} else {
					break;
				}
			}
			continue;
		}

		// Import statements (MDX)
		if (line.startsWith("import ")) {
			i++;
			continue;
		}

		// Regular paragraph - collect consecutive non-empty lines
		const paraLines = [];
		while (
			i < lines.length &&
			lines[i].trim() !== "" &&
			!lines[i].startsWith("#") &&
			!lines[i].startsWith("```") &&
			!lines[i].startsWith(">") &&
			!/^[-*+]\s/.test(lines[i]) &&
			!/^\d+\.\s/.test(lines[i]) &&
			!lines[i].startsWith("<") &&
			!lines[i].startsWith("import ") &&
			!/^[-]{3,}$/.test(lines[i].trim()) &&
			!/^\s*\{/.test(lines[i]) &&
			!/^\s*\}/.test(lines[i])
		) {
			paraLines.push(lines[i]);
			i++;
		}

		if (paraLines.length > 0) {
			blocks.push({
				_type: "block",
				style: "normal",
				children: parseInline(paraLines.join(" ")),
			});
		}

		// Safety: if i didn't advance, skip the line
		if (i === prevI) {
			i++;
		}
	}

	return blocks;
}

function parseInline(text) {
	const children = [];
	const markDefs = [];
	let remaining = text;
	let safety = 0;

	while (remaining.length > 0 && safety++ < 10000) {
		// Bold + italic
		let match = remaining.match(/^\*{3}(.+?)\*{3}/);
		if (match) {
			children.push({ _type: "span", text: match[1], marks: ["strong", "em"] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Bold
		match = remaining.match(/^\*{2}(.+?)\*{2}/);
		if (match) {
			children.push({ _type: "span", text: match[1], marks: ["strong"] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Italic (underscore)
		match = remaining.match(/^_(.+?)_/);
		if (match) {
			children.push({ _type: "span", text: match[1], marks: ["em"] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Italic (asterisk)
		match = remaining.match(/^\*(.+?)\*/);
		if (match) {
			children.push({ _type: "span", text: match[1], marks: ["em"] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Inline code
		match = remaining.match(/^`(.+?)`/);
		if (match) {
			children.push({ _type: "span", text: match[1], marks: ["code"] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Links
		match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
		if (match) {
			const key = `link-${markDefs.length}`;
			markDefs.push({ _type: "link", _key: key, href: match[2] });
			children.push({ _type: "span", text: match[1], marks: [key] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Images (convert to image block marker, skip inline)
		match = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
		if (match) {
			// Skip inline images for now
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Plain text until next special character
		match = remaining.match(/^[^*_`\[!]+/);
		if (match) {
			children.push({ _type: "span", text: match[0] });
			remaining = remaining.slice(match[0].length);
			continue;
		}

		// Single special char that didn't match a pattern
		children.push({ _type: "span", text: remaining[0] });
		remaining = remaining.slice(1);
	}

	// Attach markDefs to the result (caller can extract)
	if (markDefs.length > 0) {
		children._markDefs = markDefs;
	}

	return children;
}

// --- YAML frontmatter parser ---

function parseFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return { data: {}, body: content };

	const yamlStr = match[1];
	const body = match[2];
	const data = {};

	let currentKey = null;
	let currentValue = "";
	let inMultiline = false;
	let inArray = false;
	let arrayKey = null;
	let arrayValues = [];

	for (const line of yamlStr.split("\n")) {
		// Array item
		if (inArray && /^\s+-\s+(.+)$/.test(line)) {
			const itemMatch = line.match(/^\s+-\s+(.+)$/);
			arrayValues.push(itemMatch[1].trim());
			continue;
		} else if (inArray && !/^\s+-/.test(line)) {
			data[arrayKey] = arrayValues;
			inArray = false;
			arrayKey = null;
			arrayValues = [];
		}

		// Multiline string continuation
		if (inMultiline && /^\s+/.test(line)) {
			currentValue += " " + line.trim();
			continue;
		} else if (inMultiline) {
			data[currentKey] = currentValue.trim();
			inMultiline = false;
		}

		// Key: value
		const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
		if (kvMatch) {
			const key = kvMatch[1];
			let value = kvMatch[2].trim();

			// Array start
			if (value === "") {
				// Check next line for array
				inArray = true;
				arrayKey = key;
				arrayValues = [];
				continue;
			}

			// Multiline string indicators
			if (value === ">" || value === ">-" || value === "|") {
				inMultiline = true;
				currentKey = key;
				currentValue = "";
				continue;
			}

			// Strip quotes
			if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
				value = value.slice(1, -1);
			}

			// Boolean
			if (value === "true") value = true;
			else if (value === "false") value = false;

			data[key] = value;
		}
	}

	// Flush remaining
	if (inMultiline) data[currentKey] = currentValue.trim();
	if (inArray) data[arrayKey] = arrayValues;

	return { data, body };
}

// --- Main ---

function main() {
	// Get list of blog post directories from main branch
	const blogDirs = execSync("git show main:src/content/blog/", { encoding: "utf-8", env: { ...process.env, GIT_PAGER: "" } })
		.split("\n")
		.filter((line) => line.endsWith("/") && !line.startsWith("tree "))
		.map((line) => line.replace(/\/$/, ""));

	console.log(`Found ${blogDirs.length} blog post directories`);

	const posts = [];
	const allCategories = new Set();
	let skipped = 0;

	for (const dir of blogDirs) {
		// Try index.md first, then index.mdx
		let fileContent = null;
		let filename = null;
		for (const ext of ["index.md", "index.mdx"]) {
			try {
				fileContent = execSync(`git show main:src/content/blog/${dir}/${ext}`, { encoding: "utf-8", env: { ...process.env, GIT_PAGER: "" }, stdio: ["pipe", "pipe", "pipe"], timeout: 5000 });
				filename = ext;
				break;
			} catch {
				continue;
			}
		}

		if (!fileContent) {
			console.warn(`  Skipping ${dir}: no index.md or index.mdx found`);
			skipped++;
			continue;
		}

		const { data, body } = parseFrontmatter(fileContent);

		// Skip drafts
		if (data.draft === true) {
			console.log(`  Skipping draft: ${dir}`);
			skipped++;
			continue;
		}

		// Collect categories
		const categories = Array.isArray(data.categories) ? data.categories : [];
		for (const cat of categories) {
			allCategories.add(cat);
		}

		// Convert markdown body to portable text
		console.log(`  Parsing: ${dir}...`);
		const content = markdownToPortableText(body);

		// Extract markDefs from children and attach to blocks
		for (const block of content) {
			if (block.children) {
				const markDefs = block.children._markDefs;
				if (markDefs) {
					block.markDefs = markDefs;
					delete block.children._markDefs;
				}
			}
		}

		const post = {
			id: dir,
			slug: dir,
			status: "published",
			data: {
				title: data.title || dir,
				excerpt: data.excerpt || "",
				content,
			},
			bylines: [{ byline: "byline-joost" }],
			taxonomies: {},
		};

		// Publish date at entry level
		if (data.publishDate) {
			const dateStr = String(data.publishDate);
			post.publishedAt = dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00.000Z`;
		}

		// Featured image — use GitHub raw URL
		if (data.featureImage) {
			const imgPath = data.featureImage.replace(/^\.\//, "");
			post.data.featured_image = {
				"$media": {
					url: `https://raw.githubusercontent.com/jdevalk/joost-blog/main/src/content/blog/${dir}/${imgPath}`,
					alt: data.featureImageAlt || data.title || "",
					filename: imgPath.split("/").pop(),
				},
			};
		}

		if (categories.length > 0) {
			post.taxonomies.category = categories.map((c) => slugify(c));
		}

		posts.push(post);
		console.log(`  Imported: ${data.title || dir}`);
	}

	// Build category terms
	const categoryTerms = [...allCategories].map((cat) => ({
		slug: slugify(cat),
		label: cat,
	}));

	// Build seed file
	const seed = {
		$schema: "https://emdashcms.com/seed.schema.json",
		version: "1",
		meta: {
			name: "joost.blog Import",
			description: "Imported from Astro markdown blog posts",
			author: "Joost de Valk",
		},
		settings: {
			title: "Joost de Valk",
			tagline: "Thoughts on SEO, WordPress, open source, and building things",
		},
		collections: [
			{
				slug: "posts",
				label: "Posts",
				labelSingular: "Post",
				supports: ["drafts", "revisions", "search", "seo"],
				commentsEnabled: true,
				fields: [
					{ slug: "title", label: "Title", type: "string", required: true, searchable: true },
					{ slug: "featured_image", label: "Featured Image", type: "image" },
					{ slug: "content", label: "Content", type: "portableText", searchable: true },
					{ slug: "excerpt", label: "Excerpt", type: "text" },
				],
			},
			{
				slug: "pages",
				label: "Pages",
				labelSingular: "Page",
				supports: ["drafts", "revisions", "search"],
				fields: [
					{ slug: "title", label: "Title", type: "string", required: true, searchable: true },
					{ slug: "content", label: "Content", type: "portableText", searchable: true },
				],
			},
		],
		taxonomies: [
			{
				name: "category",
				label: "Categories",
				labelSingular: "Category",
				hierarchical: true,
				collections: ["posts"],
				terms: categoryTerms,
			},
			{
				name: "tag",
				label: "Tags",
				labelSingular: "Tag",
				hierarchical: false,
				collections: ["posts"],
				terms: [],
			},
		],
		bylines: [
			{
				id: "byline-joost",
				slug: "joost-de-valk",
				displayName: "Joost de Valk",
			},
		],
		menus: [
			{
				name: "primary",
				label: "Primary Navigation",
				items: [
					{ type: "custom", label: "Home", url: "/" },
					{ type: "custom", label: "Blog", url: "/posts" },
					{ type: "custom", label: "About", url: "/pages/about" },
				],
			},
		],
		widgetAreas: [],
		sections: [],
		content: {
			posts,
			pages: [
				{
					id: "about",
					slug: "about",
					status: "published",
					data: {
						title: "About",
						content: [
							{
								_type: "block",
								style: "normal",
								children: [
									{
										_type: "span",
										text: "I'm Joost de Valk, founder of Yoast SEO. I write about SEO, WordPress, open source, AI, and building things on the web.",
									},
								],
							},
						],
					},
				},
			],
		},
	};

	const outputPath = "seed/imported.json";
	writeFileSync(outputPath, JSON.stringify(seed, null, "\t"), "utf-8");
	console.log(`\nDone! ${posts.length} posts imported, ${skipped} skipped.`);
	console.log(`Categories: ${categoryTerms.map((t) => t.label).join(", ")}`);
	console.log(`\nSeed file written to: ${outputPath}`);
	console.log(`Run: npx emdash seed ${outputPath}`);
}

function slugify(str) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

main();
