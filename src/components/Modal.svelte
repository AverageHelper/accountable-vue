<!-- Based on a design by Ken Corbett <https://github.com/KenCorbettJr> -->
<script lang="ts">
	import { onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import Portal from "svelte-portal";
	import XIcon from "../icons/X.svelte";

	export let open: boolean;
	export let closeModal: (() => void) | null = null;

	function onClose() {
		if (closeModal) {
			closeModal();
		}
	}

	onDestroy(() => {
		onClose();
	});
</script>

<Portal target="#modal">
	{#if open}
		<div transition:fly class="modal__wrapper" on:click|self={onClose}>
			{#if closeModal}
				<a href="#" class="modal__close-button" on:click|preventDefault={closeModal}>
					<XIcon />
				</a>
			{/if}
			<div class="modal">
				<slot />
			</div>
		</div>
	{/if}
</Portal>

<style type="text/scss">
	@use "styles/setup" as *;
	@use "styles/colors" as *;

	.modal {
		font-size: 16px;
		transition: opacity 0.3s ease-out 0.1s, transform 0.3s ease-out 0.1s;
		background: color($background);
		color: color($label);
		width: 600px;
		max-width: 100%;
		padding: 3em;
		margin: 9vh auto 18%;
		transform: translateY(0);
		opacity: 1;
		transition: all 0.3s cubic-bezier(0.36, 0, 0.66, -0.56) 0.02s;

		@include mq($until: tablet) {
			padding: 2em 1em 1em;
		}

		.modal-enter-from &,
		.modal-leave-to & {
			transform: translateY(-6em) scale(0.9);
			opacity: 0;
		}

		&__close-button {
			margin: 0.5em 0.25em 0 0;
			color: color($white);
			text-decoration: none;
			font-size: 2em;
			line-height: 0.95em;
			position: fixed;
			right: 0.3em;
			opacity: 1;
			transition: all 0.3s ease 0.5s;
			text-shadow: -1px -1px 3px color($transparent-gray), 1px -1px 3px color($transparent-gray),
				-1px 1px 3px color($transparent-gray), 1px 1px 3px color($transparent-gray);
			z-index: 100;

			.icon {
				width: 1em;
				height: 1em;
			}

			.modal-enter-from &,
			.modal-leave-to & {
				opacity: 0;
			}
		}

		&__logo-wrapper {
			text-align: center;
		}

		&__wrapper {
			background-color: color($transparent-gray);
			z-index: 4000;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			padding: 0 1em;
			overflow: auto;
			transition: all 500ms ease;
			backdrop-filter: blur(1px);
			backface-visibility: hidden;
			perspective: 1000;
			transform: translate3d(0, 0, 0), translateZ(0);

			&.modal-enter-from,
			&.modal-leave-to {
				background-color: color($clear);
				backdrop-filter: blur(0px);
			}
		}

		&__header {
			margin: 0 0 1em;
			text-align: center;
			font-size: 30px;

			@include mq($until: tablet) {
				font-size: 22px;
			}
		}

		&__button-wrap {
			margin-top: 1em;
		}
	}
</style>
