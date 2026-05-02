#!/usr/bin/env node

/**
 * Downloads YouTube thumbnails locally for all videos that have a youtubeId.
 * Tries sizes in order: maxresdefault → sddefault → hqdefault → mqdefault
 * Saves to src/content/videos/{slug}/images/thumbnail.jpg
 * Updates featureImage frontmatter if not already pointing to a local file.
 *
 * Usage: node scripts/download-video-thumbs.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const rootDir = process.cwd();
const videosDir = path.join(rootDir, 'src', 'content', 'videos');

const SIZES = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];

async function fetchThumb(youtubeId) {
  for (const size of SIZES) {
    const url = `https://img.youtube.com/vi/${youtubeId}/${size}.jpg`;
    const res = await fetch(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      return { buffer: Buffer.from(buf), size };
    }
  }
  return null;
}

async function main() {
  const slugs = await fs.readdir(videosDir);
  let downloaded = 0, skipped = 0, failed = 0;

  for (const slug of slugs) {
    const dir = path.join(videosDir, slug);
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const mdPath = path.join(dir, 'index.md');
    const raw = await fs.readFile(mdPath, 'utf8').catch(() => null);
    if (!raw) continue;

    const { data, content } = matter(raw);
    if (!data.youtubeId) continue;

    const imagesDir = path.join(dir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    const destPath = path.join(imagesDir, 'thumbnail.jpg');

    const alreadyExists = await fs.access(destPath).then(() => true).catch(() => false);
    if (alreadyExists) {
      // Still update frontmatter if it points elsewhere
      if (!data.featureImage || data.featureImage.startsWith('http')) {
        data.featureImage = './images/thumbnail.jpg';
        await fs.writeFile(mdPath, matter.stringify(content, data));
      }
      skipped++;
      continue;
    }

    const result = await fetchThumb(data.youtubeId);
    if (!result) {
      console.warn(`  FAILED: ${slug} (no size worked)`);
      failed++;
      continue;
    }

    await fs.writeFile(destPath, result.buffer);
    console.log(`  ${slug} → ${result.size}.jpg`);

    if (!data.featureImage || data.featureImage.startsWith('http')) {
      data.featureImage = './images/thumbnail.jpg';
      await fs.writeFile(mdPath, matter.stringify(content, data));
    }

    downloaded++;
  }

  console.log(`\nDone. Downloaded: ${downloaded}, Skipped (already local): ${skipped}, Failed: ${failed}`);
}

main().catch(err => { console.error(err); process.exit(1); });
