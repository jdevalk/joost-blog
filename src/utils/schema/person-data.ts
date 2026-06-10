import type { IdFactory } from '@jdevalk/seo-graph-core';
import { SITE_URL } from './constants';

/**
 * Joost's Person data as consumed by `buildPiece<Person>`. The shape is
 * static except for the `@id` references that need the IdFactory.
 */
export function getJoostPersonData(ids: IdFactory) {
    return {
        '@type': 'Person' as const,
        '@id': ids.person,
        name: 'Joost de Valk',
        familyName: 'de Valk',
        birthDate: '1982-02-16',
        gender: 'https://schema.org/Male',
        nationality: { '@id': ids.country('NL') },
        description:
            'Internet entrepreneur from Wijchen, the Netherlands. Group Head of AI & Growth at Your.Online, investor through Emilia Capital, and founder of Yoast, the WordPress SEO plugin.',
        jobTitle: 'Group Head of AI & Growth',
        knowsLanguage: ['Dutch', 'English', 'German', 'French', 'Italian'],
        url: `${SITE_URL}/about-me/`,
        image: { '@id': ids.personImage },
        publishingPrinciples: `${SITE_URL}/about-me/`,
        knowsAbout: [
            'Search Engine Optimization',
            'WordPress',
            'Open Source',
            'Web Development',
            'Artificial Intelligence',
            'Schema.org',
            'Content Management Systems'
        ],
        sameAs: [
            `${SITE_URL}/about-me/`,
            'https://www.facebook.com/jdevalk',
            'https://www.instagram.com/joostdevalk',
            'https://www.linkedin.com/in/jdevalk',
            'https://x.com/jdevalk',
            'https://bsky.app/profile/joost.blog',
            'https://www.youtube.com/user/jdevalk',
            'https://en.wikipedia.org/wiki/Joost_de_Valk',
            'https://joost.net/@joost',
            'https://github.com/jdevalk',
            'https://profiles.wordpress.org/joostdevalk',
            'https://emilia.capital/joost/'
        ],
        worksFor: [
            {
                '@type': 'EmployeeRole',
                roleName: 'Group Head of AI & Growth',
                startDate: '2026',
                worksFor: { '@id': ids.organization('your-online') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Partner',
                startDate: '2020',
                worksFor: { '@id': ids.organization('emilia-capital') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Chair of the Board',
                startDate: '2024',
                worksFor: { '@id': ids.organization('post-status') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Advisor',
                startDate: '2020',
                worksFor: { '@id': ids.organization('wordproof') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Board Member',
                startDate: '2022-08-01',
                worksFor: { '@id': ids.organization('atarim') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'Board Member',
                startDate: '2024-08-01',
                worksFor: { '@id': ids.organization('patchstack') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'CEO',
                startDate: '2023',
                worksFor: { '@id': ids.organization('blokjes') }
            },
            {
                '@type': 'EmployeeRole',
                roleName: 'CEO',
                startDate: '2010',
                endDate: '2019',
                worksFor: { '@id': ids.organization('yoast') }
            }
        ],
        spouse: {
            '@id': `${SITE_URL}/#/schema.org/Person/marieke`,
            name: 'Marieke van de Rakt'
        },
        children: [
            {
                '@type': 'Person' as const,
                '@id': `${SITE_URL}/#/schema.org/Person/tycho`,
                name: 'Tycho de Valk'
            },
            {
                '@type': 'Person' as const,
                '@id': `${SITE_URL}/#/schema.org/Person/wende`,
                name: 'Wende de Valk'
            },
            {
                '@type': 'Person' as const,
                '@id': `${SITE_URL}/#/schema.org/Person/ravi`,
                name: 'Ravi de Valk'
            },
            {
                '@type': 'Person' as const,
                '@id': `${SITE_URL}/#/schema.org/Person/borre`,
                name: 'Borre de Valk'
            }
        ]
    };
}

/**
 * The `Country` entity for the Netherlands. Not a piece builder in core
 * (too narrow), so it's pushed to the graph as a raw entity.
 */
export function getCountryNl(ids: IdFactory) {
    return {
        '@type': 'Country' as const,
        '@id': ids.country('NL'),
        name: 'The Netherlands'
    };
}

/**
 * Family member `Person` references — just `@id` + `name` pairs that link
 * out to the same entities used in `spouse` and `children` on the main Person.
 * These are pushed to the graph as raw entities for the homepage and about
 * pages so the references resolve.
 */
export const familyMembers = [
    {
        '@type': 'Person' as const,
        '@id': `${SITE_URL}/#/schema.org/Person/marieke`,
        name: 'Marieke van de Rakt'
    },
    {
        '@type': 'Person' as const,
        '@id': `${SITE_URL}/#/schema.org/Person/tycho`,
        name: 'Tycho de Valk'
    },
    {
        '@type': 'Person' as const,
        '@id': `${SITE_URL}/#/schema.org/Person/wende`,
        name: 'Wende de Valk'
    },
    {
        '@type': 'Person' as const,
        '@id': `${SITE_URL}/#/schema.org/Person/ravi`,
        name: 'Ravi de Valk'
    },
    {
        '@type': 'Person' as const,
        '@id': `${SITE_URL}/#/schema.org/Person/borre`,
        name: 'Borre de Valk'
    }
];
