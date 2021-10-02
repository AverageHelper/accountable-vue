# Vue 3 + TypeScript + Vite + _Sprinkles_

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Fancy

- Semantic colors for dark mode support. (Remember to use the `color()` function in your SCSS)
- Strong TypeScript and ESLint checks for excellent type safety.
- Tabs instead of spaces everywhere for maximum accessibility and indentation choice.
- A version.ts file to get the project version at runtime without having to read package.json. (Run `npm run build` or `npm run export-version` to generate this)
- Support for Jest unit tests. (Create a .test.ts file next to a source file you want to test)

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar)

```sh
$ npm install
$ npm start
```

## Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can enable Volar's `.vue` type support plugin by running `Volar: Switch TS Plugin on/off` from VSCode command palette.
