'use strict';

var paperID, paperFrame;
var showClosingMessage = "Data you have entered may not be saved.";

$(document).ready(function() {
	paperID    = window.location.pathname.split('/').pop();
	paperFrame = document.getElementById('paper-frame');

	// load the paper into the iframe
	$(paperFrame).attr('src', '/data/papers/' + paperID + '/html/' + paperID + '.html');

});

// Fit the size of the iframe when the whole content was loaded
$(window).load(function(){
	iframeResize(paperFrame);
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
	$(iframe).contents().find('.ltx_para').not('li > div')
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
		$('<p><b>Please choose what type of visualization you want to create.</b></p>')
			.css('margin-top', '0')
			.appendTo(form);
		$('<p>Accepted formats are GeoTIFF (<code>.tif</code>), GeoJSON ' + 
      '(<code>.json</code>) as well as R <code>SP-, zoo- & xts</code>' + 
      '-Objects (<code>.Rdata</code>). Please make sure the files have the ' + 
      'correct extensions.</p>').appendTo(form);
		$('<p>visualization type: <select name="type"><option>map</option>' + 
      '<option>timeseries</option></select></p>').appendTo(form);
		$('<p>dataset: <input name="dataset" type="file" accept=".tif,.tiff,' + 
      '.geojson,.json,.geojson,.Rdata"/></p>').appendTo(form);
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
	showClosingMessage = '';
	// iterate over all visualization placeholders in the iframe and submit them using ajax
	var forms = paperFrame.contentWindow.document.forms,
		widgetIDs = [],
        valid = true;

	// validation
	for(var form = 0; form < forms.length; form++) {
		var val = forms[form].elements[1].value; // value of file input
		if (val === ""){
			$(forms[form]).css('background-color', '#CD5C5C');
			valid = false;
		} else {
			$(forms[form]).css('background-color', '#EEE');
		}
	}
	if (!valid) {
		$('#message').addClass('error').html('Please select a dataset in each upload-form.');
	} else {
		// validation successful
        // insert loading symbol
        $('#message')
            .removeClass('error').addClass('success')
            .html('Please wait, data is being uploaded.<br>' + 
                  '<img src="/img/loadingSymbol.svg" alt="" height="35px" width="auto">');
        
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
			while (forms.length !== 0) {
				var i   = forms.length - 1,
				    id  = widgetIDs[i],
				    div = $(forms[i].parentElement);

				div.replaceWith('<iframe class="widget" style="margin-top:15px; border:none" width="100%"  height="500px" src="' + id + '"></iframe>' +
					// add a caption below the visualisation
					'<div style="margin-left: 60px; margin-bottom: 15px">' + 
				$(forms[i]).find('input[name="caption"]').fieldValue()[0] + '</div>');
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

/**
 * @desc delete the uploaded files (and redirect to the landingpage)
 */
function deleteFiles(){
	showClosingMessage = '';
	$.ajax({
		type: 'DELETE',
		url: '/deletePaper/' + paperID,
		success: function(res){
			window.location = "/";
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('%s: unable to get paper data: %s',
				textStatus, errorThrown);
		}
	});
}

/**
 * @desc show warning message if user wants to leave the page without submitting or pressing the correct cancel-button
 */
$(window).on('beforeunload', function() {
	if(showClosingMessage !== '')
		return showClosingMessage;
});