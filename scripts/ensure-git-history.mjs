import { execFileSync } from 'node:child_process';

// A shallow checkout makes its oldest commit look like it changed every file.
// Restore history before Astro reads per-file dates for the sitemap.
const isShallow = () =>
    execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' }).trim() === 'true';

if (isShallow()) {
    console.log('Fetching full Git history for sitemap lastmod dates...');
    execFileSync('git', ['fetch', '--unshallow', 'origin'], { stdio: 'inherit' });
    if (isShallow()) {
        throw new Error('Full Git history is required for accurate sitemap lastmod dates.');
    }
}
