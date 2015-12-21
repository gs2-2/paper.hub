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

var app = express();
var publications = mongo.models.publications;
require('./auth.js')(app, mongo, express);

/* check if all required paths exist & create them if necessary */
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


/* return metadata about all stored papers */
app.get('/getPaperList', function(req, res) {
	publications
		.find({}, '_id title author publicationDate')
		.sort({publicationDate: -1})
		.exec(function(err, papers) {
			if (err) return console.error('could not get stored papers: ' + err);
			res.json(papers);
		});
});

/**
* @desc Send the metadata of the specified paper to the client
*/
app.get('/getPaperMetadata/:id', function(req, res) {
	
	//extract the id from the URL
	var id = req.params.id;

	publications.findById(id, function(err, doc) {
		if(err) {
			res.send('Error: ' + err);
		}
		res.send(doc);
	});
});

/**
* @desc Get the specified publication as HTML file.
*/
app.get('/getPaper/:id', function(req, res) {

	//save the id from the URL
	var id = req.params.id;

	//send the html file saved in the paper-dir
	res.sendFile(config.dataDir.papers + '/' + id + '/html/' + id + '.html');
});

app.get('/getWidget/:id', function(req, res) {

	//save the id form the URL
	var id = req.params.id;

	res.sendFile(config.dataDir.widgets + '/' + id + '.html');
});

/**
* @desc Delete the DB-content of the publication
*/
app.delete('/deletePaper/:id', function(req, res) {

	//save the id from the URL
	var id = req.params.id;

	//remove the dir from the file system
	fs.remove(config.dataDir.papers + '/' + id, function(err) {
		if(err) {
			res.send('Error, could not find or delete directory.');
		}
	});

	// remove the document form the DB
	publications.remove({_id: id}, function(err) {
		if(err) {
			res.send('Error deleting paper: ' + err);
		}
		res.send('successfully deleted paper.');
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
