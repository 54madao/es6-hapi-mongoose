var Joi = require('joi'),
    Boom = require('boom'),
    User = require('../models/User').model,
    Account = require('../models/Account').model
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
}