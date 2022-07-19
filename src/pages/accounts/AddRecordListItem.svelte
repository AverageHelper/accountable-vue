<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import ListItem from "../../components/ListItem.svelte";
	import PlusWithCircle from "../../icons/PlusWithCircle.svelte";

	const dispatch = createEventDispatcher<{
		click: void;
	}>();

	export let noun: string = "record";

	function onClick(event: Event) {
		event.preventDefault();
		dispatch("click");
	}
</script>

<!-- TODO: I18N -->
<ListItem class="add" title={`Add a new ${noun}`} to="" on:click={onClick}>
	<PlusWithCircle slot="icon" class="icon" />
</ListItem>

<style type="text/scss">
	@use "styles/colors" as *;

	.add {
		color: color($green);
		min-height: 44pt;
	}

	.icon {
		margin-right: 7pt;
		margin-left: 4pt;
		color: color($green);
	}
</style>
