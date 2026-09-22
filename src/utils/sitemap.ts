import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import importedDates from '../data/imported-post-dates.json' with { type: 'json' };

type Revision = { hash: string; date: string; path: string; previousPath: string };
export type ContentLastmod = { date: Date; source: 'git' | 'wordpress' | 'updatedDate' | 'publication-fallback'; commit?: string; assumedTime?: boolean };

// Importing existing articles does not establish their original edit time.
// All other bulk commits are inspected per file, including image conversions.
const NON_EDITORIAL_COMMITS = new Set(['a3f7e33']);
const cache = new Map<string, ContentLastmod | null>();

function git(args: string[]): string {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).trim();
}

function normalizeText(value: unknown): string | null {
    return typeof value === 'string'
        ? value
              .replace(/<\/?(?:em|strong|b|i)\b[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim()
        : null;
}

function editorialContent(raw: string, convertedImages = false): string {
    const { data, content } = matter(raw);
    // In the historic format conversion, ignore only image URL extensions.
    // Changes to prose or code in the same commit still count as real edits.
    const comparableContent = convertedImages
        ? content
              .replace(/(!\[[^\]]*\]\([^\s)]+)\.(?:png|jpe?g|webp)(?=[\s)])/gi, '$1.image')
              .replace(/(<img\b[^>]*\bsrc=["'][^"']+)\.(?:png|jpe?g|webp)(?=["'])/gi, '$1.image')
        : content;
    // Preserve whitespace inside fenced code; reflowing prose is not an update.
    const body = comparableContent
        .replace(/\r\n/g, '\n')
        .split(/(^[ \t]*(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*(?:`{3,}|~{3,})[ \t]*$)/m)
        .map((part, index) =>
            index % 2
                ? part
                : part
                      .replace(/<!--[^]*?-->/g, '')
                      .replace(/\s+/g, ' ')
                      .trim()
        );
    return JSON.stringify({
        title: normalizeText(data.title),
        excerpt: normalizeText(data.excerpt),
        seoTitle: normalizeText(data.seo?.title),
        seoDescription: normalizeText(data.seo?.description),
        draft: !!data.draft,
        body,
        youtubeId: data.youtubeId ?? null,
        videoUrl: data.videoUrl ?? null,
        videoPressId: data.videoPressId ?? null,
        duration: data.duration ?? null
    });
}

function history(filePath: string): Revision[] {
    return git(['log', '--follow', '--diff-filter=ACMR', '--format=%x1e%H%x09%cI', '--name-status', '--', filePath])
        .split('\x1e')
        .filter(Boolean)
        .map((part) => {
            const [header, ...lines] = part.trim().split('\n');
            const [hash, date] = header.split('\t');
            const status = lines.find((line) => /^[ACMR][0-9]*\t/.test(line));
            if (!status) throw new Error(`Cannot read content history for ${filePath} at ${hash}`);
            const [, firstPath, secondPath] = status.split('\t');
            return { hash, date, path: secondPath ?? firstPath, previousPath: firstPath };
        });
}

function gitContentLastmod(filePath: string): ContentLastmod | null {
    const revisions = history(filePath);
    for (let i = 0; i < revisions.length; i++) {
        const revision = revisions[i];
        if (NON_EDITORIAL_COMMITS.has(revision.hash.slice(0, 7))) continue;
        const convertedImages = revision.hash.startsWith('bd0591c');
        const current = editorialContent(git(['show', `${revision.hash}:${revision.path}`]), convertedImages);
        const parentPath = `${revision.hash}^:${revision.previousPath}`;
        const parent = spawnSync('git', ['show', parentPath], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
        if (parent.error) throw parent.error;
        // A delete/restore round trip must be compared with the last stored version.
        const previous = revisions[i + 1];
        const prior = parent.status === 0 ? parent.stdout : previous ? git(['show', `${previous.hash}:${previous.path}`]) : null;
        if (prior === null || current !== editorialContent(prior, convertedImages)) {
            return { date: new Date(revision.date), source: 'git', commit: revision.hash };
        }
    }
    return null;
}

const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });

function dateOnly(value: unknown): boolean {
    const iso = value instanceof Date ? value.toISOString() : String(value);
    return /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/.test(iso);
}

/** User-approved default for saved dates whose original time was not retained. */
export function dateAtEightPM(value: unknown): Date {
    const iso = value instanceof Date ? value.toISOString() : String(value);
    if (!dateOnly(value)) return new Date(iso);
    const day = iso.slice(0, 10);
    const utc = new Date(`${day}T20:00:00Z`);
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hourCycle: 'h23' }).format(utc));
    return new Date(utc.getTime() - (hour - 20) * 60 * 60 * 1000);
}

export function getContentLastmod(filePath: string): ContentLastmod | null {
    const key = resolve(filePath);
    if (cache.has(key)) return cache.get(key)!;
    const { data } = matter(readFileSync(filePath, 'utf8'));
    let result = gitContentLastmod(filePath);
    const slug = filePath.match(/(?:^|\/)src\/content\/blog\/([^/]+)\/index\.mdx?$/)?.[1];
    const original = slug ? (importedDates.dates as Record<string, string>)[slug] : null;
    if (original && (!result || new Date(original) > result.date)) result = { date: new Date(original), source: 'wordpress' };
    if (data.updatedDate) {
        const manual = dateAtEightPM(data.updatedDate);
        // On the same day, keep a recovered commit time instead of assuming 20:00.
        if (!result || (dateOnly(data.updatedDate) ? localDate.format(manual) > localDate.format(result.date) : manual > result.date))
            result = { date: manual, source: 'updatedDate' };
    }
    if (data.publishDate) {
        const originalPublication = slug ? (importedDates.publicationDates as Record<string, string>)[slug] : null;
        const savedDay = (data.publishDate instanceof Date ? data.publishDate.toISOString() : String(data.publishDate)).slice(0, 10);
        const recoveredPublication = originalPublication && localDate.format(new Date(originalPublication)) === savedDay;
        const published = recoveredPublication ? new Date(originalPublication) : dateAtEightPM(data.publishDate);
        if (!result || (dateOnly(data.publishDate) ? localDate.format(published) > localDate.format(result.date) : published > result.date))
            result = { date: published, source: 'publication-fallback', assumedTime: !recoveredPublication && dateOnly(data.publishDate) };
    }
    if (result && !Number.isFinite(result.date.getTime())) throw new Error(`Invalid lastmod for ${filePath}`);
    cache.set(key, result);
    return result;
}
