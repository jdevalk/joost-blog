import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDir = path.resolve('src/content/blog');
const outputPath = path.resolve('public/_draft-slugs.json');

const drafts = {};

for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
	const mdPath = entry.isDirectory()
		? path.join(blogDir, entry.name, 'index.md')
		: entry.name.endsWith('.md') ? path.join(blogDir, entry.name) : null;

	if (!mdPath || !fs.existsSync(mdPath)) continue;

	const { data } = matter(fs.readFileSync(mdPath, 'utf-8'));
	if (data.draft && data.password) {
		const slug = entry.isDirectory() ? entry.name : entry.name.replace(/\.md$/, '');
		drafts[slug] = data.password;
	}
}

fs.writeFileSync(outputPath, JSON.stringify(drafts));
console.log(`Generated ${outputPath} with ${Object.keys(drafts).length} protected draft(s)`);
