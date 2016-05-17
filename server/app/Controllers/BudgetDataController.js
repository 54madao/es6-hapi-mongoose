var Joi = require('joi'),
    Boom = require('boom'),
    BudgetData = require('../models/BudgetData.js').model;

exports.getAll = {
    auth: 'token',
    handler: function(request, reply) {
        // console.log(request);
        BudgetData.find({}, function(err, budget) {
            if (!err) {
                reply(budget);
            } else {
                reply(Boom.badImplementation(err)); // 500 error
            }
        });
    }
};