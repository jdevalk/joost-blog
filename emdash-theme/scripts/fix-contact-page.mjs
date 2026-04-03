#!/usr/bin/env node
import Database from "better-sqlite3";

const db = new Database("data.db");

const content = [
	// Intro
	{
		_type: "block",
		style: "normal",
		children: [
			{
				_type: "span",
				text: "I love hearing from people, seriously. Use the form below or one of the other ways to reach me. I usually reply within a few days. Note that if you're looking for investment, it's better to use the ",
			},
			{
				_type: "span",
				text: "contact form at Emilia Capital",
				marks: ["emilia-link"],
			},
			{
				_type: "span",
				text: ".",
			},
		],
		markDefs: [
			{
				_type: "link",
				_key: "emilia-link",
				href: "https://emilia.capital/contact/",
			},
		],
	},
	// Contact form heading
	{
		_type: "block",
		style: "h2",
		children: [{ _type: "span", text: "Contact form" }],
	},
	// Embedded form block
	{
		_type: "emdash-form",
		_key: "contact-form-embed",
		formId: "01KN5ECTTTNHZMFFF5T5CTVZBB",
	},
	// Slack heading
	{
		_type: "block",
		style: "h2",
		children: [{ _type: "span", text: "Slack" }],
	},
	{
		_type: "block",
		style: "normal",
		children: [
			{ _type: "span", text: "I'm @joostdevalk on the " },
			{
				_type: "span",
				text: "official WordPress Slack",
				marks: ["wp-slack-link"],
			},
			{ _type: "span", text: " and @jdevalk on the " },
			{
				_type: "span",
				text: "Post Status Slack",
				marks: ["ps-slack-link"],
			},
			{ _type: "span", text: "." },
		],
		markDefs: [
			{
				_type: "link",
				_key: "wp-slack-link",
				href: "https://make.wordpress.org/chat/",
			},
			{
				_type: "link",
				_key: "ps-slack-link",
				href: "https://poststatus.com/",
			},
		],
	},
	// Postal address heading
	{
		_type: "block",
		style: "h2",
		children: [{ _type: "span", text: "Postal Address" }],
	},
	{
		_type: "block",
		style: "normal",
		children: [
			{ _type: "span", text: "Emilia Capital\nAtt Joost de Valk\nEmilia van Nassaustraat 20\n6602 GW Wijchen\nThe Netherlands" },
		],
	},
	// Social media heading
	{
		_type: "block",
		style: "h2",
		children: [{ _type: "span", text: "Across Social Media" }],
	},
	// Social links custom block
	{
		_type: "socialLinks",
		_key: "social-links-embed",
	},
];

db.prepare("UPDATE ec_pages SET content = ? WHERE slug = 'contact'").run(
	JSON.stringify(content),
);

db.close();
console.log("Contact page content updated.");
