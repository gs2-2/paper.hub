'use strict';

var paperID, paperFrame;

$(document).ready(function() {
	paperID    = window.location.pathname.split('/').pop();
	paperFrame = document.getElementById('paper-frame');

	// load the paper into the iframe
	$('#paper-frame').attr('src', '/data/papers/' + paperID + '/html/' + paperID + '.html');
});

/**
 * @desc fit the height of the paperFrame to its inner dimensions
 * @param iframe: the iframe dom object
 */
function iframeResize(iframe){
	// we need an extra 100px offset for some reason. probably the reduced page width (sidebar)
	iframe.height = (100 + iframe.contentWindow.document.body.scrollHeight) + "px";
}

/**
 * @desc   adds clicklisteners for
 * @param  iframe the iframe to modify
 */
function addClickListeners(iframe) {
	// internal counter of added visualizations, used for the element IDs
	var visualCounter = 0;

	// add click listeners to all paragraphs in the paper iframe
	$(iframe).contents().find('.ltx_para')
		.css('cursor', 'pointer')
		.css('user-select', 'none')
		.hover(
			function() { $(this).css('background-color', '#EEE'); },
			function() { $(this).css('background-color', 'transparent'); }
		)
		.click(insertVisSelector);

	/**
	 * @desc append a div containing a form, where a new visualization can be created
	 */
	function insertVisSelector() {
		// 'this' is the element clicked on

		var div = $('<div>')
			.addClass('visualization-selector')
			.attr('id', 'visual-' + visualCounter++)
			.css('margin-top', '15px')
			.css('margin-bottom', '15px')
			.css('padding', '20px')
			.css('border', '1px solid #E1E1E1')
			.css('border-radius', '4px')
			.css('background-color', '#EEE');
		var form = $('<form>').appendTo(div);
		$('<p><b>Please choose what type of visualization you want to create.</b></p>')
			.css('margin-top', '0')
			.appendTo(form);
		$('<p>Accepted formats are GeoTIFF (<code>.tif</code>), GeoJSON '
			+ '(<code>.json</code>) as well as R <code>SP-, zoo- & xts</code>'
			+ '-Objects (<code>.Rdata</code>). Please make sure the files have the '
			+ 'correct extensions.</p>').appendTo(form);
		$('<p>visualization type: <select name="type"><option>map</option>'
			+ '<option>timeseries</option></select></p>').appendTo(form);
		$('<p>dataset: <input name="dataset" type="file" accept=".tif,.tiff,'
			+ '.geojson,.json,.geojson,.Rdata"/></p>').appendTo(form);
		$('<p>optional caption: <input name="caption" type="text"/></p>').appendTo(form);
		$('<button type="button">remove this visualization</button>')
			.click(function() {
				// TODO: remove tablerow in sidebar
				$(this).parent().parent().remove(); // remove div
			})
			.appendTo(form);

		// finally append the placeholder after the clicked <p>
		$(this).after(div);

		// TODO: add tablerow to sidebar
		// $('#widget-list').append( ... );

		// increase paper iframe height accordingly
		iframeResize(paperFrame);
	}
}

/**
 * @desc replaces the visualization selector elements with iframes pointing to the visualizations
 */
function uploadDatasets() {
	// iterate over all visualization placeholders in the iframe and submit them using ajax
	var forms = paperFrame.contentWindow.document.forms;

	async.eachSeries(forms, function(form, done) {
		// TODO: validate form

		// TODO: submit form with this jquery addon, as this is the cleanest way of
		// submitting forms with fileinputs using ajax.
		// http://jquery.malsup.com/form/
		// return recieved ID to callback

	}, function(err, results) {
		if (err) return console.error('couldnt upload all datasets: %s', err);

		// replace each .vis-selector with an iframe pointing to the newly created widget
		for (var i = 0; i < forms.length; i++) {
			var id = results[i],
			    div = $(forms[i].parentElement);
			div.replaceWith('<iframe width="100%" height="300px" src="/data/widgets/'
				+ id + '.html"></iframe>');
		}

		// TODO: get html (only body?) of iframe & post it to server
		// paperFrame.contentWindow.document.body.outerHTML
	});
}
