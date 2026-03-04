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

    let backgroundMarkup = '';

    if (backgroundImagePath) {
        try {
            // Read the original image and convert to PNG via sharp for consistent base64 encoding
            const imageBuffer = await sharp(backgroundImagePath)
                .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
                .png()
                .toBuffer();
            const base64 = imageBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            backgroundMarkup = `<img src="${dataUrl}" style="position: absolute; top: 0; left: 0; width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; object-fit: cover;" />`;
        } catch {
            // If image reading fails, fall through to branded fallback
        }
    }

    // If no background image, use branded gradient
    const fallbackBg = !backgroundMarkup
        ? 'background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);'
        : '';

    const markup = html`
        <div style="width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; display: flex; position: relative; ${fallbackBg}">
            ${backgroundMarkup}
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

    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return png;
}
