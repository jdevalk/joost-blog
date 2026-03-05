import { IDS } from './constants';

export const organizations = [
    {
        '@type': 'Organization' as const,
        '@id': IDS.org('emilia-capital'),
        name: 'Emilia Capital',
        url: 'https://emilia.capital/'
    },
    {
        '@type': 'Organization' as const,
        '@id': IDS.org('post-status'),
        name: 'Post Status',
        url: 'https://poststatus.com/'
    },
    {
        '@type': 'Organization' as const,
        '@id': IDS.org('wordproof'),
        name: 'WordProof',
        url: 'https://wordproof.com/'
    },
    {
        '@type': 'Organization' as const,
        '@id': IDS.org('blokjes'),
        name: 'Blokjes',
        url: 'https://blokjes.nl/'
    },
    {
        '@type': 'Organization' as const,
        '@id': IDS.org('yoast'),
        name: 'Yoast',
        url: 'https://yoast.com/'
    }
];
