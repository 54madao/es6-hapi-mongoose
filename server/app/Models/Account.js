import {BaseModel} from './BaseModel'

let Account = new class Account extends BaseModel {
	constructor() {
		super();

		let fields = {
			"accountName": { type: String, required: true, unique: true},
			"users": [{
				"role": { type: String, required: true },
				"_id": { type: this.mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: false}
			}],
			"entry_date": { type: Date, required: true, index: true}
		}

		let options = {
			strict: false
		}

		super.createSchema(fields, options);

		this.model = this.mongoose.model('Account', this.schema);
	}
}

export default Account.model