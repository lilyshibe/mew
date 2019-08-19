// import the configuration, and node.js libraries
const config = require('./config.js');
const express = require('express');
const random = require('randomstring');
const db = require('knex')(config.database);
const bodyParser = require('body-parser');
const fs = require('fs');
const logger = require('./logger.js');

const app = express(); // create the express app
require('./database/db.js')(db); // import the database logic

// this is middleware for express that allows POST
// (the method this app uses for passing information)
// variables to be easily accessed.
app.use(bodyParser.urlencoded({ extended: false }));

// if someone requests the home page from a browser
// (a GET request) give them the best home page
// ever made
app.get('/', function(req, res, next) {
    res.send(`<title>mew - no-bullshit url shortening</title><pre>
mew - no-bullshit url shortening
================================

HTTP POST request to / to shorten a url:
    curl -d 'shorten=https://example.com/super/long/url/oh/no' ${config.url}

alternatively, put the url here:
</pre>
<form method="post" action="/"><input type="text" name="shorten"><input type="submit" value="shorten"></form>
<pre>
like this site? clone it.
https://github.com/lilyshibe/mew
</pre><style>*{background:black;color:lime;appearance:none;-moz-appearance:none;-webkit-appearance:none;}input{border:1px solid lime !important;border-radius:none;}input[type=submit]{border:1px solid white;padding:1px 5px;margin-left:10px;}pre{white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;</style><meta name="viewport" content="width=device-width, initial-scale=1">`);
});

// this handles the actual link forwarding
app.get('/:short', function(req, res, next) {
    // grab the short url they're requesting
    const { short } = req.params;
    // create a new variable to store the url we redirect to
    let longURL;

    // search the database for entries where the short url requested
    // matches the short url in the database
    db.from('urls').select('short', 'url').where('short', short).then((resp) => {
        // grab the longer url from the first entry in those results
        longURL = (resp[0].url)
    }).then(() => {
        // did it work? great! redirect.
        res.status(302).redirect(longURL);
    }).catch(() => {
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
app.post('/', function(req, res, next) {
    // tries to grab the url to shorten from the request
    const url = req.body.shorten;

    // was there a url provided?
    if (url) {
        // log the request in the console
        logger.log(`shorten request for ${url} from ${req.ip}`);

        // generate a string of 6 readable characters.
        // this will be the new short url
        const short_url = random.generate({
            readable: true,
            length: 6
        });

        // insert the new entry into the database
        db.table('urls').insert({
            short: short_url,
            url: url
        }).then(() => {
            // did it work? great! give the user a heads up, give them the
            // short url, and log the success in console. :)
            res.send(config.url + "/" + short_url + "\n");
            logger.log(`shorten request for ${url} from ${req.ip} succeeded!`);
        }).catch(() => {
            // oh noes, error! most likely a database
            // connection issue or something of that sort.
            res.send("error");
            logger.log(`shorten request for ${url} from ${req.ip} failed.`, "warn");
        });
    }

    // no url provided, can't shorten something that isn't there, invalid
    else {
        res.send(`invalid request!\n`);
    }
});

// start up our webpage!
app.listen(80, () => logger.log(`started on port 80`, "ready"));