import { createApiCatalog } from '@jdevalk/astro-seo-graph';

export const GET = createApiCatalog({
    siteUrl: 'https://joost.blog',
    schemaEndpoints: [
        { path: '/schema/post.json', schemaType: 'BlogPosting', serviceDoc: '/seo-graph/' },
        { path: '/schema/page.json', schemaType: 'WebPage', serviceDoc: '/seo-graph/' },
        { path: '/schema/video.json', schemaType: 'VideoObject', serviceDoc: '/seo-graph/' }
    ],
    schemaMap: { path: '/schemamap.xml', serviceDoc: '/seo-graph/' },
    additional: [
        {
            anchor: '/ask',
            serviceDoc: '/ask-joost/',
            type: 'https://schema.org/SearchAction'
        }
    ]
});
