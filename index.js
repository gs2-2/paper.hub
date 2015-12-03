"use strict";

/**
 * @desc entrypoint for the webserver. provides routes & queries to the DB
 */

var config  = require('./config.js');
var util = require('./util.js');
var mongo   = require('./dbConnector.js');
var async = require('async');
var express = require('express');
var multer = require('multer');
var bodyparser = require('body-parser');
var cp = require('child_process')
;
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

//specify the multer upload, destination is added in the post method
app.use(multer({ 
		//rename the file to avoid name conflicts
		rename: function(fieldname, filename) {
			return filename;
		},
		//log the start of the upload process
		onFileUploadStart: function(file) {
			console.log(file.originalname + 'upload started');
		},
		//log completed upload status
		onFileUploadComplete: function(file) {
			console.log(file.fieldname + 'uploaded to ' + file.path);
			done = true;
		}
	}));


/* Provide express route for the LaTeX Code commited by the user. Uploaded Latex file is converted to HTML and saved in FS and DB*/
app.post('/addPaper', upload.single('latexDocument'), function(req, res) {

	//create new paper instance in the DB
	var uploadedPaper = new dbConnector.models.publicationModel({
		title: req.body.title,
		abstract: req.body.abstract,
		author: req.body.author,
		publicationDate: new Date(),
		widgets: [] //insert widgets, when they are generated after the upload
	});

	//save the new publication in DB
	uploadedPaper.save(function(error) {
		var message = error ? 'failed to save paper: ' + error 
                            : 'paper saved: ' + uploadedPaper._id;
        console.log(message + ' from ' + req.connection.remoteAddress);
	});

	var paperID = uploadedPaper._id;

	//create a path for the new paper in the file system
	util.newPaperDir('./data/papers/', paperID, callback); 
	
	//set the directory for the paper to be saved
	var storage  = multer.diskStooreage({
		destination: function(req, file, callback) {
			callback(null, './data/papers' + paperID);
		},
		filename: function(req, file, callback) {
			callback(null, file.fieldname + '.tex');
		}
	});

	//set the upload for multer
	var upload = multer({storage: storage});

	//upload the file
	upload(req, res, function(err) {
		if(err) res.send('Error uploading the file.');
	});

	var latexFile = req.file.filename;

	//call the LaTeX-ML parser as a child-process, the output is saved as paperID.xml
	cp.exec('latexml --dest=' + paperID + '.xml' + latexFile, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
	//convert the xml file and save the HTML file in the papers/<paperID>/ folder 
	cp.exec('latexmlpost --dest=./data/papers/' + paperID + ' ' + paperID + '.xml' , function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
	//send response to the client with the ID of the new paper
	res.send(paperID);
});

/* check if the datadir exists & create it if necessary */
util.createPath([config.dataDir.papers, config.dataDir.widgets], function(err) {
	if (err) {
		console.error('couldnt find nor create data directory: ' + err);
		process.exit(2);
	}
});

/* serve the static pages of the site under '/' */
app.use('/', express.static(__dirname + '/public'));

/* serve the data directory under '/data', to make the converted HTML and widgets available */
app.use('/data', express.static(config.dataDir.path));