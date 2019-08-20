<div align="center">
    <br>
    <img src="https://i.imgur.com/PCMCOBP.png" width="100">
    <br><br>
    <p>no-bullshit url shortening</p>
    <p><a href="https://mew.qc.to">homepage</a> | <a href="https://mew.qc.to/A2Wagu">trello</a></p>
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

## shortening from terminal

requires [cURL](https://curl.haxx.se/)

`curl -d 'shorten=https://example.com/super/long/url/oh/no' https://site_url.com`

bash alias for easy shortening:

`echo 'short() { curl -d"shorten=$1" https://mew.qc.to ; }' > ~/.bashrc && source ~/.bashrc`