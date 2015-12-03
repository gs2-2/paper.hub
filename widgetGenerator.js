"use strict";

/**
 * @desc provides an interface to R scripts, which create HTML widgets (maps, graphs)
 */

var cp = require('child_process');

/**
 * @desc  generates an interactive map in an html file for the specified GeoTIFF
 * @param inPath   absolute path to the image geotiff file
 * @param outPath  absolute path to the output html file
 * @param callback function that is called after execution of the script with param 'error'
 */
function TIFF2Map(inPath, outPath, callback) {
	var scriptPath = __dirname + '/bin/TIFF2Map.r'

	cp.exec('Rscript ' + scriptPath + ' ' + inPath + ' ' + outPath,
		function (err, stdout, stderr) {
			if (err) return callback(err);
			callback(null);
		}
	);
}

/**
 * @desc  generates interactive time series graph in an html file based on .Rdata (zoo, xts)
 * @param inPath   absolute path to the .Rdata file
 * @param outPath  absolute path to the output html file
 * @param callback function that is called after execution of the script with param 'error'
 */
function R2Graph(inPath, outPath, title, filling, callback){
//	var cmd = 'Rscript ' + __dirname + '/bin/R2Graph.R'
//					+ ' --input \'' + inPath + '\' --output' + outPath + '\' --title' + title + '\' --filling' + filling;

	var cmd = 'Rscript ' + 'C:\\Users\\Jan\\paper.hub\\bin\\R2Graph.R'
					+ ' --args' + ' ' + inPath + ' ' + outPath + ' ' + title + ' ' + filling;

	//change cp.exec to fill parameters
	//
	//
	cp.exec(cmd, function(err, stdout, stderr){
		if (err) return callback(err);
		callback(null);
	});
}



exports.TIFF2Map = TIFF2Map;
exports.R2Graph = R2Graph;
