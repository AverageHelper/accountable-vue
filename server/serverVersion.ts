import type { RequestHandler } from "express";
import { version } from "./version.js";

export const serverVersion: RequestHandler = (req, res) =>
	res.json({ message: `Accountable v${version}`, version });
