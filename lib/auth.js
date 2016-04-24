var mongoose = require("./mongoose");

var AccessToken = {
    accessToken: String,
    clientId: String,
    expires: Date,
    userId: String
},
OAuthClient = {
    clientId: String, 
    clientSecret: String,
    redirectUri: String
},
OAuthCode = {
    authCode: String,
    clientId: String,
    expires: Date,
    userId: String
},
RefreshToken = {
    refreshToken: String,
    clientId: String,
    expires: Date,
    userId: String
},
User = {
    id: String,
    username: String,
    password: String
};



module.exports = {
    getAccessToken :function(bearerToken, callback){
        mongoose('access_token', AccessToken).findOne({accessToken: bearerToken}).done(function(token){
            if(!token){
                callback(new Error('access_token not found!'));
            }else{
                callback(null, token);
            }
        }).fail(function(err){
            callback(err);
        });
        
    },
    getClient :function(clientId, clientSecret, callback){
        mongoose('oauth_client', OAuthClient).findOne({
            clientId: clientId
        }).done(function(client){
            if(!client){
                callback(new Error('oauth_client not found!'));
            }else{
                callback(null, client);
            }
        }).fail(function(err){
            callback(err);
        });
    },
    grantTypeAllowed :function(clientId, grantType, callback){
        callback(false, true);//indicates whether the grantType is allowed for this clientId
    },
    saveAccessToken :function(accessToken, clientId, expires, user, callback){
        mongoose('access_token', AccessToken).save({
            accessToken: accessToken,
            clientId: clientId,
            expires: expires,
            userId: user.id || user,
        }).done(function(token){
            callback(null);
        }).fail(function(err){
            callback(err);
        });
    },
    
    getAuthCode :function(authCode, callback){
        mongoose('oauth_code', OAuthCode).findOne({authCode: authCode}).done(function(code){
            if(!code){
                callback(new Error('oauth_code not found!'));
            }else{
                callback(null, code);
            }
        }).fail(function(err){
            callback(err);
        });
    },
    saveAuthCode :function(authCode, clientId, expires, user, callback){
        mongoose('oauth_code', OAuthCode).save({
            authCode: authCode,
            clientId: clientId,
            expires: expires,
            userId: user.id || user,
        }).done(function(code){
            callback(null);
        }).fail(function(err){
            callback(err);
        });
    },
    
    getUser :function(username, password, callback){
        mongoose('user', User).findOne({
            username: username,
            password: password
        }).done(function(user){
            if(!user){
                callback(new Error('user auth fail! '), false);
            }else{
                callback(null, user.id);
            }
        }).fail(function(err){
            callback(err, false);
        });
    },
    
    saveRefreshToken :function(refreshToken, clientId, expires, user, callback){
        mongoose('refresh_token', RefreshToken).save({
            refreshToken: refreshToken,
            clientId: clientId,
            expires: expires,
            userId: user.id || user,
        }).done(function(token){
            callback(null);
        }).fail(function(err){
            callback(err);
        });
    },
    
    getRefreshToken :function(refreshToken, callback){
        mongoose('refresh_token', RefreshToken).findOne({refreshToken: refreshToken}).done(function(token){
            if(!token){
                callback(new Error('refresh_token not found!'));
            }else{
                callback(null, token);
            }
        }).fail(function(err){
            callback(err);
        });
    },
    
   /* revokeRefreshToken: function(refreshToken, callback){
        
    },*/
    
    //(custom) grant type
    generateClient :function(req, res, next){
        mongoose('oauth_client', OAuthClient).save({
            clientId: Math.random().toString(36).substring(6),
            clientSecret:Math.random().toString(36).substring(2),
            redirectUri: req.query.redirectUri
        }).done(function(client){
            res.json(client);
        }).fail(function(err){
            res.status(500).json(err);
        });
        
    },
    
    //client_credentials
    getUserFromClient :function(clientId, clientSecret, callback){
        mongoose('oauth_client', OAuthClient).findOne({
            clientId: clientId, 
            clientSecret: clientSecret
        }).done(function(client){
            if(!client){
                callback(new Error('oauth_client not found!'));
            }else{
                mongoose('oauth_client', OAuthClient).findOne({id: client.userId}).done(function(user){
                    if(!user){
                        callback(new Error('user not found!'));
                    }else{
                        callback(null, user);
                    }
                }).fail(function(err){
                    callback(err);
                });
                
            }
        }).fail(function(err){
            callback(err);
        });
    },
    
    //type accessToken or refreshToken
    /*generateToken :function(type, req, callback){
        
    }*/

}