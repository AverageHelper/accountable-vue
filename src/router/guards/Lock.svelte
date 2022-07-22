<script lang="ts">
	import { fetchSession, lockVault, pKey, uid } from "../../store/authStore";
	import { loginPath } from "router/routes";
	import { navigate } from "svelte-navigator";
	import { onMount } from "svelte";

	let isChecking = true;
	$: isVaultLocked = $uid !== null && !$pKey; // we have a uid but no pKey

	$: if (!isVaultLocked) {
		navigate(loginPath(), { replace: true });
	}

	onMount(async () => {
		lockVault();

		// If vault is logged in and locked, continue. Otherwise, redirect to loginPath()
		if ($uid === null) await fetchSession();

		isChecking = false;
	});
</script>

{#if isChecking}
	<p>Locking...</p>
{:else}
	<slot />
{/if}
