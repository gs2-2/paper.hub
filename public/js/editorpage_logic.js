"use strict";

// get the paperid from the URL query
var paperID = window.location.pathname.split('/').pop();

$(document).ready(function() {
	// load the paper into the iframe
	var paperHtmlUrl = '/data/papers/' + paperID + '/html/' + paperID + '.html';
	$('#paper-frame').attr('src', paperHtmlUrl);
});

/**
 * @desc fit the height of the paperFrame to its inner dimensions
 * @param iframe: the iframe dom object
 */
function iframeResize(iframe){
	iframe.height = iframe.contentWindow.document.body.scrollHeight + "px";
}

/**
 * @desc delete the uploaded files (and redirect to the landingpage)
 */
function deleteFiles(){
	$.ajax({
		type: 'DELETE',
		url: '/deletePaperWhileEdit/' + paperID,
		success: function(res, bla){
			window.location = "/"
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('%s: unable to get paper data: %s',
				textStatus, errorThrown);
		}
	});
}