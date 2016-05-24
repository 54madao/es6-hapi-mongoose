import {BaseModel} from './BaseModel'

let Link = new class Link extends BaseModel {
	constructor() {
		super()

		let fields = {
			"user" :  {type: this.mongoose.Schema.Types.ObjectId, ref: 'User', index: false},
			"account" : {type: this.mongoose.Schema.Types.ObjectId, index: false, ref: 'Account'},
			"role": { type: String, required: true }
		}

		let options = {
			strict: false
		}

		super.createSchema(fields, options)

		this.model = this.mongoose.model('Link', this.schema);
	}
}

export default Link.model