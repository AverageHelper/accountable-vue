<script setup lang="ts">
import { useAuthStore } from "../../store";
import { downloadFileAtUrl } from "../../transport";
import ActionButton from "../ActionButton.vue";
import { ref } from "vue";
import { useToast } from "vue-toastification";

const auth = useAuthStore();
const toast = useToast();

const isLoading = ref(false);

async function downloadStuff(shouldMinify: boolean) {
	isLoading.value = true;
	try {
		const rawData = await auth.getAllUserDataAsJson();
		const data = JSON.stringify(rawData, undefined, shouldMinify ? undefined : "\t");
		const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`;
		downloadFileAtUrl(dataUrl, `accounts${shouldMinify ? "-raw" : ""}.json`);
	} catch (error: unknown) {
		let message: string;
		if (error instanceof Error) {
			message = error.message;
		} else {
			message = JSON.stringify(error);
		}
		toast.error(message);
		console.error(error);
	}
	isLoading.value = false;
}
</script>

<template>
	<form @submit.prevent>
		<h3>Export</h3>
		<p
			>Exports an <strong>unencrypted</strong> copy of all your data in JSON format. (Except
			attachments for now, while we figure out how to export those in one go).</p
		>
		<p
			>This export might get big, and about 1/3 of it is spacing to make the JSON more
			human-readable. If you don't care about that, then we can just export the raw JSON data as
			small as we can make it.</p
		>
		<div class="buttons">
			<ActionButton kind="bordered" :disabled="isLoading" @click.prevent="() => downloadStuff(true)"
				>Export Everything</ActionButton
			>
			<ActionButton
				kind="bordered"
				:disabled="isLoading"
				@click.prevent="() => downloadStuff(false)"
				>Export Everything with nice spacing</ActionButton
			>
		</div>
	</form>
</template>

<style scoped lang="scss">
p {
	margin-bottom: 0;
}

.buttons {
	display: flex;
	flex-flow: row wrap;

	:not(:last-child) {
		margin-right: 8pt;
	}
}
</style>
