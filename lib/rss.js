var request = require('request'),
    parser = require('xml-mapping'),
    iconv = require('iconv-lite');

var tencentrss = {
    top : "https://news.google.com/news/rss/?ned=cn&hl=zh-CN",
    world : "https://news.google.com/news/rss/headlines/section/topic/WORLD.zh-CN_cn/%E5%9B%BD%E9%99%85%2F%E6%B8%AF%E5%8F%B0?ned=cn&hl=zh-CN",
    tech : "https://news.google.com/news/rss/headlines/section/topic/SCITECH.zh-CN_cn/%E7%A7%91%E6%8A%80?ned=cn&hl=zh-CN"
    
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
                    var unicodestr = iconv.decode(body, 'utf-8');
                    var json = parser.load(unicodestr);
                    done && done(json);
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