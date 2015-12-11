"use strict";

module.exports = function(app){
	
	
	
	/* OAuth Key-File */
	var oauth_keys = require('./oauth_keys.js');
	
	/* Passport & Login Strategies */
	var passport = require('passport');
	var GitHubStrategy = require('passport-github2').Strategy;
	app.use(passport.initialize());
	app.use(passport.session());
	
	
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

};