<script lang="ts">
	import { _ } from "svelte-i18n";
	import I18N from "./components/I18N.svelte";
	import Footer from "./Footer.svelte";
	import OutLink from "./components/OutLink.svelte";
</script>

<main class="content">
	<!-- FIXME: This document is a draft. I think it's pretty close to what we actually do, but I need to proofread it again. Please take everything here with a grain of *salt* ;) -->

	<h1>{$_("security-faq.heading")}</h1>
	<I18N keypath="security-faq.summary" tag="p">
		<strong slot="tldr">{$_("security-faq.tldr")}</strong>
	</I18N>

	<!-- What kind of encryption? -->
	<h2>{$_("security-faq.encryption-kind.question")}</h2>
	<I18N keypath="security-faq.encryption-kind.answer" tag="p">
		<OutLink slot="mge" to="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard"
			>{$_("security-faq.encryption-kind.mge")}</OutLink
		>
	</I18N>

	<!-- Who does encryption? Who has keys? -->
	<h2>{$_("security-faq.where-keys.question")}</h2>
	<I18N keypath="security-faq.where-keys.answer1" tag="p" />
	<I18N keypath="security-faq.where-keys.answer2" tag="p">
		<em slot="dek">{$_("security-faq.where-keys.dek")}</em>
		<em slot="kek">{$_("security-faq.where-keys.kek")}</em>
	</I18N>
	<I18N keypath="security-faq.where-keys.answer3" tag="p">
		<OutLink slot="sha512" to="https://en.wikipedia.org/wiki/SHA-2"
			>{$_("security-faq.where-keys.sha512")}</OutLink
		>
		<OutLink slot="pbkdf2" to="https://en.wikipedia.org/wiki/PBKDF2"
			>{$_("security-faq.where-keys.pbkdf2")}</OutLink
		>
		<OutLink
			slot="source"
			to="https://github.com/AverageHelper/accountable-vue/blob/main/src/transport/cryption.ts"
			>{$_("security-faq.where-keys.source")}</OutLink
		>
	</I18N>

	<!-- Auth: What about my password? -->
	<h2>{$_("security-faq.passphrase-handling.question")}</h2>
	<I18N keypath="security-faq.passphrase-handling.answer1" tag="p" />
	<I18N keypath="security-faq.passphrase-handling.answer2" tag="p">
		<OutLink slot="salts" to="https://en.wikipedia.org/wiki/Salt_(cryptography)"
			>{$_("security-faq.passphrase-handling.salts")}</OutLink
		>
		<OutLink slot="hashes" to="https://en.wikipedia.org/wiki/Cryptographic_hash_function"
			>{$_("security-faq.passphrase-handling.hashes")}</OutLink
		>
	</I18N>
	<I18N keypath="security-faq.passphrase-handling.answer3" tag="p" />
	<I18N keypath="security-faq.passphrase-handling.answer4" tag="p">
		<em slot="dek">{$_("security-faq.passphrase-handling.dek")}</em>
	</I18N>
	<I18N keypath="security-faq.passphrase-handling.answer5" tag="p">
		<OutLink slot="sha512" to="https://en.wikipedia.org/wiki/SHA-2"
			>{$_("security-faq.passphrase-handling.sha512")}</OutLink
		>
		<OutLink slot="bcrypt" to="https://www.npmjs.com/package/bcrypt"
			>{$_("security-faq.passphrase-handling.bcrypt")}</OutLink
		>
		<OutLink
			slot="source"
			to="https://github.com/AverageHelper/accountable-vue/blob/main/server/auth/index.ts"
			>{$_("security-faq.passphrase-handling.source")}</OutLink
		>
	</I18N>

	<!-- Password change -->
	<h2>{$_("security-faq.change-passphrase.question")}</h2>
	<I18N keypath="security-faq.change-passphrase.answer1" tag="p" />
	<I18N keypath="security-faq.change-passphrase.answer2" tag="p" />
	<I18N keypath="security-faq.change-passphrase.answer3" tag="p" />

	<!-- Password loss -->
	<h2>{$_("security-faq.lost-passphrase.question")}</h2>
	<I18N keypath="security-faq.lost-passphrase.answer1" tag="p" />
	<p>
		<OutLink to="https://bitwarden.com">{$_("security-faq.lost-passphrase.answer2")}</OutLink>
	</p>

	<!-- Database loss -->
	<h2>{$_("security-faq.database-breach.question")}</h2>
	<I18N keypath="security-faq.database-breach.answer1" tag="p" />

	<Footer />
</main>
