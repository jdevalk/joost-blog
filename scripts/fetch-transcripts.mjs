#!/usr/bin/env node

/**
 * Fetches YouTube auto-generated transcripts for all videos in the content collection.
 * Caches transcripts so they're only fetched once per video.
 *
 * Requires: yt-dlp (brew install yt-dlp)
 *
 * Usage: node scripts/fetch-transcripts.mjs
 */

import { promises as fs } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import matter from 'gray-matter';

const rootDir = process.cwd();
const videosDir = path.join(rootDir, 'src', 'content', 'videos');
const cacheDir = path.join(rootDir, 'src', 'generated', 'transcripts');

function cleanVtt(vttText) {
  return vttText
    // Remove VTT header
    .replace(/^WEBVTT[\s\S]*?\n\n/, '')
    // Remove timestamps and positioning
    .replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}[^\n]*/g, '')
    // Remove VTT tags like <c> </c> <00:00:01.199>
    .replace(/<[^>]+>/g, '')
    // Remove duplicate lines (VTT repeats lines across cues)
    .split('\n')
    .map(line => line.trim())
    .filter((line, i, arr) => line && line !== arr[i - 1])
    .join(' ')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  await fs.mkdir(cacheDir, { recursive: true });

  const files = await walk(videosDir);
  let fetched = 0, cached = 0, failed = 0, noId = 0;

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);
    const youtubeId = data.youtubeId;

    if (!youtubeId) {
      noId++;
      continue;
    }

    const cachePath = path.join(cacheDir, `${youtubeId}.txt`);

    // Check cache
    try {
      await fs.access(cachePath);
      cached++;
      continue;
    } catch {
      // Not cached, fetch it
    }

    console.log(`Fetching transcript: ${data.title || youtubeId}`);

    try {
      const tmpPath = `/tmp/yt-transcript-${youtubeId}`;
      execSync(
        `yt-dlp --write-auto-sub --sub-lang en --sub-format vtt --skip-download -o "${tmpPath}" "https://www.youtube.com/watch?v=${youtubeId}"`,
        { stdio: 'pipe', timeout: 30000 }
      );

      const vttPath = `${tmpPath}.en.vtt`;
      const vttContent = await fs.readFile(vttPath, 'utf8');
      const transcript = cleanVtt(vttContent);

      await fs.writeFile(cachePath, transcript, 'utf8');
      // Clean up temp file
      await fs.unlink(vttPath).catch(() => {});

      const words = transcript.split(/\s+/).length;
      console.log(`  OK: ${words} words`);
      fetched++;
    } catch (err) {
      console.log(`  FAILED: ${err.message?.split('\n')[0] || err}`);
      // Write empty file to avoid retrying failed videos
      await fs.writeFile(cachePath, '', 'utf8');
      failed++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone: ${fetched} fetched, ${cached} cached, ${failed} failed, ${noId} no YouTube ID`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
