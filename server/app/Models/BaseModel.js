import mongoose from 'mongoose'

export class BaseModel {
	constructor(){
		this.mongoose = mongoose;
		this.schema = null;
		this.model = null;
	}

	createSchema(fields, options){
		this.schema = new this.mongoose.Schema(fields, options);
	}
}