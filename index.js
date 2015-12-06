"use strict";

/**
 * @desc entrypoint for the webserver. provides routes & queries to the DB
 */

var config  = require('./config.js');
var util = require('./util.js');
var mongo = require('./dbConnector.js');
var lp = require('./latexParser.js');
var async = require('async');
var express = require('express');
var multer = require('multer');
var app = express();
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

//set up the multer specifications
var upload = multer(
		//set the upload-destiantion for multer
		{dest: './uploads',
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
		});


var uploadFile = upload.single('latexDocument');


/* Provide express route for the LaTeX Code commited by the user. Uploaded Latex file is converted to HTML and saved in FS and DB*/
app.post('/addPaper', uploadFile, function(req, res) {

	//create new paper instance in the DB
	var uploadedPaper = new publications({
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
        console.log(message);
	});

	var paperID = uploadedPaper._id;

	//create a path for the new paper in the file system
	util.newPaperDir('./data/papers/', paperID, function(err) {
		if(err) console.log(err);
	}); 

	var latexFile = req.file.filename;

	//call the LaTeX-ML parser as a child-process, the output is saved as paperID.xml
	lp.latex2xml('uploads/' + latexFile, './data/papers/' + paperID + '/' + paperID + '.xml ', function(err) {
		if(err) console.log(err);
		//convert the xml file and save the HTML file in the papers/<paperID>/ folder 
		lp.xml2html('data/papers/' + paperID + '/' + paperID, './data/papers/' + paperID + '/html/' + paperID + '.html ', function(err){
			if(err) console.log(err)});
			console.log('Successfully parsed');
			lp.moveFile('uploads/' + latexFile, 'data/papers/' + paperID + '/tex/', function(err, succ) {
				if(err) console.log(err);
				console.log(succ);
			});
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