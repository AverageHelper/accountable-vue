import { defineNuxtConfig } from "nuxt";
import analyze from "rollup-plugin-analyzer";
import autoprefixer from "autoprefixer";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import vue from "@vitejs/plugin-vue";

export default defineNuxtConfig({
	components: [
		{
			path: "@/components", // will get any components nested in let's say /components/test too
			pathPrefix: false,
		},
	],
	// modules: ["@nuxtjs/composition-api/module", "@pinia/nuxt"],
	typescript: {
		shim: false,
		strict: true,
		typeCheck: "build",
		tsConfig: "tsconfig.prod.json",
	},
	vite: {
		plugins: [
			vue(),
			// vueI18n({
			// 	include: path.resolve(__dirname, "./locales"),
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
				"@": path.resolve(__dirname, "/"),
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
	},
});
