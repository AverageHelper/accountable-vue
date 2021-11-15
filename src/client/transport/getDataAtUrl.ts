export async function getDataAtUrl(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.responseType = "text";
		xhr.addEventListener("load", () => {
			const blob = xhr.response as string;
			resolve(blob);
		});
		xhr.addEventListener("error", () => {
			reject(xhr.response);
		});
		xhr.open("GET", url);
		xhr.send();
	});
}

// These are different, I promise
export function downloadFileAtUrl(url: string, filename: string): void {
	const anchor = document.createElement("a");
	anchor.href = url; // file to download
	anchor.download = filename; // filename to save as
	anchor.click();
}
