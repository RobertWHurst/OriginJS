(function(factory) {

	if(typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		window.OriginJS = factory();
	}

})(function() {

	//abstractions because of ms's piece o' shit browsers
	function bind(eventName, element, callback) {if(element.addEventListener){element.addEventListener(eventName,callback,false);}else{element.attachEvent("on"+eventName,function(event){return callback.call(element,event);});}}
	function trigger(eventName, element) {var a;if(document.createEvent){a=document.createEvent("HTMLEvents");a.initEvent(eventName,true,true);}else{a=document.createEventObject();a.eventType=eventName;}if(document.createEvent){element.dispatchEvent(a);}else{element.fireEvent(a.eventType,a);}}

	//polyfills for ms's piece o' shit browsers
	[].indexOf||(Array.prototype.indexOf=function(a,b,c){for(c=this.length,b=(c+~~b)%c;b<c&&(!(b in this)||this[b]!==a);b++);return b^c?b:-1;});
	typeof window.onhashchange!=='undefined'||(function(){var a=location.hash;setInterval(function(){if(a!==location.hash){trigger('hashchange',window);a=location.hash;}},10);})();

	//vars
	var routes = [],
		lastRouteData = false,
		inReset = false,
		pointers;

	pointers = [];

	//bind to the has change event
	bind('hashchange', window, handleCurrentRoute);

	/**
	 * Reads the location hash and tries to find a follow a matching route
	 */
	function handleCurrentRoute() {
		var url, routeData, lRCI, rCI;

		//add the hash if it doesn't exist
		if (!location.hash) {
			location.hash = '/';
			return false;
		}

		if(inReset) {
			inReset = false;
			return false;
		}

		//trace the url
		url = trace(location.hash.substr(1));

		//get the route
		routeData = getRoute(url);

		//if there is still no route reset the hash if possible
		if(!routeData) {
			if(lastRouteData) {
				inReset = true;
				location.hash = '/' + lastRouteData.uriData.join('/');
			}
			return false;
		}

		//make sure the last route and the current route are not the same
		if(lastRouteData && routeData.route.url === lastRouteData.route.url) {
			return false;
		}

		//execute tear down callbacks
		if(lastRouteData) {
			for(lRCI = 0; lRCI < lastRouteData.route.tearDownCallbacks.length; lRCI += 1) {
				lastRouteData.route.tearDownCallbacks[lRCI](routeData.uriData, lastRouteData.uriData);
			}
		}

		//execute setup callbacks
		for(rCI = 0; rCI < routeData.route.setupCallbacks.length; rCI += 1) {
			routeData.route.setupCallbacks[rCI](routeData.uriData, lastRouteData.uriData);
		}

		//save the route as the last route
		lastRouteData = routeData;

		return true;

		/**
		 * Traces a pointer chain all the way to the end.
		 * NOTE: this will change the hash url if it finds a redirect pointer
		 * @param url
		 */
		function trace(url) {
			var pointerDepth;

			pointerDepth = 0;

			//contain recursion inside a closure
			return (function exec(url) {
				var pointer;

				//try and get a route and if that fails continue tracing the pointer
				if(getRoute(url, {
					"noCatchall": true
				})) { return url; }

				//try and get a matching pointer
				pointer = getPointer(url);

				//if we have a pointer
				if(pointer) {

					//iterate the depth
					pointerDepth += 1;

					//make sure the pointer depth is less than one hundred
					if(pointerDepth > 100) { throw new Error('Origin cannot follow "' + url + '" because it has no end point. Check your pointers for loops.') }

					//redirect hash url if pointer is a redirect
					if(pointer.type === 'redirect') {
						inReset = true;
						location.hash = pointer.url;
					}

					//try to trace the pointer's url and if that fails return the pointer url
					return exec(pointer.url) || pointer.url;

				} else {
					return url;
				}

			})(url);
		}
	}

	/**
	 * Converts a url to a uri array and cleans out garbage
	 * @param url
	 */
	function urlToUris(url) {
		var rawUris, uris, uI;

		if(typeof url !== 'string') { throw new Error('Cannot convert url to uris. Requires a valid url string.'); }
		rawUris = url.split('/');
		uris = [];

		//loop through the uris
		for(uI = 0; uI < rawUris.length; uI += 1) {
			if(rawUris[uI]) { uris.push(rawUris[uI]); }
		}

		return uris;
	}

	/**
	 * Converts an array of uris to a url and prepends a forward slash
	 * @param uris
	 */
	function urisToUrl(uris) {
		if(typeof uris !== 'object' && typeof uris.push === 'function') { throw new Error('Cannot convert uris to url. Requires a valid uris array.'); }
		return '/' + uris.join('/');
	}

	/**
	 * Uses urlToUris and urisToUrl to clean a url
	 * @param url
	 */
	function cleanUrl(url) {

		//convert the url into an array of uris and back again to normalize the url.
		return urisToUrl(urlToUris(url));
	}

	/**
	 * Finds a route that a target url matches then returns the route and uri data
	 * @param url
	 */
	function getRoute(url, rules) {
		var matchedRoute, sortedRoutes, rGI, sRGI,
			routeGroup, route, uriData, result,
			lastRouteScore, key;

		//validate the arguments
		if(typeof url !== 'string') { throw new Error('Cannot get route. Requires a valid route.'); }

		//clean the url
		url = cleanUrl(url);

		//convert the url to uris
		uriData = urlToUris(url);

		//flip the order of the routes object so its longest to shortest and filter out routes that are
		// longer than the target
		sortedRoutes = [];
		for(rGI = 0; rGI < routes.length; rGI += 1) {
			if(!routes[rGI]) { continue; }
			if(rGI > uriData.length) { break; }
			sortedRoutes.unshift(routes[rGI]);
		}

		//setup the setup the loop initial state of the loop variables
		matchedRoute = false;
		lastRouteScore = 0;

		//loop through each of the route groups
		for(sRGI = 0; sRGI < sortedRoutes.length; sRGI += 1) {

			//grab the group
			routeGroup = sortedRoutes[sRGI];

			//loop through each route in the current group
			for(rI = 0; rI < routeGroup.length; rI += 1) {

				//grab the route
				route = routeGroup[rI];

				//compare the route url to the target url
				result = compareUrls(url, route.url, rules);

				//attach data to the UriData array
				for(key in result.data) {
					if(!result.data.hasOwnProperty(key)) { continue; }
					uriData[key] = result.data[key];
				}

				if(result.score > lastRouteScore) {
					lastRouteScore = result.score;
					matchedRoute = route;
				}
			}
		}

		//return false if no route was returned
		if(!matchedRoute) { return false; }

		//return the matched route
		return {
			"route": matchedRoute,
			"uriData": uriData
		};
	}

	//MODEL     (target)    /cake/test
	//SUBJECT   (route)     /cake/:test

	function compareUrls(modelUrl, subjectUrl, rules) {
		var modelUris, subjectUris, score, tUI, subjectUri, modelUri, data;

		modelUris = urlToUris(modelUrl);
		subjectUris = urlToUris(subjectUrl);
		score = 0;
		data = {};

		if(typeof modelUrl !== 'string') { throw new Error('Cannot compare urls. Model url must be a string.'); }
		if(typeof subjectUrl !== 'string') { throw new Error('Cannot compare urls. Subject url must be a string.'); }
		if(typeof rules !== 'object') { rules = {}; }

		//handle root
		if(modelUris.length === 0 && subjectUris.length === 0) {
			score = 1;
		}

		//loop through the target uris and compare to the route urls counter part.
		for(tUI = 0; tUI < modelUris.length; tUI += 1) {

			//get both the route and the target uri
			subjectUri = subjectUris[tUI];
			modelUri = modelUris[tUI];

			//if the route doesn't have a corresponding uri then break out of the loop and check the next route
			if(!subjectUri) {
				score = 0;
				break;
			}

			//direct uri match
			if(subjectUri === modelUri) {
				if(!rules.noDirect) {
					score += 1000;
				}
			}

			//if dynamic uri match
			else if(subjectUri.substr(0, 1) === ':') {
				if(!rules.noDynamic) {
					score += 100;
				}

				//save the route uri as the key and the target uri as the value for the callback
				data[subjectUri.substr(1)] = modelUri;
			}

			//if wild card uri match
			else if(subjectUri === '*') {
				if(!rules.noWildCard) {
					score += 10;
				}
			}

			//if catch all
			else if(subjectUri === '+') {
				if(!rules.noCatchall) {
					score += 1;
				}
				break;
			}

			//if there is no match at all
			else {
				score = 0;
				break;
			}
		}

		return {
			"score": score,
			"data": data
		}
	}

	/**
	 * Binds a route url to a callback that is fired when the route is triggered.
	 * An optional second callback can be passed that is executed when a
	 * different route is triggered. This is useful for doing cleanup.
	 * @param url
	 * @param setupCallbacks
	 * @param tearDownCallbacks (optional)
	 */
	function bindRoute(url, setupCallbacks, tearDownCallbacks) {
		var matchedRoute, rGK, rI, enI, exI, uris, route;

		if(typeof setupCallbacks === 'function') { setupCallbacks = [setupCallbacks]; }
		if(typeof tearDownCallbacks === 'function') { tearDownCallbacks = [tearDownCallbacks]; }

		setupCallbacks = setupCallbacks || [];
		tearDownCallbacks = tearDownCallbacks || [];

		//make sure the url and callback is defined
		if(typeof url !== 'string') {
			throw new Error('Cannot bind route. Requires a valid route url string.');
		}
		if(typeof setupCallbacks[0] !== 'function') {
			throw new Error('Cannot bind route. Requires a valid setup callback function.');
		}

		//clean the url
		url = cleanUrl(url);

		//if the url string is empty after being clean, asumen it was invalid and throw an exception
		if(!url) { throw new Error('Url '); }

		//try and get the route if it already exists
		matchedRoute = false;
		for(rGK in routes) {
			if(routes.hasOwnProperty(rGK)) {
				for(rI = 0; rI < routes[rGK].length; rI += 1) {
					if(routes[rGK][rI].url === url) {
						matchedRoute = routes[rGK][rI];
					}
				}
			}
		}

		//if an existing route has been setup already then add the new callbacks to it
		if(matchedRoute) {

			//add the setup callbacks
			for(enI = 0; enI < setupCallbacks.length; enI += 1) {
				matchedRoute.setupCallbacks.push(setupCallbacks[enI]);
			}
			//add the tear down
			for(exI = 0; exI < tearDownCallbacks.length; exI += 1) {
				matchedRoute.tearDownCallbacks.push(tearDownCallbacks[exI]);
			}

		//if no existing route has benn setup then create a new route
		} else {

			//pull out the route's uris
			uris = urlToUris(url);

			//if the routes object does not already have a route group for this number of uris then create it
			if(!routes[uris.length]) { routes[uris.length] = []; }

			//create the route
			route = {
				"url": url,
				"setupCallbacks": setupCallbacks,
				"tearDownCallbacks": tearDownCallbacks
			};

			routes[uris.length].push(route);
		}

		return true;
	}

	/**
	 * Takes any number of urls and returns two methods, at() which takes the urls and sets them up as aliases and to()
	 * which makes the urls redirect to another url.
	 */
	function createPointer(    ) {
		var pointerUrls, isSet;


		//gets all the source urls
		pointerUrls = Array.prototype.slice.apply(arguments);

		isSet = false;

		return { "at": createAlias, "to": createRedirect };

		//set an alias
		function createAlias(targetUrl) {
			create(targetUrl, "alias");
		}

		//sets a redirect
		function createRedirect(targetUrl) {
			create(targetUrl, "redirect");
		}

		function create(targetUrl, type) {
			if(isSet) {
				throw new Error('Pointers already set.');
			}

			//throws error if the pointer is invalid
			validate(pointerUrls, targetUrl);

			pointers.push({
				"targetUrl": targetUrl,
				"pointerUrls": pointerUrls,
				"type": type
			});
			isSet = true;
		}

		function validate(pointerUrls, targetUrl) {
			var targetUris, tUI, targetUri, targetDynamicUrls, pUlI, pointerUris, pUiI, pointerUri, dTUI, expectedUris, number;

			if(typeof pointerUrls === 'string') {
				pointerUrls = [pointerUrls];
			}

			//get the target uris
			targetUris = urlToUris(targetUrl);

			targetDynamicUrls = [];
			expectedUris = 0;

			//loop through the target uris
			for(tUI = 0; tUI < targetUris.length; tUI += 1) {

				//get the target uri
				targetUri = targetUris[tUI];

				//check sources
				if(targetUri.substr(0, 1) === '@') {

					//save the uri
					targetDynamicUrls.push(targetUri.substr(1));
				}

				//check wildcards
				if(targetUri === '*') {
					if(expectedUris < tUI) {
						expectedUris = tUI;
					}
				}

				//check queries
				if(targetUri.substr(0, 1) === '#') {
					number = parseInt(targetUri.substr(1));

					//if the number is no longer the same as the query string it must have contained non number characters.
					if(!number || number != targetUri.substr(1)) { throw new Error("Cannot create pointer. A invalid query uri was added to the target url. Query uris can only be numbers and must be greater than zero.."); }

					//if the number is greater than the last pointer length
					if(expectedUris < number) {
						expectedUris = number;
					}
				}
			}

			//loop through each pointer url
			for(pUlI = 0; pUlI < pointerUrls.length; pUlI += 1) {
				pointerUris = urlToUris(pointerUrls[pUlI]);

				if(pointerUris.length < expectedUris) { throw new Error('Cannot create pointer. The target url requires all pointer urls be a minimum length of ' + expectedUris + '. Check your wildcard and query uris.'); }

				//loop through the pointer uri
				for(pUiI = 0; pUiI < pointerUris.length; pUiI += 1) {
					pointerUri = pointerUris[pUiI];

					//if the pointer uri is dynamic
					if(pointerUri.substr(0, 1) === ':') {
						for(dTUI = 0; dTUI < targetDynamicUrls.length; dTUI += 1) {
							if(targetDynamicUrls[dTUI] === pointerUri.substr(1)) {
								targetDynamicUrls.splice(dTUI, 1);
								dTUI -= 1;
							}
						}
					}
				}
			}

			//if not all the dynamic uris are sourced then throw an error
			if(targetDynamicUrls.length) {
				throw new Error('Cannot create pointer. A source uri in the target url does not have a matching dynamic uri in (one of) the pointer url(s).');
			}
		}
	}

	/**
	 * Takes a url and if its a pointer translates it to a route url
	 * @param url
	 */
	function getPointer(url) {
		var pI, pointer, pUI, pointerUrl, result, lastScore,
			matchedPointer, targetUris, pTUI, data,
			targetUri, resultUris, uris;

		matchedPointer = false;
		lastScore = 0;
		uris = urlToUris(url);

		//loop through the pointers and find one that matches
		for(pI = 0; pI < pointers.length; pI += 1) {

			//get the pointer
			pointer = pointers[pI];

			//loop through the pointer's pointer urls
			for(pUI = 0; pUI < pointer.pointerUrls.length; pUI += 1) {

				//get the pointer url
				pointerUrl = pointer.pointerUrls[pUI];

				//only check against pointers with the same or less uris than the input url
				if(uris.length < urlToUris(pointerUrl).length) { continue; }

				//check the pointer url against the target url
				result = compareUrls(url, pointerUrl);

				//if the pointer matches better than any former match then set it as the new match
				if(result.score > lastScore) {
					matchedPointer = pointer;
					data = result.data;
					lastScore = result.score;
				}
			}
		}

		if(!matchedPointer) { return false; }

		//fill the data into the pointer target
		targetUris = urlToUris(matchedPointer.targetUrl);
		resultUris = [];

		//plugin any data from the pointer url
		for(pTUI = 0; pTUI < targetUris.length; pTUI += 1) {

			//get the current uri segment
			targetUri = targetUris[pTUI];

			//if the segment is dynamic then try to insert data
			if(targetUri.substr(0, 1) === '@') {
				targetUri = data[targetUri.substr(1)];
			}

			//if the segment is wild then copy the url over from the target url
			if(targetUri === '*') {
				targetUri = uris[pTUI];
			}

			//if the segment is a query uri
			if(targetUri.substr(0, 1) === '#') {
				targetUri = uris[parseInt(targetUri.substr(1)) - 1];
			}

			resultUris.push(targetUri);
		}

		return {
			"targetUrl": matchedPointer.targetUrl,
			"url": urisToUrl(resultUris),
			"type": matchedPointer.type
		};
	}


	/**
	 * Accepts absolute urls as well as relative urls and hash urls that are in the routing table.
	 * @param url
	 * @param forceNewTab
	 */
	function go(url, forceNewTab) {

		//if a url is given
		if(typeof url === 'string') {

			//if the redirect is absolute then redirect
			if(url.match(/https?:\/\/[a-z0-9]+.[a-z0-9\-]+.[a-z]/)) {
				open(url, '_blank');

			//if the url is relative to the domain
			} else {
				if(getRoute(url) || getPointer(url)) {
					if(forceNewTab) {
						open(location.pathname + '#' + url, '_blank');
					} else {
						location.hash = url;
					}
				} else {
					if(forceNewTab) {
						open(url, '_blank');
					} else {
						location = url;
					}
				}
			}

		//if no url is given then reload the page
		} else {
			location.reload();
		}
	}

	return {
		"bind": bindRoute,
		"update": handleCurrentRoute,
		"go": go,
		"point": createPointer
	}
});