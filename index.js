"use strict";

/**
 * @desc entrypoint for the webserver. provides routes & queries to the DB
 */

var config  = require('./config.js');
var util    = require('./util.js');
var mongo   = require('./dbConnector.js');
var widgets = require('./widget_generator/widgetGenerator.js');
var latex   = require('./latexParser.js');
var async   = require('async');
var express = require('express');
var multer  = require('multer');

var app = express();
var publications = mongo.models.publications;

/* check if the all required paths exist & create them if necessary */
util.createPath([config.dataDir.papers, config.dataDir.widgets, config.uploadDir], function(err) {
	if (err) {
		console.error('couldnt find nor create data directory: ' + err);
		process.exit(2);
	}
});

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


//set the destination of the upload and the file-rename function
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, config.uploadDir)
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname)
	}
});

//set up the multer specifications
var upload = multer({ storage: storage });

//set multer for multiple file uploads
var latexUpload = upload.fields([{
	name: 'latexDocument',
	maxCount: 1
},
{
	name: 'files'
}]);

/* Provide express route for the LaTeX Code commited by the user.
   Uploaded Latex file is converted to HTML and saved in FS and DB */
app.post('/addPaper', latexUpload, function(req, res) {

	//create new paper instance in the DB
	var uploadedPaper = new publications({
		title:    req.body.title,
		abstract: req.body.abstract,
		author:   req.body.author,
		publicationDate: new Date(),
		widgets: [] //insert widgets, when they are generated after the upload
	});

	var paperID = uploadedPaper._id;
	var latexFile = req.files['latexDocument'][0].filename;

	async.series([
		// save the paper metadata to the DB
		async.apply(uploadedPaper.save),
		// create directory structure for the paper
		async.apply(util.newPaperDir, config.dataDir.papers, paperID),
		// convert the tex document to HTML
		async.apply(latex.latex2html, paperID, latexFile)
	],
	function(err, results) {
		if (err) return console.error('could not save the new paper:\n%s', err);
		res.send(paperID)
		console.log('paper %s (%s) successfully uploaded and converted!',
			latexFile, paperID);
	});
});

/* serve the static pages of the site under '/' */
app.use('/', express.static(__dirname + '/public'));

/* serve the data directory under '/data',
   to make the converted HTML and widgets available */
app.use('/data', express.static(config.dataDir.path));
