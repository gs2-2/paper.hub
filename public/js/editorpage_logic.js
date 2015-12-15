"use strict";

/**
 * @desc fit the height of the paperFrame to its inner dimensions
 * @param id
 */
function autoResize(id){
	var newHeight;
	if(document.getElementById){
		newHeight = document.getElementById(id).contentWindow.document.body.scrollHeight;
	}
	document.getElementById(id).height = (newHeight) + "px";
}
