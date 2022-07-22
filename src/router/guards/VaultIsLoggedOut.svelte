<script lang="ts">
	import { accountsPath } from "router/routes";
	import { fetchSession, uid } from "../../store";
	import { onMount } from "svelte";
	import { useFocus, useNavigate } from "svelte-navigator";

	const registerFocus = useFocus();
	const navigate = useNavigate();

	let isChecking = true;
	$: isVaultLoggedIn = $uid !== null;

	$: if (isVaultLoggedIn) {
		// Whenever we log in, go home:
		navigate(accountsPath(), { replace: true });
	}

	onMount(async () => {
		// If we're not sure, fetch the user session
		if ($uid === null) await fetchSession();
		isChecking = false;
	});
</script>

{#if !isChecking && !isVaultLoggedIn}
	<slot {registerFocus} />
{:else}
	<p>Checking auth state...</p>
{/if}
