'use strict'

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

let Schema = mongoose.Schema

let UserSchema   = new Schema({
	"email": { type: String, required: true, index: true, unique: true },
	"password": { type: String, required: true, select: true },
	"accounts": [{
		"role": { type: String, required: true },
		"_id": {type: Schema.Types.ObjectId, unique: true, index: false, ref: 'Account'}
	}]
}, { strict: false });

UserSchema.statics.comparePassword = (password, userPassword) => bcrypt.compareSync(password, userPassword);

// UserSchema.statics.hashPassword = (password, saltRounds, callback) => {
// 	bcrypt.hash(user.password, saltRounds, (err, hash) {
// 		if(err){
// 			callback(err, null);
// 		}
// 		else{
// 			callback(null, hash);
// 		}
// 	}
// }

// let getModel = (db) => {
// 	if(db){
// 		return db.model('User', UserSchema);
// 	}
// 	else{
// 		return mongoose.model('User', UserSchema)
// 	}
// }
export default mongoose.model('User', UserSchema)