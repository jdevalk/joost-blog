import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import Database from 'better-sqlite3';

const rootDir = process.cwd();
const dbPath = path.join(rootDir, 'data.db');
const outputJsonPath = path.join(rootDir, 'src', 'generated', 'nlweb-index.json');
const outputModulePath = path.join(rootDir, 'src', 'generated', 'nlweb-index.mjs');
const embeddingCachePath = path.join(rootDir, 'src', 'generated', 'embedding-cache.json');

// Cloudflare Workers AI config for embeddings
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || 'c53e64d218c83cb220b523a637ffd079';
const CF_API_TOKEN = process.env.CF_API_TOKEN || 'cfut_6j0n95cS6YyGuKHIBC8k02gwVYhlOBboAe4z7S4g756be1c8';
const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
const MAX_EMBED_CHARS = 2000; // ~500 tokens, enough to capture the gist

// ============================================================
// Portable Text extraction
// ============================================================

function extractTextFromPortableText(content) {
  if (!content) return '';
  let blocks;
  try { blocks = typeof content === 'string' ? JSON.parse(content) : content; } catch { return ''; }
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter(b => b._type === 'block' && Array.isArray(b.children))
    .map(b => b.children.filter(c => c._type === 'span' && typeof c.text === 'string').map(c => c.text).join(''))
    .join(' ');
}

// ============================================================
// Database queries
// ============================================================

function queryPosts(db) {
  return db.prepare(
    `SELECT id, slug, title, content, excerpt, published_at FROM ec_posts WHERE status = 'published' AND deleted_at IS NULL`
  ).all();
}

function queryPages(db) {
  return db.prepare(
    `SELECT id, slug, title, content, published_at FROM ec_pages WHERE status = 'published' AND deleted_at IS NULL`
  ).all();
}

function queryVideos(db) {
  return db.prepare(
    `SELECT id, slug, title, content, excerpt, transcript, published_at, duration FROM ec_videos WHERE status = 'published' AND deleted_at IS NULL`
  ).all();
}

function queryCategories(db) {
  const rows = db.prepare(
    `SELECT ct.entry_id, GROUP_CONCAT(t.label) as categories
     FROM content_taxonomies ct
     JOIN taxonomies t ON ct.taxonomy_id = t.id
     WHERE ct.collection = 'posts' AND t.name = 'category'
     GROUP BY ct.entry_id`
  ).all();

  const map = {};
  for (const row of rows) {
    map[row.entry_id] = row.categories ? row.categories.split(',') : [];
  }
  return map;
}

// ============================================================
// Record building
// ============================================================

function buildPostRecord(row, categoryMap) {
  const plainText = extractTextFromPortableText(row.content);
  const excerpt = row.excerpt || plainText.slice(0, 280);
  const categories = categoryMap[row.id] || [];

  return {
    id: `posts:${row.slug}`,
    url: `/posts/${row.slug}/`,
    site: 'joost.blog',
    name: row.title,
    type: 'BlogPosting',
    description: excerpt,
    datePublished: row.published_at || null,
    keywords: categories,
    searchWeight: 1.0,
    text: plainText,
    schema_object: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: row.title,
      url: `/posts/${row.slug}/`,
      description: excerpt,
      datePublished: row.published_at || null,
      keywords: categories
    }
  };
}

function buildPageRecord(row) {
  const plainText = extractTextFromPortableText(row.content);
  const excerpt = plainText.slice(0, 280);

  return {
    id: `pages:${row.slug}`,
    url: `/${row.slug}/`,
    site: 'joost.blog',
    name: row.title,
    type: 'WebPage',
    description: excerpt,
    datePublished: row.published_at || null,
    keywords: [],
    searchWeight: 1.2,
    text: plainText,
    schema_object: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      headline: row.title,
      url: `/${row.slug}/`,
      description: excerpt,
      datePublished: row.published_at || null,
      keywords: []
    }
  };
}

function buildVideoRecord(row) {
  const plainText = extractTextFromPortableText(row.content);
  const transcript = row.transcript || '';
  const fullText = transcript ? `${plainText}\n\nTranscript:\n${transcript}` : plainText;
  const excerpt = row.excerpt || plainText.slice(0, 280);

  return {
    id: `videos:${row.slug}`,
    url: `/videos/${row.slug}/`,
    site: 'joost.blog',
    name: row.title,
    type: 'VideoObject',
    description: excerpt,
    datePublished: row.published_at || null,
    keywords: [],
    searchWeight: 0.5,
    text: fullText,
    schema_object: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      headline: row.title,
      url: `/videos/${row.slug}/`,
      description: excerpt,
      datePublished: row.published_at || null,
      keywords: []
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
  const db = new Database(dbPath, { readonly: true });
  const records = [];

  // Fetch categories for posts
  const categoryMap = queryCategories(db);

  // Posts
  const posts = queryPosts(db);
  for (const row of posts) {
    records.push(buildPostRecord(row, categoryMap));
  }
  console.log(`  Found ${posts.length} published posts`);

  // Pages
  const pages = queryPages(db);
  for (const row of pages) {
    records.push(buildPageRecord(row));
  }
  console.log(`  Found ${pages.length} published pages`);

  // Videos
  const videos = queryVideos(db);
  for (const row of videos) {
    records.push(buildVideoRecord(row));
  }
  console.log(`  Found ${videos.length} published videos`);

  db.close();

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
