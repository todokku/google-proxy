const path = require('path');
const express = require('express');
const pkg = require( path.join(__dirname, 'package.json') );
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const google = require('./lib/google');
const https = require("https");
const http = require('http');
const url = require("url");
const httpAgent = require('https-proxy-agent');

let websiteList = require( path.join(__dirname, 'website.json') );

// Parse command line options

var program = require('commander');

program
	.version(pkg.version)
	.option('-p, --port <port>', 'Port on which to listen to (defaults to 3000)', parseInt)
	.parse(process.argv);

var port = program.port || 8080;


// Ceate a new express app

var app = express();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(cookieParser());
app.set('view engine', 'pug');

// Serve static files from the frontend folder

app.use('/', express.static(path.join(__dirname, 'frontend')));



app.get('/', function(req, res, next){
	res.redirect("/search");
});

// cache.route(),
app.get('/search', function(req, res, next){

	if(!req.query.q){
		res.render('home', {language: google(req, res).getLanguage(), websiteList: websiteList });
		return ;
	}

	let time = new Date().toLocaleString();
	console.info(time + " " + req.query.q);

	google(req, res).search().then(function(body){
		res.render("home", body);
	}).catch(function(error, resp, body){
		res.send(body);
	});
});


app.get('/autosuggest', function(req, res){

	if(!req.query.q){
		res.status(400).send('missing keyword:q!');
		return ;
	}

	if(req.query.q.length > 64){
		res.status(400).send('keyword too long!');
		return ;
	}


	google(req, res).autoComplete(req.query.q).then(function(body){
		res.send(body);
	}).catch(function(error){
		console.error(error)
		res.send(error);
	});

});


app.get('/setLanguage', function(req, res){
	let redirectUrl = req.query.redirectUrl || "/search";
	if(['en', 'zh_CN'].indexOf(req.query.language) === -1){
		res.redirect(redirectUrl);
		return ;
	}
	google(req, res).setLanguage(req.query.language).then(function(body){
		res.redirect(redirectUrl);
	}).catch(function(error){
		console.error(error)
		res.redirect(redirectUrl);
	});
});


app.get('/url', function(req, res){
	res.redirect('https://s.gaggga.workers.dev/-----' + req.query.q);
	//req.pipe(request({rejectUnauthorized: false, url: encodeURI(req.query.q)})).pipe(res);
});

app.get('/ref', function(request, response){
	request.pause();
	let options = url.parse(request.query.q);
	options.method = request.method;
	options.headers = {
		'accept': '*/*',
		'accept-language': 'zh-CN,zh;q=0.9,la;q=0.8',
		'accept-encoding': 'gzip, deflate, br',
		'cache-control': 'no-cache',
		'host': options.host,
		'sec-fetch-mode': "cors",
		'sec-fetch-site': "cross-site",
		'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'
	};
	options.agent = process.env.http_proxy && new httpAgent(process.env.http_proxy) || false;

	let connector = null;
	if(options.protocol === 'https:'){
		connector = https.request(options, function(serverResponse) {
			serverResponse.pause();
			response.writeHeader(serverResponse.statusCode, serverResponse.headers);
			serverResponse.pipe(response);
			serverResponse.resume();
		});
	}else{
		connector = http.request(options, function(serverResponse) {
			serverResponse.pause();
			response.writeHeader(serverResponse.statusCode, serverResponse.headers);
			serverResponse.pipe(response);
			serverResponse.resume();
		});
	}

	request.pipe(connector);
	request.resume();
});

// Everything is setup. Listen on the port.

app.listen(port);

console.log('server is running on port ' + port);
