#!/usr/bin/env node

/**
 * Fetches YouTube descriptions for all videos and updates markdown body text.
 * Only updates videos that have a youtubeId.
 *
 * Usage: node scripts/fetch-video-metadata.mjs
 */

import { promises as fs } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import matter from 'gray-matter';

const rootDir = process.cwd();
const videosDir = path.join(rootDir, 'src', 'content', 'videos');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) files.push(fullPath);
  }
  return files;
}

async function main() {
  const files = await walk(videosDir);
  let updated = 0, skipped = 0, failed = 0, noId = 0;

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    const youtubeId = data.youtubeId;

    if (!youtubeId) {
      noId++;
      continue;
    }

    console.log(`Fetching description: ${data.title || youtubeId}`);

    try {
      const description = execSync(
        `yt-dlp --print description "https://www.youtube.com/watch?v=${youtubeId}"`,
        { stdio: 'pipe', timeout: 30000 }
      ).toString().trim();

      if (!description) {
        console.log('  SKIP: empty description');
        skipped++;
        continue;
      }

      if (content.trim() === description) {
        console.log('  SKIP: unchanged');
        skipped++;
        continue;
      }

      // Rebuild file: frontmatter + new description body
      const newContent = matter.stringify(description + '\n', data);
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(`  OK: ${description.length} chars`);
      updated++;
    } catch (err) {
      console.log(`  FAILED: ${err.message?.split('\n')[0] || err}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed, ${noId} no YouTube ID`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
