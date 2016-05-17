'use strict';

var bodyParser = require('body-parser'); 	// get body-parser
var jwt        = require('jsonwebtoken');
var async = require("async");
var jsonMonthData = require('../sampleMonthDataOutput.json');

var superSecret = 'ilovescotchscotchyscotchscotch';

var getOtherDataAggregate = function(){
	// Logic to generate the groupby aggregate
	var response = {_id:null};
	Object.keys(jsonMonthData).forEach(function(key) {
		if (key !== 'entry_date') {
			Object.keys(jsonMonthData[key]).forEach(function(keyTitle) {
				var keyName = key + '*' + keyTitle;
				response[keyName] = { $sum: '$' + key + '.' + keyTitle};
			});
		}
	});
	return response;
};

var backToJson = function(jsonResponse) {
	var res = {};
	Object.keys(jsonResponse).forEach(function(key) {
		if (key.toString() === '_id') {

		} else {
			var keyName = key.toString().split('*');
			if (res[keyName[0]] === undefined) {
				res[keyName[0]] = {};
			}
			res[keyName[0]][keyName[1]] = jsonResponse[key];
		}
	});
	return res;
};


module.exports = function(app, express) {

	var apiRouter = express.Router();

	// middleware to use for all req -- order matters 
	apiRouter.use(function(req, res, next) {
		// check header or url parameters or post parameters for token
		var token = req.body.token || req.param('token') || req.headers['x-access-token'];

		// decode token
		if (token) {
			// verify secret and checks expiration time
			jwt.verify(token, superSecret, function(err, decoded) {
				if (err) {
					return res.status(403).send({
						success: false,
						message: 'Failed to authenticate token.'
					});
				} else {
					// then verify the if it is the correct db name
					var dbName = app.get("tenantDbName");
					if (decoded.tenant !== dbName) {
						return res.status(403).send({
							success: false,
							message: 'Failed to authenticate db name!'
						});
					}
					// console.log(decoded);

					// if everything is good, save to request for use in other routes
					req.decoded = decoded;

					next();
				}
			});
		} else {
			// if there is no token -- send back 403 access forbidden
			return res.status(403).send({
				success: false,
				message: 'No token provided.'
			});
		}
	});

	// on routes that end in /monthData
	// ----------------------------------------------------
	apiRouter.route('/')
		// post all month data from given month
		.post(function(req, res) {
			var database     = app.get("tenantDb");
	        var MonthSum   = require('../models/MonthSum')(database);

			var monthSum = new MonthSum();

			var objKeys = Object.keys(req.body);
			// create month data
			objKeys.forEach(function(key){
				monthSum.set(key, req.body[key]);
			});

			monthSum.save(function(err) {
				if (err) {
					// console.log(err);
					res.json(err);
				} else {
					res.json({message:"success"});
				}
			});
		})

		// get all data from month a to month b
		.get(function(req, res) {
			var database     = app.get("tenantDb");
	        var MonthSum   = require('../models/MonthSum')(database);

			var from = req.query.from || null;
			var to = req.query.to || null;

			if (from === null) {
				MonthSum.find({}, function(err, monthSumData) {
					if (err) res.send(err);

					// return the users
					res.json(monthSumData);
				});
			} else {
				MonthSum.find({ 
							   "entry_date": {
								$gte: new Date(from), 
								$lte: new Date(to)
							   }
				            }, function(err, monthSumData) {
								if (err) res.send(err);

								// return the users
								res.json(monthSumData);
							});
			}
		});

	// summary all data from month a to month b
	apiRouter.get('/summary', function(req, res) {
		var database     = app.get("tenantDb");
        var MonthSum   = require('../models/MonthSum')(database);

		var from = req.query.from;
		var to = req.query.to;

		// param should be 'xxxx-xx-xx' format

		var groupedQuery = getOtherDataAggregate();
		MonthSum.aggregate([
			{ $match: 
				{ 
					"entry_date": { $gte: new Date(from), $lte: new Date(to) } 
				} 
			},
			{ 
				$group:groupedQuery
			}
			], function(err, monthSumData) {
				if (err) res.send(err);
				console.log(monthSumData);

				var result = backToJson(monthSumData[0]);
				res.json(result);
		});

	});
	// on routes that end in
	// ----------------------------------------------------
	apiRouter.route('/:entry_date')

		// get the doctor info with that id
		.get(function(req, res) {
			var database     = app.get("tenantDb");
	        var MonthSum   = require('../models/MonthSum')(database);

			MonthSum.find({ 
				"entry_date": req.params.entry_date
				}, function(err, monthSumData) {
					if (err) res.send(err);

					// return the users
					res.json(monthSumData);
				});
		})

		.delete(function(req, res) {
			var database     = app.get("tenantDb");
	        var MonthSum   = require('../models/MonthSum')(database);

			MonthSum.remove({
				"_id": req.params.entry_date
			}, function(err) {
				if (err) res.send(err);

				res.json({ message: 'Successfully deleted' });
			});
		});


	return apiRouter;
};