"use strict";

/**
 * @desc general configuration options for the server
 */

var config = {};

config.hostname = '127.0.0.1'; // development value! should be something along 'require('os').hostname();'
config.httpPort = 8080;
config.dbAddress = '127.0.0.1:27017';
config.dbName   = 'paper_hub_dev';
config.dataDir  = { path: __dirname + '/data' };    // the directory where publications will be stored
config.dataDir.widgets = config.dataDir.path + '/widgets';
config.dataDir.papers  = config.dataDir.path + '/papers';

module.exports = config;
