"use strict";

/**
 * @desc general configuration options for the server
 */

var config = {};

config.hostname = '127.0.0.1'; // development value! should be something along 'require('os').hostname();'
config.httpPort = 8080;
config.httpsPort = 8443;
config.enableHttps = true;     // setting this to false is unsafe, but may be useful for testing purposes
config.dbAddress = '127.0.0.1:27017';
config.dbName   = 'paper_hub_dev';
config.dataDir  = { path: __dirname + '/data' };    // the directory where publications will be stored
config.uploadDir = __dirname + '/upload_tmp';
config.dataDir.widgets = config.dataDir.path + '/widgets';
config.dataDir.papers  = config.dataDir.path + '/papers';

module.exports = config;
