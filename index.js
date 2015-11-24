"use strict";

/**
 * @desc entrypoint for the webserver. provides routes & queries to the DB
 */

var config  = require('./config.js');
var mongo   = require('./dbConnector.js');
var widgets = require('./widgetGenerator.js');
var express = require('express');

var app          = express();
var publications = mongo.models.publications;

/* connect to mongoDB & launch express webserver */
mongo.connect(
	config.dbPort,
	config.dbName,
	function(err) {
		if (err) {
			console.error('ABORTING: ' + err);
			process.exit(1);
		}

		// once DB is connected, start webserver
		console.log('connection to database established on port ' + config.dbPort);
		app.listen(config.httpPort, function(){
			console.log('http server now listening on port ' + config.httpPort);
		});
	}
);

/* serve everything in the folder './public/' */
app.use(express.static(__dirname + '/public'));

/* test route to check on widget creation */
app.get('/makeWidget', function(req, res) {
	var img = __dirname + '/cea.tif';
	var out = __dirname + '/widgets/cea.html';

	widgets.TIFF2Map(img, out, function(err) {
		if (err) res.send('boooh! :^(<br>' + err);
		else     res.send('yeeeh! :^><br>widget created at ' + out);
	});
});
