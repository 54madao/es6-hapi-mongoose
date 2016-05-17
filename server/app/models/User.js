'use strict';

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var bcrypt 		 = require('bcrypt-nodejs');

// monthly sum schema 
var UserSchema   = new Schema({
	"email": { type: String, required: true, index: true, unique: true },
	"password": { type: String, required: true, select: true }
}, { strict: false });

// var returnSchema = function (database){
// 	if(database){
// 		return database.model('User', UserSchema);
// 	}
//     return mongoose.model('User', UserSchema);
// };

UserSchema.pre('save', function(next) {
	var user = this;
	// hash the password
	if (!user.isModified('password')) return next();

	// generate the hash
	bcrypt.hash(user.password, null, null, function(err, hash) {
		if (err) return next(err);

		// change password to hashed version
		user.password = hash;
		next();
	});
});


UserSchema.methods.comparePassword = function(password) {
	var user = this;
	return bcrypt.compareSync(password, user.password);
};

// module.exports = returnSchema;
exports.model = mongoose.model('User', UserSchema);
