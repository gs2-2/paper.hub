'use strict';

$(document).ready(function() {

	// load the available papers and fill the table
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: 'http://' + window.location.host + '/getPaperList',
		success: function(papers, textStatus) {
			// fill the table with publications
			for (var i = 0; i < papers.length; i++) {
				var rowHtml = '<tr onclick="loadPaper(this)" data-id="'
					+ papers[i]._id + '"><td>'
					+ papers[i].title + '</td><td>'
					+ papers[i].author + '</td><td>'
					+ papers[i].publicationDate + '</td><tr>';
				$('#paper-table').append(rowHtml);
			}
			if (papers.length === 0) {
// 				$('#paper-table').append('<tr><td>No Papers uploaded yet. Please create one first!</td></tr>');
// 				Alternativ, falls Button zum Upload direkt auf der Startseite angezeigt werden soll. Öffnet dann ein Modal was in der index.html auskommentiert ist.
				$('#paper-table').append('<tr><td>No Papers uploaded yet. Want to create one? <a class="button" href="#openUploadModal">Upload new paper</a></td></tr>');
			}
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('%s: unable to get list of papers: %s',
				textStatus, errorThrown);
		}
	});

});

/**
 * @desc  loads the given paper page, when a tablerow was clicked
 * @param tablerow from the paper-table
 */
function loadPaper(tablerow) {
	var url = 'http://' + window.location.host + '/paper.html?id=';
	window.location = url + $(tablerow).data('id');
}

