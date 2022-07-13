export const deleteItem = jest.fn().mockResolvedValue(undefined);

export const ensure = jest.fn().mockResolvedValue(undefined);

export const tmpDir = jest.fn().mockReturnValue("/foo/bar");

export const fileExists = jest.fn().mockResolvedValue(false);

export const getFileContents = jest.fn().mockResolvedValue("{}");

export const moveFile = jest.fn().mockResolvedValue(undefined);

export const touch = jest.fn().mockResolvedValue(undefined);
