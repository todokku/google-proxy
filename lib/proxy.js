
let https  = require('https'),
    http = require('http'),
    httpAgent = require('https-proxy-agent'),
    zlib = require('zlib'),
    { StringDecoder } = require('string_decoder'),
    url = require('url'),
    querystring = require('querystring'),
    { pipeline, Writable } = require('stream');


class ResponseStream extends Writable {

    constructor(opts){
        super(opts);
        this.decoder = new StringDecoder('utf8');
        this.rawData = '';
    }
    _write(chunk, enc, next) {
        this.rawData += this.decoder.write(chunk);
        next();
    }

    toString(){
        return this.rawData;
    }

}

// HTTP/HTTPS proxy to connect to
console.log('using proxy server %j', process.env.http_proxy);

const proxy = (request, response) => {

    let params = querystring.stringify(request.query);

    let options = null;
    if(request.url.indexOf('?') === -1){
        options = url.parse(request.url + '?' + params);
    }
    else{
        options = url.parse(request.url + '&' + params);
    }

    options.method = request.method;
    options.headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,la;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'cache-control': 'no-cache',
        'host': options.host,
        'sec-fetch-dest': "empty",
        'sec-fetch-mode': "cors",
        'sec-fetch-site': "same-origin",
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'
    };
    options.agent = process.env.http_proxy && new httpAgent(process.env.http_proxy) || false;
    if(!response){
        response = new ResponseStream();
    }

    return new Promise((resolve, reject) =>{
        let connector = null;

        response.on('finish', () => {
            if(response instanceof ResponseStream){
                return resolve(response.toString())
            }
            return resolve(response)
        });

        const fail = (e) => {
            return reject(e)
        };

        const done = (resp) => {
            if(response instanceof ResponseStream){
                switch (resp.headers['content-encoding']) {
                    case 'br':
                        pipeline(resp, zlib.createBrotliDecompress(), response, fail);
                        break;
                    // Or, just use zlib.createUnzip() to handle both of the following cases:
                    case 'gzip':
                        pipeline(resp, zlib.createGunzip(), response, fail);
                        break;
                    case 'deflate':
                        pipeline(resp, zlib.createInflate(), response, fail);
                        break;
                    default:
                        pipeline(resp, response, fail);
                        break;
                }
            }
            else {
                response.writeHeader(resp.statusCode, resp.headers);
                pipeline(resp, response, fail);
            }

        };


        if(options.protocol === 'https:'){
            connector = https.request(options);
        }else{
            connector = http.request(options);
        }

        connector.on('response', done);
        connector.on('error', (e) => {
            return reject(e)
        });
        connector.end();


    });

};

module.exports = {
    proxy
}



