'use strict';

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
// var bcrypt 		 = require('bcrypt-nodejs');

// monthly sum schema 
var BudgetDataSchema   = new Schema({
	"entry_date": { type: Date, required: true, index: true, unique: true }
}, { strict: false });

// var returnSchema = function (database){
// 	if(database){
// 		return database.model('BudgetData', BudgetDataSchema);
// 	}
//     return mongoose.model('BudgetData', BudgetDataSchema);
// };

// module.exports = returnSchema;

exports.model = mongoose.model('BudgetData', BudgetDataSchema);