'use strict'

// import { BaseController } from './BaseController'
import User from '../Models/User'
import Account from '../Models/Account'
import Link from '../Models/Link'
import Token from '../token'
import Async from 'async'
import Joi from 'joi'
import Boom from 'boom'
import bcrypt from 'bcrypt'
// import conn from '../database'
// import mongoose from 'mongoose'
let saltRounds = 10;

let AccountController = {}

//todo check role
AccountController.index = {

    auth: 'token',
    plugins: {'hapiAuthorization': {role: 'SUPER_ADMIN'}},
    handler: (request, reply) => {

        let token = Token.refresh(request.auth.credentials);

        Account.find({}, (err, accounts) => {
            if (!err) {
                reply({
                    success: true,
                    msg: accounts
                }).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options;
            } else {
                reply(Boom.badImplementation({
                    success: false,
                    msg:err
                })).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options; // 500 error
            }
        });
    }
};

AccountController.create = {
    validate: {
        payload: {
            accountName: Joi.string().required(),
            email: Joi.string().email().lowercase().required(),
            password: Joi.string()
        }
    },
    handler: (request, reply) => {

        Async.auto({
            findUser: (callback) => {
                User.findOne({
                    email: request.payload.email
                },(err, user) =>{
                    if(!err){
                        if(!user){
                            return callback(null, null);
                            
                        }
                        else{
                            return callback(null, user);
                        }
                    }
                    else{
                        return callback(Boom.badImplementation(err),null);
                    }
                })
            },
            createUser: ['findUser', (results, callback) => {
                if(results.findUser){
                    return callback(null, results.findUser);
                }
                else{
                    if(request.payload.password){
                        
                        let user = new User({
                            email: request.payload.email,
                            password: request.payload.password
                        });


                        bcrypt.hash(user.password, saltRounds, (err, hash) => {        
                            if(err){
                                return callback(Boom.badImplementation({
                                    success: false,
                                    msg: err
                                }), null)
                            }
                            else{
                                user.password = hash;
                                user.save((err, user) => {
                                    if (!err) {
                                        return callback(null, user)
                                    }
                                    else {
                                        return callback(Boom.badImplementation({
                                            success: false,
                                            msg: err
                                        }), null)
                                    }
                                     
                                });
                            }
                        });
                    }
                    else{
                        return callback(Boom.badRequest({
                            success: false,
                            msg: "Please provide a password"
                        }), null)
                    }
                }
            }],
            saveAccount: (callback) => {

                let account = new Account({
                    accountName: request.payload.accountName,
                    entry_date : new Date()
                });


                account.save((err, account) => {
                    if(!err){
                        return callback(null, account);
                    }
                    else if (11000 === err.code || 11001 === err.code) {
                        return callback(Boom.forbidden({
                            success: false,
                            msg: "please provide another account name, it already exist"
                        }), null)
                    }
                    else{
                        return callback(Boom.badImplementation({
                            success: false,
                            msg: err
                        }), null)
                    }
                })
            },
            linking: ['createUser', 'saveAccount', (results, callback) => {
                let link = new Link({
                    user: results.createUser._id,
                    account: results.saveAccount._id,
                    role: 'ADMIN'
                });

                link.save((err, link) => {
                    if (!err) {
                        return callback(null, link)
                    } 
                    else {
                        return callback(Boom.badImplementation({
                            success: false,
                            msg: err
                        }), null)
                    }
                });
            }]
        },(err, results) => {
            if(!err){
                reply({
                    success: true,
                    msg: {
                        user: results.createUser,
                        account: results.saveAccount, 
                        link: results.linking
                    }
                }).created('/account/' + results.saveAccount._id);
            }
            else{
                reply(err);
            }
        });
    }
};

AccountController.update = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        Account.findByIdAndUpdate(
            request.params.id,
            JSON.parse(request.payload),
            {new: true},
            (err, account) => {
                if (!err) {
                    reply({
                        success: true,
                        msg: account
                    }).header("Authorization", token)        // where token is the JWT 
                    .state("token", token, Token.cookie_options) // set the cookie with options;
                }
                else{
                    reply({
                        success: false,
                        msg: err
                    }).header("Authorization", token)        // where token is the JWT 
                    .state("token", token, Token.cookie_options) // set the cookie with options;
                }
            }
        )
    }
}

AccountController.switchAccount = {
    auth: 'token',
    handler: (request, reply) => {
        let token = Token.addToken(request.auth.credentials, {account: request.params.id})

        reply().header("Authorization", token)        // where token is the JWT 
        .state("token", token, Token.cookie_options) // set the cookie with options;
    }
}
//todo: group each item togather
AccountController.getUsers = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);
        Link.find({account: request.params.id})
        .populate('user')
        .exec((err, link) => {
            if(!err){
                reply({
                    success: true,
                    msg: link
                }).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options;
            }
            else{
                reply(Boom.badImplementation({
                    success: false,
                    msg: err
                })).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options;
            }
        });
    }
}

AccountController.linkUser = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    validate: {
        payload: {
            emails: Joi.array().items(Joi.string().email().lowercase()).single().required(),
            // email: Joi.string().email().lowercase().required(),
            link: Joi.boolean().required()
        }
    },
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        let report = [];
        Async.each(request.payload.emails, (email, callback) => {
            Async.auto({
                findUser: (callback) =>{
                    User.findOne({
                        'email': email
                    }, (err, user) =>{
                        if(!err){
                            if(!user){
                                return callback(Boom.forbidden(
                                    'Linking failed. User not found.'
                                ),null);
                            }
                            else{
                                return callback(null, user);
                            }
                        }
                        else{
                            return callback(Boom.badImplementation(err),null);
                        }
                    })
                },
                linking: ['findUser', (results, callback) => {
                    if(request.payload.link){
                        let link = new Link({
                            user: results.findUser._id,
                            account: request.params.id,
                            role: 'READONLY'
                        });
                        link.save((err, link) => {
                            if (!err) {
                                return callback(null, link);
                            } 
                            else if (11000 === err.code || 11001 === err.code) {
                                return callback(Boom.forbidden(
                                    "please provide another user email or use another account, link already exist"
                                ), null);
                            } else 
                                return callback(Boom.forbidden(err), null); // HTTP 403
                        });
                    }
                    else{
                        Link.findOne({
                            $and: [
                                {user: results.findUser._id},
                                {account: request.params.id}
                            ]
                        }, (err, link) => {
                            if(!err){
                                link.remove();
                                return callback(null, link);
                            } else {
                                return callback(Boom.badImplementation(err), null);
                            }
                        });
                    }
                }]
            }, (err, results) => {
                // console.log('err = ', err);
                // console.log('results = ', results);

                if(err){
                    report.push({
                        success: false,
                        msg: {
                            error: err,
                            email: email
                        }
                    });
                }
                else{
                    report.push({
                        success: true,
                        msg: {
                            link: results.linking,
                            email: email
                        }
                    })
                }
                return callback();
            });
        }, (err) => {
            reply(report).header("Authorization", token)        // where token is the JWT 
            .state("token", token, Token.cookie_options) // set the cookie with options;
        }); 
        
    }
}

AccountController.setRole = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            role: Joi.string().required() 
        }
    },
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        Async.auto({
            // auth: (callback) => {
            //     Link.findOne({
            //         $and: [
            //             {user: request.auth.credentials.id},
            //             {account: request.params.id}
            //         ]
            //     },(err, link) => {
            //         if(!err){
            //             if(link.role == "ADMIN"){
            //                 return callback(null, link);
            //             }
            //             else{
            //                 return callback(Boom.forbidden({
            //                     success: false,
            //                     msg: "Not ADMIN"
            //                 }), null);
            //             }
            //         }else{
            //             return callback(Boom.badImplementation({
            //                 success: false,
            //                 msg: err
            //             }));
            //         }
            //     });
            // },
            findUser: (callback) => {
                User.findOne({
                    'email': request.payload.email
                }, (err, user) => {
                    if(!err){
                        if(!user){
                            return callback(Boom.forbidden({
                                success: false,
                                msg: 'Linking failed. User not found.'
                            }),null);
                            return;
                        }
                        else{
                            return callback(null, user);
                            return;
                        }
                    }
                    else{
                        return callback(Boom.badImplementation({
                            success: false,
                            msg: err
                        }),null);
                        return;
                    }
                })
            },
            assign: ['findUser', (results, callback) => {
                 Link.findOne({
                    $and: [
                        {user: results.findUser._id},
                        {account: request.params.id}
                    ]
                }, (err, link) => {
                    if(!err){
                        link.role = request.payload.role;
                        link.save((err, link) => {
                            if (!err) {
                                return callback(null, link);
                            } else {
                                return callback(Boom.forbidden({
                                    success: false,
                                    msg: err
                                }), null);
                            }
                        });
                    }
                    else{
                        return callback(Boom.badImplementation({
                            success: false,
                            msg: err
                        }), null);
                    }
                })
            }]
        }, (err, results) => {
            if(err){
                reply(err).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options;
            }
            else{
                // reply(results.linking).created('/account/' + request.params.id);
                reply({
                    success: true,
                    msg: results.assign
                }).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options
            }
        });
    }
}

export default AccountController;
