export const SITE_URL = 'https://joost.blog';

export const IDS = {
    person: `${SITE_URL}/about-me/#/schema.org/Person`,
    personImage: `${SITE_URL}/#personlogo`,
    website: `${SITE_URL}/#/schema.org/WebSite`,
    countryNl: `${SITE_URL}/#/schema.org/Country/nl`,
    navigation: `${SITE_URL}/#site-navigation`,
    webPage: (url: string) => url,
    breadcrumb: (url: string) => `${url}#breadcrumb`,
    article: (url: string) => `${url}#article`,
    videoObject: (url: string) => `${url}#video`,
    primaryImage: (url: string) => `${url}#primaryimage`,
    org: (slug: string) => `${SITE_URL}/#/schema.org/Organization/${slug}`
} as const;
