jest.mock("./database/filesystem.js");
jest.mock("./database/io.js");
jest.mock("./auth/jwt.js");

import "jest-extended";

import { temporaryFilePath } from "./db.js";
import { ensure } from "./database/filesystem.js";
import { BadRequestError } from "./errors/BadRequestError.js";

const mockEnsure = ensure as jest.Mock;

describe("File path constructor", () => {
	test("Ensures the folder exists", async () => {
		const uid = "real-user";
		const documentId = "some-doc-1234";
		const fileName = "somefile.txt";
		expect(await temporaryFilePath({ uid, documentId, fileName })).toBeString();
		expect(mockEnsure).toHaveBeenCalledOnce();
	});

	test.each`
		fileName            | documentId         | uid              | result
		${"somefile.txt  "} | ${"some-doc-1234"} | ${"real-user  "} | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
		${"somefile.txt"}   | ${"some-doc-1234"} | ${"real-user  "} | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
		${"somefile.txt  "} | ${"some-doc-1234"} | ${"real-user"}   | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
		${"  somefile.txt"} | ${"some-doc-1234"} | ${"  real-user"} | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
		${"somefile.txt"}   | ${"some-doc-1234"} | ${"  real-user"} | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
		${"  somefile.txt"} | ${"some-doc-1234"} | ${"real-user"}   | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
		${"somefile.txt"}   | ${"some-doc-1234"} | ${"real-user"}   | ${"/foo/bar/accountable-attachment-temp/users/real-user/attachments/somefile.txt"}
	`(
		"Returns a path (fileName: '$fileName', documentId: '$documentId', uid: '$uid'",
		async (params: { fileName: string; documentId: string; uid: string; result: string }) => {
			const { fileName, documentId, uid, result } = params;
			expect(await temporaryFilePath({ fileName, documentId, uid })).toBe(result);
		}
	);

	test.each`
		fileName             | documentId         | uid
		${""}                | ${"some-doc-1234"} | ${""}
		${"somefile.txt"}    | ${"some-doc-1234"} | ${".."}
		${"../somefile.txt"} | ${"some-doc-1234"} | ${"not/../real"}
		${"../somefile.txt"} | ${"some-doc-1234"} | ${"real-user"}
		${".."}              | ${"some-doc-1234"} | ${"real-user"}
	`(
		"Throws if the path contains path arguments (fileName: '$fileName', documentId: '$documentId', uid: 'uid')",
		async (params: { fileName: string; documentId: string; uid: string }) => {
			await expect(temporaryFilePath(params)).rejects.toThrowError(BadRequestError);
		}
	);
});
