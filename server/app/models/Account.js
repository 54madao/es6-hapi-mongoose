'use strict';

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
// var bcrypt 		 = require('bcrypt-nodejs');

// monthly sum schema 
var AccountSchema   = new Schema({
	"accountName": { type: String, required: true, unique: true},
	"users": [{
		"role": { type: String, required: true },
		"_id": { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: false}
	}],
	"entry_date": { type: Date, required: true, index: true}
}, { strict: false });

// var returnSchema = function (database){
// 	if(database){
// 		return database.model('BudgetData', BudgetDataSchema);
// 	}
//     return mongoose.model('BudgetData', BudgetDataSchema);
// };

// module.exports = returnSchema;

exports.model = mongoose.model('Account', AccountSchema);