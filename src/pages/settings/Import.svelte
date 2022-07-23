<script lang="ts">
	import type { DatabaseSchema } from "../../model/DatabaseSchema";
	import type { Entry } from "@zip.js/zip.js";
	import { accountsPath } from "../../router";
	import { BlobReader, TextWriter, ZipReader } from "@zip.js/zip.js";
	import { create } from "superstruct";
	import { handleError } from "../../store";
	import { schema } from "../../model/DatabaseSchema";
	import { toast } from "@zerodevx/svelte-toast";
	import { useNavigate } from "svelte-navigator";
	import FileInput from "../attachments/FileInput.svelte";
	import ActionButton from "../../components/buttons/ActionButton.svelte";
	import ImportProcessModal from "./ImportProcessModal.svelte";

	const navigate = useNavigate();

	let isLoading = false;
	let archive: Array<Entry> | null = null;
	let dbName = "";
	let db: DatabaseSchema | null = null;

	async function onFileReceived(event: CustomEvent<File | null>) {
		const file = event.detail;
		if (!file) return;
		archive = null;
		dbName = "";
		db = null;
		isLoading = true;

		let msg = `Loading ${file.name}`; // TODO: I18N
		const progressMeter = toast.push(msg, {
			duration: 300,
			initial: 0,
			next: 0,
			dismissable: false,
		});

		const reader = new ZipReader(new BlobReader(file));
		try {
			const zipFile = await reader.getEntries({
				onprogress: progress => {
					msg = `Loading ${file.name}: ${progress}%`; // TODO: I18N
					toast.set(progressMeter, { msg, next: progress });
				},
			});

			const dbFile = zipFile.find(f => f.filename === "accountable/database.json");
			if (!dbFile?.getData)
				throw new TypeError("accountable/database.json not present at root of zip"); // TODO: I18N

			const jsonString = (await dbFile.getData(new TextWriter())) as string;
			const json = JSON.parse(jsonString) as unknown;
			db = create(json, schema);
			dbName = file.name;
			archive = zipFile;
		} catch (error) {
			handleError(error);
		} finally {
			toast.set(progressMeter, { next: 1 });
			await reader.close();
		}

		isLoading = false;
	}

	function forgetFile() {
		db = null;
		dbName = "";
		navigate(accountsPath());
	}
</script>

<form on:submit|preventDefault>
	<!-- TODO: I18N -->
	<h3>Import</h3>
	<p>Import a JSON file describing one or more accounts.</p>
	<div class="buttons-79507e92">
		<FileInput accept="application/zip" disabled={isLoading} on:input={onFileReceived} let:click>
			<ActionButton
				kind="bordered"
				disabled={isLoading}
				on:click={e => {
					e.preventDefault();
					click();
				}}>Import</ActionButton
			>
		</FileInput>
	</div>
</form>

<ImportProcessModal fileName={dbName} {db} zip={archive} on:finished={forgetFile} />

<style lang="scss" global>
	p {
		margin-bottom: 0;
	}

	.buttons-79507e92 {
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
