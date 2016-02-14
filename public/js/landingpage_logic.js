'use strict';

$(document).ready(function() {

	// load the available papers and fill the table
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: '/getPaperList',
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


	/**
	 * @desc delete validation hints and input when cancel button is pressed
	 */
	$('#cancelButton').on('click', function(){ //todo tuts nicht, einfache lösung unten alles reinkopieren
		$('#latexDocument').css('background-color', 'white').val('');
		$('#files').val('');
		$('#title').css('background-color', 'white').val('');
		$('#abstract').val('');
		$('#author').css('background-color', 'white').val('');
		$('#errorMessage').css('display', 'none');
	});

});


/**
 * @desc Form validation for the uploadModal: tests if latex-upload, title or author is empty and shows a warning message
 * @desc escape htmlCode in the textfields (title, author, abstract)
 */
function validateForm() {
	var latexDocumentValue = document.forms["form"]["latexDocument"].value;
	var titleValue = document.forms["form"]["title"].value;
	var authorValue = document.forms["form"]["author"].value;
	var abstractValue = document.forms["form"]["abstract"].value;
    var showErrorMessage = false;
	if (latexDocumentValue == null || latexDocumentValue.trim() == "") {
		$('#latexDocument').css('background-color', 'rgba(229, 0, 0, 0.3)');
        showErrorMessage = true;
	} else {
        $('#latexDocument').css('background-color', 'white');
    }
	if (titleValue == null || titleValue.trim() == "") {
		$('#title').css('background-color', 'rgba(229, 0, 0, 0.3)');
        showErrorMessage = true;
	} else {
        $('#title').css('background-color', 'white');
    }
	if (authorValue == null || authorValue.trim() == "") {
		$('#author').css('background-color', 'rgba(229, 0, 0, 0.3)');
        showErrorMessage = true;
	} else {
        $('#author').css('background-color', 'white');
    }
	if (showErrorMessage) {
        $('#errorMessage').css('display', 'block');
        return false;
	} else {
        // show success message and hide errorMessage if all reqired fields are filled
        $('#errorMessage').css('display', 'none');
        $('#successMessage').css('display', 'block');

		$('#cancelButton').css('display', 'none');
		$('#submitButton').css('display', 'none');

		// escape htmlCode in the textFields
        document.forms["form"]["title"].value = escapeHtml(titleValue);
        document.forms["form"]["author"].value = escapeHtml(authorValue);
        document.forms["form"]["abstract"].value = escapeHtml(abstractValue);
        return true;
    }
}

/*
 * @task: Replace tokens to avoid damaging html
 */
function escapeHtml(string) {
    var entityMap = {
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    return String(string).replace(/[<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}

/**
 * @desc  loads the given paper page, when a tablerow was clicked
 * @param tablerow from the paper-table
 */
function loadPaper(tablerow) {
	window.location = '/paper/' + $(tablerow).data('id');
}

/**
 * @desc prevent second scrollbar while uploadModal is shown
 */
onhashchange = function() {
	var newHash = window.location.hash;
	if (newHash == '#openLoginModal' || '#openUploadModal') {
		$('body').css('overflow', 'hidden');
	}
	if (newHash == '#close') {
		$('body').css('overflow', '');
	}
};