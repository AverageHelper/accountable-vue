import { Schema } from "mongoose";

export interface DataItem {
	[key: string]: unknown;
	_id: string;
}

export const dataSchema = new Schema({
	ciphertext: String,
	objectType: String,
	_id: String,
});

export const keySchema = new Schema({
	_id: String,
	dekMaterial: String,
	passSalt: String,
	oldDekMaterial: {
		type: String,
		required: false,
	},
	oldPassSalt: {
		type: String,
		required: false,
	},
});
