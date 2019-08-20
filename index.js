/*

	mew - no-bullshit URL shortening
    Copyright (C) 2019 lillian rose winter

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/

// import the configuration, and node.js libraries
const config = require("./config.js");
const express = require("express");
const random = require("randomstring");
const db = require("knex")(config.database);
const bodyParser = require("body-parser");
const fs = require("fs");
const logger = require("./logger.js");
const https = require("https");
const http = require("http");
const URI = require("uri-js");

const app = express(); // create the express app
require("./database/db.js")(db); // import the database logic

let protocolToUse;

if (config.usehttps) {
	protocolToUse = "https://";
} else {
	protcolToUse = "http://";
}

// this is middleware for express that allows POST
// (the method this app uses for passing information)
// variables to be easily accessed.
app.use(bodyParser.urlencoded({ extended: false }));

// serve files from the /static folder
if (fs.existsSync(__dirname + "/static")) {
	app.use(express.static(__dirname + "/static", { dotfiles: "allow" }));
}

// this is from https://gist.github.com/dperini/729294
// it's a RegEx for testing if a URL is valid.
// i do not understand it and i do not pretend to
var re_weburl = new RegExp(
	"^" +
		// protocol identifier (optional)
		// short syntax // still required
		"(?:(?:(?:https?|ftp):)?\\/\\/)" +
		// user:pass BasicAuth (optional)
		"(?:\\S+(?::\\S*)?@)?" +
		"(?:" +
		// IP address exclusion
		// private & local networks
		"(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
		"(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
		"(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
		// IP address dotted notation octets
		// excludes loopback network 0.0.0.0
		// excludes reserved space >= 224.0.0.0
		// excludes network & broadcast addresses
		// (first & last IP address of each class)
		"(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
		"(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
		"(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
		"|" +
		// host & domain names, may end with dot
		// can be replaced by a shortest alternative
		// (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
		"(?:" +
		"(?:" +
		"[a-z0-9\\u00a1-\\uffff]" +
		"[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
		")?" +
		"[a-z0-9\\u00a1-\\uffff]\\." +
		")+" +
		// TLD identifier name, may end with dot
		"(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
		")" +
		// port number (optional)
		"(?::\\d{2,5})?" +
		// resource path (optional)
		"(?:[/?#]\\S*)?" +
		"$",
	"i"
);

// if someone requests the home page from a browser
// (a GET request) give them the best home page
// ever made
app.get("/", function(req, res, next) {
	res.send(
		`<title>mew - no-bullshit url shortening</title><pre>
mew - no-bullshit url shortening
================================

HTTP POST request to / to shorten a url:
    curl -d 'shorten=https://example.com/super/long/url/oh/no' ` +
			protocolToUse +
			`${config.url}

bash alias for easy & quick shortening:
    echo 'short() { curl -d"shorten=$1" ` +
			protocolToUse +
			`${config.url} ; }' > ~/.bashrc && source ~/.bashrc

alternatively, put the url here:
</pre>
<form method="post" action="/"><input type="text" name="shorten"><input type="submit" value="shorten"></form>
<pre>
like this site? clone it.
https://github.com/lilyshibe/mew
</pre><style>*{background:black;color:lime;appearance:none;-moz-appearance:none;-webkit-appearance:none;}input{border:1px solid lime !important;border-radius:none;}input[type=submit]{border:1px solid white;padding:1px 5px;margin-left:10px;}pre{white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;</style><meta name="viewport" content="width=device-width, initial-scale=1">`
	);
});

// this handles the actual link forwarding
app.get("/:short", function(req, res, next) {
	// grab the short url they're requesting
	const { short } = req.params;
	// create a new variable to store the url we redirect to
	let longURL;

	// search the database for entries where the short url requested
	// matches the short url in the database
	db.from("urls")
		.select("short", "url")
		.where("short", short)
		.then(resp => {
			// grab the longer url from the first entry in those results
			longURL = resp[0].url;
		})
		.then(() => {
			// did it work? great! redirect.
			res.status(302).redirect(longURL);
		})
		.catch(() => {
			// oh noes, something went wrong!
			// most likely, the short url
			// requested does not exist.
			res.status(422).send(`<title>mew - not found</title><pre>
mew - no-bullshit url shortening
================================

Cannot GET /${short}</pre><style>*{background:black;color:lime;webkit-appearance:none;}pre{white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;</style><meta name="viewport" content="width=device-width, initial-scale=1">`);
		});
});

// this handles the creation of new short urls
app.post("/", function(req, res, next) {
	// tries to grab the url to shorten from the request
	const url = req.body.shorten;

	// was there a url provided?
	if (url) {
		// is it a valid url?
		if (re_weburl.test(url)) {
			// is it a duplicate?
			db.from("urls")
				.select()
				.where("url", url)
				.then(resp => {
					// url is not a duplicate!
					if (!Array.isArray(resp) || !resp.length) {
						// is the url's host the same as the site's?
						if (URI.parse(url).host == config.url) {
							// yes it is
							logger.log(
								`invalid shorten request for ${url} from ${
									req.ip
								} - cannot shorten self`
							);
							res.send(`invalid shorten request - cannot shorten self`);
						} else {
							// log the request in the console
							logger.log(`shorten request for ${url} from ${req.ip}`);

							// generate a string of 6 readable characters.
							// this will be the new short url
							const short_url = random.generate({
								readable: true,
								length: 6
							});

							// insert the new entry into the database
							db.table("urls")
								.insert({
									short: short_url,
									url: url,
									ip: req.ip
								})
								.then(() => {
									// did it work? great! give the user a heads up, give them the
									// short url, and log the success in console. :)
									res.send(config.url + "/" + short_url + "\n");
									logger.log(
										`shorten request for ${url} from ${req.ip} succeeded!`
									);
								})
								.catch(() => {
									// oh noes, error! most likely a database
									// connection issue or something of that sort.
									res.send("error");
									logger.log(
										`shorten request for ${url} from ${req.ip} failed.`,
										"warn"
									);
								});
						}
					}

					// dupe url!
					else {
						db.table("duplicates")
							.insert({
								short: short_url,
								ip: req.ip
							})
							.then(() => {
								// did it work? great! give the user a heads up, give them the
								// short url, and log the success in console. :)
								res.send(config.url + "/" + short_url + "\n");
								logger.log(
									`shorten request for ${url} from ${req.ip} succeeded!`
								);
							})
							.catch(() => {
								// oh noes, error! most likely a database
								// connection issue or something of that sort.
								res.send("error");
								logger.log(
									`shorten request for ${url} from ${req.ip} failed.`,
									"warn"
								);
							});
					}
				});
		}

		// url invalid
		else {
			res.send(
				"url invalid! be sure to add http:// or https:// if you haven't"
			);
			logger.log(`invalid shorten request for ${url} from ${req.ip}`);
		}
	}

	// no url provided, can't shorten something that isn't there, invalid
	else {
		res.send(`invalid request!\n`);
	}
});

// start up our webpage!

if (config.usehttps) {
	https
		.createServer(
			{
				key: fs.readFileSync(config.httpskey),
				cert: fs.readFileSync(config.httpscert),
				ca: fs.readFileSync(config.httpsca)
			},
			app
		)
		.listen(443, () => {
			logger.log(`HTTPS started on port 443`, "ready");
		});
}

if (config.httpsredirect) {
	http
		.createServer(function(req, res) {
			res.writeHead(307, {
				Location: "https://" + req.headers["host"] + req.url
			});
			res.end();
		})
		.listen(80, () => {
			logger.log(`HTTP redirect server started on port 80`, "ready");
		});
} else {
	http.createServer(app).listen(80, () => {
		logger.log(`HTTP started on port 80`, "ready");
	});
}

// app.listen(80, () => logger.log(`started on port 80`, "ready"));
