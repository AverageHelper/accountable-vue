/* eslint-disable @typescript-eslint/consistent-type-imports */
interface Stores {
	accounts: ReturnType<typeof import("./accountsStore").useAccountsStore>;
	attachments: ReturnType<typeof import("./attachmentsStore").useAttachmentsStore>;
	locations: ReturnType<typeof import("./locationsStore").useLocationsStore>;
	tags: ReturnType<typeof import("./tagsStore").useTagsStore>;
	transactions: ReturnType<typeof import("./transactionsStore").useTransactionsStore>;
}
/* eslint-enable @typescript-eslint/consistent-type-imports */

export async function stores(this: void): Promise<Stores> {
	const [
		{ useAccountsStore },
		{ useAttachmentsStore },
		{ useLocationsStore },
		{ useTagsStore },
		{ useTransactionsStore },
	] = await Promise.all([
		import("./accountsStore"),
		import("./attachmentsStore"),
		import("./locationsStore"),
		import("./tagsStore"),
		import("./transactionsStore"),
	]);
	const accounts = useAccountsStore();
	const attachments = useAttachmentsStore();
	const locations = useLocationsStore();
	const tags = useTagsStore();
	const transactions = useTransactionsStore();
	return { accounts, attachments, locations, tags, transactions };
}
