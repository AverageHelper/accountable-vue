export const session = jest.fn();

export const blacklistHasJwt = jest.fn().mockReturnValue(false);

export const addJwtToBlacklist = jest.fn();

export const newAccessToken = jest.fn().mockResolvedValue("deft");

export const jwtTokenFromRequest = jest.fn().mockReturnValue(null);

export const verifyJwt = jest.fn().mockRejectedValue(new TypeError("This is a test"));
