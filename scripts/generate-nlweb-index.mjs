import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'src', 'content');
const outputJsonPath = path.join(rootDir, 'src', 'generated', 'nlweb-index.json');
const outputModulePath = path.join(rootDir, 'src', 'generated', 'nlweb-index.mjs');

const CONTENT_TYPES = [
  { dir: 'blog', type: 'BlogPosting', baseUrl: '/' },
  { dir: 'pages', type: 'WebPage', baseUrl: '/' },
  { dir: 'videos', type: 'VideoObject', baseUrl: '/videos/' }
];

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function stripMarkdown(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length > 1) return value[1];
  return String(value);
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }

    if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function buildUrl(contentType, filePath, frontmatter) {
  const relative = path.relative(path.join(contentDir, contentType.dir), filePath);
  const parsed = path.parse(relative);

  if (contentType.dir === 'pages') {
    const slug = frontmatter.slug || parsed.name;
    if (slug === 'index' || slug === 'home') return '/';
    return slug.startsWith('/') ? slug : `/${slug}/`;
  }

  const slug = path.basename(parsed.dir) === '' ? parsed.name : path.basename(parsed.dir);
  return `${contentType.baseUrl}${slug}/`;
}

function buildRecord(contentType, filePath, parsedFile) {
  const data = parsedFile.data || {};
  const title = data.title || path.basename(path.dirname(filePath)) || path.parse(filePath).name;
  const url = buildUrl(contentType, filePath, data);
  const bodyText = stripMarkdown(parsedFile.content);
  const excerpt = stripMarkdown(data.excerpt || bodyText.slice(0, 280));
  const categories = Array.isArray(data.categories)
    ? data.categories.map((value) => Array.isArray(value) ? value[0] : String(value))
    : [];

  return {
    id: `${contentType.dir}:${path.relative(contentDir, filePath)}`,
    url,
    site: 'joost.blog',
    name: title,
    type: contentType.type,
    description: excerpt,
    datePublished: normalizeDate(data.publishDate),
    keywords: categories,
    text: bodyText,
    schema_object: {
      '@context': 'https://schema.org',
      '@type': contentType.type,
      headline: title,
      url,
      description: excerpt,
      datePublished: normalizeDate(data.publishDate),
      keywords: categories
    }
  };
}

async function main() {
  const records = [];

  for (const contentType of CONTENT_TYPES) {
    const dir = path.join(contentDir, contentType.dir);
    const files = await walk(dir);

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsedFile = matter(raw);
      records.push(buildRecord(contentType, filePath, parsedFile));
    }
  }

  records.sort((a, b) => (b.datePublished || '').localeCompare(a.datePublished || ''));

  await fs.mkdir(path.dirname(outputJsonPath), { recursive: true });
  const json = JSON.stringify(records, null, 2) + '\n';
  await fs.writeFile(outputJsonPath, json, 'utf8');
  await fs.writeFile(outputModulePath, `export default ${json};`, 'utf8');

  console.log(`Generated NLWeb index with ${records.length} records at ${path.relative(rootDir, outputJsonPath)} and ${path.relative(rootDir, outputModulePath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
