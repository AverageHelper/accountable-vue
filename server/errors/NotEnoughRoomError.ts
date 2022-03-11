import { InternalError } from "./InternalError.js";

export class NotEnoughRoomError extends InternalError {
	constructor() {
		super({
			status: 507,
			message: "There is not enough room to write your data. Delete some stuff first",
		});
		this.name = "NotEnoughRoomError";
	}
}
