"use strict";

/**
 * @desc general configuration options for the server
 */

var config = {};

config.hostname = '127.0.0.1';
config.httpPort = 8080;
config.httpsPort = 8443;
config.enableHttps = true; // setting this to false is unsafe, but may be useful for testing purposes
config.dbAddress = '127.0.0.1:27017';
config.dbName = 'paper_hub';
config.dataDir = { path: __dirname + '/data' };
config.uploadDir = __dirname + '/upload_tmp';
config.dataDir.widgets = config.dataDir.path + '/widgets';
config.dataDir.papers  = config.dataDir.path + '/papers';

module.exports = config;
