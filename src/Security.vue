<script setup lang="ts">
import Footer from "./Footer.vue";
import OutLink from "./components/OutLink.vue";
</script>

<template>
	<main class="content">
		<h1>Security FAQs</h1>
		<!-- FIXME: This document is a draft. I think it's pretty close to what we actually do, but I need to proofread it again. Please take everything here with a grain of *salt* ;) -->

		<p><strong>TL;DR</strong> Your data is unreadable by anyone but you (as far as I know.)</p>

		<!-- What kind of encryption? -->
		<h2>What sort of encryption does Accountable do?</h2>
		<p
			>We use only the best
			<OutLink to="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard"
				>&quot;military-grade encryption&quot;</OutLink
			>
			everyone else uses.</p
		>

		<!-- Who does encryption? Who has keys? -->
		<h2>Who holds the encryption keys?</h2>
		<p>You do.</p>
		<p
			>When you create an account, Accountable generates a data-encryption key <em>(DEK)</em> to use
			to encrypt and decrypt your data. Accountable generates a separate key-encryption key
			<em>(KEK)</em> from your given passphrase to use to encrypt your DEK. Accountable then
			encrypts the DEK and sends it to our servers to store. This encrypted blob is useless without
			the KEK to decrypt it, and your KEK is unknown without your passphrase.</p
		>
		<p
			>We use <OutLink to="https://en.wikipedia.org/wiki/SHA-2">SHA-512</OutLink> and
			<OutLink to="https://en.wikipedia.org/wiki/PBKDF2">PBKDF2</OutLink> with 10,000 rounds to
			generate these keys. See
			<OutLink
				to="https://github.com/AverageHelper/accountable-vue/blob/main/src/transport/cryption.ts"
				>the relevant source code</OutLink
			>.</p
		>

		<!-- Auth: What about my password? -->
		<h2>What does Accountable do with my passphrase?</h2>
		<p>Accountable never transmits your passphrase anywhere, even over TLS.</p>
		<p
			>Accountable generates a one-way hash of your passphrase, and sends that instead. The server
			then <OutLink to="https://en.wikipedia.org/wiki/Salt_(cryptography)">salts</OutLink> and
			<OutLink to="https://en.wikipedia.org/wiki/Cryptographic_hash_function">hashes</OutLink> that
			hash, and stores the resulting mash. (That mash has nothing to do with how your data is
			encrypted; see above.)</p
		>
		<p
			>When you log in again, Accountable repeats the procedure on your hashed passphrase, and
			checks to see whether this new mash matches the stored mash.</p
		>
		<p
			>This mash is what Accountable's server uses to guard access to your encrypted database. If
			someone can give the server a passphrase hash that results in the correct mash, the server
			assumes that person is you, and happily sends over your encrypted data. No part of this
			mash&mdash;the hash the server gets, the salt the server generates, or the final mash of the
			two&mdash;can be used to decrypt your data. (Accountable uses your <em>DEK</em> for that; see
			above.)</p
		>
		<p
			>We use <OutLink to="https://en.wikipedia.org/wiki/SHA-2">SHA-512</OutLink> and
			<OutLink to="https://www.npmjs.com/package/bcrypt">bcrypt</OutLink> with a cost factor of 15.
			See
			<OutLink to="https://github.com/AverageHelper/accountable-vue/blob/main/server/auth/index.ts"
				>the relevant source code</OutLink
			>.</p
		>

		<!-- Password change -->
		<h2>What if I change my passphrase?</h2>
		<p>We don't re-encrypt the entire database, if that's what you're thinking.</p>
		<p
			>Since your passphrase is only used to generate a KEK, Accountable only re-encrypts the DEK
			using the new KEK that your new passphrase generates.</p
		>
		<p
			>If you think your DEK may be compromised, I'm sorry. You may export your data, delete your
			old account, create a new account, and import your data again. This will re-encrypt everything
			using a fresh DEK.</p
		>

		<!-- Password loss -->
		<h2>What happens if I lose my passphrase?</h2>
		<p
			>You lose your data. There is nothing I or anyone can do (unless your passphrase is
			easily-cracked. Give it a go!) Without your passphrase, nobody can generate the KEK that
			encrypts the DEK that encrypts your data. Without that passphrase, your data is lost.</p
		>
		<p><OutLink to="https://bitwarden.com">Don't lose your passphrase.</OutLink></p>

		<!-- Database loss -->
		<h2>What happens if someone steals the database?</h2>
		<p
			>If your passphrase is good, there's nothing anyone but you can do with Accountable's
			database. The server never sees your DEK, its corresponding KEK, or your passphrase, and
			cannot put those into the database.</p
		>

		<Footer />
	</main>
</template>
