export const statsForUser = jest.fn().mockResolvedValue({ totalSpace: 0, usedSpace: 0 });

export const numberOfUsers = jest.fn().mockResolvedValue(0);

export const fetchDbCollection = jest.fn().mockResolvedValue([]);

export const findUserWithProperties = jest.fn().mockResolvedValue(null);

export const fetchDbDoc = jest.fn().mockRejectedValue(new EvalError("This is a test" as never));

export const fetchDbDocs = jest.fn().mockRejectedValue(new EvalError("This is a test"));

export const upsertUser = jest.fn().mockResolvedValue(undefined);

export const destroyUser = jest.fn().mockResolvedValue(undefined);

export const upsertDbDocs = jest.fn().mockResolvedValue(undefined);

export const deleteDbDocs = jest.fn().mockResolvedValue(undefined);

export const deleteDbDoc = jest.fn().mockResolvedValue(undefined);

export const deleteDbCollection = jest.fn().mockResolvedValue(undefined);
