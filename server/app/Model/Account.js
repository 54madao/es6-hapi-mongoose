'use strict'

import mongoose from 'mongoose'

let Schema = mongoose.Schema

let AccountSchema   = new Schema({
	"accountName": { type: String, required: true, unique: true},
	"users": [{
		"role": { type: String, required: true },
		"_id": { type: Schema.Types.ObjectId, ref: 'User'}
	}],
	"entry_date": { type: Date, required: true}
}, { strict: false });

AccountSchema.index({ accountName: 1 }, {unique: true});

let model = mongoose.model('Account', AccountSchema)

model.on('index', (err) => {
  if (err) console.error(err); // error occurred during index creation
})
// let getModel = (db) => {
// 	if(db){
// 		return db.model('Account', AccountSchema);
// 	}
// 	else{
// 		return mongoose.model('Account', AccountSchema)
// 	}
// }
export default model