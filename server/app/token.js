'use strict'

import jwt from 'jsonwebtoken' // JsonWebToken implementation for node.js
import env from 'dotenv'

let Token = {}
let optionKeys = ['iat', 'exp', 'token']

Token.sign = (payload) => {
	return jwt.sign(
		payload, 
    	env.config().JWT_SECRET, 
    	{ algorithm: 'HS256', expiresIn: 3600 }
    );
}

Token.cookie_options = {
	  ttl: 1 * 60 * 60 * 1000, // expires a year from today 
	  encoding: 'none',    // we already used JWT to encode 
	  isSecure: true,      // warm & fuzzy feelings 
	  isHttpOnly: true,    // prevent client alteration 
	  clearInvalid: false, // remove invalid cookies 
	  strictHeader: true   // don't allow violations of RFC 6265 
}

Token.refresh = (credentials) => {
	
	let payload = {}
	let now = Math.floor(Date.now()/1000);
	let timeToExpire = credentials.exp - now
	console.log("ExpireIn: " + timeToExpire);
	if( timeToExpire < 600 ) {
		for(let key in credentials){
			
			if(optionKeys.indexOf(key) === -1) {
				payload[key] = credentials[key];
			}
		}
		return Token.sign(payload);
	}
	else{
		return credentials.token;
	}
}

Token.addToken = (credentials, fields) => {
	let payload = {}
	for(let key in credentials){
		if(optionKeys.indexOf(key) === -1) {
			payload[key] = credentials[key];
		}
	}
	for(let key in fields){
		payload[key] = fields[key];
	}
	return Token.sign(payload);
}

Token.changeAction = (credentials, action) => {
	let payload = {}
	if(credentials.action){
		credentials.action = action;
		for(let key in credentials){
			
			if(optionKeys.indexOf(key) === -1) {
				payload[key] = credentials[key];
			}
		}
		return Token.sign(payload);
	}
	else{
		return Token.refresh(credentials);
	}

}
export default Token