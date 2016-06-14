
'use strict'

import UserController from './Controllers/UserController'
import AccountController from './Controllers/AccountController'

let api = "/api/v1"

let endpoints = [
        { method: 'GET', path: api + '/user', config: UserController.index},
        { method: 'POST', path: api + '/user', config: UserController.create },
        { method: 'PUT', path: api + '/user/{id}', config: UserController.update },
        { method: 'GET', path: api + '/user/{id}/accounts', config: UserController.getAccounts },
        { method: 'POST', path: api + '/login', config: UserController.login },
        { method: 'GET', path: api + '/logout', config: UserController.logout },
        { method: 'POST', path: api + '/user/forgetPassword', config: UserController.forgetPassword },
        { method: 'PUT', path: api + '/user/resetPassword', config: UserController.resetPassword },
        { method: 'GET', path: api + '/account', config: AccountController.index },
        { method: 'POST', path: api + '/account', config: AccountController.create },
        { method: 'PUT', path: api + '/account/{id}', config: AccountController.update },
        { method: 'GET', path: api + '/account/{id}', config: AccountController.switchAccount },
        { method: 'GET', path: api + '/account/{id}/users', config: AccountController.getUsers },
        { method: 'POST', path: api + '/account/{id}/user', config: AccountController.inviteUser }, 
        { method: 'PUT', path: api + '/account/{id}/user/{sid}', config: AccountController.linkUser }, // add/remove link to/from link
        { method: 'PUT', path: api + '/account/{id}/user/{sid}/role', config: AccountController.setRole }
];

export default endpoints;