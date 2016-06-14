'use strict'

// import { BaseController } from './BaseController'
import User from '../Models/User'
import Link from '../Models/Link'
import Token from '../token'
import conn from '../database'
import Joi from 'joi'
import bcrypt from 'bcrypt'
import Boom from 'boom'
import env from 'dotenv'
import Async from 'async'
import SparkPost from 'sparkpost'

let saltRounds = 10;
let api = "/api/v1"
let UserController = {};

UserController.index = {
    plugins: {'hapiAuthorization': {role: 'SUPER_ADMIN'}},
    auth: 'token',
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);
        User.find({}, (err, users) => {
            if (!err) {
                reply({
                    success: true,
                    msg: users
                }).header("Authorization", token)        // where token is the JWT 
            } else {
                reply(Boom.badImplementation(err))
                .header("Authorization", token)        // where token is the JWT 
            }
        });
    }
};

UserController.create = {
    validate: {
        payload: {
            password: Joi.string().required()
        }
    },
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
        }
    ],
    handler: (request, reply) => {
        // let token = Token.refresh(request.auth.credentials);

        let user = new User({
            email: request.auth.credentials.email,
            password: request.payload.password
        });

        bcrypt.hash(user.password, saltRounds, (err, hash) => {        
            if(err){
                reply(Boom.badImplementation(err))
                .header("Authorization", token)        // where token is the JWT 
            }
            else{
                user.password = hash;
                user.save((err, user) => {
                    if (!err) {
                        // reply({
                        //     success: true,
                        //     msg: user
                        // }).created('/user/' + user._id)
                        // .header("Authorization", token)        // where token is the JWT 
                        // .state("token", token, Token.cookie_options) // set the cookie with options;
                        request.headers.Authorization = request.auth.token;
                        request.server.inject({
                            method  : 'PUT',
                            url     : api + '/account/' + request.auth.credentials.account + '/user/' + user._id,
                            headers : request.headers,
                            payload : {link: 'true'} 
                        }, (res) => {
                            console.log(res.headers.authorization);
                            reply({
                                user: user,
                                link: res.result
                            })
                            .header("Authorization", res.headers.authorization)        // where token is the JWT                     
                        })
                    } else if (11000 === err.code || 11001 === err.code) {
                        reply(Boom.forbidden("please provide another user email, it already exist"))
                        .header("Authorization", request.auth.token)        // where token is the JWT 
                    } else 
                        reply(Boom.badImplementation(err))
                        .header("Authorization", request.auth.token)        // where token is the JWT 
                });
            }
        });
    }
};

//add exception for update password
UserController.update = {
    auth: 'token',
    pre: [
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                if(request.auth.credentials.id != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", request.auth.token)
                }else{
                    reply();
                }
            }
        }
    ],
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        User.findByIdAndUpdate(
            request.params.id,
            JSON.parse(request.payload),
            {new: true},
            (err, user) => {
                if (!err) {
                    if(!user){
                        reply(Boom.forbidden('Authentication failed. User not found.'));
                    }
                    else{
                        reply({
                            success: true,
                            msg: user
                        }).header("Authorization", token)        // where token is the JWT 
                    }
                }
                else{
                    reply({
                        success: false,
                        msg: err
                    }).header("Authorization", token)        // where token is the JWT 
                }
            }
        )
    }
}

//todo: group each item togather
UserController.getAccounts = {
    auth: 'token',
    pre: [
        {
            assign: 'selfCheck',
            method: (request, reply) => {
                console.log(request.auth.credentials.id)
                console.log(request.params.id)

                if(request.auth.credentials.id != request.params.id && request.auth.credentials.role != 'SUPER_ADMIN'){
                    reply({
                        success: false,
                        msg: 'Unauthorized'
                    }).takeover()
                    .header("Authorization", request.auth.token)
                }else{
                    reply();
                }
            }
        }
    ],
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);
        
        Async.auto({
            findUser: (callback) => {
                User.findById(request.params.id, (err, user) => {
                    if(!err){
                        if(!user){
                            return callback(Boom.forbidden("User not found"), null);
                        }else{
                            return callback(null, null);
                        }
                    }else{
                        return callback(Boom.badImplementation(err), null);
                    }
                })
            },
            getAccounts: (callback) => {
                Link.find({user: request.params.id})
                    .populate('account')
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
                    msg: results.getAccounts
                }).header("Authorization", token)        // where token is the JWT 
            }
            else{
                reply(err)
                .header("Authorization", token)        // where token is the JWT 
            }

        })
    }
}

UserController.login = {
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().required()
        }
    },
    handler: (request, reply) => {
        User.findOne({
            'email': request.payload.email
        }, (err, user) => {
            if (!err) {
                // if no user found
                if (!user) {
                    reply(Boom.forbidden('Authentication failed. User not found.'));
                } else {
                    // if exists, check if the password matches -- using created method in user model
                    let validPassword = User.comparePassword(request.payload.password, user.password);
                    // let validPassword = true;
                    if (!validPassword) {
                        reply(Boom.forbidden('Authentication failed. Wrong password.'));
                    } else {
                        // // if user is found and password is correct
                        // // create a token
                        let token = Token.sign({
                            email: user.email,
                            id: user._id,
                            action: '0'
                        });

                        request.headers.Authorization = token;

                        // Link.find({user: user._id})
                        //     .populate('account')
                        //     .exec((err, link) => {
                        //     if(!err){
                        //         reply({
                        //             success: true,
                        //             msg: link
                        //         }).header("Authorization", token)        // where token is the JWT 
                        //         .state("token", token, Token.cookie_options) // set the cookie with options;
                        //     }
                        //     else{
                        //         reply(Boom.badImplementation({
                        //             success: false,
                        //             msg: err
                        //         }))
                        //     }
                        // });
                        
                        request.server.inject({
                            method  : 'GET',
                            url     : api + '/user/' + user._id + '/accounts',
                            headers : request.headers,
                        }, (res) => {

                            reply(res.result)
                            .header("Authorization", token)        // where token is the JWT 
                    
                        })
                    }
                }
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};

UserController.logout = {
    auth: 'token',
    handler: (request, reply) => {

        reply("logout!").unstate("token");
    }
}

UserController.resetPassword = {
    auth: 'token',
    validate: {
        payload: {
            password: Joi.string().required()
        }
    },
    pre: [
        {
            assign: 'actionCheck',
            method: (request, reply) => {
                if(request.auth.credentials.action !== '1' && request.auth.credentials.role != 'SUPER_ADMIN'){
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
        }
    ],
    handler: (request, reply) => {
        // console.log(request.auth.credentials);   

        let token = Token.refresh(request.auth.credentials);

        User.findOne({
            'email': request.auth.credentials.email
        }, (err, user) => {
            if (!err) {
                // if no user found
                if (!user) {
                    reply(Boom.forbidden('resetPassword failed. User not found.'))
                    .header("Authorization", token)        // where token is the JWT 
                } else {
                    bcrypt.hash(request.payload.password, saltRounds, (err, hash) => {
                        if(!err){
                            user.password = hash;
                            user.save((err, user) => {
                                if (!err) {
                                    reply({
                                        success: true,
                                        msg: user
                                    })
                                    .created('/user/' + user._id)
                                    .header("Authorization", token)        // where token is the JWT 

                                } else {
                                    reply(Boom.forbidden(err))
                                    .header("Authorization", token)        // where token is the JWT 
                                }
                            });
                        }
                        else{
                            reply(Boom.badImplementation(err))
                            .header("Authorization", token)        // where token is the JWT 
                        } 
                    });
                }
            } else {
                reply(Boom.badImplementation(err))
                .header("Authorization", token)        // where token is the JWT 
            }
        });
    }
};

UserController.forgetPassword = {
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required()
        }
    },
    handler: (request, reply) => {        
        User.findOne({
            'email': request.payload.email
        }, (err, user) => {
            if (!err) {
                // if no user found
                if (!user) {
                    reply({
                        success: false,
                        msg: 'User not found.'
                    });
                } else {

                    let token = Token.sign({
                        email: user.email,
                        id: user._id,
                        action: '1'
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
                          {address: user.email}
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
                }
            } else {
                reply(Boom.badImplementation(err))
            }
        });

    }
};

export default UserController