const client_secret = process.env.OIDC_SECRET;
if (client_secret === undefined || typeof client_secret !== "string")
	throw new TypeError("Missing value for key 'OIDC_SECRET'. Set this value in .env to continue.");

export { client_secret };
