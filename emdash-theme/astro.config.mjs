import node from "@astrojs/node";
import react from "@astrojs/react";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { themeBlocksPlugin } from "./plugins/theme-blocks/src/index.ts";
import { seoPlugin } from "@jdevalk/emdash-plugin-seo";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: sqlite({ url: "file:./data.db" }),
			storage: local({
				directory: "./uploads",
				baseUrl: "/_emdash/api/media/file",
			}),
			plugins: [formsPlugin(), themeBlocksPlugin(), seoPlugin()],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			include: [
				'use-sync-external-store/shim',
				'use-sync-external-store/shim/index.js',
				'use-sync-external-store/shim/with-selector',
				'use-sync-external-store/shim/with-selector.js',
			],
		},
	},
	prefetch: {
		defaultStrategy: "viewport",
	},
	devToolbar: { enabled: false },
});
