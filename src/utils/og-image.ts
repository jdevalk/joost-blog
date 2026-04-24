import { readFileSync } from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';

const OG_WIDTH = 1200;
const OG_HEIGHT = 675;

// Design tokens — A2 Blocks/Specimen
const paper = '#f0eae2';
const ink = '#1a1410';
const inkSoft = '#5a4e3a';
const indigo = '#3a2a6c';
const ox = '#5e1224';

let frauncesNormal: Buffer | null = null;
let frauncesItalic: Buffer | null = null;
let jetbrainsMono: Buffer | null = null;
let portraitDataUrl: string | null = null;
let monaFont: Buffer | null = null;

function loadFonts() {
    if (!frauncesNormal) {
        frauncesNormal = readFileSync(process.cwd() + '/public/fonts/Fraunces-Light.ttf');
    }
    if (!frauncesItalic) {
        frauncesItalic = readFileSync(process.cwd() + '/public/fonts/Fraunces-LightItalic.ttf');
    }
    if (!jetbrainsMono) {
        jetbrainsMono = readFileSync(process.cwd() + '/public/fonts/JetBrainsMono-Regular.ttf');
    }
    return { frauncesNormal, frauncesItalic, jetbrainsMono };
}

function loadMonaFont(): Buffer {
    if (!monaFont) {
        monaFont = readFileSync(process.cwd() + '/public/fonts/MonaSans-Bold.ttf');
    }
    return monaFont;
}

function loadPortrait(): string {
    if (!portraitDataUrl) {
        const buf = readFileSync(process.cwd() + '/src/assets/images/joost-profile.jpg');
        portraitDataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
    }
    return portraitDataUrl;
}

function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y} \u00b7 ${m} \u00b7 ${d}`;
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
    const { frauncesNormal, frauncesItalic, jetbrainsMono } = loadFonts();
    const portrait = loadPortrait();

    const issueLabel = articleNumber ? `No. ${articleNumber}` : String(publishDate?.getFullYear() ?? new Date().getFullYear());
    const dateStr = publishDate ? formatDate(publishDate) : String(new Date().getFullYear());
    const kicker = (category ?? 'JOOST.BLOG').toUpperCase();
    const isArticle = !!(publishDate || readingTime || articleNumber);
    const articleType = isFeatured ? 'FEATURED ARTICLE' : 'ARTICLE';
    const readStr = isArticle
        ? (readingTime ? `${articleType} \u00b7 ${readingTime} MIN READ` : articleType)
        : null;
    const fontSize = title.length > 60 ? 78 : 96;
    const titleLetterSpacing = fontSize === 96 ? '-3px' : '-2px';

    // Mono letter-spacing in px (0.2em equivalent)
    const monoSpacing11 = '2px';
    const monoSpacing12 = '2px';
    const monoSpacing10 = '2px';

    const card = {
        type: 'div',
        props: {
            style: {
                width: OG_WIDTH,
                height: OG_HEIGHT,
                background: paper,
                color: ink,
                position: 'relative',
                display: 'flex',
                fontFamily: 'Fraunces',
            },
            children: [
                // Top rail
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 54,
                            borderBottom: `1px solid ${ink}`,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 40px',
                            fontFamily: 'JetBrains Mono',
                            fontSize: 11,
                            letterSpacing: monoSpacing11,
                            color: ox,
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: { flex: 1, display: 'flex' },
                                    children: `JOOST.BLOG \u00b7 ${issueLabel.toUpperCase()}`,
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        color: ink,
                                    },
                                    children: `\u2014 ${kicker} \u2014`,
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                    },
                                    children: dateStr,
                                },
                            },
                        ],
                    },
                },
                // Kicker row
                ...(readStr ? [{
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            top: 92,
                            left: 48,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: { width: 60, height: 1, background: ink },
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        fontFamily: 'JetBrains Mono',
                                        fontSize: 12,
                                        letterSpacing: monoSpacing12,
                                        color: indigo,
                                    },
                                    children: readStr,
                                },
                            },
                        ],
                    },
                }] : []),
                // Title
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            left: 48,
                            width: 952,
                            top: 148,
                            fontFamily: 'Fraunces',
                            fontWeight: 300,
                            fontSize,
                            lineHeight: 0.96,
                            letterSpacing: titleLetterSpacing,
                            color: ink,
                        },
                        children: title,
                    },
                },
                // Byline + portrait
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            right: 40,
                            bottom: 40,
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 18,
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        fontFamily: 'Fraunces',
                                        fontStyle: 'italic',
                                        fontSize: 22,
                                        color: ink,
                                        paddingBottom: 6,
                                    },
                                    children: [
                                        {
                                            type: 'div',
                                            props: {
                                                style: { display: 'flex' },
                                                children: [
                                                    {
                                                        type: 'span',
                                                        props: {
                                                            style: { color: ink },
                                                            children: 'by\u00a0',
                                                        },
                                                    },
                                                    {
                                                        type: 'span',
                                                        props: {
                                                            style: { color: indigo },
                                                            children: 'Joost de Valk',
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                        {
                                            type: 'div',
                                            props: {
                                                style: {
                                                    fontFamily: 'JetBrains Mono',
                                                    fontStyle: 'normal',
                                                    fontSize: 10,
                                                    letterSpacing: monoSpacing10,
                                                    color: inkSoft,
                                                    marginTop: 6,
                                                },
                                                children: 'JOOST.BLOG / READ \u2192',
                                            },
                                        },
                                    ],
                                },
                            },
                            // Portrait
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        width: 120,
                                        height: 150,
                                        border: `1px solid ${ink}`,
                                        overflow: 'hidden',
                                        display: 'flex',
                                    },
                                    children: [
                                        {
                                            type: 'img',
                                            props: {
                                                src: portrait,
                                                style: {
                                                    width: 120,
                                                    height: 150,
                                                    objectFit: 'cover',
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        },
    };

    const svg = await satori(card, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
            {
                name: 'Fraunces',
                data: frauncesNormal!,
                style: 'normal',
                weight: 300,
            },
            {
                name: 'Fraunces',
                data: frauncesItalic!,
                style: 'italic',
                weight: 300,
            },
            {
                name: 'JetBrains Mono',
                data: jetbrainsMono!,
                style: 'normal',
                weight: 400,
            },
        ],
    });

    return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}

export async function generateHomepageOgImage(): Promise<Buffer> {
    const font = loadMonaFont();

    const avatarPath = process.cwd() + '/src/assets/images/joost-profile.jpg';
    const avatarSize = 180;
    const avatarBuffer = await sharp(avatarPath)
        .resize(avatarSize, avatarSize, { fit: 'cover' })
        .composite([
            {
                input: Buffer.from(
                    `<svg width="${avatarSize}" height="${avatarSize}"><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/></svg>`
                ),
                blend: 'dest-in',
            },
        ])
        .png()
        .toBuffer();
    const avatarBase64 = `data:image/png;base64,${avatarBuffer.toString('base64')}`;

    const ringOuter = avatarSize + 44;
    const ringInner = avatarSize + 22;

    const markup = {
        type: 'div',
        props: {
            style: {
                width: OG_WIDTH,
                height: OG_HEIGHT,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #4a1525 0%, #3a1a28 50%, #2e1220 100%)',
                position: 'relative',
            },
            children: [
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: ringOuter,
                            height: ringOuter,
                            borderRadius: ringOuter / 2,
                            border: '1px solid rgba(255,255,255,0.08)',
                            position: 'relative',
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: ringInner,
                                        height: ringInner,
                                        borderRadius: ringInner / 2,
                                        border: '1px solid rgba(255,255,255,0.15)',
                                    },
                                    children: [
                                        {
                                            type: 'img',
                                            props: {
                                                src: avatarBase64,
                                                style: {
                                                    width: avatarSize,
                                                    height: avatarSize,
                                                    borderRadius: avatarSize / 2,
                                                    border: '3px solid rgba(255,255,255,0.3)',
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            color: 'white',
                            fontSize: 44,
                            fontWeight: 700,
                            marginTop: 28,
                        },
                        children: 'Joost de Valk',
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: 22,
                            fontWeight: 700,
                            marginTop: 12,
                        },
                        children:
                            'Internet entrepreneur \u00b7 Founder of Yoast \u00b7 Investor',
                    },
                },
                {
                    type: 'div',
                    props: {
                        style: {
                            position: 'absolute',
                            bottom: 30,
                            right: 40,
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 20,
                            display: 'flex',
                            fontWeight: 700,
                        },
                        children: 'joost.blog',
                    },
                },
            ],
        },
    };

    const svg = await satori(markup, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
            {
                name: 'MonaSans',
                data: font,
                style: 'normal',
                weight: 700,
            },
        ],
    });

    return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}
