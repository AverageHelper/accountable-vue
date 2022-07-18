import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import analyze from "rollup-plugin-analyzer";
import autoprefixer from "autoprefixer";
import path from "path";
import sveltePreprocess from "svelte-preprocess";
import tsconfigPaths from "vite-tsconfig-paths";
import vue from "@vitejs/plugin-vue";
// import vueI18n from "@intlify/vite-plugin-vue-i18n";

export default defineConfig({
	plugins: [
		svelte({
			preprocess: sveltePreprocess(),
		}),
		vue(),
		// vueI18n({
		// 	include: path.resolve(__dirname, "./src/i18n/lang"),
		// }),
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
					// Only modules that themselves take >8% of the bundle
					module.percent > 8 &&
					// Not Vue (that's bound to be big no matter what)
					module.id !== "/node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js"
				);
			},
		}),
	],
	resolve: {
		alias: {
			// "vue-i18n": "vue-i18n/dist/vue-i18n.runtime.esm-bundler.js",
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
