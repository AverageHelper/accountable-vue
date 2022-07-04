<script setup lang="ts">
import ActionButton from "./buttons/ActionButton.vue";
import Confirm from "./Confirm.vue";
import { computed } from "vue";
import { useAuthStore } from "../store";

const emit = defineEmits(["yes", "no"]);

defineProps({
	isOpen: { type: Boolean, required: true },
});

const auth = useAuthStore();

const accountId = computed(() => auth.accountId);

function no() {
	emit("no");
}

function yes() {
	emit("yes");
}
</script>

<template>
	<Confirm :is-open="isOpen" :close-modal="no">
		<template #message>
			<i18n-t keypath="login.new-account.is-account-id-safe" tag="account">
				<template #accountId>
					<code>{{ accountId }}</code>
				</template>
			</i18n-t>
		</template>

		<template #primary-action>
			<ActionButton kind="bordered-primary" @click="yes">{{ $t("common.yes") }}</ActionButton>
		</template>
		<template #cancel-action>
			<ActionButton kind="bordered-secondary" @click="no">{{ $t("common.not-yet") }}</ActionButton>
		</template>
	</Confirm>
</template>
