var Mongoose = require('mongoose'),
    config = require('dotenv').config();
Mongoose.connect('mongodb://' + config.DB_HOST + '/' + config.DB_DATABASE);
var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
    console.log("Connection with database succeeded.");
});
exports.Mongoose = Mongoose;
exports.db = db;