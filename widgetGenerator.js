"use strict";

/**
 * @desc provides an interface to R scripts, which create HTML widgets (maps, ..)
 */

var cp = require('child_process');

/**
 * @desc  generates an interactive map in an html file for the specified GeoTIFF
 * @param inPath  absolute path to the image file
 * @param outPath absolute path to the output html file
 */
function TIFF2Map(inPath, outPath) {
  var scriptPath = __dirname + '/bin/makeMapFromTIFF.r'

  RScript = cp.exec('Rscript ' + scriptPath + ' ' + inPath + ' ' + outPath,
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);

      if (error) return console.log('exec error: ' + error);
    }
  );
}

exports.TIFF2Map = TIFF2Map;
