<script setup lang="ts">
import AccountsList from "./components/AccountsList.vue";
</script>

<template>
	<img alt="Vue logo" src="./assets/logo.png" />
	<AccountsList />
</template>

<style lang="scss">
@use "styles/colors" as *;
@import "styles/setup";

#app {
	text-align: center;
	margin-top: 60px;
}
</style>
