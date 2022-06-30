jest.mock("../database/io.js");

import { sanitizedFilePath } from "./sanitizedFilePath.js";
import { ensure } from "../database/io.js";

const mockEnsure = ensure as jest.Mock;

describe("File path constructor", () => {
	test("Ensures the folder exists", async () => {
		const uid = "real-user";
		const fileName = "somefile.txt";
		expect(await sanitizedFilePath({ fileName, uid })).toBeString();
		expect(mockEnsure).toHaveBeenCalledOnce();
	});

	test.each`
		fileName            | uid              | result
		${"somefile.txt  "} | ${"real-user  "} | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
		${"somefile.txt"}   | ${"real-user  "} | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
		${"somefile.txt  "} | ${"real-user"}   | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
		${"  somefile.txt"} | ${"  real-user"} | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
		${"somefile.txt"}   | ${"  real-user"} | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
		${"  somefile.txt"} | ${"real-user"}   | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
		${"somefile.txt"}   | ${"real-user"}   | ${"/foo/bar/db/users/real-user/attachments/somefile.txt"}
	`(
		"Returns a path (fileName: '$fileName', uid: '$uid'",
		async ({ fileName, uid, result }: { fileName: string; uid: string; result: string }) => {
			expect(await sanitizedFilePath({ fileName, uid })).toBe(result);
		}
	);

	test.each`
		fileName             | uid
		${""}                | ${""}
		${"somefile.txt"}    | ${".."}
		${"../somefile.txt"} | ${"not/../real"}
		${"../somefile.txt"} | ${"real-user"}
		${".."}              | ${"real-user"}
	`(
		"Returns nothing if the path contains path arguments (fileName: '$fileName', uid: 'uid')",
		async (params: { fileName: string; uid: string }) => {
			expect(await sanitizedFilePath(params)).toBeNull();
		}
	);
});
