let extend = require("./extend"),
    request = require('request')


let get = function(url, opt){
   
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
    
    return new Promise((resolve, reject) => {
         request(options, function (err, resp, body) {
            if ((err == null) && resp.statusCode === 200) {
                return resolve.call(options, body)
            }
            return reject.call(options, err, resp, body);
        })
    })
    
};

module.exports = {
    get
}



