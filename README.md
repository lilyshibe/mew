<div align="center">
    <br>
    <img src="https://i.imgur.com/PCMCOBP.png" width="100">
    <br><br>
    <p>no-bullshit url shortening</p>
    <p><a href="https://mew.qc.to">homepage</a> | <a href="https://mew.qc.to/dbJWgh">trello</a></p>
    <img src="https://img.shields.io/github/license/lilyshibe/mew.svg"> 
	<img src="https://img.shields.io/github/repo-size/lilyshibe/mew.svg">
	<img src="https://img.shields.io/david/lilyshibe/mew.svg">
	<img src="https://img.shields.io/david/dev/lilyshibe/mew.svg">
</div>

# usage

## installation

requires [git](https://git-scm.com/) and [node.js](https://nodejs.org/)

1. `git clone https://github.com/lilyshibe/mew.git`
2. `cd mew && npm i`
3. rename `config.js.example` to `config.js`, edit file to your liking
4. `npm start` to start server

## HTTPS setup

requires [certbot](https://certbot.eff.org/)

1. run `certbot certonly --manual`
2. run mew with https turned off, and place the acme-challenge files in /static (mew is automatically configured to serve static files from that directory)
3. configure the httpskey, httpscert and httpsca variables in config
4. turn https on

## shortening from terminal

requires [cURL](https://curl.haxx.se/)

`curl -d 'shorten=https://example.com/super/long/url/oh/no' https://site_url.com`

bash alias for easy shortening:

`echo 'short() { curl -d"shorten=$1" https://mew.qc.to ; }' > ~/.bashrc && source ~/.bashrc`

# features

* easily usable from cURL
* very small (see top of readme for repo size)
* minimal setup for installation

# configuration

## url

the url for your site. do not include protocols (http:// or https://).

## usehttps

should the program attempt to use https?
*note: if using https, make sure that port 443 is open for inbound / outbound connections on your firewall.*

## httpsredirect

should to program redirect users on the http protocol to the https protocol?

## httpskey, httpscert, httpsca

the private key, certificate and chain respectively.

for letsencrypt/certbot generated certificates, the paths will look something like this:
`{
    httpskey: "/etc/letsencrypt/live/<yourdomain>/privkey.pem",
    httpscert: "/etc/letsencrypt/live/<yourdomain>/cert.pem",
    httpsca: "/etc/letsencrypt/live/<yourdomain>/chain.pem"
}`

# license

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
along with this program.  If not, see [https://www.gnu.org/licenses/](https://www.gnu.org/licenses/).