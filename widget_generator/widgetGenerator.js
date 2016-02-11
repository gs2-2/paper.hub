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
exports.map = function (inPath, outPath, callback) {
    // choose a different R script for raster layers
    var rScript = '/makeMapWidget_vector.r';
    var fileExt = inPath.split('.').pop().toLowerCase();
    if(['tif', 'tiff', 'geotiff'].indexOf(fileExt) != -1)
        rScript = '/makeMapWidget_raster.r';

	var cmd = 'Rscript ' + __dirname + rScript
		+ ' --input ' + inPath + ' --output ' + outPath
        + ' --template ' + __dirname + '/mapTemplate.html';

	cp.exec(cmd, function (err, stdout, stderr) {
		if (err) return callback(err);
		callback(null);
	});
}
