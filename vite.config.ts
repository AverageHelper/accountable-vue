import { defineConfig } from "vite";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
	plugins: [
		vue(), //
		tsconfigPaths({ projects: ["./tsconfig.prod.json"] }),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "/src"),
			"~bootstrap": "bootstrap",
		},
	},
	css: {
		postcss: {
			plugins: [
				{
					postcssPlugin: "internal:charset-removal",
					AtRule: {
						charset: (atRule): void => {
							if (atRule.name === "charset") {
								atRule.remove();
							}
						},
					},
				},
			],
		},
	},
});
