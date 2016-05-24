var budget = require('./Controllers/BudgetDataController');
// var monthDataController = require('./Controllers/monthDataController');
var user = require('./Controllers/UserController');
var account = require('./Controllers/AccountController');

var endpoints = {
  api: [{ method: 'GET', path: '/budgetData', config:  budget.getAll },
        { method: 'POST', path: '/user', config: user.create },
        { method: 'GET', path: '/user', config: user.getAll },
        { method: 'GET', path: '/user/accounts', config: user.getAccounts },
        { method: 'POST', path: '/login', config: user.login },
        { method: 'POST', path: '/user/forgetPassword', config: user.forgetPassword },
        { method: 'POST', path: '/user/resetPassword', config: user.resetPassword },
        { method: 'GET', path: '/account', config: account.getAll },
        { method: 'POST', path: '/account', config: account.create },
        { method: 'GET', path: '/account/{id}/getUsers', config: account.getUsers }, //get users from account.users
        { method: 'GET', path: '/account/{id}/users', config: account.getAllUsers }, // get users from link
        { method: 'POST', path: '/account/{id}/linkUser', config: account.linkUser }, // add/remove user to/from account.users & add/rm account to/from user.accounts
        { method: 'POST', path: '/account/{id}/linking', config: account.linking }, // add/remove link to/from link
        { method: 'POST', path: '/account/{id}/assgin', config: account.assignRole },
        { method: 'POST', path: '/account/{id}/role', config: account.role }]
};

exports.register = function(server, option, next) {

  //auth
  const validate = function (decoded, request, callback) {
    var error,
    credentials = {id: decoded.id, email: decoded.email} || {};

    if (!credentials) {
        return callback(error, false, credentials);
    }

    return callback(error, true, credentials)
  };
  server.auth.strategy('token', 'jwt', {
      key: config.JWT_SECRET,
      validateFunc: validate,
      verifyOptions: { algorithms: [ 'HS256' ] }  // only allow HS256 algorithm
  });

  // route group
  const group = function(prefix, routes){
    routes.forEach(function(route){
      route.path = prefix + route.path;
    });
    server.route(routes);
  }
  server.decorate('server', 'group', group);


  server.group("/api/v1", endpoints.api);
  next();
}

exports.register.attributes = {
    name: 'routes'
};
