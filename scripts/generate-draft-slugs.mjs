import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDir = path.resolve('src/content/blog');
const outputPath = path.resolve('public/_draft-slugs.json');

const drafts = {};

for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
	let mdPath = null;
	if (entry.isDirectory()) {
		const md = path.join(blogDir, entry.name, 'index.md');
		const mdx = path.join(blogDir, entry.name, 'index.mdx');
		mdPath = fs.existsSync(md) ? md : fs.existsSync(mdx) ? mdx : null;
	} else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
		mdPath = path.join(blogDir, entry.name);
	}

	if (!mdPath || !fs.existsSync(mdPath)) continue;

	const { data } = matter(fs.readFileSync(mdPath, 'utf-8'));
	if (data.draft && data.password) {
		const slug = entry.isDirectory() ? entry.name : entry.name.replace(/\.mdx?$/, '');
		drafts[slug] = data.password;
	}
}

fs.writeFileSync(outputPath, JSON.stringify(drafts));
console.log(`Generated ${outputPath} with ${Object.keys(drafts).length} protected draft(s)`);
