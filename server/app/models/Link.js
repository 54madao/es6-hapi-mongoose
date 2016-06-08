'use strict'

import User from './User'
import Account from './Account'
import mongoose from 'mongoose'

let Schema = mongoose.Schema

let LinkSchema   = new Schema({
	"user" :  {type: Schema.Types.ObjectId, ref: 'User', index: false, required: true},
	"account" : {type: Schema.Types.ObjectId, index: false, ref: 'Account', required: true},
	"role": { type: String, required: true }
}, { strict: false });

LinkSchema.index({user: 1, account: 1}, {unique: true});

// let getModel = (db) => {
// 	if(db){
// 		return db.model('Link', LinkSchema);
// 	}
// 	else{
// 		return mongoose.model('Link', LinkSchema)
// 	}
// }
export default mongoose.model('Link', LinkSchema)