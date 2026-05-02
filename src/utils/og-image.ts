import { chromium, type Browser } from 'playwright';
import { readFileSync } from 'node:fs';

const OG_WIDTH  = 1200;
const OG_HEIGHT = 675;

const fontsDir = process.cwd() + '/public/fonts/';

let portraitDataUrl: string | null = null;
function getPortrait(): string {
    if (!portraitDataUrl) {
        const buf = readFileSync(process.cwd() + '/src/assets/images/joost-profile.jpg');
        portraitDataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
    }
    return portraitDataUrl;
}

// Design tokens — slate palette
const paper   = '#e4e2dc';
const ink     = '#1f2530';
const inkSoft = '#4e5666';
const indigo  = '#2c3447';
const ox      = '#4a6480';
const amber   = '#e08a5a';

// Reuse one browser instance across requests
let browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
    if (!browser || !browser.isConnected()) {
        browser = await chromium.launch();
    }
    return browser;
}

function fontFaces(): string {
    return `
        @font-face {
            font-family: 'DomaineDisplay';
            font-weight: 500;
            font-style: normal;
            src: url('file://${fontsDir}DomaineDisplay-Medium.otf');
        }
        @font-face {
            font-family: 'DomaineDisplay';
            font-weight: 500;
            font-style: italic;
            src: url('file://${fontsDir}DomaineDisplay-MediumItalic.otf');
        }
        @font-face {
            font-family: 'Pitch';
            font-weight: 400;
            font-style: normal;
            src: url('file://${fontsDir}Pitch-Regular.otf');
        }
    `;
}

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y} · ${m} · ${d}`;
}

export interface OgImageOptions {
    title: string;
    category?: string;
    publishDate?: Date;
    readingTime?: number;
    articleNumber?: number;
    isFeatured?: boolean;
}

export async function generateOgImage(opts: OgImageOptions): Promise<Buffer> {
    const { title, category, publishDate, readingTime, articleNumber, isFeatured } = opts;

    const issueLabel = articleNumber ? `No. ${String(articleNumber).padStart(3, '0')}` : String(publishDate?.getFullYear() ?? new Date().getFullYear());
    const dateStr    = publishDate ? formatDate(publishDate) : String(new Date().getFullYear());
    const kicker     = (category ?? 'JOOST.BLOG').toUpperCase();
    const isArticle  = !!(publishDate || readingTime || articleNumber);
    const articleType = isFeatured ? 'FEATURED ARTICLE' : 'ARTICLE';
    const readStr    = isArticle
        ? (readingTime ? `${articleType} · ${readingTime} MIN READ` : articleType)
        : null;
    const fontSize = title.length > 60 ? '78px' : '96px';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${fontFaces()}
    body {
        width: ${OG_WIDTH}px;
        height: ${OG_HEIGHT}px;
        background: ${paper};
        color: ${ink};
        font-family: 'DomaineDisplay', serif;
        position: relative;
        overflow: hidden;
    }
    /* Top rail */
    .rail {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 54px;
        border-bottom: 1px solid ${ink};
        display: flex;
        align-items: center;
        padding: 0 40px;
        font-family: 'Pitch', monospace;
        font-size: 14px;
        letter-spacing: 0.18em;
        color: ${ox};
    }
    .rail-center { flex: 1; text-align: center; color: ${ink}; }
    .rail-right  { flex: 1; text-align: right; }
    .rail-left   { flex: 1; }
    /* Kicker */
    .kicker {
        position: absolute;
        top: 92px; left: 48px;
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: 'Pitch', monospace;
        font-size: 16px;
        letter-spacing: 0.18em;
        color: ${indigo};
    }
    .kicker-rule { width: 60px; height: 1px; background: ${ink}; flex-shrink: 0; }
    /* Title */
    .title {
        position: absolute;
        top: 148px; left: 48px;
        width: 952px;
        font-family: 'DomaineDisplay', serif;
        font-weight: 500;
        font-size: ${fontSize};
        line-height: 1.0;
        letter-spacing: -0.03em;
        color: ${ink};
    }
    /* Byline */
    .byline {
        position: absolute;
        right: 40px; bottom: 40px;
        display: flex;
        align-items: flex-end;
        gap: 18px;
    }
    .byline-text {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-family: 'DomaineDisplay', serif;
        font-weight: 500;
        font-style: italic;
        font-size: 22px;
        color: ${ink};
        padding-bottom: 6px;
    }
    .byline-name { color: ${indigo}; }
    .byline-url {
        font-family: 'Pitch', monospace;
        font-style: normal;
        font-size: 14px;
        letter-spacing: 0.18em;
        color: ${inkSoft};
        margin-top: 6px;
    }
    .portrait {
        width: 120px; height: 150px;
        border: 1px solid ${ink};
        object-fit: cover;
        display: block;
    }
</style>
</head>
<body>
    <div class="rail">
        <span class="rail-left">JOOST.BLOG · ${issueLabel.toUpperCase()}</span>
        <span class="rail-center">— ${kicker} —</span>
        <span class="rail-right">${dateStr}</span>
    </div>

    ${readStr ? `
    <div class="kicker">
        <div class="kicker-rule"></div>
        <span>${readStr}</span>
    </div>` : ''}

    <div class="title">${title}</div>

    <div class="byline">
        <div class="byline-text">
            <div>by <span class="byline-name">Joost de Valk</span></div>
            <div class="byline-url">JOOST.BLOG / READ →</div>
        </div>
        <img class="portrait" src="${getPortrait()}" />
    </div>
</body>
</html>`;

    const b   = await getBrowser();
    const page = await b.newPage();
    await page.setViewportSize({ width: OG_WIDTH, height: OG_HEIGHT });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    await page.close();
    return buf as Buffer;
}

export async function generateHomepageOgImage(): Promise<Buffer> {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${fontFaces()}
    body {
        width: ${OG_WIDTH}px;
        height: ${OG_HEIGHT}px;
        background: #2c3447;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        font-family: 'DomaineDisplay', serif;
        overflow: hidden;
    }
    .avatar-wrap {
        width: 224px; height: 224px;
        border-radius: 50%;
        border: 1px solid rgba(232,227,214,0.08);
        display: flex; align-items: center; justify-content: center;
    }
    .avatar-inner {
        width: 202px; height: 202px;
        border-radius: 50%;
        border: 1px solid rgba(232,227,214,0.15);
        display: flex; align-items: center; justify-content: center;
    }
    .avatar {
        width: 180px; height: 180px;
        border-radius: 50%;
        border: 3px solid rgba(232,227,214,0.30);
        object-fit: cover;
    }
    .name {
        color: #e8e3d6;
        font-size: 44px;
        font-weight: 500;
        margin-top: 28px;
    }
    .subtitle {
        color: rgba(232,227,214,0.60);
        font-size: 22px;
        font-weight: 500;
        margin-top: 12px;
    }
    .domain {
        position: absolute;
        bottom: 30px; right: 40px;
        color: rgba(232,227,214,0.50);
        font-size: 20px;
        font-weight: 500;
    }
</style>
</head>
<body>
    <div class="avatar-wrap">
        <div class="avatar-inner">
            <img class="avatar" src="${getPortrait()}" />
        </div>
    </div>
    <div class="name">Joost de Valk</div>
    <div class="subtitle">Internet entrepreneur · Founder of Yoast · Investor</div>
    <div class="domain">joost.blog</div>
</body>
</html>`;

    const b   = await getBrowser();
    const page = await b.newPage();
    await page.setViewportSize({ width: OG_WIDTH, height: OG_HEIGHT });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    await page.close();
    return buf as Buffer;
}
