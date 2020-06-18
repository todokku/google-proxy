const TOP_URL = 'http://top.baidu.com/buzz?b=1&fr=topindex',
    TITLE_SEL = '.list-title';

const { proxy, ResponseStream } = require('./proxy'),

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
        req.url = TOP_URL;
        return proxy(req, new ResponseStream({ charset: 'gbk' })).then(parse);
    };

    return {
        req: req,
        res: res,
        top: top
    }

};



