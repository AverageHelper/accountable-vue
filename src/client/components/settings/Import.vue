<script setup lang="ts">
import type { DatabaseSchema } from "../../model/DatabaseSchema";
import ActionButton from "../ActionButton.vue";
import FileInput from "../attachments/FileInput.vue";
import ImportProcessModal from "./ImportProcessModal.vue";
import JSZip from "jszip";
import { schema } from "../../model/DatabaseSchema";
import { ref } from "vue";
import { useUiStore } from "../../store";
import { useRouter } from "vue-router";

const ui = useUiStore();
const router = useRouter();

const isLoading = ref(false);
const zip = ref<JSZip | null>(null);
const dbName = ref("");
const db = ref<DatabaseSchema | null>(null);

// TODO: Move this into a store
async function onFileReceived(file: File) {
	zip.value = null;
	dbName.value = "";
	db.value = null;
	isLoading.value = true;

	try {
		const zipFile = await JSZip.loadAsync(file);
		const dbFile = zipFile.files["accountable/database.json"] ?? null;
		if (!dbFile) throw new TypeError("accountable/database.json not present at root of zip");

		const jsonString = await dbFile.async("string");
		const json = JSON.parse(jsonString) as unknown;
		db.value = (await schema.validateAsync(json)) as DatabaseSchema;
		dbName.value = file.name;
		zip.value = zipFile;
	} catch (error: unknown) {
		ui.handleError(error);
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

	<ImportProcessModal :file-name="dbName" :db="db" :zip="zip" @finished="forgetFile" />
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
