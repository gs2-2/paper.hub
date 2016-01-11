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
var widget = mongo.models.widget;
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

var widgetUpload = upload.single('dataset');


/**
* @desc Send the HTML file of the specified paper.
*/
app.get('/paper/:id', function(req, res) {

	//get the id from the request
	var id = req.params.id;

	//send the html file
	res.redirect('/data/papers/' + id + '/html/' + id + '.html');
});

/**
* @desc Send the file for the editor page
*/
app.get('editor/:id', function(req, res) {

	//get the id from the request
	var id = req.params.id;

	//send the html file in the response
	res.redirect('/data/papers/' + id + '/html/' + id + '.html');
});

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

	var dbEntry;

	//find all widgets of the given publication
	publications.findById(id, function(err, doc) {
		if(err) {
			res.send('Error: ' + err);
		}
		dbEntry = doc.widgets;
	});

	//delete all widgets, saved in the widgets array
	for(var i = 0; i < dbEntry.length; i++) {

		//remove widgets, that might be created already
		fs.remove(config.dataDir.widgets + '/' + dbEntry[i], function(err) {
			if(err) {
				res.send('Error, could not find or delete widget.');
			}
		})
	};

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

		var fileList;
		// move each file (the latex doc + the utility files) to the paper dir
		if(req.files['files']) {
			fileList = req.files['files'];
		}
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

/**
* @desc Upload a dataset, that is part of the publication.
* 		The dataset is parsed and saved in the file system.
*/
app.post('/addDataset', widgetUpload, function(req, res) {
	
	//get the file extension of the uploaded file
	var fileExt = req.file.filename.split('.').pop().toLowerCase();
	
	//create a DB entry for the dataset
	var uploadedWidget = new widget({
		publicationID: req.body.publication,
		caption: req.body.caption,
		fileType: fileExt,
		widgetType: req.body.type
	});

	var widgetID = uploadedWidget._id
	var filename = req.file.filename;
	var movePath = config.dataDir.papers + '/' + req.body.publication + '/datasets/';

	/**
	* @desc Helper function, that calls the script to parse the given file to a widget
	*/
	function useWidgetScript(file, callback) {

		if(uploadedWidget.widgetType == 'map') {
			widgets.map(movePath + filename, config.dataDir.widgets + '/' + widgetID, function(err) {
				if(err) console.log(err);
			});
		}
		else if(uploadedWidget.widgetType == 'timeseries') {
			widgets.timeseries(movePath + filename, config.dataDir.widgets + '/' + widgetID + '.html');
		}
		else {
			console.error('The file can not be parsed to a widget');
			return callback('Error filetype not available');
		}
		callback(null);
	};
	
	//perform task in an asynchronous series, one after another
	async.series([
		//move the file to the paperDir of the related paper
		async.apply(fs.move, req.file.path, movePath + filename, {clobber: true}),
		//start the conversion of the dataset for any format
		async.apply(useWidgetScript, filename),
		//save the DB entry for the file.
		async.apply(uploadedWidget.save),
		//save the widget in the widgets-array of the publication
		//async.apply(publications.update, {_id: req.body.publication}, {$push: {'widgets': widgetID}}, {})
		function(callback) {
			publications.update( {_id: req.body.publication}, {$push: {'widgets': widgetID}}, {}, callback);
		}
	],
	function(err, results) {
		if(err) return console.error('Could not save the new widget:\n%s', err)
		res.send(widgetID)
		console.log('Widget %s (%s) successfully created and saved.', filename, widgetID);
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
		res.sendFile('/index.html')
//         res.redirect('/');
    }
}

app.use('/editor', loggedIn, function(req,res,next){

	res.sendfile('/editor.html');

});
