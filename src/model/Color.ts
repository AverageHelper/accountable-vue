import isString from "lodash/isString";

export type ColorID = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

export const allColors: ReadonlyArray<ColorID> = [
	"red",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
];

export function randomColor(): ColorID {
	return allColors[Math.floor(Math.random() * allColors.length)] as ColorID;
}

export function isColorId(toBeDetermined: unknown): toBeDetermined is ColorID {
	return isString(toBeDetermined) && allColors.includes(toBeDetermined as ColorID);
}
