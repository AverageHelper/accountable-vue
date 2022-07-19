/* eslint-disable @typescript-eslint/consistent-type-imports */
interface Stores {
	accounts: ReturnType<typeof import("./accountsStore").useAccountsStore>;
	attachments: ReturnType<typeof import("./attachmentsStore").useAttachmentsStore>;
}
/* eslint-enable @typescript-eslint/consistent-type-imports */

export async function stores(this: void): Promise<Stores> {
	const [
		{ useAccountsStore }, //
		{ useAttachmentsStore },
	] = await Promise.all([
		import("./accountsStore"), //
		import("./attachmentsStore"),
	]);
	const accounts = useAccountsStore();
	const attachments = useAttachmentsStore();
	return { accounts, attachments };
}
