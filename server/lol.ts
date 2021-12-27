import type { RequestHandler } from "express";

export const lol: RequestHandler = (req, res) => res.json({ message: "lol" });
