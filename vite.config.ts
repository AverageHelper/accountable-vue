import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tsconfigPaths from "vite-tsconfig-paths";
// import eslintPlugin from "vite-plugin-eslint";
// import checker from "vite-plugin-checker";

// console.log(checker);

export default defineConfig({
	plugins: [
		vue(),
		tsconfigPaths({ projects: ["./tsconfig.prod.json"] }),
		// eslintPlugin.default(),
		// eslintPlugin.default({
		// 	include: ["src/**/*.ts", "src/**/*.json", "src/**/*.d.ts", "src/**/*.vue"],
		// }),
		// checker.default({
		// 	// this should yell at TransactionEdit.vue and toCurrency.ts, but doesn't
		// 	typescript: {
		// 		root: ".",
		// 		tsconfigPath: "tsconfig.prod.json",
		// 	},
		// 	vueTsc: true,
		// }),
	],
});
