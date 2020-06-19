
const persistence = {};

module.exports = function(key, getter, timeout){
    let current =  new Date().getTime();
    if( persistence.key && persistence.key.timeout >=  current ){
        return persistence.key.value;
    }

    persistence.key = {
        timeout: current + timeout,
        value: getter()
    };

    return persistence.key.value;
};
