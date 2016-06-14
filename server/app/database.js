'use strict'

import mongoose from 'mongoose'
import config from 'config'

// mongoose.set('debug', true);
let Admin = mongoose.mongo.Admin;
let dbconfig = config.get('database');

let conn = new class Database {
	constructor(){
		mongoose.connect('mongodb://' + dbconfig.host + '/' + dbconfig.db, { config: { autoIndex: false } })
		this._mainDb = mongoose.connection
		this._tenantDb = null;
		this._mainDb.on('error', console.error.bind(console, 'connection error'));
		this._mainDb.once('open', () => {
		    console.log("Connection with main database succeeded.");
		    new Admin(this._mainDb.db).listDatabases(function(err, result) {
				// for (var db in result.databases) {
				// 	if (typeof result.databases[db] === 'object') {
				// 		allDbs.push(result.databases[db].name);
				// 	}
				// }
				// // console.log(allDbs);
				console.log(result.databases);
			});
		});
	}

	get mainDb() { return this._mainDb }
	get tenantDb() { return this._tenantDb }
	set tenantDb(name) { 
		// if(this._tenantDb){
		// 	this._tenantDb.close();
		// }
		if(this._tenantDb){
			this._tenantDb.close()
			delete this._tenantDb
		}
		this._tenantDb = mongoose.createConnection('mongodb://' + dbconfig.host + '/' + name, { config: { autoIndex: false } });
		this._tenantDb.on('error', console.error.bind(console, 'connection error'));
		this._tenantDb.once('open', () => {
		    console.log("Connection with tenant database succeeded.");
		    new Admin(this._mainDb.db).listDatabases(function(err, result) {
				console.log(result.databases);
			});
		});
	}
} 

export default conn;