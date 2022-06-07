import { InternalError } from "./InternalError.js";

export class NotEnoughRoomError extends InternalError {
	constructor(
		message: string = "There is not enough room to write your data. Delete some stuff first"
	) {
		super({ status: 507, message });
		this.name = "NotEnoughRoomError";
	}
}
