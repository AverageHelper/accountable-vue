import { getDataAtUrl } from "./getDataAtUrl";

export interface IPLocateResult {
	asn: string | null;
	city: string | null;
	continent: string | null;
	country: string | null;
	country_code: string | null;
	ip: string;
	latitude: number | null;
	longitude: number | null;
	org: string | null;
	postal_code: string | null;
	subdivision: string | null;
	subdivision2: string | null;
	time_zone: string | null;
}

export async function fetchLocationData(): Promise<IPLocateResult> {
	const source = "https://www.iplocate.io/api/lookup/";
	const raw = await getDataAtUrl(source, "application/json");
	return JSON.parse(raw) as IPLocateResult;
}
