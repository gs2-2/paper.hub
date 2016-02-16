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
var bodyParser = require('body-parser');
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

// SSL Integration, if enabled in config. must be run before app.listen()
if (config.enableHttps) {
	require('https').createServer({
		key: fs.readFileSync('private.key'),
		cert: fs.readFileSync('certificate.pem')
	}, app).listen(config.httpsPort);

	/* Redirect all traffic over SSL */
	app.set('port_https', config.httpsPort);
	app.all('*', function(req, res, next){
		if (req.secure) return next();
		res.redirect("https://" + req.hostname + ":" + config.httpsPort + req.url);
	});
	console.log('https server now listening on port ' + config.httpsPort);
}

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
}, {
	name: 'files'
}]);

var widgetUpload = upload.single('dataset');
var htmlUpload = bodyParser.urlencoded({ extended: true, limit: '4mb' });


/**
* @desc Send the HTML file of the specified paper.
*/
app.get('/paper/:id', function(req, res) {

	//get the id from the request
	var id = req.params.id;

	//send the html file
	res.sendFile(__dirname + '/public/paper.html');
});

/**
* @desc Send the file for the editor page
*/
app.get('/editor/:id', loggedIn, function(req, res) {

	//get the id from the request
	var id = req.params.id;

	//send the html file in the response
	res.sendFile(__dirname + '/public/editor.html');
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
app.delete('/deletePaper/:id', loggedIn, function(req, res) {

	//save the id from the URL
	var id = req.params.id,
	    widgets;

    async.series([
        // find given publication and all widgets
        function(done) {
            publications.findById(id, function(err, doc) {
                if(err) return done(err);
                widgets = doc.widgets || [];
                done(null);
            });
        },
        // remove the paper from the file system
        function(done) {
            fs.remove(config.dataDir.papers + '/' + id, done);
        },
        //delete all widgets stored in the widgets array & remove DB entry
        function(done) {
            // remove widgets, that might be created already
            for(var i = 0; i < widgets.length; i++) {
                fs.remove(config.dataDir.widgets + '/' + widgets[i], function(err) {
                    if (err) return done(err);
                });
            };
                        
            // remove the document form the DB
            publications.remove({_id: id}, done);
        },
    ], function(err) {
        if (err) console.error('error while deleting paper %s: %s', id, err);
        res.send('');
    });
});

/* Provide express route for the LaTeX Code commited by the user.
   Uploaded Latex file is converted to HTML and saved in FS and DB */
app.post('/addPaper', latexUpload, loggedIn, function(req, res) {

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
		res.redirect('/editor/' + paperID);
		console.log('paper %s (%s) successfully uploaded and converted!',
			texFile, paperID);
	});
});

/**
 * @desc accepts a html string, wich replaces the body of a given papers' html
 *       also creates / updates the zip package of the paper
 */
app.post('/updatePaperHTML/:id/', loggedIn, htmlUpload, function(req, res){
	var paperId   = req.params.id,
	    paperPath = config.dataDir.papers + '/' + paperId + '/html/' + paperId + '.html',
	    paperHTML = '<!DOCTYPE html><html>' + req.body.html + '</html>';

	async.series([
		// replace the papers html file with recieved data
		async.apply(fs.writeFile, paperPath, paperHTML),
		// zip the publication (again), so its available for download
		async.apply(util.zipPaper, config.dataDir.papers, paperId)
	],
	function (err, results) {
		if (err) res.status(500).send('unable to update the paper: %s', err);
		res.send(paperId);
	});
});

/* Route for downloading a zip File.
*  /:id paperId, equals folder name
*/
app.get('/downloadPaper/:id/', function(req, res){

	// set variable to content of param :id
	var paperId = req.params.id;

	// define path of .zip file
	var zipPath = config.dataDir.papers + '/' + paperId + '.zip';

	//check if .zipFile exists
	fs.access(zipPath, fs.F_OK, function(err){

		// if file found download it
		if (!err){
			// define as Download
			res.setHeader('Content-type', 'application-zip, application/octet-stream');

			// start download
			res.download(zipPath);

		//if file NOT found send error
		} else {
			res.status(404).send('File not found');
		}
	});


});


/**
* @desc Upload a dataset, that is part of the publication.
* 		The dataset is parsed and saved in the file system.
*/
app.post('/addDataset', loggedIn, widgetUpload, function(req, res) {

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
			widgets.map(movePath + filename, config.dataDir.widgets + '/' + widgetID + '.html', 'area', function(err) {
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
		console.log('UNAUTHORIZED REQUEST TO %s FROM %s!', req.originalUrl, req.ip);
		res.redirect('/');
    }
}

//-----------Delete-------------------------------
app.get('/testR2Graph', function(req, res){
	
	var inpath = __dirname + '/data/papers/Meaningful/fig-8-zoo.Rdata';
	//var inpath = __dirname + '/data/papers/test01-zeitreihenbeispiel/data/fig01.Rdata';
	var outpath = __dirname + '/data/widgets/fig1xtsflot3.html';
	widgets.timeseries(inpath, outpath, function(error, result){
		if (error) console.log(error);
		res.send(result);
	});
});

//--------------------------------------------


