import "source-map-support/register.js";
import "./environment.js";
import { generateSecureToken } from "n-digit-token";
import { client_secret } from "./auth.js";
import { lol } from "./lol.js";
import cors from "cors";
// import csrf from "csurf"; // look into this
import express from "express";
import formidable from "formidable";
import helmet from "helmet";
import methodOverride from "method-override";

const port = 40850;

const app = express()
	.use(methodOverride())
	.use(helmet())
	.use(cors())
	.use(express.json())
	.get("/", lol);

// Auth
//   ¯\_(ツ)_/¯  Try https://thecodebarbarian.com/oauth-with-node-js-and-express.html
//   Prevent brute-forcing same user ID
//     Limit num of consecutive failed attempts by the same user name and IP
const authCodes = new Set();
const accessTokens = new Set();
app
	.post("/authcode", (req, res) => {
		// FIXME: We're vulnerable to CSRF attacks here

		// Generate a string of 10 random digits
		const authCode = generateSecureToken(10);

		// Normally this would be a `redirect_uri` parameter, but for
		// this example it is hard coded.
		// res.redirect(`http://localhost:3000/oauth-callback.html?code=${authCode}`);
		res.send(authCode);
	})
	.options("/authtoken", (req, res) => res.end())
	.post("/authtoken", (req, res) => {
		// Verify an auth code and exchange it for an access token
		type AuthtokenRequestBody = { code?: string | undefined } | null | undefined;
		const code = (req.body as AuthtokenRequestBody)?.code as string | undefined;

		if (authCodes.has(code)) {
			// Generate a string of 50 random chars
			const access_token = generateSecureToken(50);

			authCodes.delete(code);
			accessTokens.add(access_token);
			res.json({ access_token, expires_in: 60 * 60 * 24 });
		} else {
			res.status(400).json({ message: "Invalid auth token" });
		}
	});

const checkAuth: express.RequestHandler = (req, res, next) => {
	const authorization = req.get("authorization");
	if (!accessTokens.has(authorization)) {
		res.status(403).json({ message: "Unauthorized" });
		return;
	}
	next();
};

app.use(checkAuth);

// Database data storage
//   CONNECT path -> open websocket to watch a database path
//   GET path -> get data in JSON format
//   PUT path data -> database set
//   DELETE path -> database delete
app
	.connect("/db", (req, res) => {
		res.send("This will open a websocket.\n");
	})
	.get("/db", (req, res) => {
		res.send("This will return data at the path.\n");
	})
	.put("/db", (req, res) => {
		res.send("This will set data at the path.\n");
	})
	.delete("/db", (req, res) => {
		res.send("This will delete data at the path.\n");
	});

// Blob data storage
//   GET path -> get file
//   PUT path data -> store file
//   DELETE path -> delete file
app
	.get("/files", (req, res) => {
		res.send("This will return the file at the path.\n");
	})
	.put("/files", (req, res, next) => {
		formidable({ multiples: true }).parse(req, (error, fields, files) => {
			if (Boolean(error)) {
				next(error);
				return;
			}
			res.json({ fields, files });
		});
	})
	.delete("/files", (req, res) => {
		res.send("This will delete the file at the path.\n");
	});

app.listen(port, () => {
	process.stdout.write(`Accountable storage server listening on port ${port}\n`);
});
