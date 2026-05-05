import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer as mdxRenderer } from '@astrojs/mdx';
import sanitizeHtml from 'sanitize-html';
import siteConfig from '../data/site-config';
import { getPublishedPosts } from '../utils/post-utils';

export async function GET(context) {
    const posts = getPublishedPosts(await getCollection('blog'));
    const renderers = await loadRenderers([mdxRenderer()]);
    const container = await AstroContainer.create({ renderers });

    const items = await Promise.all(
        posts.map(async (post) => {
            const { Content } = await render(post);
            const html = await container.renderToString(Content);
            return {
                title: post.data.title.replace(/<[^>]+>/g, ''),
                description: post.data.excerpt ?? '',
                link: `/${post.id}/`,
                pubDate: new Date(post.data.publishDate),
                categories: post.data.categories ?? [],
                author: 'joost@joost.blog (Joost de Valk)',
                content: sanitizeHtml(html, {
                    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
                }),
            };
        })
    );

    return rss({
        title: siteConfig.title,
        description: siteConfig.description,
        site: context.site,
        xmlns: {
            atom: 'http://www.w3.org/2005/Atom',
        },
        customData: [
            '<language>en-us</language>',
            `<atom:link href="${new URL('/feed.xml', context.site)}" rel="self" type="application/rss+xml" />`,
            '<managingEditor>joost@joost.blog (Joost de Valk)</managingEditor>',
            '<webMaster>joost@joost.blog (Joost de Valk)</webMaster>',
        ].join(''),
        items,
    });
}
