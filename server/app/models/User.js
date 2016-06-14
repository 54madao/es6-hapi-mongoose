'use strict'

import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

let Schema = mongoose.Schema

let UserSchema   = new Schema({
	"email": { type: String, required: true, index: true, unique: true },
	"password": { type: String, required: true, select: true },
	"accounts": [{
		"role": { type: String, required: true },
		"_id": {type: Schema.Types.ObjectId, ref: 'Account'}
	}]
}, { strict: false });

UserSchema.statics.comparePassword = (password, userPassword) => bcrypt.compareSync(password, userPassword);

UserSchema.index({ email: 1 }, {unique: true});

let model = mongoose.model('User', UserSchema)

model.on('index', (err) => {
  if (err) console.error(err); // error occurred during index creation
})
// let getModel = (db) => {
// 	if(db){
// 		return db.model('User', UserSchema);
// 	}
// 	else{
// 		return mongoose.model('User', UserSchema)
// 	}
// }
export default model