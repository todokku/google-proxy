var SEARCH_URL = 'https://www.google.com/search?q=%s&start=%s',
    PREFS_URL = 'https://www.google.com/setprefs?hl=%s&prev=%s&sa=X',
    AUTO_COMPLETE_URL = 'https://www.google.com/complete/search?client=hp&hl=zh-CN&gs_rn=64&gs_ri=hp&cp=2&gs_id=ul&&xhr=t&q=%s',
    itemSel = '#search .srg > div.g',
    linkSel = '.r > a',
    titleSel = '.r > a > h3',
    descSel = '.s span.st',
    imageItemSel = 'g-section-with-header #iur',
    imageListSel = 'img',
    imageScriptSel1 = 'script:contains(\'_setImagesSrc\')',
    imageScriptSel2 = 'script:contains(\'google.ldi\')',
    relevantSel = '#brs p > a',
    totalSel = '#resultStats',
    hintSel = '#fprsl',
    origSel = '#fprs a.spell_orig', 
    adviceSel = '#taw .med a b i', //do you mean
    paginationSel = '#foot td';


var proxy = require('./proxy'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    util = require('util'),
    iconv = require('iconv-lite'),
    Buffer = require('buffer').Buffer,
    recast = require("recast");


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
                src: $(item).attr("data-src"),
                height: $(item).attr("height"),
                width: $(item).attr("width"),
                href: $(item).attr("title")
            });
        });

        let ldiScript = $(imageScriptSel2).html();
        const ast = recast.parse(ldiScript);

        let loc = ast.program.body[0].loc;

        let injectScript = "(function(){for(let ll in google.ldi){_setImagesSrc([ll], google.ldi[ll]);}})();";

        let injectImgSrcFunc = "window.google = window.google || {}; function _setImagesSrc(e,c){function f(b){b.onerror=function(){b.style.display=\"none\"};b.src=c}for(var g=0,a=void 0;a=e[g++];){var d=document.getElementById(a)||document.querySelector(\"img[data-iid=\"+a+\"]\");d?f(d):(window.google=window.google||{},google.iir=google.iir||{},google.iir[a]=c)}};";

        itemList.push({
            title: images.prev().find("h3 a").text(),
            type: "image",
            link: imageLinks,
            script: ($(imageScriptSel1).html() || injectImgSrcFunc) + ldiScript.substring(loc.start.column, loc.end.column) + injectScript
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
    
    var search= function(keyword, page, extra){
        return doGet(util.format(SEARCH_URL, querystring.escape(keyword), (page || '')), {
          //  encoding: null,
            keyword: keyword,
            qs: extra
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



