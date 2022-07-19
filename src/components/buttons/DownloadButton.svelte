<script lang="ts">
	import type { Attachment } from "../../model/Attachment";
	import { _ } from "svelte-i18n";
	import { downloadFileAtUrl } from "../../transport";
	import { useAttachmentsStore } from "../../store";
	import ActionButton from "./ActionButton.svelte";
	import DownloadIcon from "../../icons/Download.svelte";

	export let file: Attachment;

	const attachments = useAttachmentsStore();

	$: imgUrl = attachments.files[file.id] ?? null;
	$: disabled = imgUrl === null;

	function startDownload(event: Event) {
		event.preventDefault();
		if (imgUrl === null || !imgUrl) return;

		downloadFileAtUrl(imgUrl, file.title);
	}
</script>

<ActionButton class={$$props.class} kind="bordered-primary" {disabled} on:click={startDownload}>
	<DownloadIcon class="icon" />
	<span>{$_("common.download-action")}</span>
</ActionButton>

<style type="text/scss">
	.icon {
		margin-right: 6pt;
	}
</style>
