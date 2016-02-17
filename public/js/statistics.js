"use strict";


/**
* @Desc calculates statistics for spatial data
* @Param unsorted, Array containing values [value1, value2, value3, ..]
* @Return stats, object containing statistics
*/
function stats(unsorted){
	//var sorted = unsorted.sort(function(a,b){return a-b});
	var sorted = unsorted.slice(0);
	sorted.sort(function(a,b){return a-b});
	var stats = {
		mean: 0.0,
		variance: 0.0,
		standardDev: 0.0,
		quantiles: {
			quarter: 0.0,
			half: 0.0,
			threequarter: 0.0
		},
		min: 0.0,
		max: 0.0 
	};

	var sum = 0;
	var min = sorted[0];
	var max = sorted[sorted.length-1];
	var quart;
	var half;
	var threeqrt;
    // calc sum of all values (for the mean)
	for(var j=0; j < sorted.length; j++){
		sum += sorted[j];
	}

	//calculating quantiles
    quart = parseInt(sorted.length * 0.25);
    half = parseInt(sorted.length * 0.5);
    threeqrt = parseInt(sorted.length * 0.75);

	//set mean
	var mean = sum/sorted.length;
	stats.mean = mean.toFixed(2);

	var	i = sorted.length, variance = 0;
 
	while( i-- ){
		variance += Math.pow( (sorted[i] - mean), 2 );
	}
	variance /= sorted.length;

	//set variance & standard deviation
	stats.variance = variance.toFixed(2);
	stats.standardDev = Math.sqrt(stats.variance).toFixed(2);

	//set quantiles
	stats.quantiles.quarter = sorted[quart].toFixed(2);
	stats.quantiles.half = sorted[half].toFixed(2);
	stats.quantiles.threequarter = sorted[threeqrt].toFixed(2);
    
	stats.min = min.toFixed(2);
	stats.max = max.toFixed(2);

	return stats;
}


/**
* @Desc counts number of appearance of given data
* @Param unsorted, Array [value1, value2, value3, ...]
* @Return histData, Array of Arrays, containing each value and its number of appearance
*/
function prepareHisto(unsorted){
	var sorted = unsorted.slice();
    sorted.sort(function(a,b){return a-b;});
    var min = sorted[0];
    var max = sorted[sorted.length - 1];
    var intervals = new Array(20);
    var intervalSize = ((max - min) + 1) / intervals.length;
    
    for (var i = 0; i < intervals.length; i ++) {
        var intervalMin = min + i * intervalSize;
        var intervalMax = min + (i+1) * intervalSize;
        intervals[i] = [intervalMin, 0];
        
        for(var j = sorted.length - 1; j > 0; j--) {
            if (sorted[j] < intervalMax && sorted[j] >= intervalMin) {
                intervals[i][1] = intervals[i][1] +  1;
            }
        }
    }

	return intervals;
}


