/**
 * Vite looks for this config automatically.
 * @see https://vitejs.dev/config/#css-postcss
 *
 * Using CommonJS here because for some reason Vite doesn't import ESM.
 */

const autoprefixer = require("autoprefixer");
const purgecss = require("@fullhuman/postcss-purgecss");

const IN_PRODUCTION = process.env.NODE_ENV !== "development";

module.exports = {
	plugins: [
		autoprefixer,
		IN_PRODUCTION &&
			// Purge unused CSS rules (lookin' at you, Bootstrap)
			purgecss({
				content: ["./**/*.html", "./src/**/*.vue"],
				defaultExtractor(content) {
					const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, "");
					return contentWithoutStyleBlocks.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g) || [];
				},
				whitelist: [],
				// Leave Vue stuff alone
				whitelistPatterns: [
					/-(leave|enter|appear)(|-(to|from|active))$/,
					/^(?!(|.*?:)cursor-move).+-move$/,
					/^router-link(|-exact)-active$/,
					/data-v-.*/,
				],
			}),
	],
};
