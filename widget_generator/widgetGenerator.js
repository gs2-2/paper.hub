"use strict";

/**
 * @desc provides an interface to R scripts, which create HTML widgets (map, timeseries)
 */

var cp = require('child_process');

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
 * @param inPaths  String absolute paths to the datasets
 * @param outPath  absolute path to the output HTML file
 * @param callback function that is called after execution of the script with param 'error'
 */
exports.timeseries = function (inPaths, outPath, callback) {

}
