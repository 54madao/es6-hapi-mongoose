var Joi = require('joi'),
    Boom = require('boom'),
    User = require('../models/User').model,
    Account = require('../models/Account').model
    jwt = require('jsonwebtoken'), // JsonWebToken implementation for node.js
    config = require('dotenv').config();

var cookie_options = {
  ttl: 365 * 24 * 60 * 60 * 1000, // expires a year from today 
  encoding: 'none',    // we already used JWT to encode 
  isSecure: true,      // warm & fuzzy feelings 
  isHttpOnly: true,    // prevent client alteration 
  clearInvalid: false, // remove invalid cookies 
  strictHeader: true   // don't allow violations of RFC 6265 
}

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
        	users:[
        		request.auth.credentials.id
        	],
        	entry_date : new Date()
        });
        console.log(account);
        account.save(function(err, account) {
            if (!err) {
                // reply('created').code(201); // HTTP 201
                // reply.json(user);
                reply(account).created('/account/' + account._id);
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
            email: Joi.string().email().lowercase().required()
        }
	},
	handler: function(request, reply){
		User.findOne({
            'email': request.payload.email
        }, { _id: 1, email: 1 }, function(err, user) {
            if (!err) {
                // if no user found
                if (!user) {
                    reply({
                        success: false,
                        message: 'Linking failed. User not found.'
                    });
                } else if (user) {
                    // console.log(user);
                    Account.findByIdAndUpdate(
                    	encodeURIComponent(request.params.id),
                    	{$push: {"users": user._id}},
                     	{new: true},
                     	function(err, account) {
            				if (!err) {
	            				reply(account).created('/account/' + request.params.id);
			                    // .header("Authorization", token)        // where token is the JWT 
			                    // .state("token", token, cookie_options) // set the cookie with options ;
				            } else {
				                if (11000 === err.code || 11001 === err.code) {
				                    reply(Boom.forbidden("please provide another account id, it already exist"));
				                } else reply(Boom.forbidden(err)); // HTTP 403
				            }
        				}
                    );                    
                }
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
	}
}