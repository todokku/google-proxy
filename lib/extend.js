var extend = function(source){
    for(var i=1; i < arguments.length; i++){
        var target = arguments[i];
        for(var p in target){
            if(source[p] && typeof source[p] === 'object'){
                source[p] = extend(source[p], target[p]);
            }else{
                source[p] = target[p];
            }
        }
    }
    return source;
};

module.exports = extend;