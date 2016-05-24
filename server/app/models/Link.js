'use strict';

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
// var bcrypt 		 = require('bcrypt-nodejs');

// monthly sum schema 
var LinkSchema   = new Schema({
	"user" :  {type: Schema.Types.ObjectId, ref: 'User', index: false},
	"account" : {type: Schema.Types.ObjectId, index: false, ref: 'Account'},
	"role": { type: String, required: true }
}, { strict: false });

exports.model = mongoose.model('Link', LinkSchema);