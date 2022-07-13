import atob from "atob-lite";

export async function getDataAtUrl(url: string, contentType?: string): Promise<string> {
	return await new Promise((resolve, reject) => {
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
		if (contentType !== undefined && contentType) {
			xhr.setRequestHeader("Content-Type", contentType);
		}
		xhr.send();
	});
}

export function dataUriToBlob(dataUri: string): Blob {
	// See https://stackoverflow.com/a/12300351

	// convert base64 to raw binary data held in a string
	// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
	const encodedByteString = dataUri.split(",")[1];
	if (encodedByteString === undefined)
		throw new TypeError("Invalid Data URI: Could not get byte string"); // TODO: I18N?
	const byteString = atob(encodedByteString);

	// separate out the mime component
	const mimeString = dataUri.split(",")[0]?.split(":")[1]?.split(";")[0];
	if (mimeString === undefined) throw new TypeError("Invalid Data URI: Could not get MIME string"); // TODO: I18N?

	// write the bytes of the string to an ArrayBuffer
	const ab = new ArrayBuffer(byteString.length);

	// create a view into the buffer
	const ia = new Uint8Array(ab);

	// set the bytes of the buffer to the correct values
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	// write the ArrayBuffer to a blob, and you're done
	const blob = new Blob([ab], { type: mimeString });
	return blob;
}

async function dataFromBlob(file: Blob, type: "dataUrl" | "text"): Promise<string> {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			const result = reader.result;
			if (typeof result === "string") {
				resolve(result);
			} else {
				reject(new TypeError(`Expected string result, got ${typeof result}`)); // TODO: I18N?
			}
		});
		reader.addEventListener("error", error => {
			reject(error);
		});
		switch (type) {
			case "dataUrl":
				reader.readAsDataURL(file);
				break;
			case "text":
				reader.readAsText(file);
				break;
		}
	});
}

export async function dataUrlFromFile(file: Blob): Promise<string> {
	return await dataFromBlob(file, "dataUrl");
}

export async function getJsonFromFile(file: Blob): Promise<unknown> {
	const text = await dataFromBlob(file, "text");
	return JSON.parse(text) as unknown;
}

// These are different, I promise
export function downloadFileAtUrl(url: string, filename: string): void {
	const anchor = document.createElement("a");
	anchor.href = url; // file to download
	anchor.download = filename; // filename to save as
	anchor.click();
}
