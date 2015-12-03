"use strict";

var mkdirp = require('mkdirp');
var async  = require('async');

/**
 * @desc various utility functions needed by the server
 */

/**
 * @desc  checks if a path exists, and creates it if not
 * @param path:     String or Array of Strings of path(s) to create
 * @param callback: node style callback
 */
exports.createPath = function(path, callback) {
	if (path instanceof Array)
		async.map(path, mkdirp, callback);
	else
		mkdirp(path, callback);
};

/**
 * @desc  creates the necessary paths for a new paper
 * @param parentPath: String path to parent of the new paper (eg. /data/papers/)
 * @param UID:        String of the new paper
 * @param callback:   node style callback
 */
exports.newPaperDir = function(parentPath, UID, callback) {
	var paths = [
		parentPath + '/' + UID + '/tex',
		parentPath + '/' + UID + '/html',
		parentPath + '/' + UID + '/datasets'
	];
	exports.createPath(paths, callback);
}