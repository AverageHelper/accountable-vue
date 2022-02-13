import { defineConfig } from "vite";
import analyze from "rollup-plugin-analyzer";
import autoprefixer from "autoprefixer";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
	plugins: [
		vue(),
		tsconfigPaths({ projects: ["./tsconfig.prod.json"] }),
		analyze({
			onAnalysis: () => {
				// Add a newline before the analysis
				// for vanity
				process.stdout.write("\n");
			},
			filter: module => {
				// Decide which modules are important enough to warn about:
				return (
					// Only modules that themselves take >8.6% of the bundle
					module.percent > 8.6 && // TODO: Fix this percentage for new dependency balance
					// Not Vue (that's bound to be big no matter what)
					module.id !== "/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js"
				);
			},
		}),
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
				autoprefixer(),
				{
					// Fixes a benign error about charset being improperly placed
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
