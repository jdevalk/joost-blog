import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import { themeBlocksPlugin } from "./plugins/theme-blocks/src/index.ts";
import { createPlugin as lettermintPlugin } from "@jdevalk/emdash-plugin-lettermint";
import { seoPlugin } from "@jdevalk/emdash-plugin-seo";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { d1, r2 } from "@emdash-cms/cloudflare";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB" }),
			storage: r2({
				binding: "MEDIA",
				baseUrl: "/_emdash/api/media/file",
			}),
			plugins: [formsPlugin(), themeBlocksPlugin(), seoPlugin(), lettermintPlugin()],
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
