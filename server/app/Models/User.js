import bcrypt from 'bcrypt-nodejs'
import {BaseModel} from './BaseModel'
// import mongoose from 'mongoose'


let User = new class User extends BaseModel {
	constructor(){

		super();

		let fields = {
			"email": { type: String, required: true, index: true, unique: true },
			"password": { type: String, required: true, select: true },
			"accounts": [{
				"role": { type: String, required: true },
				"_id": {type: this.mongoose.Schema.Types.ObjectId, unique: true, index: false, ref: 'Account'}
			}]
		}

		let options = { strict: false }

		super.createSchema(fields, options);

		this.schema.pre('save', function(next) {
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

		this.schema.methods.comparePassword = function(password) {
			var user = this;
			return bcrypt.compareSync(password, user.password);
		};

		this.model = this.mongoose.model('User', this.schema);
	}
}

export default User.model;