const config = require('./config.js');
const express = require('express');
const random = require('randomstring');
const db = require('knex')(config.database);
const bodyParser = require('body-parser');
const fs = require('fs');
const logger = require('./logger.js');

const app = express();
require('./database/db.js')(db);

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res, next) {
    res.send(`<pre>
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
</pre><style>*{background:black;color:lime;webkit-appearance:none;}pre{white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;</style><meta name="viewport" content="width=device-width, initial-scale=1">`);
});

app.get('/:short', function(req, res, next) {
    const { short } = req.params;
    let longURL;

    db.from('urls').select('short', 'url').where('short', short).then((resp) => {
        longURL = (resp[0].url)
    }).then(() => {
        res.status(302).redirect(longURL);
    }).catch(() => {
        res.status(422).send(`<pre>
mew - no-bullshit url shortening
================================

Cannot GET /${short}</pre><style>*{background:black;color:lime;webkit-appearance:none;}pre{white-space:pre-wrap;white-space:-moz-pre-wrap;white-space:-pre-wrap;white-space:-o-pre-wrap;word-wrap:break-word;</style><meta name="viewport" content="width=device-width, initial-scale=1">`)
    });
});

app.post('/', function(req, res, next) {
    const url = req.body.shorten;

    if (url) {
        logger.log(`shorten request for ${url} from ${req.ip}`);

        const short_url = random.generate({
            readable: true,
            length: 6
        });

        db.table('urls').insert({
            short: short_url,
            url: url
        }).then(() => {
            res.send(config.url + "/" + short_url + "\n");
            logger.log(`shorten request for ${url} from ${req.ip} succeeded!`);
        }).catch(() => {
            res.send("error");
            logger.log(`shorten request for ${url} from ${req.ip} failed.`, "warn");
        });
    }

    else {
        res.send(`invalid request!\n`);
    }
});

app.listen(80, () => console.log(`started on port 80`));