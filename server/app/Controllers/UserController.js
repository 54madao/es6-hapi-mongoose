'use strict'

// import jwt from 'jsonwebtoken' // JsonWebToken implementation for node.js
// import env from 'dotenv'
// import { BaseController } from './BaseController'

import User from '../Models/User'
import Link from '../Models/Link'
import Token from '../token'
import conn from '../database'
import Joi from 'joi'
import bcrypt from 'bcrypt'
import Boom from 'boom'

let saltRounds = 10;


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
                .state("token", token, Token.cookie_options) // set the cookie with options ;;
            } else {
                reply(Boom.badImplementation({
                    success: false,
                    msg: err
                })).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options; // 500 error
            }
        });
    }
};


//check token
UserController.create = {
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().required()
        }
    },
    auth: 'token',
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        let user = new User(request.payload);


        // User().hashPassword(user.password, saltRounds, (err, hash) => {

        // })

        bcrypt.hash(user.password, saltRounds, (err, hash) => {        
            if(err){
                reply(Boom.badImplementation({
                    success: false,
                    msg: err
                })).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options // 500 error
            }
            else{
                user.password = hash;
                user.save((err, user) => {
                    if (!err) {
                        reply({
                            success: true,
                            msg: user
                        }).created('/user/' + user._id)
                        .header("Authorization", token)        // where token is the JWT 
                        .state("token", token, Token.cookie_options) // set the cookie with options;
                    } else if (11000 === err.code || 11001 === err.code) {
                        reply(Boom.forbidden({
                            success: false,
                            msg: "please provide another user email, it already exist"
                        })).header("Authorization", token)        // where token is the JWT 
                        .state("token", token, Token.cookie_options) // set the cookie with options;
                    } else 
                        reply(Boom.forbidden({
                            success: false,
                            msg: err
                        })).header("Authorization", token)        // where token is the JWT 
                        .state("token", token, Token.cookie_options) // set the cookie with options; // HTTP 403
                });
            }
        });
    }
};

//add exception for update password
UserController.update = {
    auth: 'token',
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        User.findByIdAndUpdate(
            request.params.id,
            JSON.parse(request.payload),
            {new: true},
            (err, user) => {
                if (!err) {
                    reply({
                        success: true,
                        msg: user
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

//todo: group each item togather
UserController.getAccounts = {
    auth: 'token',
    handler: (request, reply) => {
        let token = Token.refresh(request.auth.credentials);

        Link.find({user: request.params.id})
            .populate('account')
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
                    reply(Boom.forbidden({
                        success: false,
                        msg: 'Authentication failed. User not found.'
                    }));
                } else {
                    // if exists, check if the password matches -- using created method in user model
                    let validPassword = User.comparePassword(request.payload.password, user.password);
                    // let validPassword = true;
                    if (!validPassword) {
                        reply(Boom.forbidden({
                            success: false,
                            msg: 'Authentication failed. Wrong password.'
                        }));
                    } else {
                        // // if user is found and password is correct
                        // // create a token
                        let token = Token.sign({
                            email: user.email,
                            id: user._id
                        });

                        Link.find({user: user._id})
                            .populate('account')
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
                                }))
                            }
                        });
                    }
                }
            } else {
                reply(Boom.badImplementation({
                    success: false,
                    msg: err
                })); // 500 error
            }
        });
    }
};

UserController.logout = {
    auth: 'token',
    handler: (request, reply) => {

        //todo check token
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
    handler: (request, reply) => {
        // console.log(request.auth.credentials);   

        let token = Token.refresh(request.auth.credentials);

        User.findOne({
            'email': request.auth.credentials.email
        }, (err, user) => {
            if (!err) {
                // if no user found
                if (!user) {
                    reply(Boom.forbidden({
                        success: false,
                        msg: 'resetPassword failed. User not found.'
                    })).header("Authorization", token)        // where token is the JWT 
                    .state("token", token, Token.cookie_options) // set the cookie with options;
                } else {
                    bcrypt.hash(request.payload.password, saltRounds, (err, hash) => {
                        if(!err){
                            user.password = hash;
                            user.save((err, user) => {
                                if (!err) {
                                    // // // create a token
                                    // let token = jwt.sign({
                                    //     email: user.email,
                                    //     id: user._id
                                    // }, 
                                    // env.config().JWT_SECRET, 
                                    // { 
                                    //     algorithm: 'HS256',
                                    //     expiresIn: 3000
                                    // });

                                    reply({
                                        success: true,
                                        msg: user
                                    })
                                    .created('/user/' + user._id)
                                    .header("Authorization", token)        // where token is the JWT 
                                    .state("token", token, Token.cookie_options) // set the cookie with options;

                                } else {
                                    reply(Boom.forbidden({
                                        success: false,
                                        msg: err
                                    })).header("Authorization", token)        // where token is the JWT 
                                    .state("token", token, Token.cookie_options) // set the cookie with options; // HTTP 403
                                }
                            });
                        }
                        else{
                            reply(Boom.badImplementation({
                                success: false,
                                msg: err
                            })).header("Authorization", token)        // where token is the JWT 
                            .state("token", token, Token.cookie_options) // set the cookie with options; // 500 error
                        } 
                    });
                }
            } else {
                reply(Boom.badImplementation({
                    success: false,
                    msg: err
                })).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options; // 500 error
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
                        id: user._id
                    });

                    reply({
                        success: true,
                        msg: user
                    })
                    .header("Authorization", token)        // where token is the JWT 
                    .state("token", token, Token.cookie_options) // set the cookie with options;

                }
            } else {
                reply(Boom.badImplementation({
                    success: false,
                    msg: err
                })).header("Authorization", token)        // where token is the JWT 
                .state("token", token, Token.cookie_options) // set the cookie with options; // 500 error
            }
        });
    }
};

export default UserController