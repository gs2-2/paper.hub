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
 * @desc Form validation for the uploadModal
 */
function validateForm() {
	var latexDocumentValue = document.forms["form"]["latexDocument"].value;
	var titleValue = document.forms["form"]["title"].value;
	var authorValue = document.forms["form"]["author"].value;
    var error = false;
	if (latexDocumentValue == null || latexDocumentValue.trim() == "") {
		$('#latexDocument').css('background-color', 'rgba(229, 0, 0, 0.3)');
        error=true;
	} else {
        $('#latexDocument').css('background-color', 'white');
    }
	if (titleValue == null || titleValue.trim() == "") {
		$('#title').css('background-color', 'rgba(229, 0, 0, 0.3)');
        error=true;
	} else {
        $('#title').css('background-color', 'white');
    }
	if (authorValue == null || authorValue.trim() == "") {
		$('#author').css('background-color', 'rgba(229, 0, 0, 0.3)');
        error=true;
	} else {
        $('#author').css('background-color', 'white');
    }
	if (error) {
        $('#errorMessage').css('display', 'block');
        return false;
	} else {
        $('#errorMessage').css('display', 'none');
        $('#successMessage').css('display', 'block'); //todo: testen
    }
}

/**
 * @desc delete validation hints and input when cancel button is pressed
 */
$('#cancelButton').click(function(){
    $('#latexDocument').css('background-color', 'white').val('');
    $('#files').val('');
    $('#title').css('background-color', 'white').val('');
    $('#abstract').val('');
    $('#author').css('background-color', 'white').val('');
    $('#errorMessage').css('display', 'none');
});

/**
 * @desc  loads the given paper page, when a tablerow was clicked
 * @param tablerow from the paper-table
 */
function loadPaper(tablerow) {
	var url = 'http://' + window.location.host + '/paper.html?id=';
	window.location = url + $(tablerow).data('id');
}

/* Upload-button with nice style, but without upload info
$(document).ready(function(){
	$('#latexDocument').before('<input type="button" id="button-file" value="Datei Upload" />');
	$('#latexDocument').hide();
	$('body').on('click', '#button-file', function() {
		$('#latexDocument').trigger('click');
	});
});*/