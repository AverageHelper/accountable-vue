import isString from "lodash/isString";

export const allColors = ["red", "orange", "yellow", "green", "blue", "purple"] as const;

export type ColorID = typeof allColors[number];

export function randomColor(): ColorID {
	return allColors[Math.floor(Math.random() * allColors.length)] as ColorID;
}

export function isColorId(tbd: unknown): tbd is ColorID {
	return isString(tbd) && allColors.includes(tbd as ColorID);
}
