import { IDS, SITE_URL } from './constants';

export const joostPersonData = {
    '@type': ['Person', 'Organization'] as const,
    '@id': IDS.person,
    name: 'Joost de Valk',
    familyName: 'de Valk',
    birthDate: '1982-02-16',
    gender: 'https://schema.org/Male',
    nationality: { '@id': IDS.countryNl },
    description:
        'Internet entrepreneur from Wijchen, the Netherlands. Investor at Emilia Capital and actively working on Progress Planner. Founder of Yoast.',
    jobTitle: 'Partner',
    knowsLanguage: ['Dutch', 'English', 'German', 'French', 'Italian'],
    url: `${SITE_URL}/about-me/`,
    image: { '@id': IDS.personImage },
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
            roleName: 'Partner',
            startDate: '2020',
            worksFor: { '@id': IDS.org('emilia-capital') }
        },
        {
            '@type': 'EmployeeRole',
            roleName: 'Chair of the Board',
            startDate: '2024',
            worksFor: { '@id': IDS.org('post-status') }
        },
        {
            '@type': 'EmployeeRole',
            roleName: 'Advisor',
            startDate: '2020',
            worksFor: { '@id': IDS.org('wordproof') }
        },
        {
            '@type': 'EmployeeRole',
            roleName: 'CEO',
            startDate: '2023',
            worksFor: { '@id': IDS.org('blokjes') }
        },
        {
            '@type': 'EmployeeRole',
            roleName: 'CEO',
            startDate: '2010',
            endDate: '2019',
            worksFor: { '@id': IDS.org('yoast') }
        }
    ],
    spouse: {
        '@id': `${SITE_URL}/#/schema.org/Person/marieke`,
        name: 'Marieke van de Rakt'
    },
    children: [
        { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/tycho`, name: 'Tycho' },
        { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/wende`, name: 'Wende' },
        { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/ravi`, name: 'Ravi' },
        { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/borre`, name: 'Borre' }
    ]
};

export const countryNl = {
    '@type': 'Country' as const,
    '@id': IDS.countryNl,
    name: 'The Netherlands'
};

export const familyMembers = [
    {
        '@type': 'Person' as const,
        '@id': `${SITE_URL}/#/schema.org/Person/marieke`,
        name: 'Marieke van de Rakt'
    },
    { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/tycho`, name: 'Tycho' },
    { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/wende`, name: 'Wende' },
    { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/ravi`, name: 'Ravi' },
    { '@type': 'Person' as const, '@id': `${SITE_URL}/#/schema.org/Person/borre`, name: 'Borre' }
];
