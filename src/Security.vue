<script setup lang="ts">
import Footer from "./Footer.vue";
import OutLink from "./components/OutLink.vue";
</script>

<template>
	<main class="content">
		<!-- FIXME: This document is a draft. I think it's pretty close to what we actually do, but I need to proofread it again. Please take everything here with a grain of *salt* ;) -->

		<h1>{{ $t("security-faq.heading") }}</h1>
		<i18n-t keypath="security-faq.summary" tag="p">
			<template #tldr>
				<strong>{{ $t("security-faq.tldr") }}</strong>
			</template>
		</i18n-t>

		<!-- What kind of encryption? -->
		<h2>{{ $t("security-faq.encryption-kind.question") }}</h2>
		<i18n-t keypath="security-faq.encryption-kind.answer" tag="p">
			<template #mge>
				<OutLink to="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard"
					>&quot;military-grade encryption&quot;</OutLink
				>
			</template>
		</i18n-t>

		<!-- Who does encryption? Who has keys? -->
		<h2>{{ $t("security-faq.where-keys.question") }}</h2>
		<i18n-t keypath="security-faq.where-keys.answer1" tag="p" />
		<i18n-t keypath="security-faq.where-keys.answer2" tag="p">
			<template #dek>
				<em>{{ $t("security-faq.where-keys.dek") }}</em>
			</template>
			<template #kek>
				<em>{{ $t("security-faq.where-keys.kek") }}</em>
			</template>
		</i18n-t>
		<i18n-t keypath="security-faq.where-keys.answer3" tag="p">
			<template #sha512>
				<OutLink to="https://en.wikipedia.org/wiki/SHA-2">{{
					$t("security-faq.where-keys.sha512")
				}}</OutLink>
			</template>
			<template #pbkdf2>
				<OutLink to="https://en.wikipedia.org/wiki/PBKDF2">{{
					$t("security-faq.where-keys.pbkdf2")
				}}</OutLink>
			</template>
			<template #source>
				<OutLink
					to="https://github.com/AverageHelper/accountable-vue/blob/main/src/transport/cryption.ts"
					>{{ $t("security-faq.where-keys.source") }}</OutLink
				>
			</template>
		</i18n-t>

		<!-- Auth: What about my password? -->
		<h2>{{ $t("security-faq.passphrase-handling.question") }}</h2>
		<i18n-t keypath="security-faq.passphrase-handling.answer1" tag="p" />
		<i18n-t keypath="security-faq.passphrase-handling.answer2" tag="p">
			<template #salts>
				<OutLink to="https://en.wikipedia.org/wiki/Salt_(cryptography)">{{
					$t("security-faq.passphrase-handling.salts")
				}}</OutLink>
			</template>
			<template #hashes>
				<OutLink to="https://en.wikipedia.org/wiki/Cryptographic_hash_function">{{
					$t("security-faq.passphrase-handling.hashes")
				}}</OutLink>
			</template>
		</i18n-t>
		<i18n-t keypath="security-faq.passphrase-handling.answer3" tag="p" />
		<i18n-t keypath="security-faq.passphrase-handling.answer4" tag="p">
			<template #dek>
				<em>{{ $t("security-faq.passphrase-handling.dek") }}</em>
			</template>
		</i18n-t>
		<i18n-t keypath="security-faq.passphrase-handling.answer5" tag="p">
			<template #sha512>
				<OutLink to="https://en.wikipedia.org/wiki/SHA-2">SHA-512</OutLink>
			</template>
			<template #bcrypt>
				<OutLink to="https://www.npmjs.com/package/bcrypt">bcrypt</OutLink>
			</template>
			<template #source>
				<OutLink
					to="https://github.com/AverageHelper/accountable-vue/blob/main/server/auth/index.ts"
					>the relevant source code</OutLink
				>
			</template>
		</i18n-t>

		<!-- Password change -->
		<h2>{{ $t("security-faq.change-passphrase.question") }}</h2>
		<i18n-t keypath="security-faq.change-passphrase.answer1" tag="p" />
		<i18n-t keypath="security-faq.change-passphrase.answer2" tag="p" />
		<i18n-t keypath="security-faq.change-passphrase.answer3" tag="p" />

		<!-- Password loss -->
		<h2>{{ $t("security-faq.lost-passphrase.question") }}</h2>
		<i18n-t keypath="security-faq.lost-passphrase.answer1" tag="p" />
		<p>
			<OutLink to="https://bitwarden.com">{{ $t("security-faq.lost-passphrase.answer2") }}</OutLink>
		</p>

		<!-- Database loss -->
		<h2>{{ $t("security-faq.database-breach.question") }}</h2>
		<i18n-t keypath="security-faq.database-breach.answer1" tag="p" />

		<Footer />
	</main>
</template>
