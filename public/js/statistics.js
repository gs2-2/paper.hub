"use strict";
//Histogramm



/**
* @Desc calculates statistics of one series (time)
* @Param sorted, Array of Arrays containing x and y values sorted by y value [[y,x], [y,x], .. ]
* @Return stats, object containing all calculated statistics of one series (time)
*/
function statsTime (unsorted){
	console.log(unsorted);
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
	var sorted = [];
	var min = unsorted[0][1];
	var max = unsorted[0][1];
	var quart;
	var half;
	var threeqrt;
	for(var i=0; i<unsorted.length; i++){

		//sorting array
		sorted.push([0,0]);
		sorted[i][0] = unsorted[i][1];
		sorted[i][1] = unsorted[i][0];

		//calculating mean
		sum += sorted[i][0];

		//calculating variance
		sumsqr = sumsqr + Math.pow(sorted[i][0], 2);

		//calculating min
		if (sorted[i][0] < min) min = sorted[i][0];

		//calculating max
		if (sorted[i][0] > max) max = sorted[i][0];

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
	stats.quantiles.quarter = sorted[quart][0].toFixed(2);
	stats.quantiles.half = sorted[half][0].toFixed(2);
	stats.quantiles.threequarter = sorted[threeqrt][0].toFixed(2);



	//set min
	stats.min = min.toFixed(2);
	//set max
	stats.max = max.toFixed(2);

	// return
	console.log(sorted);
	return stats;
}


/**
* @Desc sorts data by y-value, switches x and y value
* @Param unsorted, Array of Arrays containing x and y values [[x,y],[x,y], .. ]
* @Return unsorted, Array of Arrays sorted by y values [[y,x], [y,x], .. ]
*/
function sortIt(unsorted){
	// sort by y-value
	for (var n = unsorted.length; n>1; n=n-1){
		for (var i=0; i<n-1; i++){
			//sorted.push([0,0]);
			//if first item is bigger than second item, switch position
			if(unsorted[i][1] > unsorted[i+1][1]){

				//switching positions
				var tmp = unsorted[i][1];
				unsorted[i][1] = unsorted[i+1][1];
				unsorted[i+1][1] = tmp;

			}
		}
	}

	return unsorted;
}


/**
* @Desc counts number of appearance of given data
* @Param sorted, Array of Arrays, sorted by x-values
* @Return histData, Array of Arrays, containing each value and its number of appearance
*/
function prepareHistoTime(sorted){
	var histData = [];//create new Array with number of appearance of sorted values
	histData.push(sorted[0]);
	histData[0][1] = 1;
	for (var j=1; j < sorted.length; j++){
		if(sorted[j][0] == sorted[j-1][0]){
			histData[histData.length-1][0] += 1;
		} else {
			histData.push(sorted[j]);
			sorted[j][1] = 1;
		}
	}
	
	return histData;
}



/**
* @Desc calculates statistics for spatial data
* @Param unsorted, Array containing values [value1, value2, value3, ..]
* @Return stats, object containing statistics
*/
function statsSpatial (unsorted){
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
		sumsqr = sumsqr + Math.pow(sorted[i][0], 2);


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
function prepareHistoSpatial(unsorted){
	var sorted = unsorted.sort(function(a,b){return a-b});
	var histData = [];//create new Array with number of appearance of sorted values
	histData.push([sorted[0], 1]);
	histData[0][1] = 1;
	for (var j=1; j < sorted.length; j++){
		if(sorted[j][0] == sorted[j-1][0]){
			histData[histData.length-1][0] += 1;
		} else {
			histData.push(sorted[j]);
			sorted[j][1] = 1;
		}
	}
	
	return histData;
}