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
