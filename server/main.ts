import "source-map-support/register";
import express from "express";

// This will need to handle:
// * Database data storage
// * Blob data storage
// * Data access (auth)

const port = 40850;

express() //
	.get("/", (req, res) => {
		res.send("Hello, world!");
	})
	.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`);
	});
