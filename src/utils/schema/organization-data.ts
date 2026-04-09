import type { OrganizationInput } from '@jdevalk/seo-graph-core';

/**
 * Organizations Joost is or has been affiliated with. Fed one-by-one
 * into `@jdevalk/seo-graph-core`'s `buildOrganization` so they become
 * referenced entities the Person's `worksFor` list can point at.
 */
export const organizationInputs: OrganizationInput[] = [
    {
        slug: 'emilia-capital',
        name: 'Emilia Capital',
        url: 'https://emilia.capital/',
    },
    {
        slug: 'post-status',
        name: 'Post Status',
        url: 'https://poststatus.com/',
    },
    {
        slug: 'wordproof',
        name: 'WordProof',
        url: 'https://wordproof.com/',
    },
    {
        slug: 'blokjes',
        name: 'Blokjes',
        url: 'https://blokjes.co/',
    },
    {
        slug: 'atarim',
        name: 'Atarim',
        url: 'https://atarim.io/',
    },
    {
        slug: 'patchstack',
        name: 'Patchstack',
        url: 'https://patchstack.com/',
    },
    {
        slug: 'yoast',
        name: 'Yoast',
        url: 'https://yoast.com/',
    },
];
