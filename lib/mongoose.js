var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/test');
    
var db= mongoose.connection;

db.on('error', console.error.bind(console, 'connection error!'));

db.once('open', function(callback){
    console.log('start!')
});

var schemaCache = {};

module.exports=function(schemaName, desc, formatter){
    var Schema = schemaCache[schemaName] || (schemaCache[schemaName] = mongoose.model(schemaName, new mongoose.Schema(desc)));

    var doneFunc = [], failFunc = [], alwaysFunc = [], druid = 0, sent = false;
    var notify = function(index, result, err){
        if (!sent && err){
            console.error(err);
            failFunc.forEach(function(func){
                func(err);
            });
            alwaysFunc.forEach(function(func){
                func(err);
            });
            sent = true;
        }
      
        //目标次数
        else if(!sent && index == druid - 1){
            doneFunc.forEach(function(func){
                func(result);
            });
            alwaysFunc.forEach(function(func){
                func(result);
            });
            sent = true;
        }
    },
    format = function(query){
        if(formatter){
            return formatter(query);
        }
        return query;
    };
    
    return {
        save:function(target){
            var index = druid ++;
            if(target._id){
                Schema.findByIdAndUpdate(target._id, target, {
                    new : true
                },function(err, result){
                    notify(index, result, err);
                });
            }else{
               new Schema(target).save(function(err, result){
                    notify(index, result, err);
                });
            }
            
            return this;
        },
        remove:function(id){
            var index = druid ++;
            Schema.findByIdAndRemove(id, function(err, result){
                notify(index, result, err);
            });
            return this;
        },
        findById:function(id){
            var index = druid ++;
            Schema.findById(id,function(err, result){
                notify(index, result, err);
            });
            return this;
        },
        findOne:function(query){
            var index = druid ++;
            Schema.findOne(query, function(err, result){
                notify(index, result, err);
            });
            return this;
        },
        find:function(query){
            var index = druid ++, meta = format(query);
            var Query = Schema.find(meta.condition);
                
                if(meta.perPage && meta.perPage > 0){
                    Query = Query.limit(meta.perPage);
                    if(meta.page && meta.page > 0){
                        Query = Query.skip(meta.perPage * (meta.page - 1))
                    }else{
                        meta.page = 1;
                    }
                }else{
                    meta.page = 1;
                    meta.perPage = null;
                }
                
                if(meta.sort){
                    Query = Query.sort(meta.sort);
                }
                
                Query.exec(function (err, data) {
                    if(err){
                        notify(index, data, err);
                    }else{
                        Schema.count(meta.condition, function(err, count){
                            notify(index, {
                                page: meta.page && meta.page >> 0 || 1,
                                pages: meta.perPage && Math.ceil(count / meta.perPage) || 1 ,
                                perPage: meta.perPage && meta.perPage >> 0 || null,
                                total: count,
                                data: data
                            }, err);
                        })
                    }
                    
                });
            return this;
        },
        done: function(callback){
            doneFunc.push(callback);
            return this;
        },
        fail: function(callback){
            failFunc.push(callback);
            return this;
        },
        always: function(callback){
            alwaysFunc.push(callback);
            return this;
        }
    }
}