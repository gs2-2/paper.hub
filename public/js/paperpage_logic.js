"use strict";

// get the paperid from the URL query (slice(4) for '?id=')
var paperID = window.location.search.slice(4);

$(document).ready(function() {
	// load the paper into the iframe
	var paperHtmlUrl = '/data/papers/' + paperID + '/html/' + paperID + '.html';
	$('#paper-frame').attr('src', paperHtmlUrl);

	// load the paper metadata
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: 'http://' + window.location.host + '/getPaperMetadata?id=' + paperID,
		success: function(paper, textStatus) {
			$('#title').text(paper.title);
			$('#author').text('by ' + paper.author);
			$('#pubdate').text('published on ' + paper.publicationDate);
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('%s: unable to get paper data: %s',
				textStatus, errorThrown);
		}
	});

	// check if user is logged in
	$.ajax({
		type: 'GET',
		url: '/getAuthStatus',
		success: function(data) {
			console.log(data);
			if(data === 'Auth successful'){
				// transform the loginbutton to an "logout" button
				$('#login-btn').text('Log Out');
				$('#login-btn').attr('href', '/logout');
			}
		}
	});

});

/**
 * @desc fit the height of the paperFrame to its inner dimensions
 * @param iframe: the iframe dom object
 */
function iframeResize(iframe){
	iframe.height = iframe.contentWindow.document.body.scrollHeight + "px";
}

/**
 * @desc redirects to a download package
 */
function downloadPaper() {
	var url = 'http://' + window.location.host + '/downloadPaper?id=';
	window.open(url + paperID);
}
