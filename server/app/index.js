'use strict'

import "babel-register"
import config from 'config'
// import fs  from 'fs'
import Hapi  from 'hapi'
import path  from 'path'
// import { default as pluginsConfig } from '../config/plugins'
import { default as log } from './logger'
import db from './database'
import Routes from './routes'


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
        roles: ['ADMIN', 'MEMBER', 'VISITOR']
    }
}
], (err) => {

    server.route([{
        method: 'GET',
        path: '/',
        config:{
            handler: function (request, reply) {
                reply('Hello, world!');
            }
        }
    }]);

    server.route(Routes);

    if (err) {
        console.error(err);
    } else {
        server.start(() => {

            console.info('Server started at ' + server.info.uri);
        });
    }
});

