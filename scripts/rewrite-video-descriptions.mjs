#!/usr/bin/env node

/**
 * Rewrites video descriptions using Claude CLI.
 * Reads each video's YouTube description + transcript and generates a short,
 * first-person intro written as Joost de Valk.
 *
 * Usage: node scripts/rewrite-video-descriptions.mjs
 */

import { promises as fs } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import matter from 'gray-matter';

const rootDir = process.cwd();
const videosDir = path.join(rootDir, 'src', 'content', 'videos');
const transcriptsDir = path.join(rootDir, 'src', 'generated', 'transcripts');

const SYSTEM = `You are writing short video introductions for joost.blog, the personal blog of Joost de Valk (founder of Yoast SEO, now running Emilia Capital). Write in first person as Joost. Be direct and concise. No em-dashes. No marketing fluff. No links. No references to the interviewer, podcast name, or platform. Focus on what the viewer will learn or hear from Joost in the video. 2-5 sentences max.`;

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

async function rewrite(title, youtubeDescription, transcript) {
  const transcriptExcerpt = transcript
    ? transcript.replace(/\[\d+:\d{2}(?::\d{2})?\]\s*/g, ' ').slice(0, 3000)
    : '';

  const prompt = `Video title: ${title}

YouTube description:
${youtubeDescription}

${transcriptExcerpt ? `Transcript excerpt (first ~3000 chars):\n${transcriptExcerpt}` : ''}

Write a short intro for this video as Joost de Valk. First person. 2-5 sentences. No links, no interviewer names, no platform references.`;

  const result = execSync(
    `claude --print --system-prompt ${JSON.stringify(SYSTEM)} --bare`,
    {
      input: prompt,
      encoding: 'utf8',
      timeout: 60000,
    }
  ).trim();

  return result;
}

async function main() {
  const files = await walk(videosDir);
  let updated = 0, skipped = 0, failed = 0;

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);

    if (!data.youtubeId) {
      skipped++;
      continue;
    }

    console.log(`Rewriting: ${data.title || data.youtubeId}`);

    try {
      // Load transcript if available
      const transcriptPath = path.join(transcriptsDir, `${data.youtubeId}.txt`);
      let transcript = '';
      try {
        transcript = await fs.readFile(transcriptPath, 'utf8');
      } catch {}

      const newBody = await rewrite(data.title || '', content.trim(), transcript);

      if (!newBody) {
        console.log('  SKIP: empty result');
        skipped++;
        continue;
      }

      const newContent = matter.stringify(newBody + '\n', data);
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(`  OK`);
      updated++;
    } catch (err) {
      console.log(`  FAILED: ${err.message?.split('\n')[0] || err}`);
      failed++;
    }

    // Brief pause between calls
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (no YouTube ID), ${failed} failed`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
