'use strict';


/**
 * @desc fit the size of the paperFrame
 * @param id
 */


function autoResize(id){
    var newheight;
    if(document.getElementById){
        newheight = document.getElementById(id).contentWindow.document .body.scrollHeight;
    }
    document.getElementById(id).height = (newheight) + "px";
}
