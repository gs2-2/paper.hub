"use strict";

/**
*@desc Provides interface for latexMl-Script, to create html output.
*/

var config = require('./config.js');
var cp     = require('child_process');
var fs     = require('fs-extra');
var async  = require('async');

/**
* @desc  generates a html file out of an xml file
* @param inPath  path of the file, that shall be parsed
* @param outPath path, where to save the new file
*/
var xml2html = function (inPath, outPath, callback) {

	var stylingpath 	= __dirname+'/styling.js';
	var jquerypath		= __dirname+'/public/vendor/jquery/dist/jquery.js';
	var mathjaxpath		= "https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML";	
	
	// Alternative if MathJax should be used.
 	//var cmd = 'latexmlpost --dest=' + outPath +' --javascript='+ jquerypath +' --javascript='+mathjaxpath +' --javascript="' +stylingpath+ '"' + ' '+ inPath;
	var cmd = 'latexmlpost --dest=' + outPath +' --format=html4'+' --javascript='+ jquerypath +' --javascript="' +stylingpath+ '"' + ' '+ inPath;
	cp.exec(cmd, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
};

/**
* @desc  generate a xml file out of the .tex input file
* @param inPath  path of the file, that shall be parsed
* @param outPath path, where to save the new file
*/
var latex2xml = function (inPath, outPath, callback) {
	var cmd = 'latexml --dest=' + outPath + ' ' + inPath;

	cp.exec(cmd, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
};

/**
 * @desc converts a given Latex document to HTML
 * @param paperID  ID of the associated paper in the DB
 * @param texPath  filename of the .tex file, located in ./uploads
 * @param callback node style callback
 */
exports.latex2html = function (paperID, texPath, callback) {
	var xmlPath  = config.dataDir.papers + '/' + paperID + '/'      + paperID + '.xml';
	var htmlPath = config.dataDir.papers + '/' + paperID + '/html/' + paperID + '.html';

	console.log("starting conversion of %s to HTML!", paperID);

	async.series([
		async.apply(latex2xml, texPath, xmlPath),  // convert tex -> xml
		async.apply(xml2html,  xmlPath, htmlPath), // convert xml -> html
		async.apply(fs.remove, xmlPath)            // remove temporary xml file
	], function(err, results) {
		if (err) return callback(err);
		callback(null);
	});
};
