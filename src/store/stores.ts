/* eslint-disable @typescript-eslint/consistent-type-imports */
interface Stores {
	accounts: ReturnType<typeof import("./accountsStore").useAccountsStore>;
}
/* eslint-enable @typescript-eslint/consistent-type-imports */

export async function stores(this: void): Promise<Stores> {
	const [
		{ useAccountsStore }, //
	] = await Promise.all([
		import("./accountsStore"), //
	]);
	const accounts = useAccountsStore();
	return { accounts };
}
