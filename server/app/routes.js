var budget = require('./Controllers/BudgetDataController');
// var monthDataController = require('./Controllers/monthDataController');
var user = require('./Controllers/UserController');
var account = require('./Controllers/AccountController');

exports.endpoints = [
  { 
  	method: 'GET', 
  	path: '/budgetData', 
  	config:  budget.getAll
  },
  {
  	method: 'POST',
  	path: '/user',
  	config: user.create
  },
  {
  	method: 'GET',
  	path: '/user',
  	config: user.getAll
  },
  {
  	method: 'POST',
  	path: '/login',
  	config: user.login
  },
  {
    method: 'POST',
    path: '/user/forgetPassword',
    config: user.forgetPassword
  },
  {
    method: 'POST',
    path: '/user/resetPassword',
    config: user.resetPassword
  },
  {
  	method: 'GET',
  	path: '/account',
  	config: account.getAll
  },
  {
  	method: 'POST',
  	path: '/account',
  	config: account.create
  },
  {
  	method: 'POST',
  	path: '/account/{id}/linkUser',
  	config: account.linkUser
  }
 ];

 // ,
 //  {
 //  	method: 'GET', 
 //  	path: '/monthData', 
 //  	config:  monthDataController.getAll
 //  }