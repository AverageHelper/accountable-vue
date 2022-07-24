<!--
	@component

	When mounted, redirects to the provided path.
 -->
<script lang="ts">
	import { useLocation, useNavigate } from "svelte-navigator";
	import { onMount } from "svelte";

	export let to: string;

	const location = useLocation();
	const navigate = useNavigate();

	onMount(() => {
		console.warn(`We should not have landed at '${$location.pathname}', redirecting to '${to}'...`);

		navigate(to, { replace: true });
	});
</script>
