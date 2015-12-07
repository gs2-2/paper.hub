"use strict";

/**
*@desc Provides interface for latexMl-Script, to create html output.
*/

var config = require('./config.js');
var cp = require('child_process');
var fs = require('fs-extra');

/**
* @desc generates a html file out of an xml file
* @param inPath path of the file, that shall be parsed
* @param outPath path, where to save the new file
*/
var xml2html = function (inPath, outPath, callback) {

	var cmd = 'latexmlpost --dest=' + outPath + inPath;

	cp.exec(cmd, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
};


/**
* @desc generate a xml file out of the .tex input file
* @param inPath path of the file, that shall be parsed
* @param outPath path, where to save the new file
*/
var latex2xml = function (inPath, outPath, callback) {

	var cmd = 'latexml --dest=' + outPath + inPath;

	cp.exec(cmd, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
};

/**
* @desc Call functions that parse the latex file to html
*/
exports.latexParsing = function (paperID, file) {
	//call the LaTeX-ML parser function, the output is saved as paperID.xml
	latex2xml('uploads/' + file, config.dataDir.papers + '/' + paperID + '/' + paperID + '.xml ', function(err) {
		if(err) console.log(err);
		//convert the xml file and save the HTML file in the papers/<paperID>/ folder 
		xml2html(config.dataDir.papers + '/' + paperID + '/' + paperID, config.dataDir.papers + '/' + paperID + '/html/' + paperID + '.html ', function(err) {
			if(err) console.log(err);
			console.log('Successfully parsed');
			//move the tex file from the upload folder to the paper-dir
			fs.move('uploads/' + file, config.dataDir.papers + '/' + paperID + '/tex/' + file, function(err) {
				if(err) return console.error(err);
				console.log('Success with moving');
			});
		})
})};