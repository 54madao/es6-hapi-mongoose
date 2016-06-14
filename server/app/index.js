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
        }, 'stdout'],
        file: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', request: '*', response: '*', 'error': '*' }]
        }, {
            module: 'good-squeeze',
            name: 'SafeJson',
            args: [
                null,
                { separator: ',' }
            ]
        }, {
            module: 'rotating-file-stream',
            args: [
                'logs.log',
                {
                    size:     '10M', // rotate every 10 MegaBytes written
                    interval: '1d',
                    path: './logs'
                }
            ]
        }]
    }
};

//auth
const validate = function (decoded, request, callback) {
    let error
    // {exp: decoded.exp, token: request.auth.token, id: decoded.id, email: decoded.email, role: "SUPER_ADMIN"} || {};

    // for(let key in decoded){
    //     credentials[key] = decoded[key]
    // }
    let credentials = Object.assign({}, decoded)
    credentials.token = request.auth.token
    log.info(credentials);
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
                log.info(err);
            }
            else{
                log.info('Server started at ' + server.info.uri);
            }
        });
    }
});

