const path = require('path');
const express = require('express');
const pkg = require( path.join(__dirname, 'package.json') );
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const google = require('./lib/google');
const moment = require('moment');

let websiteList = require( path.join(__dirname, 'website.json') );

// Parse command line options

var program = require('commander');
const {proxy} = require("./lib/proxy");

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
	res.render('index', { websiteList: websiteList });
});


fullUrl = (req) => {
	return req.protocol + '://' + req.get('host') + req.originalUrl;
};

// cache.route(),
app.get('/search', function(req, res, next){

	if(!req.query.q){
		res.render('index', { websiteList: websiteList });
		return ;
	}

	let time = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

	console.info( time + " " + req.query.q);

	google(req, res).search().then(function(body){
		body.url = fullUrl(req);
		res.render("home", body);
	}).catch(function(error){
		console.error(error);
		res.render('home', {hl: google(req, res).getLanguage(), websiteList: websiteList , url: fullUrl(req)});
	});
});


app.get('/complete/search', function(req, res){

	if(!req.query.q){
		res.status(400).send('missing keyword:q!');
		return ;
	}

	if(req.query.q.length > 64){
		res.status(400).send('keyword too long!');
		return ;
	}


	google(req, res).complete().then(function(json){
		res.send(json);
	}).catch(function(error){
		console.error(error);
		res.send(error);
	});

});


app.get('/setLanguage', function(req, res){
	let redirectUrl = req.query.redirectUrl || "/search";
	if(['en', 'zh_CN'].indexOf(req.query.hl) === -1){
		res.redirect(redirectUrl);
		return ;
	}
	google(req, res).setLanguage(req.query.hl).then(function(){
		res.redirect(redirectUrl);
	}).catch(function(error){
		console.error(error);
		res.redirect(redirectUrl);
	});
});


app.get('/url', function(req, res){
	res.redirect('https://godwine.shop/-----' + req.query.q);
	//req.pipe(request({rejectUnauthorized: false, url: encodeURI(req.query.q)})).pipe(res);
});

app.get('/ref', function(request, response){
	request.pause();
	request.url = request.query.q;
	request.query = null;
	proxy(request, response).then(response =>{
		response.status(200)
	}).finally(() =>{
		request.resume();
	})

});

// Everything is setup. Listen on the port.

app.listen(port);

console.log('server is running on port ' + port);
