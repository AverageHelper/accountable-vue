<script lang="ts">
	import type { ColorID } from "../model/Color";

	export let colorId: ColorID = "blue";
</script>

<div class={`dot dot--${colorId} ${$$props["class"]}`}>
	<slot />
</div>

<style type="text/scss">
	@use "styles/colors" as *;

	.dot {
		width: 2em;
		height: 2em;
		border-radius: 50%;
		user-select: none;

		&--red {
			background-color: color($red);
		}
		&--orange {
			background-color: color($orange);
			color: color($label-light);
		}
		&--yellow {
			background-color: color($yellow);
			color: color($label-light);
		}
		&--green {
			background-color: color($green);
		}
		&--blue {
			background-color: color($blue);
		}
		&--purple {
			background-color: color($purple);
		}
	}
</style>
