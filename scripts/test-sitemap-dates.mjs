import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import test from 'node:test';
import { dateAtEightPM } from '../src/utils/sitemap.ts';

const moduleUrl = new URL('../src/utils/sitemap.ts', import.meta.url).href;
const post = 'src/content/blog/example/index.md';
const content = (body = 'Original article.', extra = '') => `---\ntitle: Example\npublishDate: 2020-01-01\n${extra}---\n${body}\n`;

function repository(t) {
    const cwd = mkdtempSync(join(tmpdir(), 'sitemap-dates-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
    git('init', '-q');
    git('config', 'user.name', 'Sitemap test');
    git('config', 'user.email', 'sitemap@example.invalid');
    const write = (path, value) => { mkdirSync(dirname(join(cwd, path)), { recursive: true }); writeFileSync(join(cwd, path), value); };
    const commit = (date, message = 'Content change') => {
        git('add', '-A');
        execFileSync('git', ['commit', '-qm', message], { cwd, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
    };
    const read = (path = post) => JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', `import { getContentLastmod } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(getContentLastmod(process.argv[1])));`, path], { cwd, encoding: 'utf8' }));
    return { cwd, git, write, commit, read };
}

test('presentation-only changes do not hide an edit older than ten revisions', (t) => {
    const r = repository(t);
    r.write(post, content()); r.commit('2021-01-01T10:15:30Z');
    for (let day = 2; day <= 15; day++) {
        r.write(post, content('Original article.', `isFeatured: ${day % 2 === 0}\nfeatureImage: ./image-${day}.webp\n`));
        r.commit(`2021-01-${String(day).padStart(2, '0')}T10:00:00Z`);
    }
    assert.equal(r.read().date, '2021-01-01T10:15:30.000Z');
});

test('a mixed commit updates only the article with a meaningful edit', (t) => {
    const r = repository(t); const other = 'src/content/blog/other/index.md';
    r.write(post, content()); r.write(other, content()); r.commit('2021-01-01T10:00:00Z');
    r.write(post, content('An actual correction and [new link](https://example.org).'));
    r.write(other, content('Original article.', 'isFeatured: true\n'));
    r.commit('2021-02-02T11:12:13Z');
    assert.equal(r.read().date, '2021-02-02T11:12:13.000Z');
    assert.equal(r.read(other).date, '2021-01-01T10:00:00.000Z');
});

test('renaming a post and deleting/restoring it preserve its editorial date', (t) => {
    const r = repository(t); const renamed = post.replace('.md', '.mdx');
    r.write(post, content()); r.commit('2021-01-01T10:00:00Z');
    renameSync(join(r.cwd, post), join(r.cwd, renamed)); r.commit('2021-02-01T10:00:00Z');
    assert.equal(r.read(renamed).date, '2021-01-01T10:00:00.000Z');
    r.git('rm', renamed); r.commit('2021-03-01T10:00:00Z');
    r.write(renamed, content()); r.commit('2021-04-01T10:00:00Z');
    assert.equal(r.read(renamed).date, '2021-01-01T10:00:00.000Z');
});

test('code indentation changes count as content changes', (t) => {
    const r = repository(t);
    r.write(post, content('```python\nif ready:\n    run()\n```')); r.commit('2021-01-01T10:00:00Z');
    r.write(post, content('```python\nif ready:\n  run()\n```')); r.commit('2021-02-01T10:00:00Z');
    assert.equal(r.read().date, '2021-02-01T10:00:00.000Z');
});

test('missing times use 20:00 Amsterdam with the correct seasonal UTC offset', () => {
    assert.equal(dateAtEightPM('2026-02-25').toISOString(), '2026-02-25T19:00:00.000Z');
    assert.equal(dateAtEightPM(new Date('2025-07-10T00:00:00.000Z')).toISOString(), '2025-07-10T18:00:00.000Z');
    assert.equal(dateAtEightPM('2025-07-10T09:12:13+02:00').toISOString(), '2025-07-10T07:12:13.000Z');
});

test('an exact same-day update wins, but an assumed 20:00 does not replace Git evidence', (t) => {
    const r = repository(t);
    r.write(post, content('Original article.', 'updatedDate: 2021-01-01T12:30:00Z\n')); r.commit('2021-01-01T10:00:00Z');
    assert.equal(r.read().date, '2021-01-01T12:30:00.000Z');
    r.write(post, content('Original article.', 'updatedDate: 2021-01-01\n')); r.commit('2021-02-01T10:00:00Z');
    assert.equal(r.read().date, '2021-01-01T10:00:00.000Z');
});

test('a post without recorded history uses the approved publication fallback', (t) => {
    const r = repository(t);
    r.write('README.md', 'Fixture'); r.commit('2021-01-01T10:00:00Z');
    r.write(post, content());
    assert.deepEqual(r.read(), { date: '2020-01-01T19:00:00.000Z', source: 'publication-fallback', assumedTime: true });
});

test('copying a post under a new slug follows its source history', (t) => {
    const r = repository(t); const copied = 'src/content/blog/copied/index.md';
    r.write(post, content()); r.commit('2021-01-01T10:00:00Z');
    r.write(post, content('Original article.', 'isFeatured: false\n'));
    r.write(copied, content('Original article.', 'isFeatured: true\n'));
    r.commit('2021-02-01T10:00:00Z');
    assert.equal(r.read(copied).date, '2021-01-01T10:00:00.000Z');
});

test('verified WordPress modification times survive the import', (t) => {
    const r = repository(t); const imported = 'src/content/blog/automatically-convert-webp-files-to-png/index.md';
    r.write('README.md', 'Fixture'); r.commit('2021-01-01T10:00:00Z');
    r.write(imported, content());
    assert.deepEqual(r.read(imported), { date: '2024-02-14T20:05:39.000Z', source: 'wordpress' });
});

test('a known original publication time is preserved instead of assuming 20:00', (t) => {
    const r = repository(t); const imported = 'src/content/blog/blogging-about-not-seo/index.md';
    r.write('README.md', 'Fixture'); r.commit('2021-01-01T10:00:00Z');
    r.write(imported, content().replace('2020-01-01', '2017-01-14'));
    const result = r.read(imported);
    assert.equal(result.source, 'publication-fallback');
    assert.equal(result.assumedTime, false);
    assert.notEqual(result.date, '2017-01-14T19:00:00.000Z');
});
