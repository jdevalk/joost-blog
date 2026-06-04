import avatarImage from '../assets/images/joost-profile.jpg';
import type { SiteConfig } from '../types';

const siteConfig: SiteConfig = {
    title: 'Joost.blog',
    description: 'Joost de Valk - internet entrepreneur, Group Head of AI & Growth at Your.Online, founder of Yoast',
    image: {
        src: '/images/og-default.jpg',
        alt: 'Joost.blog'
    },
    primaryNavLinks: [
        { text: 'Blog', href: '/blog/' },
        { text: 'About', href: '/about-me/' },
        { text: 'Code', href: '/code/' },
        { text: 'Videos', href: '/videos/' },
        { text: 'Research', href: '/research/' },
        { text: 'Contact', href: '/contact-me/' }
    ],
    secondaryNavLinks: [],
    socialLinks: [
        { text: 'Bluesky', href: 'https://bsky.app/profile/joost.blog', icon: 'bluesky' },
        { text: 'GitHub', href: 'https://github.com/jdevalk', icon: 'github' },
        { text: 'LinkedIn', href: 'https://www.linkedin.com/in/jdevalk/', icon: 'linkedin' },
        { text: 'X / Twitter', href: 'https://x.com/jdevalk', icon: 'x' }
    ],
    hero: {
        title: 'Joost de Valk',
        text: 'Internet entrepreneur from the Netherlands. I\'m Group Head of AI &amp; Growth at <a href="https://your.online/" target="_blank" rel="noopener noreferrer">Your.Online</a>, where I lead an AI team building tools to help entrepreneurs get online and grow. I founded Yoast, the most popular WordPress SEO plugin, and I still invest in digital companies through <a href="https://emilia.capital/" target="_blank" rel="noopener noreferrer">Emilia Capital</a>.<span class="block mt-3"><a href="/about-me/">Read more about me &rarr;</a></span>',
        avatar: {
            src: avatarImage,
            alt: 'Joost de Valk'
        }
    },
    postsPerPage: 12
};

export default siteConfig;
