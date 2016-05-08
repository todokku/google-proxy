var google = require("../google");
var extend = require("../extend");

module.exports = function(app){

    app.get('/v2', function(req, res){
    	var render = {
    		root: '/search',
    		reserve: '/s'
    	};
    	
    	if(!req.query.q){
    		res.render('v2/index', render);
    		return ;
    	}
	
    	google(req, res).search(req.query.q, req.query.page, req.query.orig).done(function(body){
    		//res.send(body);
    		res.render("v2/index",extend(render,this.respJSON));
    	}).fail(function(error, resp, body){
    		res.send(body);
    	});
    });

    //other routes..
}