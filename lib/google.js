var proxy = require('./proxy'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    util = require('util'),
    iconv = require('iconv-lite');


var SEARCH_URL = 'http://www.google.com/search?q=%s&hl=zh_CN',
    PREFS_URL = '',
    AUTO_COMPLETE_URL = 'https://www.google.com/complete/search?client=hp&hl=zh-CN&gs_rn=64&gs_ri=hp&cp=2&gs_id=ul&&xhr=t&q=%s',
    linkSel = 'h3 > a',
    descSel = 'span.st',
    itemSel = '#search div.g',
    vLinkSel = 'p.v_title > a',
    vDescSel = 'div.videoDesc',
    imgLinkSel = 'a > img',
    imgDescSel = '',
    relevantSel = '#desktop-search table td p._Bmc > a',
    totalSel = '#resultStats',
    hintSel = '#_FQd a.spell',
    origSel = '#_FQd span.spell_orig > a',
    adviceSel = 'div.DYM > h3 > a',
    paginationSel = '#foot td';


var parseResult = function(body){
    var parseItem =function($, elem){
        var linkElem = $(elem).find(linkSel),
            descElem = $(elem).find(descSel),
            type = 'text';


        if(!linkElem.length || !descElem.length){
            descElem = linkElem;
            linkElem = $(elem).find(imgLinkSel);
            type = 'imgs';
        }

        var title = linkElem.text(),
            description = descElem.text(),
            link = linkElem.attr('href'),
            link = link && decodeURIComponent(link.replace(/\/url\?q\=/g,'').replace(/&[^&]*/g,''));

        if(type == 'imgs'){
            
            //图片组 标题使用描述
            title = description;
            var links = [];
            
            $(linkElem).each(function(i, item){
                links.push({
                    href: $(item).attr('title'),
                    src: 'redirect?url=' + encodeURIComponent($(item).attr('src'))
                });
            });
            link = links;
            console.info(link);
        }

        return {
            title: title,
            description: description,
            link: link     
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
    
    var html = iconv.decode(body, 'gb2312');
    var $ = cheerio.load(html);
    
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
    
    var doGet = proxy(req,res).doGet;
    
    //zh_CN en
    var setPrefs= function(pref){
        return doGet(util.format(PREFS_URL, pref),{
        });
    };
        
    var autoComplete= function(keyword){
        return doGet(util.format(AUTO_COMPLETE_URL, querystring.escape(keyword)), {
            encoding: null
        }).done(function(body){this.body = iconv.decode(body, 'gb2312');});
    };
    
    var search= function(keyword, page, orig){
        return doGet(util.format(SEARCH_URL, querystring.escape(keyword)) + (page && ('&start='+page) || '') + (orig && '&nfpr=1' || ''), {
            //'http://www.google.com/search?q=s&amp;safe=strict&amp;hl=zh_CN&amp;ie=UTF-8&amp;gbv=1&amp;sei=h8GQVs-EEMmW0gS-u7CQAQ',{
            encoding: null,
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



