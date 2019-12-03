var SEARCH_URL = 'https://www.google.com/search?q=%s&start=%s',
    PREFS_URL = 'https://www.google.com/setprefs?hl=%s&prev=%s&sa=X',
    AUTO_COMPLETE_URL = 'https://www.google.com/complete/search?client=hp&hl=zh-CN&gs_rn=64&gs_ri=hp&cp=2&gs_id=ul&&xhr=t&q=%s',
    itemSel = '#search .srg > div.g',
    linkSel = '.r > a',
    titleSel = '.r > a > h3',
    descSel = '.s span.st',
    imageItemSel = 'g-section-with-header',
    imageTitleSel = 'h3 a',
    imageListSel = '#iur img',
    imageSrcSel = 'script:contains(\'_setImagesSrc\')',
    relevantSel = '#brs p > a',
    totalSel = '#resultStats',
    hintSel = '#center_col a.spell',
    origSel = '#center_col span.spell_orig > a',
    adviceSel = 'div.DYM > h3 > a',
    paginationSel = '#foot td';


var proxy = require('./proxy'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    util = require('util'),
    iconv = require('iconv-lite'),
    Buffer = require('buffer').Buffer;


var parseResult = function(body){
    var parseItem =function($, elem){
        let linkElem = $(elem).find(linkSel),
            descElem = $(elem).find(descSel),
            titleElem = $(elem).find(titleSel);

        let title = titleElem.text(),
            description = descElem.text(),
            link = linkElem.attr("href");

        return {
            type: "link",
            title: title,
            description: description,
            link: link || ''
        }

    },
    parsePagination = function($){
        var paginResult = [];
        $(paginationSel).each(function(i, item){
            var pageItem = $(item),
                active = true, page;

            var virtrueLink = $(item).find('a');
            if(!virtrueLink.length){
                active = false;
            }
            else{
                pageItem = virtrueLink;
                page = pageItem.attr('href').match(/start=(\d+)/)[1];
            }

            if(pageItem.text()){
                paginResult.push({
                    page: page,
                    active: active,
                    text: pageItem.text()
                });
            }
        });

        return paginResult;
    }

    //let html = iconv.decode(new Buffer(body, 'binary'), 'win1251' );//|| 'win1251'
    var $ = cheerio.load(body);
    
    var itemList = [];

    let images = $(imageItemSel);
    if(images.length){
        let imageList = images.find(imageListSel);
        let imageLinks = [];
        $(imageList).each(function(i, item){
            imageLinks.push({
                id: $(item).attr("id"),
                height: $(item).attr("height"),
                width: $(item).attr("width"),
                href: $(item).attr("title")
            });
        });

        itemList.push({
            title: images.find(imageTitleSel).text(),
            type: "image",
            link: imageLinks,
            script: $(imageSrcSel).html()
        });
    }


    $(itemSel).each(function (i, elem) {
        itemList.push(parseItem($, elem));
    });
    

   // console.info(html);
    var relevantList = [];
    $(relevantSel).each(function (i, elem) {
        relevantList.push($(elem).text());
    });

    var paginList = parsePagination($);

    var totalText = $(totalSel).text(), hintText = $(hintSel).text(), origText = $(origSel).text(), adviceText = $(adviceSel).text();
    
    this.respJSON = {
        headers: { 'content-language' : this.pref },
        keyword: this.keyword,
        items: itemList, 
        relevants: relevantList, 
        total: totalText,
        hint: hintText,
        orig: origText,
        advice: adviceText,
        pagin: paginList
    };
    
};



module.exports = function(req, res){
    
    var doGet = proxy(req,res).doGet;
    
    //zh_CN en
    var setPrefs= function(pref, prev){
        return doGet(util.format(PREFS_URL, pref, querystring.escape(prev))).done(function(body){
            res.cookie('content-language', pref, { maxAge: 900000, httpOnly: true });
        });
    };
        
    var autoComplete= function(keyword){
        return doGet(util.format(AUTO_COMPLETE_URL, querystring.escape(keyword)), {
            encoding: null
        }).done(function(body){this.body = body; });
    };
    
    var search= function(keyword, page, orig){
        var pref = (req.cookies['content-language'] || 'zh-CN');
        return doGet(util.format(SEARCH_URL, querystring.escape(keyword), (page || '')), {
          //  encoding: null,
            keyword: keyword,
            pref: pref
        }).done(parseResult);
    };
    
    return {
        req: req,
        res: res,
        setPrefs: setPrefs,
        autoComplete: autoComplete,
        search: search
    }
    
}



