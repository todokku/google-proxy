var extend = require("./extend"),
    request = require('request');
    /*.defaults({
        proxy: "http://127.0.0.1:1080"
    });*/


var passingResp = function(resp){
    var res = this.res,
        cookies = resp.headers['set-cookie'],
        contentLanguage = resp.headers['content-language'];
    
    if(!res){
        return ;
    }
        
    if(cookies && cookies.length > 0){
        cookies.forEach(function(cookie){
            res.writable && res.append('Set-Cookie', cookie.replace(/(Domain=)[^;]+/i, '$1ggga.ga'));
        }); 
    }
    if(contentLanguage){
        res.writable && res.append('content-language',contentLanguage);
    }
};

var doGet = function(url, opt){
    var doneFunc =[], failFunc =[], awaysFunc =[];
    
    var options = extend(opt || {}, {
        url: url,
        method: 'GET',
        gzip: true,
        headers: {
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,la;q=0.8',
            'accept-encoding': 'gzip',
            'cache-control': 'no-cache',
            'connection': "keep-alive",
            'sec-fetch-mode': "cors",
            'host': "www.google.com",
            'sec-fetch-site': "cross-site",
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36'
        }
    });
    
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




