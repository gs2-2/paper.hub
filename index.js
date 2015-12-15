"use strict";

/**
 * @desc entrypoint for the webserver. provides routes & queries to the DB
 */

var config  = require('./config.js');
var util    = require('./util.js');
var mongo   = require('./dbConnector.js');
var widgets = require('./widget_generator/widgetGenerator.js');
var lp = require('./latexParser.js');
var async   = require('async');
var express = require('express');
var multer = require('multer');
var app = express();
var publications = mongo.models.publications;
require('./auth.js')(app, mongo, express);

/* connect to mongoDB & launch express webserver */
mongo.connect(
	config.dbAddress,
	config.dbName,
	function(err) {
		if (err) {
			console.error('ABORTING: ' + err);
			process.exit(1);
		}

		// once DB is connected, start webserver
		console.log('connection to database established on ' + config.dbAddress);
		app.listen(config.httpPort, function(){
			console.log('http server now listening on port ' + config.httpPort);
		});
	}
);

/* serve everything in the folder './public/' */
app.use(express.static(__dirname + '/public'));

//set up the multer specifications
var upload = multer({
	//set the upload-destiantion for multer
	dest: './uploads',
	//rename the file to avoid name conflicts
	rename: function(fieldname, filename) {
		return filename;
	}
});


var uploadFile = upload.single('latexDocument');

/* return metadata about all stored journeys */
app.get('/getPaperList', function(req, res) {
	publications
		.find({}, '_id title author publicationDate')
		.sort({publicationDate: -1})
		.exec(function(err, papers) {
			if (err) return console.error('could not get stored papers: ' + err);
			res.json(papers);
		});
});

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
	var latexFile = req.file.filename;

	//create a path for the new paper in the file system
	util.newPaperDir('./data/papers/', paperID, function(err) {
		if(err) console.log(err);
		lp.latexParsing(paperID, latexFile);
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


function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
		res.sendfile('/index.html')
//         res.redirect('/');
    }
}

app.use('/editor', loggedIn, function(req,res,next){

	res.sendfile('/editor.html');

});
