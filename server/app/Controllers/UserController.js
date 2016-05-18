var Joi = require('joi'),
    Boom = require('boom'),
    User = require('../models/User').model,
    jwt = require('jsonwebtoken'), // JsonWebToken implementation for node.js
    config = require('dotenv').config();

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
        User.find({}, function(err, users) {
            if (!err) {
                reply(users);
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};

exports.create = {
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().required()
        }
    },
    handler: function(request, reply) {
        var user = new User(request.payload);
        user.save(function(err, user) {
            if (!err) {
                // reply('created').code(201); // HTTP 201
                // reply.json(user);
                reply(user).created('/user/' + user._id);
            } else {
                if (11000 === err.code || 11001 === err.code) {
                    // reply(Boom.forbidden("please provide another user id, it already exist"));
                    reply(Boom.forbidden(err));
                } else reply(Boom.forbidden(err)); // HTTP 403
            }
        });
    }
};

exports.login = {
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().required()
        }
    },
    handler: function(request, reply) {
        User.findOne({
            'email': request.payload.email
        }, function(err, user) {
            if (!err) {
                // if no user found
                if (!user) {
                    reply({
                        success: false,
                        message: 'Authentication failed. User not found.'
                    });
                } else if (user) {
                    // if exists, check if the password matches -- using created method in user model
                    var validPassword = user.comparePassword(request.payload.password);
                    // var validPassword = true;
                    if (!validPassword) {
                        reply({
                            success: false,
                            message: 'Authentication failed. Wrong password.'
                        });
                    } else {
                        // // if user is found and password is correct
                        // // create a token
                        var token = jwt.sign({
                            email: user.email,
                            id: user._id
                        }, 
                        config.JWT_SECRET, 
                        { 
                            algorithm: 'HS256',
                            expiresIn: 3000
                        });

                        // res.json({
                        //     success: true,
                        //     message: 'Enjoy your token!',
                        //     token: token
                        // });
                        reply({
                            success: true,
                            message: 'Enjoy your token!'
                        }).header("Authorization", token)        // where token is the JWT 
                        .state("token", token, cookie_options) // set the cookie with options ;
                    }
                }
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};

exports.resetPassword = {
    auth: 'token',
    validate: {
        payload: {
            password: Joi.string().required()
        }
    },
    handler: function(request, reply) {
        console.log(request.auth.credentials);        
        User.findOne({
            'email': request.auth.credentials.email
        }, function(err, user) {
            if (!err) {
                // if no user found
                if (!user) {
                    reply({
                        success: false,
                        message: 'Authentication failed. User not found.'
                    });
                } else if (user) {
                    user.password = request.payload.password;
                    user.save(function(err, user) {
                        if (!err) {
                            // reply('created').code(201); // HTTP 201
                            // reply.json(user);

                            // // if user is found and password is correct
                            // // create a token
                            var token = jwt.sign({
                                email: user.email,
                                id: user._id
                            }, 
                            config.JWT_SECRET, 
                            { 
                                algorithm: 'HS256',
                                expiresIn: 3000
                            });

                            reply(user)
                            .created('/user/' + user._id)
                            .header("Authorization", token)        // where token is the JWT 
                            .state("token", token, cookie_options);

                        } else {
                            if (11000 === err.code || 11001 === err.code) {
                                reply(Boom.forbidden("please provide another user id, it already exist"));
                            } else reply(Boom.forbidden(err)); // HTTP 403
                        }
                    });
                }
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};

exports.forgetPassword = {
    validate: {
        payload: {
            email: Joi.string().email().lowercase().required()
        }
    },
    handler: function(request, reply) {        
        User.findOne({
            'email': request.payload.email
        }, function(err, user) {
            if (!err) {
                // if no user found
                if (!user) {
                    reply({
                        success: false,
                        message: 'Authentication failed. User not found.'
                    });
                } else if (user) {

                    // reply('created').code(201); // HTTP 201
                    // reply.json(user);

                    // // if user is found and password is correct
                    // // create a token
                    var token = jwt.sign({
                        email: user.email,
                        id: user._id
                    }, 
                    config.JWT_SECRET, 
                    { 
                        algorithm: 'HS256',
                        expiresIn: 3000
                    });

                    reply(user)
                    .header("Authorization", token)        // where token is the JWT 
                    .state("token", token, cookie_options);

                }
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};