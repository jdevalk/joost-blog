#!/usr/bin/env node
import Database from "better-sqlite3";

const db = new Database("data.db");

// --- Create sections ---

// Work with me section
const workWithMeContent = JSON.stringify([
	{
		_type: "block",
		style: "normal",
		children: [
			{
				_type: "span",
				text: "I reserve a portion of my time for digital / growth consultancy with companies we don't have an investment in. I can advise you and your company on your (digital) product direction, your search/SEO strategy, and how you can leverage the open web for your company.",
			},
		],
	},
	{
		_type: "block",
		style: "normal",
		children: [{ _type: "span", text: "Get in touch", marks: ["cta-link"] }],
		markDefs: [{ _type: "link", _key: "cta-link", href: "/contact" }],
	},
]);

db.prepare(`
	INSERT OR REPLACE INTO _emdash_sections (id, slug, title, description, keywords, content, source, created_at, updated_at)
	VALUES ('sec-work-with-me', 'work-with-me', 'Work with me?', 'Consultancy', '[]', ?, 'theme', datetime('now'), datetime('now'))
`).run(workWithMeContent);
console.log("Created section: work-with-me");

// Speaking engagements section (just label + heading, videos come from collection)
db.prepare(`
	INSERT OR REPLACE INTO _emdash_sections (id, slug, title, description, keywords, content, source, created_at, updated_at)
	VALUES ('sec-speaking', 'speaking-engagements', 'Past speaking engagements', 'On stage', '[]', '[]', 'theme', datetime('now'), datetime('now'))
`).run();
console.log("Created section: speaking-engagements");

// --- Build about page content ---

function link(key, href) {
	return { _type: "link", _key: key, href };
}
function span(text, marks) {
	const s = { _type: "span", text };
	if (marks) s.marks = marks;
	return s;
}
function para(children, markDefs) {
	const b = { _type: "block", style: "normal", children };
	if (markDefs) b.markDefs = markDefs;
	return b;
}
function heading(level, text) {
	return { _type: "block", style: `h${level}`, children: [span(text)] };
}

const content = [
	// Hero banner
	{ _type: "heroBanner", _key: "about-hero", sectionSlug: "about-hero" },

	// Social links
	{ _type: "socialLinks", _key: "about-social" },

	// My story
	heading(2, "My story"),

	para(
		[
			span(
				"I have worn a couple of different hats in my time at Yoast. First, for almost 9 years, I was the CEO, then I became Chief Product Officer when my wife ",
			),
			span("Marieke", ["marieke1"]),
			span(
				" took over as CEO. We sold Yoast to Newfold Digital in August of 2021, after which I became Head of WordPress Strategy at Newfold for a while. I then came back for a 6-month stint as interim CTO (because they were suddenly without one) in 2022-2023. I finally left the company in April 2023.",
			),
		],
		[link("marieke1", "https://marieke.com/")],
	),

	para(
		[
			span("When we left Yoast, Marieke and I started "),
			span("Emilia Capital", ["emilia"]),
			span(
				", our investment and holding company. Through Emilia Capital, we invest in companies that play at least partly in the digital space — and often in the WordPress ecosystem. We're on the board of companies like ",
			),
			span("PatchStack", ["patchstack"]),
			span(" (WordPress security) and "),
			span("Atarim", ["atarim"]),
			span(
				" (visual collaboration for agencies). We also build our own products under the Emilia Capital umbrella; our main focus right now is ",
			),
			span("Progress Planner", ["pp"]),
			span(
				", a plugin that helps WordPress site owners stay on top of their content and maintenance tasks.",
			),
		],
		[
			link("emilia", "https://emilia.capital/"),
			link("patchstack", "https://patchstack.com/"),
			link("atarim", "https://atarim.io/"),
			link("pp", "https://progressplanner.com/"),
		],
	),

	para(
		[
			span(
				"I founded Yoast in 2010 after working as a digital marketing consultant in several different companies. I've worked on some of the biggest SEO projects in the world, like the ",
			),
			span(
				"Guardian's site migration from .co.uk to theguardian.com",
				["guardian"],
			),
			span("."),
		],
		[
			link(
				"guardian",
				"https://www.theguardian.com/info/developer-blog/2014/feb/18/how-the-guardian-successfully-moved-domain",
			),
		],
	),

	para(
		[
			span(
				"In my spare time, I can often be found coaching kids' soccer at ",
			),
			span("AWC", ["awc"]),
			span(
				", where I'm also a board member. On holidays, Marieke and I love spending time in our ",
			),
			span("holiday home in Tuscany", ["tuscany"]),
			span(" or traveling to other places in the world."),
		],
		[
			link("awc", "https://svawc.nl/"),
			link("tuscany", "https://limonaia.house/"),
		],
	),

	// Work with me CTA
	{ _type: "ctaBanner", _key: "work-cta", sectionSlug: "work-with-me" },

	// Featured videos
	{
		_type: "featuredVideos",
		_key: "speaking-videos",
		sectionSlug: "speaking-engagements",
		limit: 6,
	},
];

db.prepare("UPDATE ec_pages SET content = ? WHERE slug = ?").run(
	JSON.stringify(content),
	"about",
);

db.close();
console.log("About page content updated.");
