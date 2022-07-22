<script lang="ts">
	import { fetchSession, pKey, uid } from "../../store";
	import { onMount } from "svelte";
	import { useFocus, useNavigate } from "svelte-navigator";
	import { lockPath } from "router/routes";

	const registerFocus = useFocus();
	const navigate = useNavigate();

	let isChecking = true;
	$: isVaultUnlocked = $uid !== null && $pKey !== null;

	$: if (!isVaultUnlocked) {
		// We're locked. Go to login:
		navigate(lockPath(), { replace: true });
	}

	onMount(async () => {
		// If we're not sure, fetch the user session
		if ($uid === null) await fetchSession();

		isChecking = false;
	});
</script>

{#if !isChecking && isVaultUnlocked}
	<slot {registerFocus} />
{:else}
	<p>Checking lock state...</p>
{/if}
