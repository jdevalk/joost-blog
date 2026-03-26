import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import matter from 'gray-matter';

const rootDir = process.cwd();
const contentDir = path.join(rootDir, 'src', 'content');
const outputJsonPath = path.join(rootDir, 'src', 'generated', 'nlweb-index.json');
const outputModulePath = path.join(rootDir, 'src', 'generated', 'nlweb-index.mjs');
const embeddingCachePath = path.join(rootDir, 'src', 'generated', 'embedding-cache.json');

// Cloudflare Workers AI config for embeddings
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || 'c53e64d218c83cb220b523a637ffd079';
const CF_API_TOKEN = process.env.CF_API_TOKEN || 'cfut_6j0n95cS6YyGuKHIBC8k02gwVYhlOBboAe4z7S4g756be1c8';
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const MAX_EMBED_CHARS = 2000; // ~500 tokens, enough to capture the gist

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

const transcriptDir = path.join(rootDir, 'src', 'generated', 'transcripts');

async function loadTranscript(youtubeId) {
  if (!youtubeId) return '';
  try {
    const text = await fs.readFile(path.join(transcriptDir, `${youtubeId}.txt`), 'utf8');
    return text.trim();
  } catch {
    return '';
  }
}

function buildRecord(contentType, filePath, parsedFile, transcript) {
  const data = parsedFile.data || {};
  const title = data.title || path.basename(path.dirname(filePath)) || path.parse(filePath).name;
  const url = buildUrl(contentType, filePath, data);
  const bodyText = stripMarkdown(parsedFile.content);
  // Append transcript to body text for search indexing
  const fullText = transcript ? `${bodyText}\n\nTranscript:\n${transcript}` : bodyText;
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
    text: fullText,
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

// ============================================================
// Embedding generation with cache
// ============================================================

function contentHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function embeddingInput(record) {
  // Combine title, description, keywords, and beginning of body for embedding
  const parts = [record.name, record.description, record.keywords.join(', '), record.text.slice(0, MAX_EMBED_CHARS)];
  return parts.join('\n');
}

async function loadEmbeddingCache() {
  try {
    const raw = await fs.readFile(embeddingCachePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveEmbeddingCache(cache) {
  await fs.writeFile(embeddingCachePath, JSON.stringify(cache), 'utf8');
}

async function fetchEmbeddings(texts) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${EMBEDDING_MODEL}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: texts }),
    }
  );

  const data = await res.json();
  if (!data.success || !data.result?.data) {
    throw new Error(`Embedding API error: ${JSON.stringify(data.errors)}`);
  }
  return data.result.data; // array of float arrays
}

async function generateEmbeddings(records) {
  const cache = await loadEmbeddingCache();
  const toEmbed = []; // { index, text, hash }
  const embeddings = new Array(records.length);

  // Check cache for each record
  for (let i = 0; i < records.length; i++) {
    const text = embeddingInput(records[i]);
    const hash = contentHash(text);

    if (cache[records[i].id]?.hash === hash) {
      embeddings[i] = cache[records[i].id].embedding;
    } else {
      toEmbed.push({ index: i, text, hash, id: records[i].id });
    }
  }

  const cached = records.length - toEmbed.length;
  if (cached > 0) console.log(`  Embedding cache: ${cached} cached, ${toEmbed.length} to generate`);

  // Batch embed in chunks of 20 (API limit)
  const BATCH_SIZE = 20;
  for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + BATCH_SIZE);
    const texts = batch.map(b => b.text);

    console.log(`  Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toEmbed.length / BATCH_SIZE)} (${batch.length} items)...`);
    const vectors = await fetchEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      embeddings[batch[j].index] = vectors[j];
      cache[batch[j].id] = { hash: batch[j].hash, embedding: vectors[j] };
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < toEmbed.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  await saveEmbeddingCache(cache);
  return embeddings;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const records = [];

  for (const contentType of CONTENT_TYPES) {
    const dir = path.join(contentDir, contentType.dir);
    const files = await walk(dir);

    for (const filePath of files) {
      const raw = await fs.readFile(filePath, 'utf8');
      const parsedFile = matter(raw);

      // Skip draft content — it should never appear in the public index
      if (parsedFile.data.draft === true) {
        console.log(`  Skipping draft: ${path.relative(contentDir, filePath)}`);
        continue;
      }

      const transcript = await loadTranscript(parsedFile.data.youtubeId);
      records.push(buildRecord(contentType, filePath, parsedFile, transcript));
    }
  }

  records.sort((a, b) => (b.datePublished || '').localeCompare(a.datePublished || ''));

  // Generate embeddings
  console.log(`Generating embeddings for ${records.length} records...`);
  const embeddings = await generateEmbeddings(records);

  // Attach embeddings to records
  for (let i = 0; i < records.length; i++) {
    records[i].embedding = embeddings[i];
  }

  await fs.mkdir(path.dirname(outputJsonPath), { recursive: true });
  const json = JSON.stringify(records, null, 2) + '\n';
  await fs.writeFile(outputJsonPath, json, 'utf8');
  await fs.writeFile(outputModulePath, `export default ${json};`, 'utf8');

  const sizeKB = Math.round(Buffer.byteLength(json) / 1024);
  console.log(`Generated NLWeb index with ${records.length} records (${sizeKB}KB) at ${path.relative(rootDir, outputJsonPath)} and ${path.relative(rootDir, outputModulePath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
