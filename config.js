"use strict";

/**
 * @desc general configuration options for the server
 */

var config = {};

config.httpPort = 8080;
config.dbPort   = 27017;
config.dbName   = 'paper_hub_dev';
config.dataDir  = { path: __dirname + '/data' };    // the directory where publications will be stored
config.uploadDir = __dirname + '/upload_tmp';
config.dataDir.widgets = config.dataDir.path + '/widgets';
config.dataDir.papers  = config.dataDir.path + '/papers';

module.exports = config;