import jwt from 'jsonwebtoken' // JsonWebToken implementation for node.js
import {config} from 'dotenv'
import { BaseController } from './BaseController'
import User from '../Models/User'

let cookie_options = {
  ttl: 1 * 60 * 60 * 1000, // expires a year from today 
  encoding: 'none',    // we already used JWT to encode 
  isSecure: true,      // warm & fuzzy feelings 
  isHttpOnly: true,    // prevent client alteration 
  clearInvalid: false, // remove invalid cookies 
  strictHeader: true   // don't allow violations of RFC 6265 
}

let UserController = new class UserController extends BaseController {
    constructor(){
        let notFoundMsg = 'ToDo List not found'
        super(notFoundMsg)
    }

    index(request, reply) {
        User.find({}, (err, users) => {
            if (!err) {
                reply(users);
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }

    create(request, reply) {
        let user = new User(request.payload);
        user.save((err, user) => {
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
}

export default UserController;