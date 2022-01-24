<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

interface Page {
	path: string;
	title: string;
}

const pages = computed<Array<Page>>(() => [
	{ path: "/", title: "Home" },
	{ path: "/login", title: "Login" },
]);

const route = useRoute();
const currentPath = computed(() => route.path);
</script>

<template>
	<nav class="navbar navbar-expand-sm navbar-dark">
		<router-link to="/" class="navbar-brand">Accountable</router-link>
		<!-- FIXME: toggler does nothing rn -->
		<button
			class="navbar-toggler"
			type="button"
			data-toggle="collapse"
			data-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon" />
		</button>

		<!-- TODO: Change these styles. Too similar to lab 1 -->
		<div id="navbarSupportedContent" class="collapse navbar-collapse">
			<ul class="navbar-nav mr-auto">
				<li
					v-for="page in pages"
					:key="page.path"
					class="nav-item active"
					:class="{ active: currentPath === page.path }"
				>
					<router-link
						class="nav-link"
						:class="{ active: currentPath === page.path }"
						:to="page.path"
						>{{ page.title }}
						<span v-if="currentPath === page.path" class="visually-hidden">(current)</span>
					</router-link>
				</li>
			</ul>
		</div>
	</nav>
</template>

<style scoped lang="scss">
@import "styles/bootstrap"; // Let's only use this here, if we can

.navbar-brand {
	display: block;
	transform: translateX(-50%);
	position: absolute;
	left: 50%;
	font-weight: bold;
	font-size: x-large;
}

ul,
.navbar-toggler {
	list-style-type: none;
	position: absolute;
	right: 0;
	margin: 0;
	margin-right: 8pt;
}
</style>
