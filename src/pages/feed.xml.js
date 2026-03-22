import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import siteConfig from '../data/site-config';
import { sortPostsByDateDesc, getPublishedPosts } from '../utils/post-utils';

const parser = new MarkdownIt();

export async function GET(context) {
    const posts = getPublishedPosts(await getCollection('blog'));
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
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.excerpt ?? '',
            link: `/${post.id}/`,
            pubDate: new Date(post.data.publishDate),
            categories: post.data.categories ?? [],
            author: 'joost@joost.blog (Joost de Valk)',
            content: sanitizeHtml(parser.render(post.body ?? ''), {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
            }),
        })),
    });
}
