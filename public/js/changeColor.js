/**
* @desc Change the color of a timeseries.
*/

var colorControls = function(args) {

	//initialize the new graph (with updated colors)
	this.initialize = function() {

		//save the parameters given to the function
		this.element = args.element;
		this.plot = args.plot;
		this.options = args.options;
		this.data = args.data;
		this.settings = this.serialize();

		//define three selectable color-schemes, form rickshaw exmaple page
		var munin = [
			'#00cc00',
			'#0066b3',
			'#ff8000',
			'#ffcc00',
			'#330099',
			'#990099',
			'#ccff00',
			'#ff0000',
			'#808080',
			'#008f00',
			'#00487d',
			'#b35a00',
			'#b38f00',
			'#6b006b',
			'#8fb300',
			'#b30000',
			'#bebebe',
			'#80ff80',
			'#80c9ff',
			'#ffc080',
			'#ffe680',
			'#aa80ff',
			'#ee00cc',
			'#ff8080',
			'#666600',
			'#ffbfff',
			'#00ffcc',
			'#cc6699',
			'#999900'
		];

		var colorwheel = [
			'#b5b6a9',
			'#858772',
			'#785f43',
			'#96557e',
			'#4682b4',
			'#65b9ac',
			'#73c03a',
			'#cb513a'
		].reverse();

		var spectrum14 = [
			'#ecb796',
			'#dc8f70',
			'#b2a470',
			'#92875a',
			'#716c49',
			'#d2ed82',
			'#bbe468',
			'#a1d05d',
			'#e7cbe6',
			'#d8aad6',
			'#a888c2',
			'#9dc2d3',
			'#649eb9',
			'#387aa3'
		].reverse();
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

			//check the selected color for changing it to:
			if(this.settings.color == 'Colorwheel') {

				//set the config for the updated series
				this.options.colors = colorwheel;
			}
			else if(this.settings.color == 'Munin') {
				
				//set the config for the updated series
				this.options.colors = munin;
			}
			else if(this.settings.color == 'Spectrum14') {
				
				//set the config for the updated series
				this.options.colors = spectrum14;
			}
			this.plot = $.plot('#placeholder', this.data, this.options);
			this.plot.setupGrid();
			this.plot.draw();
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