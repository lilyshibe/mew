const config = require('./config.js');
const express = require('express');
const random = require('randomstring');
const db = require('knex')(config.database);
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
require('./database/db.js')(db);

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res, next) {
    res.send(`<pre>
mew - no-bullshit url shortening
================================

HTTP POST request to / to shorten a url:
    curl -d 'shorten=https://example.com/super/long/url/oh/no' ${config.url}
</pre>`);
});

app.get('/:short', function(req, res, next) {
    const { short } = req.params;
    let longURL;

    db.from('urls').select('short', 'url').where('short', short).then((resp) => {
        longURL = (resp[0].url)
    }).then(() => {
        res.status(302).redirect(longURL);
    });
})

app.post('/', function(req, res, next) {
    const url = req.body.shorten;
    console.log("got shorten request for " + url);
    const short_url = random.generate({
        readable: true,
        length: 6
    });

    db.table('urls').insert({
        short: short_url,
        url: url
    }).then(() => {
        res.send(config.url + "/" + short_url + "\n");
    });
});



app.listen(80, () => console.log(`started on port 80`));