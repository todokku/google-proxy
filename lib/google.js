var proxy = require('./proxy'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    util = require('util'),
    iconv = require('iconv-lite'),
    Buffer = require('buffer').Buffer;


var SEARCH_URL = 'http://www.google.com/search?q=%s&start=%s&nfpr=%s&hl=%s&sourceid=chrome&ie=UTF-8',
    PREFS_URL = 'https://www.google.com/setprefs?hl=%s&prev=%s&sa=X',
    AUTO_COMPLETE_URL = 'https://www.google.com/complete/search?client=hp&hl=zh-CN&gs_rn=64&gs_ri=hp&cp=2&gs_id=ul&&xhr=t&q=%s',
    titleSel = 'div:nth-child(1)',
    descSel = 'div:nth-child(1)',
    itemSel = '#main .xpd > div:nth-child(1) > a[href^=\'/url?\']',
    imgLinkSel = 'a > img',
    relevantSel = '#center_col table:last-child td p > a',
    totalSel = '#resultStats',
    hintSel = '#center_col a.spell',
    origSel = '#center_col span.spell_orig > a',
    adviceSel = 'div.DYM > h3 > a',
    paginationSel = '#foot td';


var parseResult = function(body){
    var parseItem =function($, elem){
        var linkElem = $(elem),
            titleElem = $(elem).find(titleSel),
            descElem = linkElem.parents(".xpd").children().last(),
            type = 'text';


       /* if(!linkElem.length || !descElem.length){
            descElem = linkElem;
            linkElem = $(elem).find(imgLinkSel);
            type = 'imgs';
        }*/

        var title = titleElem.text(),
            description = descElem.text(),
            link = linkElem.attr('href'),
            link = link && decodeURIComponent(link.replace(/\/url\?q\=/g,'').replace(/&[^&]*/g,''));

      /*  if(type == 'imgs'){
            
            //图片组 标题使用描述
            title = description;
            var links = [];
            
            $(linkElem).each(function(i, item){
                links.push({
                    href: $(item).parent().attr('href'),
                    src: 'forward?q=' + encodeURIComponent($(item).attr('src'))
                });
            });
            link = links;
        }*/

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
    
    var html = iconv.decode(new Buffer(body, 'binary'), this.pref == 'en' ? 'win1251' : 'gbk');

    var $ = cheerio.load(html);
    
    var itemList = [];
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
        }).done(function(body){this.body = iconv.decode(new Buffer(body, 'binary'), 'gbk');});
    };
    
    var search= function(keyword, page, orig){
        var pref = (req.cookies['content-language'] || 'zh-CN');
        return doGet(util.format(SEARCH_URL, querystring.escape(keyword), (page || ''), (orig && '1' || ''), pref), {
            //'http://www.google.com/search?q=s&amp;safe=strict&amp;hl=zh_CN&amp;ie=UTF-8&amp;gbv=1&amp;sei=h8GQVs-EEMmW0gS-u7CQAQ',{
            encoding: null,
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



