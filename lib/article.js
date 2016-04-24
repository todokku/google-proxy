var mongoose = require('./mongoose');

var Article = {
      title: String
    , author: String
    , content: String
    , modifyTime: Date
    , createTime: Date
};

module.exports=function(){
    return mongoose('article', Article, function(query){
        var condition = {}, sort = {};
        if(query && query.title){
            condition.title = new RegExp(query.title,'i');
        }
        if(query && query.content){
            condition.content = new RegExp(query.content,'i');
        }
        if(query && query.author){
            condition.author = new RegExp(query.author,'i');
        }
        
        if(query && query.order){
            sort[query.order] = query.sort || 'desc';
        }
        return {
            condition: condition,
            perPage: query && query.perPage,
            page: query && query.page,
            sort: sort
        };
    });
}
