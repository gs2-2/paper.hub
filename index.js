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
var fs      = require('fs-extra');
var ZipZipTop = require('zip-zip-top');

var app = express();
var publications = mongo.models.publications;
require('./auth.js')(app, mongo, express);

/* check if the all required paths exist & create them if necessary */
util.createPath([config.dataDir.papers, config.dataDir.widgets, config.uploadDir], function(err) {
	if (err) {
		console.error('couldnt find nor create data directory: ' + err);
		process.exit(2);
	}
});

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
	var texFile = req.files['latexDocument'][0].filename;
	var texPath = config.dataDir.papers + '/' + paperID + '/tex/';

	/**
	 * @desc  helper function to asynchronously move all files from the upload
	 *        to its paper folder
	 * @param paperID the ID of the paper
	 */
	function moveUploadToPaper(paperID, callback) {

		// move each file (the latex doc + the utility files) to the paper dir
		var fileList = req.files['files'];
		fileList.push(req.files['latexDocument'][0]);

		async.each(fileList, function(file, cb) {
			fs.move(file.path, texPath + file.filename, {clobber: true}, cb);
		}, callback);
	}

	async.series([
		// create directory structure for the paper
		async.apply(util.newPaperDir, config.dataDir.papers, paperID),
		// move the files to the correct location
		async.apply(moveUploadToPaper, paperID),
		// convert the tex document to HTML
		async.apply(latex.latex2html, paperID, texPath + texFile),
		// save the paper metadata to the DB
		async.apply(uploadedPaper.save)
	],
	function(err, results) {
		if (err) return console.error('could not save the new paper:\n%s', err);
		res.send(paperID)
		console.log('paper %s (%s) successfully uploaded and converted!',
			texFile, paperID);
	});
});

//----------------------------In progress---------------------------------------------------

/*
 * @desc zips the folder where uploaded files are stored
 * ToDo: change paths to real paths in filesystem
 * ToDo: embed this code/function into route where editing has been finalized
 * Note: uploaded data and latex files are in two separate folders 
 * @param id the id of publication
 */
function zipIt(id){

	// set path of local folders
	var localpath = __dirname + "/data/delete/test";

	// set target path for .zip
	var zippath = __dirname + config.dataDir.papers + '/' + id + '.zip';

	// new ZipZipTip instance
	var zip = new ZipZipTop();

	// define folder to be zipped
	zip.zipFolder(localpath, function(err){

		// if error occurs, make console.log
		if (err) return console.log(err);

		// write zip to target path
		zip.writeToFile(zippath, function(err){

			// if error occurs, make console.log
			if (err) return console.log(err);

			// debuggind
			console.log("Zipped folder"/*need to add paperId*/);


			
		});
	});
	
}


app.get('/downloadPaper', function(req, res){

	// set variable to content of query
	var paperId = req.query.id;

	// define path of .zip file
	var zipPath = config.dataDir.papers + '/' + paperId + '.zip';
	

	// delete following line, just for testing
	//var zipPath = __dirname + '/data/delete/' + paperId + '.zip';


	// define as Download
	res.setHeader('Content-disposition', 'attachment; filename= ' + zipPath);
	res.setHeader('Content-type', 'application-zip, application/octet-stream');

	// start download
	res.download(zipPath);

});


//---------------------------End In-Progress------------------------------------------------

/* serve the static pages of the site under '/' */
app.use('/', express.static(__dirname + '/public'));

/* serve the data directory under '/data',
   to make the converted HTML and widgets available */
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
