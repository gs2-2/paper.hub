"use strict";

// get the paperid from the URL query (slice(4) for '?id=')
var paperID = window.location.pathname.split('/').pop();

$(document).ready(function() {
	// load the paper into the iframe
	var paperHtmlUrl = '/data/papers/' + paperID + '/html/' + paperID + '.html';
	$('#paper-frame').attr('src', paperHtmlUrl);

	// load the paper metadata
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: '/getPaperMetadata/' + paperID,
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
});

/**
 * @desc fit the height of the paperFrame to its inner dimensions
 * @param iframe: the iframe dom object
 */
function iframeResize(iframe){
	// add 30 to compensate for an horizontal scrollbar
	iframe.height = (100 + iframe.contentWindow.document.body.scrollHeight) + "px";
}

/**
 * @desc redirects to a download package
 */
function downloadPaper() {
	window.open('/downloadPaper/' + paperID);
}

$('#paper-frame').ready(function() {
	var elements = $('paper-frame').find('widget');
	console.log(elements);

	$.each(elements, function(index, element) {
		console.log('in each');
		new Waypoint({
			element: this,
			handler: function(direction) {
				var previousWaypoint = this.previous();
				var nextWaypoint = this.next();
				var srcValue = $(this.element).getAttribute('src')
				console.log(srcValue);

				console.log(this.element.src);
				$(this.element).attr('src', '/data/widgets/' + srcValue + '.html');
				console.log(this.element.src);

				if(nextWaypoint) {
					$(nextWaypoint.element).attr('src', 'data/widgets/' + nextWaypoint.element.getAttribute('src') + '.html');
				}
			},
			offset: '30%',
			context: $('#paper-frame')
		});
	});
})
