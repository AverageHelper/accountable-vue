import type { RequestHandler } from "express";

export const ping: RequestHandler = (req, res) => res.json({ message: "Pong!" });
