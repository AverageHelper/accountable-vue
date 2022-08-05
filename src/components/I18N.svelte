<!-- 
	@component
	Renders an element with internationalized content, and elements injected
	into the i18n variables. The default slot may contain any number of elements,
	which are rendered in the place of the variables in order.

	The I18N component does some work to dynamically inject elements in the
	right spot. If you do not need to inject components or HTML into the
	translation, avoid using the I18N component, and instead use the proper
	formatting store from `svelte-i18n`.

	Usage:

	en-US.json:
	```json
	"place": {
		"invitation": "Let's go to the {place}!",
		"beach": "beach"
	}
	```

	MyComponent.svelte:
	```svelte
	<script>
		import { _ } from "svelte-i18n";
		import I18N from "path/to/I18N.svelte";
	</script>

	<p>
		<I18N keypath="place.invitation">
			<em>{$_("place.beach")}</em>
		</I18N>
	</p>
	```

	The above renders the following:
	```html
	<p><span>Let's go to the <em>beach</em>!</span></p>
	```
 -->
<script lang="ts">
	import { _ } from "svelte-i18n";
	import { onMount, tick } from "svelte";

	export let tag: keyof HTMLElementTagNameMap = "span";
	export let keypath: string;
	export let debug: boolean = false;

	interface SlotItem {
		/** `true` if the item should render some slotted data. */
		isVar: true;
		/** The name of the variable. */
		name: string;
	}

	interface TextItem {
		/** `true` if the item should render some slotted data. */
		isVar: false;
		/** Text to render. */
		text: string;
	}

	type Item = SlotItem | TextItem;

	let root: HTMLElement | undefined;
	let leftovers: HTMLSpanElement | undefined;

	$: rawText = $_(keypath);
	$: if (debug) console.debug(`text for keypath ${keypath}: "${rawText}"`);

	let items: Array<Item> = [];

	onMount(async () => {
		{
			// TODO: Unit test this
			// Parse out text and variable names
			const newItems: Array<Item> = [];

			let mode: "discovery" | "text" | "slot" = "discovery";
			let text = "";
			for (const char of rawText) {
				if (char === "{" && mode !== "slot") {
					if (mode === "text") {
						// Finish text node
						newItems.push({ isVar: false, text });
					}
					// Start variable name
					text = "";
					mode = "slot";
				} else if (char === "}" && mode === "slot") {
					// We've hit the end of a variable name
					if (text === "") {
						// but the brackets were empty. Treat that as a text node
						newItems.push({ isVar: false, text: "{}" });
					} else {
						newItems.push({ isVar: true, name: text });
					}
					text = "";
					mode = "discovery";
				} else if (mode === "slot") {
					// Continue variable name
					text += char;
				} else {
					// Continue text
					text += char;
					mode = "text";
				}
			}
			if (text !== "") {
				if (mode === "text") {
					// Finished, but there's some string left
					newItems.push({ isVar: false, text });
				} else if (mode === "slot") {
					// Finished, but we ended with an incomplete variable. Push it as text
					text = `{${text}`; // make sure to include the variable starter
					newItems.push({ isVar: false, text });
				}
			}

			items = newItems;
			if (debug) console.debug("Items:", items);
			await processSlots();
		}
	});

	function hasDataset(tbd: Element): tbd is HTMLElement {
		return (tbd as HTMLElement).dataset["i18nKey"] !== undefined;
	}

	async function processSlots() {
		await tick();
		if (!leftovers || !root) return;

		const slots = Array.from(leftovers.children);
		const targets = Array.from(root.children).filter(hasDataset);

		if (debug) console.debug(`targets: ${targets.length}`, targets);
		slots.forEach((stuff, idx) => {
			// Move this slot to the one at index `idx`
			const slotName = stuff.slot;
			if (debug) console.debug(`slotName: ${slotName}`);
			const target = targets[idx];
			if (debug) console.debug("target:", target);
			if (!target) return; // Ignore this item if we don't know where it goes
			stuff.remove();
			target.appendChild(stuff);
		});
	}
</script>

<svelte:element this={tag} bind:this={root} class={$$props["class"]}>
	{#each items as item}
		{#if item.isVar}{#if debug}&lbrace;begin: {item.name}&rbrace;{/if}<span
				data-i18n-key={item.name}
			/>{#if debug}&lbrace;end: {item.name}&rbrace;{/if}{:else}{item.text}{/if}
	{/each}
	<span bind:this={leftovers}>
		<slot />
	</span>
</svelte:element>
