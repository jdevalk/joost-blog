import type { SiteConfig } from '../types';
import avatarImage from '../assets/images/joost-profile.jpg';

const siteConfig: SiteConfig = {
    title: 'joost.blog',
    description: 'Joost de Valk - internet entrepreneur, founder of Yoast, investor at Emilia Capital',
    image: {
        src: '/images/og-default.jpg',
        alt: 'joost.blog'
    },
    primaryNavLinks: [
        { text: 'Blog', href: '/blog' },
        { text: 'About', href: '/about-me' },
        { text: 'Plugins', href: '/plugins' },
        { text: 'Videos', href: '/videos' },
        { text: 'Contact', href: '/contact-me' }
    ],
    secondaryNavLinks: [],
    socialLinks: [
        { text: 'X / Twitter', href: 'https://x.com/jdevalk', icon: 'x' },
        { text: 'GitHub', href: 'https://github.com/jdevalk', icon: 'github' },
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/jdevalk/', icon: 'linkedin' },
        { text: 'Bluesky', href: 'https://bsky.app/profile/joost.blog', icon: 'bluesky' }
    ],
    hero: {
        title: "Hi! I'm Joost de Valk",
        text: 'Internet entrepreneur from the Netherlands. I founded Yoast, the company behind the most popular WordPress SEO plugin. Now I invest in and build digital companies through <a href="https://emiliacapital.com/">Emilia Capital</a>, and I\'m working on <a href="https://progressplanner.com/">Progress Planner</a>. <a href="/about-me">Read more &rarr;</a>',
        avatar: {
            src: avatarImage,
            alt: 'Joost de Valk'
        }
    },
    postsPerPage: 5
};

export default siteConfig;
