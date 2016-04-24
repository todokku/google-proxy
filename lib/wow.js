var proxy = require('./proxy'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    util = require('util');


var SEARCH_URL = 'http://www.wow.com/search?q=%s',
    PREFS_URL = 'http://www.wow.com/setprefs?s_cu=settings%3FprevUrl%3Dhttp%3A%2F%2Fwww.wow.com%2F&sp_lp=1&s_cm=settings&s_cd=prefRedir&src=PREFS&languagePreference=%s',
    AUTO_COMPLETE_URL = 'http://autocomplete-gsa.search.aol.com/autocomplete/get?q=%s&count=8&output=json&echo=off&it=gsa-wow-search&&locale=zh_CN,zh_*,*_CN,*',
    itemSel = 'ul[content="ALGO"] li',
    linkSel = 'a[property="f:title"]',
    descSel = 'p[property="f:desc"]',
    vLinkSel = 'p.v_title > a',
    vDescSel = 'div.videoDesc',
    imgLinkSel = 'div.container img',
    imgDescSel = 'div.header_title a',
    relevantSel = 'div.RSBOT ul > li > a',
    totalSel = 'div.MSR > span',
    hintSel = 'div.SC > span.spell > a',
    origSel = 'div.SC > span.origq > a',
    adviceSel = 'div.DYM > h3 > a',
    paginationSel = '#pagination > ul',
    headers = {
        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer':'http://www.wow.com/',
        'Accept-Language':'zh-CN,zh;q=0.8'
    };


var parseResult = function(body){
    var parseItem =function($, elem){
        var linkElem = $(elem).find(linkSel),
            descElem = $(elem).find(descSel),
            type = 'text';


        if(!linkElem.length){
            linkElem = $(elem).find(vLinkSel);
            descElem = $(elem).find(vDescSel);
            type = 'video';
        }

        if(!linkElem.length){
            console.info($(elem).html());
            linkElem = $(elem).find(imgLinkSel);
            descElem = $(elem).find(imgDescSel);
            type = 'imgs';
        }

        var title = linkElem.text(),
            description = descElem.text(),
            link = linkElem.attr('href');

        if(type == 'imgs'){
            //图片组 标题使用描述
            title = description;
            var links = [];
            
            $(linkElem).each(function(i, item){
                links.push({
                    href: $(item).attr('src'),
                    src:$(item).attr('src')
                });
            });
            link = links;
        }

        return {
            title: title,
            description: description,
            link: link     
        }

    },
    parsePagination = function($){
        var paginResult = [];
        $(paginationSel).children().each(function(i, item){
            var pageItem = $(item),
                active = true, page;

            if($(item)[0].name == 'span'){
                var virtrueLink = $(item).find('a');
                if(!virtrueLink.length){
                    active = false;
                }
                else{
                    pageItem = virtrueLink;
                    page = pageItem.attr('href').match(/page=(\d+)/)[1];
                }
            }
            else{
                page = pageItem.attr('href').match(/page=(\d+)/)[1];
            }

            paginResult.push({
                page: page,
                active: active,
                text: pageItem.text()
            });
        });

        return paginResult;
    }
    
    var $ = cheerio.load(body);
    var itemList = [];
    $(itemSel).each(function (i, elem) {
        itemList.push(parseItem($, elem));
    });

    var relevantList = [];
    $(relevantSel).each(function (i, elem) {
        relevantList.push($(elem).text());
    });

    var paginList = parsePagination($);

    var totalText = $(totalSel).text(), hintText = $(hintSel).text(), origText = $(origSel).text(), adviceText = $(adviceSel).text();
    
    this.respJSON = {
        headers: this.headers,
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
    
    var doGet = proxy(req, res).doGet;
    
    //zh_CN en
    var setPrefs= function(pref){
        return doGet(util.format(PREFS_URL, pref),{
            headers: headers
        });
    };
        
    var autoComplete= function(keyword){
        return doGet(util.format(AUTO_COMPLETE_URL, querystring.escape(keyword)));
    };
    
    var search= function(keyword, page, orig){
        return doGet(util.format(SEARCH_URL, querystring.escape(keyword)) + (page && ('&page='+page) || '') + (orig && '&nfpr=1' || ''), {
            headers: headers,
            keyword: keyword
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



