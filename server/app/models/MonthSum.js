'use strict';

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var bcrypt 		 = require('bcrypt-nodejs');

// monthly sum schema 
var MonthSumSchema   = new Schema({
	"entry_date": { type: Date, required: true, index: true, unique: true }
}, { strict: false });

var returnSchema = function (database){
	if(database){
		return database.model('MonthSum', MonthSumSchema);
	}
    return mongoose.model('MonthSum', MonthSumSchema);
};

module.exports = returnSchema;
