var path = require('path');
var express = require('express');
var contentDisposition = require('content-disposition');
var pkg = require( path.join(__dirname, 'package.json') );

var bodyParser = require('body-parser');
var oauthserver = require('oauth2-server');
var oauthModel = require("./lib/auth");


var scan = require('./scan');
var wow = require('./lib/wow');
var google = require('./lib/google');
var rss = require('./lib/rss');
var extend = require('./lib/extend');
var request = require("request");
var cache = require('express-redis-cache')({
    host: '127.0.0.1',
    port: 6379,
    expire: 7 * 24 * 60 * 60
});



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

app.set('view engine', 'jade');

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

require("./lib/v2/index")(app);

app.oauth = oauthserver({
  model: oauthModel, // See below for specification
  grants: ['authorization_code', 'password', 'refresh_token', 'client_credentials'],
  debug: true,
  accessTokenLifetime: 30 //default 3600
});

app.all('/oauth/token', app.oauth.grant());

app.all('/oauth/authorize', app.oauth.authCodeGrant(function(req, callback){
	oauthModel.getUser(req.body.username, req.body.password, function(err,userId){
		callback(err, !!userId, userId);
	});
	
}));

app.get('/oauth/confirm', function(req, res){
	res.render("confirm",{
		clientId: req.query.clientId,
		redirectUri: req.query.redirectUri
	});
});
app.get('/oauth/client', oauthModel.generateClient);

//客户授权成功页
app.get('/clienttoken',function(req, res){
	res.render('client',{
		client_id: 'ycolw8jdzpvi',
		client_secret: 'jzlvoevtotvxtj4i',
		code: req.query.code		
	});
})

app.get('/target', app.oauth.authorise(), function (req, res) {
  res.send('Secret area');
});

app.use(app.oauth.errorHandler());

app.get('/search', cache.route(), function(req, res, next){
	var render = {
		root: '/search',
		reserve: '/s'
	};
	
	if(!req.query.q){
		res.render('home', render);
		return ;
	}
	
	google(req, res).search(req.query.q, req.query.page, req.query.orig).done(function(body){
		//res.send(body);
		res.render("home",extend(render,this.respJSON));
	}).fail(function(error, resp, body){
		res.send(body);
	});
});

/**/
app.get('/rss',cache.route({
	expire : 60 * 60 * 6
}), function(req, res){
	if(!req.query.c){
		res.status(400).send('missing keyword:c!');
		return ;
	}
	
	rss(req.query.c, function(rss){
		res.render('rss', rss);
	}, function(err, resp, body){
		res.status(400).send(body);
	});
});

app.get('/index',  function(req,res){
	var fs = require('fs');
	var json = JSON.parse(fs.readFileSync('views/template/interface.json', 'utf8'));
	res.render('template/post', json);
});


app.get('/login',  function(req,res){
	res.render('login');
});

app.get('/autosuggest', cache.route(), function(req, res){
	
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

app.get('/pref', cache.route(), function(req, res){
	if(!req.query.language || ['zh_CN','en'].indexOf(req.query.language) == -1){
		res.status(400).send('wrong language value! (zh_CN/en only)');
		return ;
	}
	
	wow(req,res).setPrefs(req.query.language).done(function(data){
			res.send(data);
		}).fail(function(error){
			res.send(error);
		});
});

app.get('/flushredis', function(req, res){
	cache.del("*",function (error, removed) {
		res.send("del:" + removed);
	});
});

app.get('/redirect', function(req, res){
	req.pipe(request(req.query.url)).pipe(res);
});


// Everything is setup. Listen on the port.

app.listen(port);

console.log('Cute files is running on port ' + port);