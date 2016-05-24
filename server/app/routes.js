// var budget = require('./Controllers/BudgetDataController');
// // var monthDataController = require('./Controllers/monthDataController');
// var user = require('./Controllers/UserController');
// var account = require('./Controllers/AccountController');

// var endpoints = {
//   api: [{ method: 'GET', path: '/budgetData', config:  budget.getAll },
//         { method: 'POST', path: '/user', config: user.create },
//         { method: 'GET', path: '/user', config: user.getAll },
//         { method: 'GET', path: '/user/accounts', config: user.getAccounts },
//         { method: 'POST', path: '/login', config: user.login },
//         { method: 'POST', path: '/user/forgetPassword', config: user.forgetPassword },
//         { method: 'POST', path: '/user/resetPassword', config: user.resetPassword },
//         { method: 'GET', path: '/account', config: account.getAll },
//         { method: 'POST', path: '/account', config: account.create },
//         { method: 'GET', path: '/account/{id}/getUsers', config: account.getUsers }, //get users from account.users
//         { method: 'GET', path: '/account/{id}/users', config: account.getAllUsers }, // get users from link
//         { method: 'POST', path: '/account/{id}/linkUser', config: account.linkUser }, // add/remove user to/from account.users & add/rm account to/from user.accounts
//         { method: 'POST', path: '/account/{id}/linking', config: account.linking }, // add/remove link to/from link
//         { method: 'POST', path: '/account/{id}/assgin', config: account.assignRole },
//         { method: 'POST', path: '/account/{id}/role', config: account.role }]
// };

'use strict'

import Router from './Routing/Router'
import User from './Controllers/UserController'
import Account from './Controllers/AccountController'
import Joi from 'joi'

let endpoints = {
    api: [
        { 
            method: 'POST', 
            path: '/user', 
            config: {
                validate: {
                    payload: {
                        email: Joi.string().email().lowercase().required(),
                        password: Joi.string().required()
                    }
                },
                handler: User.create
            }
        },
        { 
            method: 'GET', 
            path: '/user', 
            config: {
                handler: User.index
            }
        },
        { 
            method: 'GET', 
            path: '/account', 
            config: {
                handler: Account.index
            } 
        },
        { 
            method: 'POST', 
            path: '/account', 
            config: {
                validate: {
                    payload: {
                        accountName: Joi.string().required()
                    }
                },
                handler: Account.create
            }
        },
    ]
}

Router.group("/api/v1", endpoints.api);

export default Router.endpoints;