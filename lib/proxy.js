
let https  = require('https'),
    http = require('http'),
    httpAgent = require('https-proxy-agent'),
    zlib = require('zlib'),
    { StringDecoder } = require('string_decoder'),
    url = require('url'),
    { pipeline, Writable } = require('stream');


class ResponseStream extends Writable {

    constructor(opts){
        super(opts);
        this.decoder = new StringDecoder('utf8');

    }
    _write(chunk, enc, next) {
        this.rawData += this.decoder.write(chunk);
        next();
    }

    get(){
        return this.rawData;
    }

}

// HTTP/HTTPS proxy to connect to
console.log('using proxy server %j', process.env.http_proxy);

const proxy = (request, response) => {
    let options = url.parse(request.url);
    options.method = request.method;
    options.headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,la;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'cache-control': 'no-cache',
        'host': options.host,
        'sec-fetch-mode': "cors",
        'sec-fetch-site': "cross-site",
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36'
    };
    options.agent = process.env.http_proxy && new httpAgent(process.env.http_proxy) || false;

    return new Promise((resolve, reject) =>{
        let connector = null;

        const stream = new ResponseStream();

        stream.on('finish', () => {
            return resolve.call(connector, stream.get())
        });
        const fail = (e) => {
            return reject.call(connector, e)
        };

        const done = (responseBody) => {
            switch (responseBody.headers['content-encoding']) {
                case 'br':
                    pipeline(responseBody, zlib.createBrotliDecompress(), stream, fail);
                    break;
                // Or, just use zlib.createUnzip() to handle both of the following cases:
                case 'gzip':
                    pipeline(responseBody, zlib.createGunzip(), stream, fail);
                    break;
                case 'deflate':
                    pipeline(responseBody, zlib.createInflate(), stream, fail);
                    break;
                default:
                    pipeline(responseBody, stream, fail);
                    break;
            }
        };

        if(options.protocol === 'https:'){
            connector = https.request(options, done);
        }else{
            connector = http.request(options, done);
        }

        connector.on('error', (e) => {
            return reject.call(connector, e)
        });
        return connector;
    });

};

module.exports = {
    proxy
}



