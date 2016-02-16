"use strict";


/**
* @Desc calculates statistics for spatial data
* @Param unsorted, Array containing values [value1, value2, value3, ..]
* @Return stats, object containing statistics
*/
function stats(unsorted){
	console.log(unsorted);
	var sorted = unsorted.sort(function(a,b){return a-b});
	console.log(sorted);
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
	var sumsqr = 0;
	var min = sorted[0];
	var max = sorted[sorted.length-1];
	var quart;
	var half;
	var threeqrt;
	for(var i=0; i<sorted.length; i++){

		

		//calculating mean
		sum += sorted[i];

		//calculating variance
		sumsqr = sumsqr + Math.pow(sorted[i], 2);


	}

	//calculating quantiles
		//25%
		quart = parseInt(sorted.length * 0.25);
		//50%
		half = parseInt(sorted.length * 0.5);
		//75%
		threeqrt = parseInt(sorted.length * 0.75);



	//set mean
	var mean = sum/sorted.length;
	stats.mean = mean.toFixed(2);

	//set variance
	console.log(sorted.length);
	var variance = (sumsqr/sorted.length) - Math.pow(stats.mean, 2);
	stats.variance = variance.toFixed(2);

	//set standardDev
	stats.standardDev = Math.sqrt(stats.variance).toFixed(2);

	//set quantiles
	stats.quantiles.quarter = sorted[quart].toFixed(2);
	stats.quantiles.half = sorted[half].toFixed(2);
	stats.quantiles.threequarter = sorted[threeqrt].toFixed(2);



	//set min
	stats.min = min.toFixed(2);
	//set max
	stats.max = max.toFixed(2);

	// return
	console.log(sorted);
	return stats;
}


/**
* @Desc counts number of appearance of given data
* @Param unsorted, Array [value1, value2, value3, ...]
* @Return histData, Array of Arrays, containing each value and its number of appearance
*/
function prepareHisto(unsorted){
	var sorted = unsorted.sort(function(a,b){return a-b});
	var histData = [];//create new Array with number of appearance of sorted values
	histData.push([sorted[0], 1]);
	
	for (var j=0; j < sorted.length-1; j++){
		if(sorted[j] == sorted[j+1]){
			histData[histData.length-1][1] += 1;
		} else {
			histData.push([sorted[j+1], 1]);

		}
	}
	
	return histData;
}


