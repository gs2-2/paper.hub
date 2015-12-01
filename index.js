"use strict";

/**
 * @desc entrypoint for the webserver. provides routes & queries to the DB
 */

var config  = require('./config.js');
var util = require('./util.js');
var mongo   = require('./dbConnector.js');
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

//specify the multer upload
/*muss umsortiert werden, wenn man die ID des papers hat und das DIR angelegt wurde. 
Sonst sehe ich keine Möglichkeit die paper jeweils in das richtige dir einzuordnen.*/
app.use(multer({dest: './data/papers/uploads', 
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


/* Provide express route for the LaTeX Code commited by the user*/
app.post('/addPaper', upload.single('latex'), function(req, res) {

	//create new paper instance in the DB
	var uploadedPaper = new dbConnector.models.publicationModel({
		title: req.body.title,
		abstract: req.body.abstract,
		author: req.body.author,
		publicationDate: new Date(),
		widgets: [] // koennen erst eingesetzt werden, wenn die mit den anderen Scripten erstellt wurden?!?
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
	
	//upload the file
	upload(req, res, function(err) {
		if(err) res.send('Error uploading the file.');
	});
	var latexFile = req.file;

	//call the LaTeX-ML parser as a child-process
	cp.exec('latexml --dest=' + req.file + '.xml' + latexFile, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
	//xml Datei evtl. in dem HTML Ordner (zwichen-)speichern
	cp.exec('latexmlpost --dest=irdegenwoImSYstem' + DATEINAME.xml , function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
	//geparstes Ergebnis speichern (Dateisystem)
	res.send(paperID);
	//Antwort an den Client mit der paperID
})