var path = require('path');
var express = require('express');
var pkg = require( path.join(__dirname, 'package.json') );
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var google = require('./lib/google');
var request = require("request");

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
	
	google(req, res).search(req.query.q, req.query.page, req.query).then(function(body){
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

app.get('/reloadWebsite', function(req, res){
	 websiteList = require( path.join(__dirname, 'website.json') );
	 res.end("reload success");
});

app.get('/setLanguage', function(req, res){
	let redirectUrl = req.query.redirectUrl || "/search";
	if(['en', 'zh_CN'].indexOf(req.query.language) == -1){
		res.redirect(redirectUrl);
	}
	google(req, res).setLanguage(req.query.language).then(function(body){
		res.redirect(redirectUrl);
	}).catch(function(error){
		console.error(error)
		res.redirect(redirectUrl);
	});
});


app.get('/url', function(req, res){
	req.pipe(request({rejectUnauthorized: false, url: encodeURI(req.query.q)})).pipe(res);
});


// Everything is setup. Listen on the port.

app.listen(port);

console.log('server is running on port ' + port);
