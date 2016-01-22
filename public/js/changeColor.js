/**
* @desc Change the color of a timeseries, based on rickshaw.
*/

var colorControls = function(args) {

	//initialize the new graph (with updated colors)
	this.initialize = function() {

		//save the parameters given to the function
		this.element = args.element;
		this.graph = args.graph;
		this.settings = this.serialize();

		//define three selectable color-schemes, form rickshaw
		var munin = new Rickshaw.Color.Palette({scheme: 'munin'});
		var colorwheel = new Rickshaw.Color.Palette({scheme: 'colorwheel'});
		var spectrum14 = new Rickshaw.Color.Palette({scheme: 'spectrum14'});

		//save the input form the form in HTML
		this.inputs = {
			color: this.element.elements.color
		};

		//eventlistener for changes in the form 
		this.element.addEventListener('change', function(e) {
			//save the current selected color
			this.settings = this.serialize();

			if(e.target.name == 'color') {
				this.setDefaultColor(e.target.value);
			}

			this.settings = this.serialize();

			//set the config for the updated series
			var config = {
				series: content.series
			};
			//check the selected color for changing it to:
			if(this.settings.color == 'Colorwheel') {

				/* iterate over all timeseries */
				for(var j=0; j<content.series.length; j++){

					/* set color for each timeseries to colorwheel*/
					config.series[j]["color"] = colorwheel.color();
				};
			}
			else if(this.settings.color == 'Munin') {
				/* iterate over all timeseries to munin */
				for(var j=0; j<content.series.length; j++){

					/* set color for each timeseries */
					config.series[j]["color"] = munin.color();
				};
			}
			else if(this.settings.color == 'Spectrum14') {
				/* iterate over all timeseries to spectrum14*/
				for(var j=0; j<content.series.length; j++){

					/* set color for each timeseries */
					config.series[j]["color"] = spectrum14.color();
				};
			}
			//configure the graph with the new color
			this.graph.configure(config);
			//and render it
			this.graph.render();
		}.bind(this), false);
	};

	//function to save the selected color 
	this.serialize = function() {

		var values = {};
		var pairs = $(this.element).serializeArray();
		//save the values form the HTML-form
		pairs.forEach(function(pair) {
			values[pair.name] = pair.value;
		});
		//and return them
		return values;
	};

	//set the input as checked for newly selected colors, after the graph is updated
	this.setDefaultColor = function(color) {
		var options = this.colorOptions[color];

		if(options) {
			Array.prototype.forEach.call(this.inputs.color, function(input) {
				if(input.value == options.color) {
					input.checked = true;
				}
				else {
					input.checked = false;
				}
			}.bind(this));
		}
	};
	//give the three options, that can be chosen as colors
	this.colorOptions = {
		colorwheel,
		munin,
		spectrum14
	};
	this.initialize();
};