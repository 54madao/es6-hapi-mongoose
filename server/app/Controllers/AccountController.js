var Joi = require('joi'),
    Boom = require('boom'),
    User = require('../models/User').model,
    Account = require('../models/Account').model,
    Link = require('../models/Link').model
    jwt = require('jsonwebtoken'), // JsonWebToken implementation for node.js
    config = require('dotenv').config();
var Async = require('async');

var cookie_options = {
  ttl: 1 * 60 * 60 * 1000, // expires a year from today 
  encoding: 'none',    // we already used JWT to encode 
  isSecure: true,      // warm & fuzzy feelings 
  isHttpOnly: true,    // prevent client alteration 
  clearInvalid: false, // remove invalid cookies 
  strictHeader: true   // don't allow violations of RFC 6265 
}

//todo check role
exports.getAll = {

    auth: 'token',
    handler: function(request, reply) {
        Account.find({}, function(err, accounts) {
            if (!err) {
                reply(accounts);
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};

exports.create = {
	auth: 'token',
    validate: {
        payload: {
            accountName: Joi.string().required()
        }
    },
    handler: function(request, reply) {
    	// console.log(request.auth.credentials);
        var account = new Account({
        	accountName: request.payload.accountName,
        	users:[{
                role: "ADMIN",
                _id: request.auth.credentials.id
            }],
        	entry_date : new Date()
        });
        // console.log(account);
        account.save(function(err, account) {
            if (!err) {
                var userId = request.auth.credentials.id;
                var item = {
                    role: "ADMIN",
                    _id: account._id
                };
                var update = {$push: {"accounts": item}};
                var options = {new: true};
                User.findByIdAndUpdate(
                    userId,
                    update,
                    options,
                    function(err, user) {
                         if (!err) {
                            reply({account: account, user: user}).created('/account/' + account._id);
                         } else {
                             if (11000 === err.code || 11001 === err.code) {
                                 callback(Boom.forbidden("please provide another account id, it already exist"),null);
                             } else callback(Boom.forbidden(err),null); // HTTP 403
                         }
                     }
                );          
            } else {
                if (11000 === err.code || 11001 === err.code) {
                    reply(Boom.forbidden(err));
                } else reply(Boom.forbidden(err)); // HTTP 403
            }
        });
    }
};

exports.getUsers = {
    auth: 'token',
    handler: function(request, reply){
        Account.findById(request.params.id)
                .populate('users._id')
                .exec(function(err, account){
                    if(!err){
                        reply(account.users);
                    }
                    else{
                        reply(Boom.badImplementation(err));
                    }
                });
    }
};


exports.linkUser = {
	auth: 'token',
	validate: {
		payload: {
            email: Joi.string().email().lowercase().required(),
            link: Joi.boolean().required()
        }
	},
	handler: function(request, reply){ 
        Async.auto({
            findUser: function(callback){
                User.findOne({
                    'email': request.payload.email
                }, function(err, user) {
                    if(!err){
                        if(!user){
                            callback({
                                success: false,
                                message: 'Linking failed. User not found.'
                            },null);
                            return;
                        }
                        else{
                            callback(null, user);
                            return;
                        }
                    }
                    else{
                        callback(Boom.badImplementation(err),null);
                        return;
                    }
                })
            },
            linking: ['findUser', function(results, callback){
                // console.log(JSON.stringify(results));
                var user = results.findUser;
                var accountId = encodeURIComponent(request.params.id);
                var item = {
                    role: "READONLY",
                    _id: user._id
                };
                var update = request.payload.link?{$push: {"users": item}}:{$pull: {"users": item}};
                var options = {new: true};


                Account.findByIdAndUpdate(
                    accountId,
                    update,
                    options,
                    function(err, account) {
                         if (!err) {
                            var item = {
                                role: "READONLY",
                                _id: account._id
                            }
                             request.payload.link?user.accounts.push(item):user.accounts.pull(item);
                             user.save(function(err, user){
                                if(!err){
                                    callback(null,{account: account, user: user});
                                }
                                else{
                                    callback(Boom.badImplementation(err),null);
                                }
                             });
                         } else {
                             if (11000 === err.code || 11001 === err.code) {
                                 callback(Boom.forbidden("please provide another account id, it already exist"),null);
                             } else callback(Boom.forbidden(err),null); // HTTP 403
                         }
                     }
                );          
            }]
        }, function(err, results) {
            // console.log('err = ', err);
            // console.log('results = ', results);

            if(err){
                reply(err);
            }
            else{
                reply(results.linking).created('/account/' + request.params.id);
            }
        });
	}
};

exports.assignRole = {
    auth: 'token',
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            role: Joi.string().required() 
        }
    },
    handler: function(request, reply) {
        Async.auto({
            auth: function(callback){
                Account.findOne({
                    $and: [{
                        '_id': request.params.id
                    },
                    {
                        'users._id': request.auth.credentials.id
                    }]
                },'users.$',function(err, account){
                    if(!err){
                        if(account.users[0].role == "ADMIN"){
                            callback(null, null);
                        }
                        else{
                            callback("Not ADMIN", null);
                        }
                    }
                    else{
                        callback(Boom.badImplementation(err), null);
                    }
                });
            },
            findUser: function(callback){
                User.findOne({
                    'email': request.payload.email
                }, function(err, user) {
                    if(!err){
                        if(!user){
                            callback({
                                success: false,
                                message: 'Assign failed. User not found.'
                            },null);
                            return;
                        }
                        else{
                            callback(null, user);
                            return;
                        }
                    }
                    else{
                        callback(Boom.badImplementation(err),null);
                        return;
                    }
                })
            },
            assign: ['findUser', function(results, callback){
                var user = results.findUser;

                var conditions = {
                    $and: [{
                        '_id': request.params.id
                    },
                    {
                        'users._id': user._id
                    }]
                };
                var update = {$set: {"users.$.role": request.payload.role}};
                var options = {new: true};

                Account.findOneAndUpdate(
                    conditions,
                    update,
                    options,
                    function(err, account) {
                         if (!err) {
                            // var item = {
                            //     role: "READONLY",
                            //     _id: account._id
                            // }
                            //  request.payload.link?user.accounts.push(item):user.accounts.pull(item);
                            //  user.save(function(err, user){
                            //     if(!err){
                            //         callback(null,{account: account, user: user});
                            //     }
                            //     else{
                            //         callback(Boom.badImplementation(err),null);
                            //     }
                            //  });
                             var conditions = {
                                $and: [{
                                    '_id': user._id
                                },
                                {
                                    'accounts._id': request.params.id
                                }]
                            };
                            var update = {$set: {"accounts.$.role": request.payload.role}};
                            var options = {new: true};
                            User.findOneAndUpdate(
                                conditions,
                                update,
                                options,
                                function(err, user) {
                                    if(!err){
                                        callback(null,{account: account, user: user});
                                    }
                                    else{
                                        callback(Boom.badImplementation(err),null);
                                    }
                                }
                            );
                         } else {
                             if (11000 === err.code || 11001 === err.code) {
                                 callback(Boom.forbidden("please provide another account id, it already exist"),null);
                             } else callback(Boom.forbidden(err),null); // HTTP 403
                         }
                     }
                );          
            }]
        }, function(err, results){
            if(err){
                reply(err);
            }
            else{
                // reply(results.linking).created('/account/' + request.params.id);
                reply(results.assign)
            }
        });
    }
};

exports.linking = {
    auth: 'token',
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            link: Joi.boolean().required()
        }
    },
    handler: function(request, reply){ 
        Async.auto({
            findUser: function(callback){
                User.findOne({
                    'email': request.payload.email
                }, function(err, user) {
                    if(!err){
                        if(!user){
                            callback({
                                success: false,
                                message: 'Linking failed. User not found.'
                            },null);
                            return;
                        }
                        else{
                            callback(null, user);
                            return;
                        }
                    }
                    else{
                        callback(Boom.badImplementation(err),null);
                        return;
                    }
                })
            },
            linking: ['findUser', function(results, callback){
                if(request.payload.link){
                    var link = new Link({
                        user: results.findUser._id,
                        account: request.params.id,
                        role: 'READONLY'
                    });
                    link.save(function(err, link) {
                        if (!err) {
                            callback(null, link);
                        } else {
                            callback(Boom.badImplementation(err), null);
                        }
                    });
                }
                else{
                    Link.findOne({
                        $and: [
                            {user: results.findUser._id},
                            {account: request.params.id}
                        ]
                    }, function(err, link){
                        if(!err){
                            link.remove();
                            callback(null, link);
                        } else {
                            callback(Boom.badImplementation(err), null);
                        }
                    });
                }
            }]
        }, function(err, results) {
            // console.log('err = ', err);
            // console.log('results = ', results);

            if(err){
                reply(err);
            }
            else{
                reply(results.linking);
            }
        });
    }
}

exports.getAllUsers = {
    auth: 'token',
    handler: function(request, reply){
        Link.find({account: request.params.id})
        .populate('user')
        .exec(function(err, link){
            if(!err){
                reply(link);
            }
            else{
                reply(Boom.badImplementation(err));
            }
        });
    }
}

exports.role = {
    auth: 'token',
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            role: Joi.string().required() 
        }
    },
    handler: function(request, reply) {
        Async.auto({
            auth: function(callback){
                Link.findOne({
                    $and: [
                        {user: request.auth.credentials.id},
                        {account: request.params.id}
                    ]
                },function(err, link){
                    console.log(link.role);
                    if(!err){
                        if(link.role == "ADMIN"){
                            callback(null, link);
                        }
                        else{
                            callback("Not ADMIN", null);
                        }
                    }else{
                        reply(Boom.badImplementation(err));
                    }
                });
            },
            findUser: function(callback){
                User.findOne({
                    'email': request.payload.email
                }, function(err, user) {
                    if(!err){
                        if(!user){
                            callback({
                                success: false,
                                message: 'Linking failed. User not found.'
                            },null);
                            return;
                        }
                        else{
                            callback(null, user);
                            return;
                        }
                    }
                    else{
                        callback(Boom.badImplementation(err),null);
                        return;
                    }
                })
            },
            assign: ['findUser', function(results, callback){
                 Link.findOne({
                    $and: [
                        {user: results.findUser._id},
                        {account: request.params.id}
                    ]
                }, function(err, link){
                    if(!err){
                        link.role = request.payload.role;
                        link.save();
                    }
                    else{
                        callback(Boom.badImplementation(err), null);
                    }
                }
            }]
        }, function(err, results){
            if(err){
                reply(err);
            }
            else{
                // reply(results.linking).created('/account/' + request.params.id);
                reply(results.assign)
            }
        });
    }
} 

