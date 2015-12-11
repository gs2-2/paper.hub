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

/* OAuth Key-File */
var oauth_keys = require('./oauth_keys.js');

/* Passport & Login Strategies */
var passport = require('passport');
var GitHubStrategy = require('passport-github2').Strategy;
app.use(passport.initialize());
app.use(passport.session());

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


/**
 *	@desc Passport Integration
 */	
 
 
passport.use(new GitHubStrategy({
    clientID: oauth_keys.GITHUB_CLIENT_ID,
    clientSecret: oauth_keys.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:8080/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
  	
  	console.log('GitHub Auth successful with ID'+profile.id);
//  	console.log(profile);		
  	return done(null, {});
  	
  	//TODO: Fix UserSchema to get access to the findOrCreate method.
/*
    users.findOrCreate({ githubId: profile.id }, function (err, user) {	
	    // We can choose here if we want the profile, etc. 
      return done(err, user);

    });
*/  }
));

/* Routes for Passport */


// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }),	// scope = what data we want access to
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
	 console.log('Im Callback'); 
    res.redirect('/');
  });
                                      
// GET /logout
// Can be used to log a user out.                                     
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});                              
                                      
                                      
    
    
/* Passport needs some functions for serialization */


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});                                      

