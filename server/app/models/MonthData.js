'use strict';

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var bcrypt 		 = require('bcrypt-nodejs');

// month schema 
var MonthSchema   = new Schema({
	"entry_date": { type: Date, required: true, index: true, unique: true }
}, { strict: false });

// get database from router api and setup this model into that database rather than global one
var returnSchema = function (database){
	if(database){
		return database.model('Month', MonthSchema);
	}
    return mongoose.model('Month', MonthSchema);
};

module.exports = returnSchema;
