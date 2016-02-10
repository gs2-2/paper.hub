/*
	Styling Javascript for paper iframes	
*/
	
	
$( document ).ready(function() {
	
	// Attach font as stylesheet
    $('head').append('<link href="//fonts.googleapis.com/css?family=Raleway:400,300,600" rel="stylesheet" type="text/css">');
	
	$("body").css({'font-family':'"Raleway", "HelveticaNeue", "Helvetica Neue", Helvetica, Arial, sans-serif'});
	
	// Don't show Errors
    $(".ltx_ERROR").css("display","none");

	// Center tables
    $(".ltx_tabular").css("margin-left","auto");
    $(".ltx_tabular").css("margin-right","auto");
    
    // Remove MathML Error if MathJax is unable to fix it
    $("merror").remove(".ltx_ERROR");
    
    // Remove footer
    $("footer").css("display","none");
    
    // Align text in paragraphs
    $(".ltx_p").css("text-indent","0");
    $(".ltx_p").css("text-align","justify");
    
    // Making big images not overflow the iframe
    $("img").css("max-width","100%");
    $("img").css("height","auto");
    
    // Remove scroll bar if any
	$("body").css("overflow","hidden");

    $.each(['widget'], function(i, classname) {

        var $elements = $('.' + classname);

        $elements.each(function() {
            new Waypoint({
                element: this,
                handler: function(direction) {
                    var srcValue = $(this.element).attr('src');

                    $(this.element).attr('src', '/data/widgets/' + srcValue + '.html');
                    this.disable();
                },
                offset: '150%',
                context: window.parent,
                group: classname
            });
        });  
    })
	    
});
