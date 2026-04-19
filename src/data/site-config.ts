import avatarImage from '../assets/images/joost-profile.jpg';
import type { SiteConfig } from '../types';

const siteConfig: SiteConfig = {
    title: 'Joost.blog',
    description: 'Joost de Valk - internet entrepreneur, founder of Yoast, investor at Emilia Capital',
    image: {
        src: '/images/og-default.jpg',
        alt: 'Joost.blog'
    },
    primaryNavLinks: [
        { text: 'Blog', href: '/blog/' },
        { text: 'About', href: '/about-me/' },
        { text: 'Code', href: '/code/' },
        { text: 'CMS Market Share', href: '/cms-market-share/' },
        { text: 'Videos', href: '/videos/' },
        { text: 'Contact', href: '/contact-me/' },
        { text: 'Ask', href: '/ask-joost/' }
    ],
    secondaryNavLinks: [],
    socialLinks: [
        { text: 'X / Twitter', href: 'https://x.com/jdevalk', icon: 'x' },
        { text: 'GitHub', href: 'https://github.com/jdevalk', icon: 'github' },
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/jdevalk/', icon: 'linkedin' },
        { text: 'Bluesky', href: 'https://bsky.app/profile/joost.blog', icon: 'bluesky' }
    ],
    hero: {
        title: "Joost de Valk",
        text: 'Internet entrepreneur from the Netherlands. I\'m the founder of Yoast, the company behind the most popular WordPress SEO plugin. Now I invest in and build digital companies through <a href="https://emilia.capital/" target="_blank" rel="noopener noreferrer">Emilia Capital</a>, and I\'m working on <a href="https://progressplanner.com/" target="_blank" rel="noopener noreferrer">Progress Planner</a> &amp; <a href="https://rondo.club/" target="_blank" rel="noopener noreferrer">Rondo</a>.<span class="block mt-3"><a href="/about-me/">Read more about me &rarr;</a></span>',
        avatar: {
            src: avatarImage,
            alt: 'Joost de Valk'
        }
    },
    postsPerPage: 12
};

export default siteConfig;
