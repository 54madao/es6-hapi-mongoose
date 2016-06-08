'use strict'

// import "babel-register"
import config from 'config'
import env from 'dotenv'
// import fs  from 'fs'
import Hapi  from 'hapi'
import path  from 'path'
// import { default as pluginsConfig } from '../config/plugins'
import { default as log } from './logger'
// import connection from './database'
import endpoints from './routes'


// Global dependencies (available across the whole App)
GLOBAL.log = log
///////////////////////////////////////
//
// Start the server
//
// ///////////////////////////////////////
// server.start(() => {
//   log.info({
//     'Server running at': server.info.uri,
//     'With NODE_ENV': process.env.NODE_ENV || 'local'
//   })
// })

const server = new Hapi.Server();
server.connection(config.get('server'));

const options = {
    ops: {
        interval: 1000
    },
    reporters: {
        console: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*' }]
        }, {
            module: 'good-console'
        }, 'stdout']
    }
};

//auth
const validate = function (decoded, request, callback) {
    var error,
    credentials = {exp: decoded.exp, token: request.auth.token, id: decoded.id, email: decoded.email, role: "SUPER_ADMIN"} || {};
    // console.log(decoded);
    //decoded.iat
    //decoded.exp

    if (!credentials) {
        return callback(error, false, credentials);
    }

    return callback(error, true, credentials)
};

server.register([{
    register: require('good'),
    options: options
},
{
    register: require('hapi-auth-jwt2')
},
{
    register: require('hapi-authorization'),
    options: {
        roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'BASIC', 'VIEWONLY']
    }
},
{
    register: require('blipp'), options: {}
}
], (err) => {

    server.auth.strategy('token', 'jwt', {
        key: env.config().JWT_SECRET,
        validateFunc: validate,
        verifyOptions: { algorithms: [ 'HS256' ] }  // only allow HS256 algorithm
    });

    server.route([{
        method: 'GET',
        path: '/',
        config:{
            handler: function (request, reply) {
                reply('Hello, world!');
            }
        }
    }]);
    server.route(endpoints);

    if (err) {
        console.error(err);
    } else {
        server.start((err) => {
            if(err){
                console.log(err);
            }
            else{
                console.info('Server started at ' + server.info.uri);
            }
        });
    }
});

