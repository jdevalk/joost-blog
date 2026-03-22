const SITE_URL = 'https://joost.blog';

const manifest = {
	name: 'Joost.blog',
	description: 'Joost de Valk - internet entrepreneur, founder of Yoast, investor at Emilia Capital',
	url: SITE_URL,
	endpoints: {
		ask: {
			url: `${SITE_URL}/ask`,
			methods: ['GET', 'POST'],
			modes: ['list', 'summarize', 'generate'],
			description: 'NLWeb-compatible natural language query endpoint with hybrid keyword + semantic search and LLM-powered answers.',
		},
	},
	schema: {
		schemamap: `${SITE_URL}/schemamap.xml`,
		posts: `${SITE_URL}/schema/post.json`,
		videos: `${SITE_URL}/schema/video.json`,
		pages: `${SITE_URL}/schema/page.json`,
	},
	feeds: {
		rss: `${SITE_URL}/feed.xml`,
		sitemap: `${SITE_URL}/sitemap-index.xml`,
	},
	navigation: [
		{ name: 'Blog', url: `${SITE_URL}/blog/` },
		{ name: 'About', url: `${SITE_URL}/about-me/` },
		{ name: 'Code', url: `${SITE_URL}/code/` },
		{ name: 'CMS Market Share', url: `${SITE_URL}/cms-market-share/` },
		{ name: 'Videos', url: `${SITE_URL}/videos/` },
		{ name: 'Contact', url: `${SITE_URL}/contact-me/` },
		{ name: 'Ask', url: `${SITE_URL}/ask-joost/` },
	],
};

export function onRequestGet() {
	return new Response(JSON.stringify(manifest, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'max-age=3600',
		},
	});
}
