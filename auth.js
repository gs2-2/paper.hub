"use strict";

/**
 * @desc Passport Integration for Oauth2 login
 *       supported providers: GitHub
 */

module.exports = function(app, mongo, express){

	/* OAuth Key-File */
	var config = require('./config.js');
	var oauth_keys = require('./oauth_keys.js');
	var session = require('express-session');		

	app.use(session({
		secret: oauth_keys.session_secret,
		resave: false,
		saveUninitialized: false
	}));


	/* Passport & Login Strategies */
	var passport = require('passport');
	var GitHubStrategy = require('passport-github2').Strategy;
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

	app.use(passport.initialize());
	app.use(passport.session());
	
	/** GITHUB STRATEGY **/
	passport.use(new GitHubStrategy({
		clientID: oauth_keys.GITHUB_CLIENT_ID,
		clientSecret: oauth_keys.GITHUB_CLIENT_SECRET,
		callbackURL: 'https://' + config.hostname + ':' + config.httpsPort + '/auth/github/callback/'
	},
	function(accessToken, refreshToken, profile, done) {
		//First we need to check if the user logs in for the first time
		mongo.models.users.findOne({
			'providerID': profile.id,
			'provider': 'github'
		}, function(err, user) {
			if (err) return done(err);
			if (!user) {
			// no user existent --> new user --> create a new one
				user = new mongo.models.users({
					name: profile.displayName,
					email: profile.emails[0].value,
					username: profile.username,
					provider: 'github',
					providerID: profile.id
				});

				user.save(function(err) {
					if (err) console.log(err);
					return done(err, user);
				});
			} else {
				//user found. return it.
				return done(err, user);
			}
		});
	}));

	/** GOOGLE STRATEGY **/

	passport.use(new GoogleStrategy({
		clientID: oauth_keys.GOOGLE_CLIENT_ID,
		clientSecret: oauth_keys.GOOGLE_CLIENT_SECRET,
		callbackURL: 'https://' + config.hostname + ':' + config.httpsPort + '/auth/google/callback/'
	},
	function(accessToken, refreshToken, profile, done) {

		mongo.models.users.findOne({
			'providerID': profile.id,
			'provider': 'google'
		}, function(err, user) {
			if (err) return done(err);
			if (!user) {
				// no user existent --> new user --> create a new one

				// Fix if a user has a Google Account but no real name
				var userName = 'Unbekannter Benutzer via Google';
 				if(profile.displayName) userName = profile.displayName;

				user = new mongo.models.users({
					name: userName,
					email: profile.emails[0].value,
					provider: 'google',
					providerID: profile.id
				});

				user.save(function(err) {
					if (err) console.log(err);
					return done(err, user);
				});

			} else {
				//user found. return it.
				return done(err, user);
			}
		});
	}));

	/** LINKEDIN STRATEGY **/
	passport.use(new LinkedInStrategy({
		clientID: oauth_keys.LINKEDIN_KEY,
		clientSecret: oauth_keys.LINKEDIN_SECRET,
		callbackURL: 'https://' + config.hostname + ':' + config.httpsPort + '/auth/linkedin/callback/',
		scope: ['r_emailaddress', 'r_basicprofile']
	}, function(accessToken, refreshToken, profile, done) {
		mongo.models.users.findOne({
			'providerID': profile.id,
			'provider': 'linkedin'
		}, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
			// no user existent --> new user --> create a new one

				user = new mongo.models.users({
					name: profile.displayName,
					email: profile.emails[0].value,
					provider: 'linkedin',
					providerID: profile.id
				});

				user.save(function(err) {
					if (err) console.log(err);
					return done(err, user);
				});

			} else {
				//user found. return it.
				return done(err, user);
			}
		});

	}));

	/** GITHUB ROUTES **/

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
		res.redirect('/');
	  });

	/** GOOGLE ROUTES **/

	// GET /auth/google
	app.get('/auth/google', passport.authenticate('google', { scope: [ 'https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }));

	// GET /auth/google/callback
	app.get('/auth/google/callback',
	  passport.authenticate('google', { failureRedirect: '/login' }),
	  function(req, res) {
	    // Successful authentication, redirect home.
	    res.redirect('/');
	});


	/** LINKEDIN ROUTES **/

	// GET /auth/linkedin
	app.get('/auth/linkedin',
		passport.authenticate('linkedin', { state: oauth_keys.LINKEDIN_SECRET }),
		function(req, res){
	});

	// GET /auth/linkedin/callback
	app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
		successRedirect: '/',
		failureRedirect: '/login'
	}));


	/** Additional Passport Routes **/
	// Can be used to log a user out.
	app.get('/logout', function(req, res){
	  req.logout();
	  res.redirect('/');
	});


	// Can be used to check for the Login status of the current user
	app.get('/getAuthStatus', function(req,res){
		if(req.user){
			res.send('Auth successful');
		}else{
			res.send('Auth unsuccessful');
		}
	});


	/* passport serialization functions */
	passport.serializeUser(function(user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function(user, done) {
	  done(null, user);
	});
};