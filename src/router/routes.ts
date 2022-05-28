/* Information Pages */

export function homePath(): "/" {
	return "/";
}

export function aboutPath(): "/about" {
	return "/about";
}

export function accountsPath(): "/accounts" {
	return "/accounts";
}

export function securityPath(): "/security" {
	return "/security";
}

export function installPath(): "/install" {
	return "/install";
}

/* Auth Pages */

export function signupPath(): "/signup" {
	return "/signup";
}

export function loginPath(): "/login" {
	return "/login";
}

export function logoutPath(): "/logout" {
	return "/logout";
}

export function settingsPath(): "/settings" {
	return "/settings";
}

/* Data Pages */

export function accountPath<ID extends string>(accountId: ID): `/accounts/${typeof accountId}` {
	return `${accountsPath()}/${accountId}`;
}

export function transactionsByMonth<AID extends string, MID extends string>(
	accountId: AID,
	month: MID
): `/accounts/${typeof accountId}/months/${typeof month}` {
	return `/accounts/${accountId}/months/${month}`;
}

export function transactionPath<AID extends string, TID extends string>(
	accountId: AID,
	transactionId: TID
): `/accounts/${typeof accountId}/transactions/${typeof transactionId}` {
	return `${accountsPath()}/${accountId}/transactions/${transactionId}`;
}

export function attachmentsPath(): "/attachments" {
	return "/attachments";
}

export function locationsPath(): "/locations" {
	return "/locations";
}

export function tagsPath(): "/tags" {
	return "/tags";
}
