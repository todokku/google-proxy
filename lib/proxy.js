var extend = require("./extend"),
    request = require('request');


var passingResp = function(resp){
    var res = this.res,
        cookies = resp.headers['set-cookie'],
        contentLanguage = resp.headers['content-language'];
    
    if(!res){
        return ;
    }
        
    if(cookies && cookies.length > 0){
        cookies.forEach(function(cookie){
            res.writable && res.append('Set-Cookie', cookie.replace(/(Domain=)[^;]+/i, '$1proxy-wow-pn-paradise.c9.io'));
        }); 
    }
    if(contentLanguage){
        res.writable && res.append('content-language',contentLanguage);
    }
};

var doGet = function(url, opt){
    var doneFunc =[], failFunc =[], awaysFunc =[];
    
    var options = {
        url: url,
        method: 'GET'
    };
    
    if(opt){
        options = extend(options, opt, {
           headers: {
                'Cookie':opt.req && opt.req.headers.cookie
            }
        });
    }
    
    
    var proxyRequest = request(options, function (err, resp, body) {
        if(resp){
            
            //设置cookie
            passingResp.call(options, resp);
            
            options.headers['content-language'] = resp.headers['content-language'];
        }
        
        if ((err == null) && resp.statusCode === 200) {
            doneFunc.forEach(function(func){
                func.call(options, body);
            });
        }else{
            failFunc.forEach(function(func){
                func.call(options, err, resp, body);
            });
        }
        awaysFunc.forEach(function(func){
            func.call(options, err, resp, body);
        });
    });
    
    return extend(proxyRequest, {
        done: function(done){
            doneFunc.push(done);
            return this;
        },
        fail: function(fail){
            failFunc.push(fail);
            return this;
        },
        always: function(always){
            awaysFunc.push(always);
            return this;
        }
    });
};

module.exports = function(req, res){
    return {
        doGet: function(url, options){
            return doGet(url, extend({
                req: req,
                res: res
            }, options));
        }
    };
}




