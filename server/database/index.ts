// Since all data is encrypted, we only need to bother
// about where that data goes and comes from. We leave
// path-level security to Express.

export interface DataItem {
	[key: string]: unknown;
}

export async function getDataItemAtPath(path: string): Promise<DataItem | null> {
	return null;
}

export async function deleteDataItemAtPath(path: string): Promise<void> {
	//
}

export async function setDataItemAtPath(path: string, data: DataItem): Promise<void> {
	//
}
