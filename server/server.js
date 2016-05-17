'use strict';

const Hapi = require('hapi');
const config = require('dotenv').config();
const routes = require('./app/routes');
// const config = require('./config');
const db = require('./app/database');
const User = require('./app/models/User').returnSchema;
// const Boom = require('boom');

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

var validate = function (decoded, request, callback) {

    var error,
    credentials = {id: decoded.id, email: decoded.email} || {};

    if (!credentials) {
        return callback(error, false, credentials);
    }

    return callback(error, true, credentials)
    // return callback(error, true, {});
};

// server.start(function() {
//     console.log('Server started ', server.info.uri);
// });

server.register([{
    register: require('good'),
    options: options
},{register: require('hapi-auth-jwt2')}], (err) => {

    server.auth.strategy('token', 'jwt', {
        key: config.JWT_SECRET,
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

    // server.route();

    server.route(routes.endpoints);

    if (err) {
        console.error(err);
    } else {
        server.start(() => {

            console.info('Server started at ' + server.info.uri);
        });
    }
});
// server.route({
//     method: 'GET',
//     path: '/budget',
//     handler: function (request, reply) {
        
//         // GET DB CONNECTION
//         const myCollection = mongojs.db().collection('budgetData');

//         // EXECUTE QUERY
//         myCollection.find((error, value) => {
//           if (error) {
//             return reply(Boom.badData('Internal MongoDB error', error));
//           }
//           reply(value);
//         });
//     }
// });

// server.register(plugins, (err) => {
//   if (err) {
//     throw err;
//   }

//   server.start((err) => {
//     if (err) {
//       throw err;
//     }
//     server.log('info', `Server running at: ${server.info.uri}`);
//   });
// });