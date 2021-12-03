import "source-map-support/register.js";
import "./environment.js";
import { OIDCAdapter, client_secret } from "./auth.js";
import { Provider } from "oidc-provider";
import cors from "cors";
// import csrf from "csurf"; // look into this
import express from "express";
import formidable from "formidable";
import helmet from "helmet";
import methodOverride from "method-override";

const port = 40850;

const oidc = new Provider(`http://localhost:${port}`, {
	clients: [
		{
			client_id: "oidcCLIENT",
			client_secret,
			grant_types: ["authorization_code"],
			response_types: ["code"],
		},
	],
	pkce: {
		required: () => false,
		methods: ["plain"],
	},
	cookies: {
		keys: [],
	},
	jwks: {
		keys: [],
	},
	interactions: {},
	adapter: OIDCAdapter,
});

const app = express()
	.use(methodOverride())
	.use(helmet())
	.use(cors())
	.use("/oidc", oidc.callback())
	.get("/", (req, res) => {
		res.send(
			'<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Yo</title>\n</head>\n<body>\n<pre>lol</pre>\n</body>\n</html>\n'
		);
	});

// Auth
//   ¯\_(ツ)_/¯
//   Prevent brute-forcing same user ID
//     Limit num of consecutive failed attempts by the same user name and IP
app.post("/auth", (req, res) => {
	res.send("Users will authenticate here.\n");
});

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
			if (!!error) {
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
