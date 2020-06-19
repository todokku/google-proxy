const TOP_URL = 'http://top.baidu.com/buzz?b=1&fr=topindex',
    TITLE_SEL = '.list-title';

const { proxy, ResponseStream } = require('./proxy'),
    cache = require('./cache'),
    cheerio = require('cheerio');


const parse = function(body){

    let $ = cheerio.load(body);

    let itemList = [];

    $(TITLE_SEL).each(function (i, elem) {
        if(i >= 8) {
            return false;
        }
        itemList.push([$(elem).text()]);
    });

    return [
        'search-top',
         itemList
    ];

};



module.exports = function(req, res){

    let top = function(){
        return cache('top', () => {
            req.url = TOP_URL;
            return proxy(req, new ResponseStream({ charset: 'gbk' })).then(parse);
        }, 60000);

    };

    return {
        req: req,
        res: res,
        top: top
    }

};



