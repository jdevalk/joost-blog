import { generateHomepageOgImage } from '../../utils/og-image';

export async function GET() {
    const png = await generateHomepageOgImage();

    return new Response(png, {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
}
