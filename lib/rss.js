var request = require('request'),
    parser = require('xmlparser'),
    iconv = require('iconv-lite');

var tencentrss = {
    civil : "http://news.baidu.com/n?cmd=1&class=civilnews&tn=rss",
    net : "http://news.baidu.com/n?cmd=1&class=internet&tn=rss",
    tech : "http://news.baidu.com/n?cmd=1&class=technnews&tn=rss"
    
}
module.exports = function(type, done, fail){
    
    if(tencentrss[type]){
        request({
            url: tencentrss[type],
            method: 'get',
            encoding : null
        }, function (err, resp, body) {
            if ((err == null) && resp.statusCode === 200) {
               
                /*var unionstr = null;
                if(type == "sh"){
                    
                }
                else{
                    unionstr= iconv.decode(body, 'gb2312');
                }*/
                try{
                    var unicodestr = iconv.decode(body, 'gb2312');
                    done && done(parser.parser(unicodestr,''));
                }catch(ex){
                    console.log(ex);
                    fail && fail(err, resp, body);
                }
               
                
              
            }else{
                fail && fail(err, resp, body);
            }
        });
    }else{
        done && done({});
    }
}