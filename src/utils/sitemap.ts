import { gitLastmod as packageGitLastmod } from '@jdevalk/astro-seo-graph';

const BULK_COMMITS = ['52130a9', '989dc47', '53c0235', '6def8ab', 'a3f7e33'];

export function gitLastmod(filePath: string): Date | null {
    return packageGitLastmod(filePath, { excludeCommits: BULK_COMMITS });
}
