import { defineEventHandler } from "h3";
import { version } from "~~/version.js";

export default defineEventHandler(() => ({ message: `Accountable v${version}`, version }));
