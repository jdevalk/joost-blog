import { readFileSync } from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';

const OG_WIDTH = 1200;
const OG_HEIGHT = 675;

let fontData: Buffer | null = null;

function loadFont(): Buffer {
    if (!fontData) {
        fontData = readFileSync(process.cwd() + '/public/fonts/MonaSans-Bold.ttf');
    }
    return fontData;
}

function getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        default:
            return 'image/png';
    }
}

export async function generateOgImage(title: string, backgroundImagePath?: string): Promise<Buffer> {
    const font = loadFont();

    // Render the text overlay with satori (using object markup to avoid HTML entity issues)
    const markup = {
        type: 'div',
        props: {
            style: { width: OG_WIDTH, height: OG_HEIGHT, display: 'flex', position: 'relative' },
            children: [
                { type: 'div', props: { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))', display: 'flex' } } },
                { type: 'div', props: { style: { position: 'absolute', bottom: 50, left: 60, right: 240, color: 'white', fontSize: 56, lineHeight: 1.2, display: 'flex', fontWeight: 700 }, children: title } },
                { type: 'div', props: { style: { position: 'absolute', bottom: 30, right: 40, color: 'rgba(255,255,255,0.9)', fontSize: 24, display: 'flex', fontWeight: 700 }, children: 'joost.blog' } },
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
                weight: 700
            }
        ]
    });

    const overlay = Buffer.from(svg);

    if (backgroundImagePath) {
        try {
            // Composite: background image + text overlay
            const bg = await sharp(backgroundImagePath)
                .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
                .png()
                .toBuffer();

            return await sharp(bg)
                .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
                .jpeg({ quality: 85 })
                .toBuffer();
        } catch {
            // Fall through to gradient fallback
        }
    }

    // No background image — use branded gradient
    const gradientSvg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4a1525"/>
            <stop offset="50%" stop-color="#3a1a28"/>
            <stop offset="100%" stop-color="#2e1220"/>
        </linearGradient></defs>
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/>
    </svg>`;

    return await sharp(Buffer.from(gradientSvg))
        .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
        .jpeg({ quality: 85 })
        .toBuffer();
}

export async function generateHomepageOgImage(): Promise<Buffer> {
    const font = loadFont();

    // Load avatar as circular image
    const avatarPath = process.cwd() + '/src/assets/images/joost-profile.jpg';
    const avatarSize = 180;
    const avatarBuffer = await sharp(avatarPath)
        .resize(avatarSize, avatarSize, { fit: 'cover' })
        .composite([{
            input: Buffer.from(
                `<svg width="${avatarSize}" height="${avatarSize}"><circle cx="${avatarSize / 2}" cy="${avatarSize / 2}" r="${avatarSize / 2}" fill="white"/></svg>`
            ),
            blend: 'dest-in'
        }])
        .png()
        .toBuffer();
    const avatarBase64 = `data:image/png;base64,${avatarBuffer.toString('base64')}`;

    // Ring sizes matching the hero's concentric circles
    const ringOuter = avatarSize + 44;
    const ringInner = avatarSize + 22;

    const markup = {
        type: 'div',
        props: {
            style: { width: OG_WIDTH, height: OG_HEIGHT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4a1525 0%, #3a1a28 50%, #2e1220 100%)', position: 'relative' },
            children: [
                { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: ringOuter, height: ringOuter, borderRadius: ringOuter / 2, border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }, children: [
                    { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: ringInner, height: ringInner, borderRadius: ringInner / 2, border: '1px solid rgba(255,255,255,0.15)' }, children: [
                        { type: 'img', props: { src: avatarBase64, style: { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, border: '3px solid rgba(255,255,255,0.3)' } } },
                    ] } },
                ] } },
                { type: 'div', props: { style: { display: 'flex', color: 'white', fontSize: 44, fontWeight: 700, marginTop: 28 }, children: 'Joost de Valk' } },
                { type: 'div', props: { style: { display: 'flex', color: 'rgba(255,255,255,0.6)', fontSize: 22, fontWeight: 700, marginTop: 12 }, children: 'Internet entrepreneur \u00b7 Founder of Yoast \u00b7 Investor' } },
                { type: 'div', props: { style: { position: 'absolute', bottom: 30, right: 40, color: 'rgba(255,255,255,0.5)', fontSize: 20, display: 'flex', fontWeight: 700 }, children: 'joost.blog' } },
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
                weight: 700
            }
        ]
    });

    return await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
}
