"use strict";

/**
 * @desc provides an interface to R scripts, which create HTML widgets (map, timeseries)
 */

var cp = require('child_process');
var fs = require('fs-extra');
var async = require('async');
var moment = require('moment');

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
 * @param type 	   one of the following ['area', 'line', 'bar', 'scatterplot']
 * @param callback function that is called after execution of the script with param 'error'
 */
exports.timeseries = function (inPath, outPath, type, callback) {
	// will contain the data from inPath as json
	var jsonData = [];
	// will contain the exit code from Rscript
	var isXts;
	// will contain the string for the graph-html template
	var graphTemplate;
	async.series([
		// convert data to CSV using R2csv.r to a temporary csv file
		function(done) {
			var cmd = 'Rscript ' + __dirname + '/R2csv.r'
				+ ' --input "' + inPath + '" --output ' + inPath + '.csv';
			cp.exec(cmd, {}, function(error){
				console.log(error.code);
				console.log('type: ' + typeof error.code);
				if (error && error.code == 12) {isXts = false; console.log('is here');}
				else if (error && error.code == 11) isXts = true;
				else if (error && error.code ==13) done('invalid data type of file: ' + inPath);
				else return done(error);
				done(null);
			});
		},
		// read csv file & parse csv to json 2d array
		function(done) {
			fs.readFile(inPath + '.csv', function(err, data) {
				if (err) done(err);
				jsonData = csv2rickshaw(data.toString('utf8'), isXts);
				done(null);
			});
		},
		// remove temporary csv file
		function (done) { fs.remove(inPath + '.csv', done); },
		// load JS & HTML template as strings
		function(done) {
			// check if xts or zoo template is needed and change path according to cases
			var templatePath;
			if (isXts){
				//templatePath = '/xtsTemplate.txt';
				templatePath = '/zooTemplate2.txt';
			} else {
				templatePath = '/zooTemplate2.txt';
			}

			fs.readFile(__dirname + templatePath, function(err, data){
				if (err) done(err);
				graphTemplate = data.toString('utf8');
				done(null);
			});

		}
	], function done(err) {
		if (err) return callback(err);


		//insert values into JS template
		//var addedValues = graphTemplate.replace('InsertValuesHere', JSON.stringify(jsonData)).replace('InsertTypeHere', type);
		var addedValues = graphTemplate.replace('InsertValueHere', JSON.stringify(jsonData));
		// save HTML
		fs.writeFile(outPath, addedValues, callback);
		callback(null);
	});
}

/**
 * @desc    parses a string containing CSV data to a format accepted by rickshaw.js
 * @param   csv data as String
 * @param   xts boolean which indicates if data is xts or zoo object. TRUE = xts, FALSE = zoo
 * @returns a rickshaw.js compatible json object
 */
 function csv2rickshaw(csv, xts) {
 	// convert csv string to 2d json array
 	var csvMatrix = [];
 	var lines = csv.split('\n');
 	lines.map(function(line) {
 		var lineArray = line.split(',');
 		csvMatrix.push(lineArray);
 	});

 	// convert the json "matrix" to a format compatible to rickshaw.js
 	// skip first column, as it contains the time index
 	// skip first row, as it contains the column names
 	var result = [];
 	if(xts){
		    for(var col = 1; col < csvMatrix[0].length; col++){
		    	var series = {label: String, data: []};
		    	series.label = csvMatrix[0][col].substring(1, csvMatrix[0][col].length-1);
		    	for(var row = 1; row < csvMatrix.length-1; row++){
		    		var time = moment(csvMatrix[row][0]);
		    		var milliseconds = time._d.getTime();
		    		var point = [milliseconds, parseFloat(csvMatrix[row][col])];
		    		series.data.push(point);
		    	}
		    	result.push(series);
		    }
		} else {
			for(var col = 1; col < csvMatrix[0].length; col++){
		    	var series = {label: String, data: []};
		    	series.label = csvMatrix[0][col].substring(1, csvMatrix[0][col].length-1);
		    	for(var row = 1; row < csvMatrix.length-1; row++){
		    		
		    		var point = [parseFloat(csvMatrix[row][0]), parseFloat(csvMatrix[row][col])];
		    		series.data.push(point);
		    	}
		    	result.push(series);
		    }
		}
 	return result;
 }
