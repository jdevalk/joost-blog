import { definePlugin } from "emdash";
import type { PluginDescriptor } from "emdash";

export function themeBlocksPlugin(): PluginDescriptor {
	return {
		id: "theme-blocks",
		version: "1.0.0",
		format: "native",
		entrypoint: new URL("./index.ts", import.meta.url).pathname,
		componentsEntry: new URL("./astro/index.ts", import.meta.url).pathname,
		options: {},
	};
}

export function createPlugin() {
	return definePlugin({
		id: "theme-blocks",
		version: "1.0.0",

		admin: {
			portableTextBlocks: [
				{
					type: "heroBanner",
					label: "Hero Banner",
					icon: "link-external",
					description: "Full-width banner with label, heading, body text, and image from a section",
					fields: [
						{
							type: "text_input",
							action_id: "sectionSlug",
							label: "Section Slug",
							placeholder: "e.g. contact-hero, about-hero",
						},
					],
				},
				{
					type: "ctaBanner",
					label: "CTA Banner",
					icon: "link",
					description: "Styled call-to-action box with heading, text, and button from a section",
					fields: [
						{
							type: "text_input",
							action_id: "sectionSlug",
							label: "Section Slug",
							placeholder: "e.g. work-with-me",
						},
					],
				},
				{
					type: "featuredVideos",
					label: "Featured Videos",
					icon: "video",
					description: "Grid of featured videos with label and heading from a section",
					fields: [
						{
							type: "text_input",
							action_id: "sectionSlug",
							label: "Section Slug",
							placeholder: "e.g. speaking-engagements",
						},
						{
							type: "number_input",
							action_id: "limit",
							label: "Number of videos",
						},
						{
							type: "text_input",
							action_id: "onStageOnly",
							label: "On stage only (yes/no)",
							placeholder: "yes",
						},
					],
				},
				{
					type: "label",
					label: "Label",
					icon: "code",
					description: "Small uppercase label text (moustache)",
					fields: [
						{
							type: "text_input",
							action_id: "id",
							label: "Label text",
							placeholder: "e.g. Connect, Background, On stage",
						},
					],
				},
				{
					type: "socialLinks",
					label: "Social Links",
					icon: "link-external",
					description: "Social media link pills",
					placeholder: "No configuration needed — just click Insert",
					fields: [
						{
							type: "text_input",
							action_id: "id",
							label: "This block has no settings",
						},
					],
				},
			],
		},
	});
}

export default createPlugin;
