<script lang="ts">
	import { loginPath } from "../routes";
	import { logout } from "../../store";
	import { onMount } from "svelte";
	import { useLocation, useNavigate } from "svelte-navigator";

	const location = useLocation();
	const navigate = useNavigate();

	function goToLogin() {
		navigate(loginPath(), {
			state: { from: $location.pathname },
			replace: true,
		});
	}

	onMount(async () => {
		await logout();
		// We're logged out. Go to login:
		goToLogin();
	});
</script>

<main class="content">
	<p>Logging out...</p>
</main>
