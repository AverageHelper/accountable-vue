import { defineEventHandler } from "h3";
import { cors } from "~~/server/cors.js";

export default defineEventHandler(event => {
	cors()(event);
});
