"use strict";

/**
 * @desc defines DB schemata & connects to mongoDB
 */

var mongoose = require('mongoose');

/* definition of data schemata */
var publicationSchema = new mongoose.Schema({
	title: String,
	// ...
});
var publicationModel = mongoose.model('Publication', publicationSchema);


/**
 * @desc function to connect the ODB driver to mongoDB
 * @param dbPort:   port on which mongoDB is listening
 * @param dbName:   name of the database to use
 * @param callback: function with parameter 'error' (node style callback)
 */
exports.connect = function(dbPort, dbName, callback) {
	var uri = 'mongodb://localhost:' + dbPort + '/' + dbName;
	var options = {};
	mongoose.connect(uri, options);

	mongoose.connection.on('error',  function() { callback('database connection error'); });
	mongoose.connection.once('open', function() { callback(null); });
};

/* the database models, that can be accessed for queries etc */
exports.models = {
	publications: publicationModel,
	// ...
};