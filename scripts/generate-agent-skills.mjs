#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_SRC = join(__dirname, '../../skills');
const SKILLS_DEST = join(__dirname, '../public/.well-known/agent-skills');
const SITE_URL = 'https://joost.blog';

const SKILL_NAMES = [
    'astro-seo',
    'emdash-github-actions',
    'github-profile',
    'github-repo',
    'metadata-check',
    'readability-check',
    'wp-github-actions',
    'wp-readme-optimizer',
];

const srcAvailable = existsSync(SKILLS_SRC);
if (!srcAvailable) {
    console.log('  Skills source not found, rebuilding index from committed files.');
}

const skills = [];

for (const name of SKILL_NAMES) {
    const destDir = join(SKILLS_DEST, name);
    const destPath = join(destDir, 'SKILL.md');

    if (srcAvailable) {
        mkdirSync(destDir, { recursive: true });
        copyFileSync(join(SKILLS_SRC, name, 'SKILL.md'), destPath);
    }

    const content = readFileSync(destPath, 'utf-8');
    const { data } = matter(content);
    const description = String(data.description ?? '').trim().replace(/\s+/g, ' ').slice(0, 1024);
    const digest = 'sha256:' + createHash('sha256').update(content).digest('hex');

    skills.push({
        name,
        type: 'skill-md',
        description,
        url: `${SITE_URL}/.well-known/agent-skills/${name}/SKILL.md`,
        digest,
    });

    console.log(`  ✓ ${name}`);
}

mkdirSync(SKILLS_DEST, { recursive: true });
writeFileSync(
    join(SKILLS_DEST, 'index.json'),
    JSON.stringify({ $schema: 'https://agentskills.io/schema/index.json', skills }, null, 2)
);
console.log(`Generated agent-skills index with ${skills.length} skills`);
