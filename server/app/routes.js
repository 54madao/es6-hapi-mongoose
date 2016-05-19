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
        { method: 'GET', path: '/account/{id}/users', config: account.getUsers },
        { method: 'POST', path: '/account/{id}/linking', config: account.linkUser }]
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
