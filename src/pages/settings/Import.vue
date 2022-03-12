<script setup lang="ts">
import type { DatabaseSchema } from "../../model/DatabaseSchema";
import type { Entry } from "@zip.js/zip.js";
import ActionButton from "../../components/buttons/ActionButton.vue";
import FileInput from "../attachments/FileInput.vue";
import ImportProcessModal from "./ImportProcessModal.vue";
import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js";
import { create } from "superstruct";
import { ref } from "vue";
import { schema } from "../../model/DatabaseSchema";
import { useUiStore } from "../../store";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";

const ui = useUiStore();
const router = useRouter();
const toast = useToast();

const isLoading = ref(false);
const archive = ref<Array<Entry> | null>(null);
const dbName = ref("");
const db = ref<DatabaseSchema | null>(null);

async function onFileReceived(file: File) {
	archive.value = null;
	dbName.value = "";
	db.value = null;
	isLoading.value = true;

	let progressMessage = `Loading ${file.name}`;
	const progressMeter = toast.info(progressMessage);

	const reader = new ZipReader(new BlobReader(file));
	try {
		const zipFile = await reader.getEntries({
			onprogress: progress => {
				progressMessage = `Loading ${file.name}: ${progress}%`;
				toast.update(progressMeter, { content: progressMessage });
			},
		});

		const dbFile = zipFile.find(f => f.filename === "accountable/database.json");
		if (!dbFile?.getData)
			throw new TypeError("accountable/database.json not present at root of zip");

		const jsonString = (await dbFile.getData(new TextWriter())) as string;
		const json = JSON.parse(jsonString) as unknown;
		db.value = create(json, schema);
		dbName.value = file.name;
		archive.value = zipFile;
	} catch (error: unknown) {
		ui.handleError(error);
	} finally {
		toast.dismiss(progressMeter);
		await reader.close();
	}

	isLoading.value = false;
}

function forgetFile() {
	db.value = null;
	dbName.value = "";
	void router.push("/accounts");
}
</script>

<template>
	<form @submit.prevent>
		<h3>Import</h3>
		<p>Import a JSON file describing one or more accounts.</p>
		<div class="buttons">
			<FileInput accept="application/zip" :disabled="isLoading" @input="onFileReceived">
				<template #default="{ click }">
					<ActionButton kind="bordered" :disabled="isLoading" @click.prevent="click"
						>Import</ActionButton
					>
				</template>
			</FileInput>
		</div>
	</form>

	<ImportProcessModal :file-name="dbName" :db="db" :zip="archive" @finished="forgetFile" />
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

	* {
		text-decoration: none;
	}
}
</style>
