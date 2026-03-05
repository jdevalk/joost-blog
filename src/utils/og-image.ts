import { readFileSync } from 'node:fs';
import satori from 'satori';
import { html } from 'satori-html';
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

    // Render the text overlay with satori (no background image — composited later with sharp)
    const markup = html`
        <div style="width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; display: flex; position: relative;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 70%; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)); display: flex;"></div>
            <div style="position: absolute; bottom: 50px; left: 60px; right: 60px; color: white; font-size: 48px; line-height: 1.2; display: flex; font-weight: 700;">
                ${title}
            </div>
            <div style="position: absolute; top: 30px; right: 40px; color: rgba(255,255,255,0.9); font-size: 24px; display: flex; font-weight: 700;">
                joost.blog
            </div>
        </div>
    `;

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
                .png()
                .toBuffer();
        } catch {
            // Fall through to gradient fallback
        }
    }

    // No background image — use branded gradient
    const gradientSvg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#334155"/>
        </linearGradient></defs>
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#g)"/>
    </svg>`;

    return await sharp(Buffer.from(gradientSvg))
        .composite([{ input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 }])
        .png()
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

    const markup = html`
        <div style="width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); position: relative;">
            <!-- Concentric rings -->
            <div style="display: flex; align-items: center; justify-content: center; width: ${ringOuter}px; height: ${ringOuter}px; border-radius: ${ringOuter / 2}px; border: 1px solid rgba(255,255,255,0.08); position: relative;">
                <div style="display: flex; align-items: center; justify-content: center; width: ${ringInner}px; height: ${ringInner}px; border-radius: ${ringInner / 2}px; border: 1px solid rgba(255,255,255,0.15);">
                    <img src="${avatarBase64}" style="width: ${avatarSize}px; height: ${avatarSize}px; border-radius: ${avatarSize / 2}px; border: 3px solid rgba(255,255,255,0.3);" />
                </div>
            </div>
            <!-- Name -->
            <div style="display: flex; color: white; font-size: 44px; font-weight: 700; margin-top: 28px;">
                Joost de Valk
            </div>
            <!-- Tagline -->
            <div style="display: flex; color: rgba(255,255,255,0.6); font-size: 22px; font-weight: 700; margin-top: 12px;">
                Internet entrepreneur · Founder of Yoast · Investor
            </div>
            <!-- Domain -->
            <div style="position: absolute; bottom: 30px; right: 40px; color: rgba(255,255,255,0.5); font-size: 20px; display: flex; font-weight: 700;">
                joost.blog
            </div>
        </div>
    `;

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

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return png;
}
