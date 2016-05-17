'use strict';

var bodyParser = require('body-parser'); 	// get body-parser
var jwt        = require('jsonwebtoken');
var async = require("async");
var bcrypt 		 = require('bcrypt-nodejs');

var superSecret = 'ilovescotchscotchyscotchscotch';

module.exports = function(app, express) {

	var apiRouter = express.Router();

	// api verify req jwt key: ending in /reset
	apiRouter.route('/reset/:key')
		.get(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);
	        var dbName = app.get("tenantDbName");

			jwt.verify(req.params.key, superSecret, function(err, decode) {
				if (err) res.json(err);
				else {
					res.json(decode);
				}
			});
		})

		.put(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);
	        var dbName = app.get("tenantDbName");

			jwt.verify(req.params.key, superSecret, function(err, decode) {
				if (err) res.json(err);
				else {
					// if it is valid, reset password in the body field
					var userEmail = decode.email;

			        User.findOne({
			        	email: userEmail
			        }, function(err, user) {
			        	if (err) res.json(err);
			        	else {
					        for (var key in req.body) {
					        	if (req.body.hasOwnProperty(key)) {
					        		user.set(key, req.body[key]);
					        	}
					        }

					        user.save(function(err, user) {
					        	if (err) res.json(err);
					        	else {
					        		res.json(user);
					        	}
					        });
			        	}
			        });
				}
			});
		});

	// authenticate user
	apiRouter.post('/authenticate', function(req, res) {
		var database     = app.get("tenantDb");
        var User   = require('../models/User')(database);
        var dbName = app.get("tenantDbName");

		// first find the user
		User.findOne({
			email: req.body.email
		}).select('email password').exec(function(err, user) {
			if (err) throw err;

			// if no user found
			if (!user) {
				res.json({
					success: false,
					message: 'Authentication failed. User not found.'
				});
			} else if (user) {
				// if exists, check if the password matches -- using created method in user model
				var validPassword = user.comparePassword(req.body.password);
				// var validPassword = true;
				if (!validPassword) {
					res.json({
						success: false,
						message: 'Authentication failed. Wrong password.'
					});
				} else {
					// if user is found and password is correct
					// create a token
					var token = jwt.sign({
						tenant: dbName,
						email: req.body.email
					}, superSecret, {
						expiresInMinutes: 1440
					});

					res.json({
						success: true,
						message: 'Enjoy your token!',
						token: token
					});
				}
			}
		});
	});

	// on routes that end in /
	// ----------------------------------------------------
	apiRouter.route('/')

		.post(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);

	        var newUser = new User();
	        for (var key in req.body) {
	        	if (req.body.hasOwnProperty(key)) {
	        		newUser.set(key, req.body[key]);
	        	}
	        }

	        newUser.save(function(err, user) {
	        	if (err) res.json(err);
	        	else {
	        		res.json(user);
	        	}
	        });
		})

		// get all user from model
		.get(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);

			User.find({}, function(err, user) {
				if (err) res.send(err);

				// return the users
				res.json(user);
			});
		});

	// update user info
	apiRouter.put('/', function(req, res) {
		var database     = app.get("tenantDb");
        var User   = require('../models/User')(database);

        // upsert client input json object
        if (req.body.email) {
	        User.findOne({
	        	email: req.body.email
	        }, function(err, user) {
	        	if (err) res.json(err);
	        	else {
			        for (var key in req.body) {
			        	if (req.body.hasOwnProperty(key)) {
			        		user.set(key, req.body[key]);
			        	}
			        }

			        user.save(function(err, user) {
			        	if (err) res.json(err);
			        	else {
			        		res.json(user);
			        	}
			        });
	        	}
	        });   	
        } else {
        	res.json('no email provided!!');
        }
	});


	// TODO: send email to client 
	apiRouter.put('/:id/resendinvitation', function(req, res) {
		var database     = app.get("tenantDb");
        var User   = require('../models/User')(database);
        var dbName = app.get("tenantDbName");
        var apiVersion = app.get('apiVersion');
        var userEmail;

        // first, find the email address in db
        User.findOne({
        	"_id" : req.params.id
        }, function(err, user) {
        	if (err) res.json(err);
        	else {
        		userEmail = user.email;

		        // second, generate jwt token with global key to verify
				var token = jwt.sign({
					tenant: dbName,
					email: userEmail
				}, superSecret, {
					expiresInMinutes: 1440
				});

				// third, generate jwt url: https://mean.dev/apiVersion/dbName/user?key=jwtToken
				var jwtUrl = 'https://meandashboard.dev' + apiVersion + '/' + dbName + '/user/reset/'+ token;

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: jwtUrl
				});
        	}
        });
	});



	// on routes that end in id
	// ----------------------------------------------------
	apiRouter.route('/:id')

		.get(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);

			User.find({ 
				"_id" : req.params.id
				}, function(err, user) {
					if (err) res.send(err);

					// return the users
					res.json(user);
				});
		})

		// update user info
		.put(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);

	        // upsert client input json object
	        if (req.body.email) {
		        User.findOne({
		        	email: req.body.email
		        }, function(err, user) {
		        	if (err) res.json(err);
		        	else {
				        for (var key in req.body) {
				        	if (req.body.hasOwnProperty(key)) {
				        		user.set(key, req.body[key]);
				        	}
				        }

				        user.save(function(err, user) {
				        	if (err) res.json(err);
				        	else {
				        		res.json(user);
				        	}
				        });
		        	}
		        });   	
	        } else {
	        	res.json('no email provided!!');
	        }	        
		})

		// delete budget info with this id
		.delete(function(req, res) {
			var database     = app.get("tenantDb");
	        var User   = require('../models/User')(database);

	        // remove will not return the removed user as callback param,
	        // but use number of removed items as callback param!
			User.remove({
				"_id": req.params.id
			}, function(err, removedCnt) {
				if (err) res.send(err);
				else {
					res.json({message: "success removed!"});	
				}
			});
		});


	return apiRouter;
};