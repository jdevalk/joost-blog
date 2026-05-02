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
  const cueBlocks = vttText.split(/\n\n+/).slice(1);
  const entries = [];

  for (const block of cueBlocks) {
    const lines = block.trim().split('\n');
    if (!lines[0] || !lines[0].includes('-->')) continue;

    const tsMatch = lines[0].match(/^(\d{2}):(\d{2}):(\d{2})\.\d{3}/);
    if (!tsMatch) continue;

    const totalSecs = parseInt(tsMatch[1]) * 3600 + parseInt(tsMatch[2]) * 60 + parseInt(tsMatch[3]);

    // Take the clean line (no inline word-timing tags)
    const cleanLines = lines.slice(1).filter(l => l.trim() && !l.includes('<c>'));
    if (cleanLines.length === 0) continue;

    const text = cleanLines[cleanLines.length - 1]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
      .replace(/>{2,}/g, '')
      .trim();
    if (!text) continue;

    entries.push({ secs: totalSecs, text });
  }

  // Remove rolling-caption duplicates (each line appears as prefix of the next)
  const deduped = [];
  for (let i = 0; i < entries.length; i++) {
    const next = entries[i + 1];
    if (next && (next.text.startsWith(entries[i].text) || entries[i].text === next.text)) continue;
    deduped.push(entries[i]);
  }

  // Group into ~30-second paragraphs prefixed with [M:SS] or [H:MM:SS]
  const grouped = [];
  let groupStart = null;
  let groupText = [];
  for (const e of deduped) {
    if (groupStart === null) groupStart = e.secs;
    if (e.secs - groupStart > 30 && groupText.length > 0) {
      const h = Math.floor(groupStart / 3600);
      const m = Math.floor((groupStart % 3600) / 60);
      const s = groupStart % 60;
      const ts = h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
      grouped.push(`[${ts}] ${groupText.join(' ')}`);
      groupStart = e.secs;
      groupText = [];
    }
    groupText.push(e.text);
  }
  if (groupText.length) {
    const h = Math.floor(groupStart / 3600);
    const m = Math.floor((groupStart % 3600) / 60);
    const s = groupStart % 60;
    const ts = h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
    grouped.push(`[${ts}] ${groupText.join(' ')}`);
  }

  return grouped.join('\n\n');
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
