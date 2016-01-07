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
					+ papers[i].publicationDate.substr(0, 10) + '</td><tr>';
				$('#paper-table').append(rowHtml);
			}
			if (papers.length === 0) {
				$('#paper-table').append('<tr><td>No Papers uploaded yet. Please log in to create one!</td></tr>');
			}
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error('%s: unable to get list of papers: %s',
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
				// add an "add paper" button
				$('#login-btn').after('<a id="addpaper-btn"'
					+ 'class="button" href="#openUploadModal">Add Paper</a>');
			}
		}
	});

});

/**
 * @desc  loads the given paper page, when a tablerow was clicked
 * @param tablerow from the paper-table
 */
function loadPaper(tablerow) {
	var url = 'http://' + window.location.host + '/paper/';
	window.location = url + $(tablerow).data('id');
}
