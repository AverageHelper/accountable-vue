namespace NodeJS {
	interface ProcessEnv {
		readonly OIDC_SECRET: string | undefined;
		readonly NODE_ENV: "development" | "production";
	}
}
