/*
BASIC ROUTES EXAMPLE

This file should give you an idea of how to get started
 */

bind('load', window, function() {

	//get the page div
	var page = document.getElementById('page');

	//setup the routes
	
	//home route
	OriginJS.bind('/', function() {
		
		//load the home content
		page.innerHTML = '<h2>Home</h2><p>This is an example of OriginJS routing. You may use it to learn how to effectively use the library.</p><p>OriginJS is available on <a href="http://github.com/RobertWHurst/OriginJS" target="_blank">GitHub</a></p>';
	});
	
	//about route
	OriginJS.bind('/about', function() {
		
		//load the about content
		page.innerHTML = '<h2>About</h2><p>OriginJS is am awesome client slide router. It\'s lightweight, easy to use, and has a lot of very powerful features. If your building a single page application, and javascript game, or anything else heavy in javascript, OriginJS will make your application more accessable and might even help you code in a more organized way.</p>';
	});
	
	//contact route
	OriginJS.bind('/contact', function() {
		
		//load the contact content
		page.innerHTML = '<h2>Contact</h2><p>If you find any issues or you have a request regarding OriginJS please post an issue on the <a href="http://github.com/RobertWHurst/OriginJS/issues" target="_blank">issue tracker</a>.</p>';
	});

	OriginJS.bind('/.', function() {
		console.log('cascade!');
	});

});


//DO NOT USE IN YOUR PROJECT!
//This is pollyfill for binding to the load event in ms's old browsers (not needed for oigin)
function bind(eventName, element, callback) {if(element.addEventListener){element.addEventListener(eventName,callback,false);}else{element.attachEvent("on"+eventName,function(event){return callback.call(element,event);});}}
