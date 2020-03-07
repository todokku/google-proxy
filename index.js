var path = require('path');
var express = require('express');
var contentDisposition = require('content-disposition');
var pkg = require( path.join(__dirname, 'package.json') );
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var scan = require('./scan');
var google = require('./lib/google');
var extend = require('./lib/extend');
var request = require("request");



// Parse command line options

var program = require('commander');

program
	.version(pkg.version)
	.option('-p, --port <port>', 'Port on which to listen to (defaults to 3000)', parseInt)
	.parse(process.argv);

var port = program.port || 8080;


// Scan the directory in which the script was called. It will
// add the 'files/' prefix to all files and folders, so that
// download links point to our /files route

var tree = scan('.', 'files');


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

// Serve files from the current directory under the /files route

app.use('/files', express.static(process.cwd(), {
	index: false,
	setHeaders: function(res, path){
		// Set header to force files to download
		res.setHeader('Content-Disposition', contentDisposition(path))

	}
}));

app.locals.moment = require('moment');

// This endpoint is requested by our frontend JS

app.get('/scan', function(req,res){
	res.send(tree);
});

app.get('/', function(req, res, next){
	res.redirect("/search");
});

// cache.route(),
app.get('/search', function(req, res, next){
	var render = {
		root: '/search'
	};
	
	if(!req.query.q){
		res.render('home', render);
		return ;
	}
	
	google(req, res).search(req.query.q, req.query.page, req.query).done(function(body){
		//res.send(body);
		res.render("home", extend(render,this.respJSON));
	}).fail(function(error, resp, body){
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
	
	
	google(req, res).autoComplete(req.query.q).done(function(){
			res.send(this.body);
		}).fail(function(error){
			res.send(error);
		});
	
});


app.get('/url', function(req, res){
	req.pipe(request(encodeURI(req.query.q))).pipe(res);
});


// Everything is setup. Listen on the port.

app.listen(port);

console.log('Cute files is running on port ' + port);
