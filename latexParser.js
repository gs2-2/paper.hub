"use strict";

/**
*@desc Provides interface for latexMl-Script, to create html output.
*/

var cp = require('child_process');

/**
* @desc generates a html file out of an xml file
* @param
*/
exports.xml2html = function (inPath, outPath, callback) {

	var cmd = 'latexmlpost --dest=' + outPath + inPath;

	cp.exec(cmd, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
};


/**
* @desc generate a xml file out of the .tex input file
*/
exports.latex2xml = function (inPath, outPath, callback) {

	var cmd = 'latexml --dest=' + outPath + inPath;

	cp.exec(cmd, function(err, stdout, stderr) {
		if(err) return callback(err);
		callback(null);
	});
};

exports.moveFile = function (inPath, outPath, callback) {

	var cmd = 'mv ' + inPath + ' ' + outPath;

	cp.exec(cmd, function(err, succ) {
		if(err) return callback(err);
		return callback(succ);
	}) 
}