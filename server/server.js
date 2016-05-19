'use strict';

const Hapi = require('hapi');
const config = require('dotenv').config();
// const routes = require('./app/routes');
// const config = require('./config');
const db = require('./app/database');
const User = require('./app/models/User').returnSchema;

// const mongojs = require('hapi-mongojs');

// // ADD PLUGIN
// const plugins = [
//   {
//     register: mongojs,
//     options: {
//       url: 'mongodb://localhost:27017/pharmacydb'
//     }
//   }
// ];


const server = new Hapi.Server();
server.connection({ 
    host: config.APP_HOST,
    port: config.APP_PORT
});

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
},
{
    register: require('./app/routes')
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

    // server.route(routes.endpoints);

    if (err) {
        console.error(err);
    } else {
        server.start(() => {

            console.info('Server started at ' + server.info.uri);
        });
    }
});