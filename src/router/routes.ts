/* Information Pages */

export function home(): "/" {
	return "/";
}

export function about(): "/about" {
	return "/about";
}

export function accounts(): "/accounts" {
	return "/accounts";
}

export function security(): "/security" {
	return "/security";
}

export function install(): "/install" {
	return "/install";
}

/* Auth Pages */

export function signup(): "/signup" {
	return "/signup";
}

export function login(): "/login" {
	return "/login";
}

export function logout(): "/logout" {
	return "/logout";
}

export function settings(): "/settings" {
	return "/settings";
}

/* Data Pages */

export function account<ID extends string>(accountId: ID): `/accounts/${typeof accountId}` {
	return `${accounts()}/${accountId}`;
}

export function transaction<AID extends string, TID extends string>(
	accountId: AID,
	transactionId: TID
): `/accounts/${typeof accountId}/transactions/${typeof transactionId}` {
	return `${accounts()}/${accountId}/transactions/${transactionId}`;
}

export function attachments(): "/attachments" {
	return "/attachments";
}

export function locations(): "/locations" {
	return "/locations";
}

export function tags(): "/tags" {
	return "/tags";
}
