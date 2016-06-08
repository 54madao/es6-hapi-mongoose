'use strict'

import mongoose from 'mongoose'

let Schema = mongoose.Schema

let AccountSchema   = new Schema({
	"accountName": { type: String, required: true, unique: true},
	"users": [{
		"role": { type: String, required: true },
		"_id": { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: false}
	}],
	"entry_date": { type: Date, required: true, index: true}
}, { strict: false });

// let getModel = (db) => {
// 	if(db){
// 		return db.model('Account', AccountSchema);
// 	}
// 	else{
// 		return mongoose.model('Account', AccountSchema)
// 	}
// }
export default mongoose.model('Account', AccountSchema)