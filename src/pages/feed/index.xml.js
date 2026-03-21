import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import siteConfig from '../../data/site-config';
import { sortPostsByDateDesc } from '../../utils/post-utils';

export async function GET(context) {
    const posts = (await getCollection('blog')).sort(sortPostsByDateDesc);
    return rss({
        title: siteConfig.title,
        description: siteConfig.description,
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom',
        },
        customData: [
            '<language>en-us</language>',
            `<atom:link href="${new URL('/feed/', context.site)}" rel="self" type="application/rss+xml" />`,
            '<managingEditor>joost@joost.blog (Joost de Valk)</managingEditor>',
            '<webMaster>joost@joost.blog (Joost de Valk)</webMaster>',
        ].join(''),
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.excerpt ?? '',
            link: `/${post.id}/`,
            pubDate: new Date(post.data.publishDate),
            categories: post.data.categories ?? [],
            author: 'joost@joost.blog (Joost de Valk)',
            content: post.body ?? '',
        })),
    });
}
