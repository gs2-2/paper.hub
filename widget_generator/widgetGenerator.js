"use strict";

/**
 * @desc provides an interface to R scripts, which create HTML widgets (map, timeseries)
 */

var cp = require('child_process');
var fs = require('fs-extra');

/**
 * @desc  generates an interactive map in an HTML file for the specified datasets
 * @param inPaths  array of absolute paths to the datasets
 * @param outPath  absolute path to the output HTML file
 * @param callback function that is called after execution of the script with param 'error'
 */
exports.map = function (inPaths, outPath, callback) {

	var cmd = 'Rscript ' + __dirname + '/makeMapWidget.r'
		+ ' --input "' + inPaths.toString() + '" --output ' + outPath;

	cp.exec(cmd, function (err, stdout, stderr) {
		if (err) return callback(err);
		callback(null);
	});
}

/**
 * @desc  generates an interactive timeseries in an HTML file for the specified dataset
 * @param inPath   String absolute paths to the datasets
 * @param outPath  absolute path to the output HTML file
 * @param callback function that is called after execution of the script with param 'error'
 */
exports.timeseries = function (inPath, outPath, callback) {
	// will contain the data from inPath as json
	// values can be accessed like matrix[row][column]
	var jsonData = [];

	async.series([
		// convert data to CSV using R2csv.r
		function(done) {
			var cmd = 'Rscript ' + __dirname + '/R2csv.r'
				+ ' --input "' + inPath + '" --output ' + outPath;
			cp.exec(cmd, done);
		},
		// read csv file & parse csv to json 2d array
		function(done) {
			fs.readFile(inPath, function(err, data) {
				if (err) done(err);
				jsonData = parseCSV(data)
				done(null);
			});
		},
		// TODO load JS & HTML template as strings
		function(done) {
			done(null);
		}
	], function(err) {
		if (err) return callback(err);

		// TODO insert values into JS template

		// TODO insert modified js into HTML

		// TODO save HTML
			// call callback
	});
}

/**
 * @desc    parses a string containing CSV data to a 2d json array / matrix
 * @param   csv data as String
 * @returns the json 2d array
 */
function parseCSV(csv) {
	var lines = csv.split('\n');
	var csvMatrix = [];
	lines.map(function(line) {
		var lineArray = line.split(',');
		csvMatrix.push(lineArray);
	});
	return csvMatrix;
}
