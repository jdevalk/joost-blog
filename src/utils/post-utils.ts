import { type CollectionEntry } from 'astro:content';

export function sortPostsByDateDesc(postA: CollectionEntry<'blog'>, postB: CollectionEntry<'blog'>) {
    return new Date(postB.data.publishDate).getTime() - new Date(postA.data.publishDate).getTime();
}

export function isPublished(post: CollectionEntry<'blog'>): boolean {
    return !post.data.draft;
}

export function getPublishedPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
    return posts.filter(isPublished).sort(sortPostsByDateDesc);
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export function getReadingTime(content: string): number {
    const words = content.split(/\s+/).filter((word) => word.length > 0);
    const minutes = Math.ceil(words.length / 225);
    return Math.max(1, minutes);
}

function getLinkedSlugs(body: string): Set<string> {
    const slugs = new Set<string>();
    const linkPattern = /\]\(\/([\w-]+)\/?\)/g;
    let match;
    while ((match = linkPattern.exec(body)) !== null) {
        slugs.add(match[1]);
    }
    return slugs;
}

export function getRelatedPosts(
    currentPost: CollectionEntry<'blog'>,
    allPosts: CollectionEntry<'blog'>[],
    limit: number = 3
): CollectionEntry<'blog'>[] {
    const otherPosts = allPosts.filter((post) => post.id !== currentPost.id && isPublished(post));
    const currentCategories = currentPost.data.categories ?? [];
    const linkedSlugs = getLinkedSlugs(currentPost.body ?? '');
    const related: CollectionEntry<'blog'>[] = [];
    const usedIds = new Set<string>();

    // First: posts linked from the current post
    if (linkedSlugs.size > 0) {
        const linked = otherPosts
            .filter((post) => linkedSlugs.has(post.id))
            .sort(sortPostsByDateDesc);
        for (const post of linked) {
            if (related.length >= limit) break;
            if (!usedIds.has(post.id)) {
                related.push(post);
                usedIds.add(post.id);
            }
        }
    }

    // Second: posts sharing the first category, sorted by date desc
    if (currentCategories.length > 0 && related.length < limit) {
        const firstCat = currentCategories[0];
        const sameCat = otherPosts
            .filter((post) => post.data.categories?.includes(firstCat))
            .sort(sortPostsByDateDesc);
        for (const post of sameCat) {
            if (related.length >= limit) break;
            if (!usedIds.has(post.id)) {
                related.push(post);
                usedIds.add(post.id);
            }
        }
    }

    // Third: posts from other shared categories
    for (let i = 1; i < currentCategories.length && related.length < limit; i++) {
        const cat = currentCategories[i];
        const sameCat = otherPosts
            .filter((post) => post.data.categories?.includes(cat))
            .sort(sortPostsByDateDesc);
        for (const post of sameCat) {
            if (related.length >= limit) break;
            if (!usedIds.has(post.id)) {
                related.push(post);
                usedIds.add(post.id);
            }
        }
    }

    // Fourth: fill with most recent posts
    if (related.length < limit) {
        const recent = otherPosts.sort(sortPostsByDateDesc);
        for (const post of recent) {
            if (related.length >= limit) break;
            if (!usedIds.has(post.id)) {
                related.push(post);
                usedIds.add(post.id);
            }
        }
    }

    return related;
}
