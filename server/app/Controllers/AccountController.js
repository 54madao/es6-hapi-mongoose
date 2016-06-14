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
import env from 'dotenv'
import SparkPost from 'sparkpost'

let saltRounds = 10;
let AccountController = {}

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

            } else {
                reply(Boom.badImplementation(err))
                .header("Authorization", token)        // where token is the JWT 
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
        GLOBAL.log.info("Start creating an account")
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
                                return callback(Boom.badImplementation(err), null)
                            }
                            else{
                                user.password = hash;
                                user.save((err, user) => {
                                    if (!err) {
                                        return callback(null, user)
                                    }
                                    else {
                                        return callback(Boom.badImplementation(err), null)
                                    }
                                     
                                });
                            }
                        });
                    }
                    else{
                        return callback(Boom.badRequest("Please provide a password"), null)
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
                        return callback(Boom.forbidden(err), null)
                    }
                    else{
                        return callback(Boom.badImplementation(err), null)
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
                        return callback(Boom.badImplementation(err), null)
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
    pre: [
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                if(request.auth.credentials.account != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    })
                    .takeover()
                    .header("Authorization", token)
                }else{
                    reply();
                }
            }
        }
    ],
    handler: (request, reply) => {

        GLOBAL.log.info('Start updating an account')

        let token = Token.refresh(request.auth.credentials);

        Account.findByIdAndUpdate(
            request.params.id,
            JSON.parse(request.payload),
            {new: true},
            (err, account) => {
                if (!err) {
                    if(!account){
                        reply(Boom.forbidden('Account not found.'));
                    }
                    else{
                        reply({
                            success: true,
                            msg: account
                        }).header("Authorization", token)        // where token is the JWT 
                    }
                }
                else{
                    reply(Boom.badImplementation(err))
                    .header("Authorization", token)        // where token is the JWT 
                }
            }
        )
    }
}

AccountController.switchAccount = {
    auth: 'token',
    pre: [
        {
            assign: 'roleCheck',
            method: (request, reply) => {
                Link.findOne({
                    $and: [
                        {user: request.auth.credentials.id},
                        {account: request.params.id}
                    ]
                }, (err, link) => {
                    if(!err){
                        if(!link){
                            reply(Boom.forbidden("Link not found"))
                            .takeover()
                            .header("Authorization", token)
                        }else{
                            reply(link);
                        }
                    }else{
                        reply(Boom.badImplementation(err)).takeover()
                        .header("Authorization", token)
                    }
                })
            }
        }
    ],
    handler: (request, reply) => {
        GLOBAL.log.info('Start switching to an account')

        let token = Token.refresh(request.auth.credentials);

        Account.findById( request.params.id, (err, account) => {
            if(!err){
                if(!account){
                    reply(Boom.forbidden("Account not found"))
                    .header("Authorization", token)
                }else{
                    let link = request.pre.roleCheck

                    let token = Token.addToken(request.auth.credentials, {account: request.params.id, role: link.role})

                    reply({
                        success: true,
                        msg: {
                            account: account,
                            link: link
                        }
                    }).header("Authorization", token)        // where token is the JWT 
                }
            }else{
                reply(Boom.badImplementation(err))
                .header("Authorization", token)
            }
        })
    }
}

//todo: group each item togather
AccountController.getUsers = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    pre: [
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                if(request.auth.credentials.account != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", token)
                }else{
                    reply();
                }
            }
        }
    ],
    handler: (request, reply) => {

        let token = Token.refresh(request.auth.credentials);

        Async.auto({
            findAccount: (callback) => {
                Account.findById(request.params.id, (err, account) => {
                    if(!err){
                        if(!account){
                            return callback(Boom.forbidden("Account not found"), null);
                        }else{
                            return callback(null, null);
                        }
                    }else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            },
            getUsers: (callback) => {
                Link.find({account: request.params.id})
                    .populate('user')
                    .exec((err, link) => {
                        if(!err){
                            return callback(null, link);
                        }
                        else{
                            return callback(Boom.badImplementation(err), null)
                        }
                    });
            }
        }, (err, results) => {

            if(!err){
                reply({
                    success: true,
                    msg: results.getUsers
                }).header("Authorization", token)        // where token is the JWT 
            }
            else{
                reply(err)
                .header("Authorization", token)        // where token is the JWT 
            }

        })
    }
}

AccountController.linkUser = {
    auth: 'token',
    pre: [
        {
            assign: 'actionCheck',
            method: (request, reply) => {
                if(request.auth.credentials.action !== '2' && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", request.auth.token)
                }
                else{
                    reply();
                }
            }
        },
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                if(request.auth.credentials.account != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", token)
                }else{
                    reply();
                }
            }
        }
    ],
    validate: {
        payload: {
            // emails: Joi.array().items(Joi.string().email().lowercase()).single().required(),
            // email: Joi.string().email().lowercase().required(),
            link: Joi.boolean().required()
        }
    },
    handler: (request, reply) => {

        GLOBAL.log.info("Start linking")

        let token = Token.changeAction(request.auth.credentials, '0')

        // let report = [];
        // Async.each(request.payload.emails, (email, callback) => {
        //     Async.auto({
        //         
        //     }, (err, results) => {
 
        //         return callback();
        //     });
        // }, (err) => {
        //     reply(report).header("Authorization", token)        // where token is the JWT 
        //     .state("token", token, Token.cookie_options) // set the cookie with options;
        // }); 

        
        Async.auto({
            findAccount: (callback) => {
                Account.findById(request.params.id, (err, account) => {
                    if(!err){
                        if(!account){
                            return callback(Boom.forbidden("Account not found"),null);
                        }else{
                            return callback(null, null);
                        }
                    }else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            },
            findUser: (callback) => {
                User.findById(request.params.sid, (err, user) => {
                    if(!err){
                        if(!user){
                            return callback(Boom.forbidden('Linking failed. User not found.'),null);
                        }
                        else{
                            return callback(null, null);
                        }
                    }
                    else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            },
            linking: (callback) => {
                if(request.payload.link){
                    let link = new Link({
                        user: request.params.sid,
                        account: request.params.id,
                        role: 'VIEWONLY'
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
                            {user: request.params.sid},
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
            }
        }, (err, results) => {
            if(err){
                reply(err).header("Authorization", token)        // where token is the JWT 
            }
            else{
                // reply(results.linking).created('/account/' + request.params.id);
                reply({
                    success: true,
                    msg: results.linking
                }).header("Authorization", token)        // where token is the JWT 
            }
        });
    }
}

AccountController.setRole = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    pre: [
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                if(request.auth.credentials.account != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", token)
                }else{
                    reply();
                }
            }
        }
    ],
    validate: {
        payload: {
            role: Joi.string().required() 
        }
    },
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);
        Async.auto({
            findAccount: (callback) => {
                Account.findById(request.params.id, (err, account) => {
                    if(!err){
                        if(!account){
                            return callback(Boom.forbidden("Account not found"),null);
                        }else{
                            return callback(null, null);
                        }
                    }else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            },
            findUser: (callback) => {
                User.findById(request.params.sid, (err, user) => {
                    if(!err){
                        if(!user){
                            return callback(Boom.forbidden('Linking failed. User not found.'),null);
                        }
                        else{
                            return callback(null, null);
                        }
                    }
                    else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            },
            assign: (callback) => {
                Link.findOne({
                    $and: [
                        {user: request.params.sid},
                        {account: request.params.id}
                    ]
                }, (err, link) => {
                    if(!err){
                        if(!link){
                            callback(Boom.forbidden('Link not found'), null)
                        }
                        else{
                            link.role = request.payload.role;
                            link.save((err, link) => {
                                if (!err) {
                                    return callback(null, link);
                                } else {
                                    return callback(Boom.badImplementation(err), null);
                                }
                            });  
                        }
                    }
                    else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            }
        }, (err, results) => {
            if(err){
                reply(err).header("Authorization", token)        // where token is the JWT 
            }
            else{
                // reply(results.linking).created('/account/' + request.params.id);
                reply({
                    success: true,
                    msg: results.assign
                }).header("Authorization", token)        // where token is the JWT 
            }
        });
    }
}

AccountController.inviteUser = {
    auth: 'token',
    plugins: {'hapiAuthorization': {roles: ['SUPER_ADMIN', 'ADMIN']}},
    pre: [
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                if(request.auth.credentials.account != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", token)
                }else{
                    reply();
                }
            }
        }
    ],
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required()
        }
    },
    handler: (request, reply) => {

        let token = Token.refresh(request.auth.credentials);

        User.findOne({
            'email': request.payload.email
        }, (err, user) => {
            if (!err) {
                // if no user found
                if (!user) {
                    let token = Token.sign({
                        email: request.payload.email,
                        account: request.params.id,
                        action: '2'
                    });

                    let sp = new SparkPost(env.config().SPARKPOST_SECRET);

                    sp.transmissions.send({
                      transmissionBody: {
                        content: {
                          from: 'testing@sparkpostbox.com',
                          subject: 'Hello, World!',
                          html:'<html><body><p>Testing SparkPost - the world\'s most awesomest email service! Click Here: ' + token + ' </p></body></html>'
                        },
                        recipients: [
                          {address: request.payload.email}
                        ]
                      }
                    }, (err, res) => {
                        if (err) {
                            reply({
                                success: false,
                                msg: err
                            })
                        } else {
                            reply({
                                success: true,
                                msg: 'Woohoo! You just sent your first mailing!'
                            })
                        }
                    });
                } else {
                    Link.findOne({
                        $and: [
                            {user: user._id},
                            {account: request.params.id}
                        ]
                    }, (err, link) => {
                        if(!err){
                            if(!link){
                                
                                let token = Token.sign({
                                    id: user._id,
                                    email: request.payload.email,
                                    account: request.params.id,
                                    action: '2'
                                });

                                let sp = new SparkPost(env.config().SPARKPOST_SECRET);

                                sp.transmissions.send({
                                  transmissionBody: {
                                    content: {
                                      from: 'testing@sparkpostbox.com',
                                      subject: 'Hello, World!',
                                      html:'<html><body><p>Testing SparkPost - the world\'s most awesomest email service! Click Here: ' + token + ' </p></body></html>'
                                    },
                                    recipients: [
                                      {address: request.payload.email}
                                    ]
                                  }
                                }, (err, res) => {
                                    if (err) {
                                        reply({
                                            success: false,
                                            msg: err
                                        })
                                    } else {
                                        reply({
                                            success: true,
                                            msg: 'Woohoo! You just sent your first mailing!'
                                        })
                                    }
                                });
                
                            }else{
                                reply({
                                    success: false,
                                    msg: request.payload.email + " has been linked to this account"
                                }).header("Authorization", token)        // where token is the JWT 
                            }
                        }
                        else{
                            reply(Boom.badImplementation(err), null)
                            .header("Authorization", token)        // where token is the JWT 
                        }
                    })                    
                }
            } else {
                reply(Boom.badImplementation(err))
                .header("Authorization", token)        // where token is the JWT 
            }
        });
    }
}

export default AccountController;
