'use strict';

var paperID, paperFrame;

$(document).ready(function() {
	paperID    = window.location.pathname.split('/').pop();
	paperFrame = document.getElementById('paper-frame');

	// load the paper into the iframe
	$(paperFrame).attr('src', '/data/papers/' + paperID + '/html/' + paperID + '.html');
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
		// bind submit handler to form & prevent native submit
		$(form).on('submit', function(e) {
			e.preventDefault();
			$(this).ajaxSubmit();
		});
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
			.click(function() { $(this).parent().parent().remove(); })
			.appendTo(form);

		// finally append the placeholder after the clicked <p>
		$(this).after(div); // 'this' is the element clicked on

		// increase paper iframe height accordingly
		iframeResize(paperFrame);
	}
}

/**
 * @desc replaces the visualization selector elements with iframes pointing to the visualizations
 */
function uploadDatasets() {
	// iterate over all visualization placeholders in the iframe and submit them using ajax
	var forms = paperFrame.contentWindow.document.forms,
		widgetIDs = [];

	// validation
	var valid = true;
	for(var form=0;form<forms.length;form++){
		var val = forms[form].elements[1].value;
		if (val == ""){
			$(forms[form]).css('background-color', '#CD5C5C');
			valid = false;
		} else {
			$(forms[form]).css('background-color', '#EEE');
		}
	}
	if(valid == false){
		alert('Please select a dataset in each upload-form.');
		return false; // validation not successful
	}else{
		// validation successful
		// submit all form using ajax, one by one
		async.eachSeries(forms, function(form, done) {
			$(form).ajaxSubmit({
				success: function(id, status) {
					if (status != 'success') return done(status);
					widgetIDs.push(id);
					done(null);
					console.log('done');
				},
				error: done,
				data: { publication: paperID },
				dataType: 'json',
				type: 'POST',
				url: '/addDataset'
			});

		}, function(err) {
			if (err) return console.error('couldnt upload all datasets: %s', JSON.stringify(err));

			// replace each .vis-selector with an iframe pointing to the newly created widget
			while (forms.length != 0) {
				var i = forms.length - 1;
				var id = widgetIDs[i];
				var div = $(forms[i].parentElement);

				div.replaceWith('<iframe style="margin-top: 15px" width="100%" height="420px" src="'
					+ '/data/widgets/' + id + '.html"></iframe>'
						// add a caption below the visualisation
					+ '<div style="margin-left: 60px; margin-bottom: 15px">'
					+ $(forms[i]).find('input[name="caption"]').fieldValue()[0] + '</div>');
			}

			// remove added style on paragraphs
			$(paperFrame).contents().find('.ltx_para')
				.css('cursor', '')
				.css('user-select', '');

			// get html of iframe & post it to server
			var paperHTML = $('#paper-frame').contents().find('html').html();
			$.post('/updatePaperHTML/' + paperID, { html: paperHTML }, function(data, status) {
				if (status == 'success') window.location = '/paper/' + paperID;
			});
		});
	}
}