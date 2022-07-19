/* eslint-disable @typescript-eslint/consistent-type-imports */
interface Stores {
	accounts: ReturnType<typeof import("./accountsStore").useAccountsStore>;
	attachments: ReturnType<typeof import("./attachmentsStore").useAttachmentsStore>;
	locations: ReturnType<typeof import("./locationsStore").useLocationsStore>;
}
/* eslint-enable @typescript-eslint/consistent-type-imports */

export async function stores(this: void): Promise<Stores> {
	const [
		{ useAccountsStore }, //
		{ useAttachmentsStore },
		{ useLocationsStore },
	] = await Promise.all([
		import("./accountsStore"),
		import("./attachmentsStore"),
		import("./locationsStore"),
	]);
	const accounts = useAccountsStore();
	const attachments = useAttachmentsStore();
	const locations = useLocationsStore();
	return { accounts, attachments, locations };
}
