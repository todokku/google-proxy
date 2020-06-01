var SEARCH_URL = 'https://www.google.com/search',
    PREFS_URL = '/setprefs?hl=%s&sa=X',
    AUTO_COMPLETE_URL = 'https://www.google.com/complete/search?client=hp&q=%s&hl=%s&xhr=t',
    itemSel = '#rso > .g',
    linkSel = '.r > a',
    titleSel = '.r > a > h3',
    descSel = '.s span.st',
    descSnippetSel = '.mod', //snippetSel 描述
    groupItemSel = '#search #rso table.rbt tr a', //分组结果
    imageItemSel = 'g-section-with-header #iur',
    imageListSel = 'img',
    imageScriptSelList = 'script:contains(\'_setImagesSrc\')', //google代码
    imageScriptSelPatch = 'script:contains(\'google.ldi\')', //图像后翻数据
    relevantSel = '#brs p > a', //相关结果
    totalSel = '#result-stats', //找到结果
    hintSel = '#fprsl', //拼写纠正
    origSel = '#fprs a.spell_orig', //原拼写
    adviceSel = '#taw .med a b i', //搜索建议
    paginationSel = '#foot td', //分页
    notResultSel = '#topstuff .med'; //无搜索结果


var { proxy } = require('./proxy'),
    querystring = require('querystring'),
    cheerio = require('cheerio'),
    util = require('util'),
    recast = require("recast");


var parseResult = function(connector, body){
    var parseItem =function($, elem){
        let $elem = $(elem);

        let linkElem = $elem.find(linkSel),
            descElem = $elem.find(descSel),
            titleElem = $elem.find(titleSel);

        if($elem.hasClass('g-blk')){
            if($elem.hasClass('kno-kp')){ //People also ask   g kno-kp mnr-c g-blk
                return null;
            }
            //Featured Snippets   g mnr-c g-blk
            descElem = $elem.find(descSnippetSel);
            if(descElem.length > 1){
                descElem = descElem.eq(1);
            }
        }

        let title = titleElem.text(),
            description = descElem.html(),
            link = linkElem.attr("href");

        //Translations  g knavi obcontainer mod
        if(!link){
            return ;
        }

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


    let groupResultList = $(groupItemSel);
    if(groupResultList.length){
        let groupItemHead = groupResultList.first();//首个
        let groupItemList = groupResultList.splice(1);//后面所有


        let groupItemLinks = [];
        for (let i = 0; i < groupItemList.length; i++) {
            let target = $(groupItemList[i]);
            groupItemLinks.push({
                title: target.html(),
                description:target.next('span').html(),
                href: target.attr('href')
            });
        }

        itemList.push({
            title: groupItemHead.html(),
            titleLink: groupItemHead.attr('href'),
            type: "group",
            link: groupItemLinks
        });
    }


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

        let ldiScript = $(imageScriptSelPatch).html();
        const ldiScriptAst = recast.parse(ldiScript);

        let initialScript  = 'window.google = window.google || {};';
        let injectSetImgSrcFunc = "function _setImagesSrc(e,c){function f(b){b.onerror=function(){b.style.display=\"none\"};b.src=c}for(var g=0,a=void 0;a=e[g++];){var d=document.getElementById(a)||document.querySelector(\"img[data-iid=\"+a+\"]\");d?f(d):(window.google=window.google||{},google.iir=google.iir||{},google.iir[a]=c)}};";
        let injectScript = "(function(){if(google.ldi) { for(let ll in google.ldi){_setImagesSrc([ll], google.ldi[ll]);}}})();";

        let proxyImgScript = "(function(){let imgs = document.getElementsByTagName('img'); for(var i=0;i<imgs.length;i++){if(imgs[i].src && imgs[i].src.startsWith('http')){ imgs[i].src = '/ref?q=' + imgs[i].src;}}})();";

        let injectPresetBase64Script = '';
        let imageScriptList = $(imageScriptSelList);
        for (let i = 0; i < imageScriptList.length; i++) {
            let script = $(imageScriptList[i]).html();
            if(script.indexOf('data:image') !== -1){
                injectPresetBase64Script += script;
                continue;
            }
            let primaryAst = recast.parse(script);

            for(let j=0; j< primaryAst.program.body.length; j++){
                let statement = primaryAst.program.body[j];
                if( statement.type === "FunctionDeclaration" && statement.id.name === "_setImagesSrc"){
                     injectPresetBase64Script +=  recast.print(statement).code;
                }
            }
        }

        itemList.push({
            title: images.prev().find("h3 a").text(),
            type: "image",
            link: imageLinks,
            script: initialScript + (injectPresetBase64Script || injectSetImgSrcFunc) + recast.print(ldiScriptAst.program.body[0]).code + injectScript + proxyImgScript
        });
    }


    $(itemSel).each(function (i, elem) {
        let item = parseItem($, elem);
        if(item){
            itemList.push(item);
        }
    });


   // console.info(html);
    var relevantList = [];
    $(relevantSel).each(function (i, elem) {
        relevantList.push($(elem).text());
    });

    var paginList = parsePagination($);

    var totalText = $(totalSel).text(), hintText = $(hintSel).text(), origText = $(origSel).text(), adviceText = $(adviceSel).text();

    let notResult = $(notResultSel).html();

    return {
        items: itemList,
        relevants: relevantList,
        total: totalText,
        hint: hintText,
        orig: origText,
        advice: adviceText,
        pagin: paginList,
        notResult: notResult
    };

};



module.exports = function(req, res){

    let getLanguage = function() {
         return req.cookies['hl'] || 'zh_CN';
    }
    let lang = getLanguage();

    //zh_CN en
    let setLanguage= function(language){
        return new Promise((resolve, reject) =>{
            res.cookie('hl', language, { maxAge: 31536000000, httpOnly: true });
            resolve('success');
        })

    };

    var autoComplete= function(keyword){
        return get(util.format(AUTO_COMPLETE_URL, querystring.escape(keyword), lang), {
            encoding: null
        });
    };

    let search = function(){
        req.url = SEARCH_URL;
        req.query.safe = 'active';
        req.query.hl = lang;
        req.query.start = req.query.page;
        return proxy(req, res).then(parseResult);
    };

    return {
        req: req,
        res: res,
        getLanguage: getLanguage,
        setLanguage: setLanguage,
        autoComplete: autoComplete,
        search: search
    }

}



