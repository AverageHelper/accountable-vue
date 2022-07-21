<!-- 
	
	Usage:
	
	```json
	"place": {
		"invitation": "Let's go to the {place}!",
		"beach": "beach"
	}
	```

	<script>
		import { _ } from "svelte-i18n";
	</script>
	
	<I18N keypath="place.invitation">
		<em slot="place">{$_("place.beach")}</em>
	</I18N>
	
 -->
<script lang="ts">
	// Based on https://www.npmjs.com/package/@neiwad/svelte-i18n-slots

	import { _ } from "svelte-i18n";
	import { onMount } from "svelte";

	export let keypath: string;
	export let tag: keyof HTMLElementTagNameMap;

	interface Item {
		isVar: boolean;
		name?: string;
		text?: string;
	}

	let cutted: Array<Item> = [];
	let _slots: Array<HTMLSpanElement | undefined> = [];
	$: slots = _slots.filter(Boolean); // clean up dirty refs

	function processSlots() {
		slots.forEach(slot => {
			const slotName = slot.dataset.i18nKey;
			const children = Array.from(slot.children) as Array<HTMLElement>;
			children.forEach(c => {
				if (c.dataset.i18nKey !== slotName) {
					c.remove();
				}
				delete c.dataset.i18nKey;
			});
			slot.replaceWith(...slot.children);
		});
	}

	onMount(() => {
		const testString = $_(keypath); // get the locale text
		const reBrackets = /\{(.*?)\}/g; // find variable declarations
		const listOfText: Array<string> = [];
		let found: RegExpExecArray;
		while ((found = reBrackets.exec(testString))) {
			listOfText.push(found[1]);
		}
		cutted = [];

		listOfText.forEach((text, index) => {
			if (index === 0) {
				cutted.push({ isVar: false, text: testString.split(`{${text}}`)[0] });
				cutted.push({ isVar: true, name: text });
				cutted.push({ isVar: false, text: testString.split(`{${text}}`)[1] });
			} else {
				const toCut = cutted[cutted.length - 1];
				cutted[cutted.length - 1] = { isVar: false, text: toCut!.text!.split(`{${text}}`)[0] };
				cutted.push({ isVar: true, name: text });
				cutted.push({ isVar: false, text: toCut!.text!.split(`{${text}}`)[1] });
			}
		});
		cutted = cutted.filter(f => f);
		setTimeout(() => {
			processSlots();
		});
	});
</script>

<svelte:element this={tag} class={$$props["class"]}>
	{#each cutted as cut, i}
		{#if cut.isVar}
			<span bind:this={_slots[i]} data-i18n-key={cut.name}>
				<slot />
			</span>
		{:else}
			{cut.text}
		{/if}
	{/each}
</svelte:element>
