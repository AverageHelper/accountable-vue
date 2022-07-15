import { defineEventHandler } from "h3";
import helmet from "helmet";

export default defineEventHandler(event => {
	helmet()(event);
});
