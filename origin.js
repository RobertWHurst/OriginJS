(function(factory) {

	if(typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		window.OriginJS = factory();
	}

})(function() {
	var routes, currentRoutes, inReset, pointers, DEBUG;

	//abstractions because of ms's piece o' shit browsers
	function bind(eventName, element, callback) {if(element.addEventListener){element.addEventListener(eventName,callback,false);}else{if(element===window){element=document.body;}element.attachEvent("on" + eventName,function(event){return callback.call(element,event);});}}
	function trigger(eventName, element) {var a;if(document.createEvent){a=document.createEvent("HTMLEvents");a.initEvent(eventName,true,true);}else{if(element===window){element=document.body;}a=document.createEventObject();a.eventType='on'+eventName;}if(element.dispatchEvent){element.dispatchEvent(a);}else{element.fireEvent(a.eventType,a);}}
	function isEventSupported(eventName, element) {var a={'select':'input','change':'input','submit':'form','reset':'form','error':'img','load':'img','abort':'img'};element=element||document.createElement(a[eventName]||'div');eventName='on'+eventName;var b=eventName in element;if(!b){if(!element.setAttribute){element=document.createElement('div');}if(element.setAttribute&&element.removeAttribute){element.setAttribute(eventName,'');b=typeof element[eventName]==='function';if(!is(element[eventName],'undefined')){element[eventName]=undefined;}element.removeAttribute(eventName);}}element=null;return b;}

	//polyfills for ms's piece o' shit browsers
	[].indexOf||(Array.prototype.indexOf=function(a,b,c){for(c=this.length,b=(c+~~b)%c;b<c&&(!(b in this)||this[b]!==a);b++);return b^c?b:-1;});
	isEventSupported('hashchange',window)&&(document.documentMode===undefined||document.documentMode>7)||(function(){var a=location.hash;setInterval(function(){if(a!==location.hash){trigger('hashchange',window);a=location.hash;}},1);})();

	//DEBUG
	DEBUG = true;

	//vars
	routes = [];
	currentRoutes = [];
	inReset = false;
	pointers = [];

	//bind to the has change event
	bind('hashchange', window, handleCurrentRoute);

	return {
		"bind": bindRoute,
		"update": handleCurrentRoute,
		"go": go,
		"point": createPointer,
		"queryLocation": queryLocation
	};

	/**
	 * Reads the location hash and tries to find a follow a matching route
	 */
	function handleCurrentRoute() {
		var url, newRoutes, _currentRoutes, nRI, cRI, tDCI, sUCI, active;

		//init vars
		_currentRoutes = [];

		//add the hash if it doesn't exist
		if (!location.hash) {
			location.hash = '/';
			return false;
		}

		if(inReset === location.hash.substr(1)) {
			inReset = false;
			return false;
		}

		//trace the url
		url = trace(location.hash.substr(1));

		//get the route
		newRoutes = getRoutes(url);

		//call the tear down callbacks of all non active routes
		for(cRI = 0; cRI < currentRoutes.length; cRI += 1) {

			//check if the route is still active
			active = false;
			for(nRI = 0; nRI < newRoutes.length; nRI += 1) {
				if(newRoutes[nRI].route.url === currentRoutes[cRI].route.url) {
					active = true;
				}
			}

			//if the route is inactive then kill it
			if(!active) {
				for(tDCI = 0; tDCI < currentRoutes[cRI].route.tearDownCallbacks.length; tDCI += 1) {
					currentRoutes[cRI].route.tearDownCallbacks[tDCI](currentRoutes[cRI].uriData);
				}
			} else {
				_currentRoutes.push(currentRoutes[cRI]);
			}
		}

		//activate new routes that are not currently active
		for(nRI = 0; nRI < newRoutes.length; nRI += 1) {

			//check if the route is already active
			active = false;
			for(cRI = 0; cRI < currentRoutes.length; cRI += 1) {
				if(currentRoutes[cRI].route.url === newRoutes[nRI].route.url) {
					active = true;
				}
			}

			//if the route is inactive then execute it
			if(!active) {
				for(sUCI = 0; sUCI < newRoutes[nRI].route.setupCallbacks.length; sUCI += 1) {
					newRoutes[nRI].route.setupCallbacks[sUCI](newRoutes[nRI].uriData);
					_currentRoutes.push(newRoutes[nRI]);
				}
			}
		}

		//update the current routes
		currentRoutes = _currentRoutes;

		return true;
	}

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
			if(getRoutes(url, {
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
					location.hash = inReset = pointer.url;
				}

				//try to trace the pointer's url and if that fails return the pointer url
				return exec(pointer.url) || pointer.url;

			} else {
				return url;
			}

		})(url);
	}

	/**
	 * Query location
	 */
	function queryLocation() {
		var url, routeData, uris, routeUrl, routeUris, api;

		//get the url
		url = location.hash.substr(1);

		//get the current route
		routeData = getRoutes(trace(url));

		//get the uris
		uris = routeData.uriData;

		//get the route
		routeUrl = routeData.route.url;

		//get the route uris
		routeUris = urlToUris(routeUrl);

		api = {
			"location": {
				"url": url,
				"uris": uris
			},
			"route": {
				"url": routeUrl,
				"uris": routeUris
			}
		};

		return api;
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
	function getRoutes(url, rules) {
		var terminalRoute, sortedRoutes, rGI, sRGI,
			routeGroup, route, uriData, result,
			lastRouteScore, key, rI, cascadingRoutes,
			cI, matchedRoutes, routeUriData, uI;

		//validate the arguments
		if(typeof url !== 'string') { throw new Error('Cannot get route. Requires a valid route.'); }

		//clean the url
		url = cleanUrl(url);

		//convert the url to uris
		uriData = urlToUris(url);

		//flip the order of the routes object so its longest to shortest
		sortedRoutes = [];
		for(rGI = 0; rGI < routes.length; rGI += 1) {
			if(!routes[rGI] || sortedRoutes.indexOf(routes[rGI]) > -1) { continue; }
			sortedRoutes.unshift(routes[rGI]);
		}

		//setup the setup the loop initial state of the loop variables
		terminalRoute = false;
		lastRouteScore = 0;
		cascadingRoutes = [];
		matchedRoutes = [];

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
				routeUriData = [];
				for(uI = 0; uI < uriData.length; uI += 1) {
					routeUriData[uI] = uriData[uI];
				}

				//attach data to the UriData array
				for(key in result.data) {
					if(!result.data.hasOwnProperty(key)) { continue; }
					routeUriData[key] = result.data[key];
				}

				//if the route cascades then keep it
				if(result.score > 0 && result.cascade) {
					cascadingRoutes[result.score] = {
						"route": route,
						"uriData": routeUriData
					};
				}

				//if the route has a better score than the last then
				// replace it
				if(result.score > lastRouteScore && !result.cascade) {
					lastRouteScore = result.score;
					terminalRoute = {
						"route": route,
						"uriData": routeUriData
					};
				}
			}
		}

		for(cI = 0; cI < cascadingRoutes.length; cI += 1) {
			if(!cascadingRoutes[cI]) { continue; }
			if(matchedRoutes.indexOf(cascadingRoutes[cI]) > -1) { continue; }
			matchedRoutes.push(cascadingRoutes[cI]);
		}

		if(terminalRoute) {
			if(matchedRoutes.indexOf(terminalRoute) === -1) {
				matchedRoutes.push(terminalRoute);
			}
		}

		//return false if no route was returned
		if(matchedRoutes.length === 0) { return false; }

		//return the matched route
		return matchedRoutes;
	}

	//MODEL     (target)    /cake/test
	//SUBJECT   (route)     /cake/:test

	function compareUrls(modelUrl, subjectUrl, rules) {
		var modelUris, subjectUris, score, uI, subjectUri, modelUri, data, cascading;

		modelUris = urlToUris(modelUrl);
		subjectUris = urlToUris(subjectUrl);
		score = 0;
		data = {};
		cascading = false;

		if(typeof modelUrl !== 'string') { throw new Error('Cannot compare urls. Model url must be a string.'); }
		if(typeof subjectUrl !== 'string') { throw new Error('Cannot compare urls. Subject url must be a string.'); }
		if(typeof rules !== 'object') { rules = {}; }

		DEBUG && console.log('');
		DEBUG && console.log(modelUrl + ' <===> ' + subjectUrl);

		//handle root
		if(modelUris.length === 0 && subjectUris.length === 0) {
			score += 5;
			DEBUG && console.log('    ROOT MATCH');
		}

		//loop through the target uris and compare to the route urls counter part.
		for(uI = 0; uI < modelUris.length || uI < subjectUris.length; uI += 1) {

			//get both the route and the target uri
			subjectUri = subjectUris[uI];
			modelUri = modelUris[uI];

			DEBUG && console.log('/' + (modelUri || '') + ' <-> ' + '/' + (subjectUri || ''));

			//if no subject uri
			if(!modelUri && subjectUri !== '.' && subjectUri !== '+' || !subjectUri) {
				score = 0;
				cascading = false;
				DEBUG && console.log('    =0 | MISSING SEGMENT');
				break;
			}

			//direct uri match
			if(subjectUri === modelUri) {
				if(!rules.noDirect) {
					score += 5;
					DEBUG && console.log('    +5 | DIRECT MATCH');
				}
			}

			//if dynamic uri match
			else if(subjectUri.substr(0, 1) === ':') {
				if(!rules.noDynamic) {
					score += 4;
					DEBUG && console.log('    +4 | DYNAMIC MATCH');
				}

				//save the route uri as the key and the target uri as the value for the callback
				data[subjectUri.substr(1)] = modelUri;
			}

			//if wild card uri match
			else if(subjectUri === '*') {
				if(!rules.noWildCard) {
					score += 3;
					DEBUG && console.log('    +3 | WILDCARD MATCH');
				}
			}

			//if catch all
			else if(subjectUri === '.') {
				if(!rules.noCascade) {
					score += 2;
					cascading = true;
					DEBUG && console.log('    +2 | CASCADING CATCHALL MATCH');
				}
				break;
			}

			//if catch all
			else if(subjectUri === '+') {
				if(!rules.noCatchall) {
					score += 1;
					DEBUG && console.log('    +1 | TERMINATING CATCHALL MATCH');
				}
				break;
			}

			//if there is no match at all
			else {
				score = 0;
				DEBUG && console.log('    =0 | NO MATCH');
				break;
			}
		}

		DEBUG && console.log('  SCORE: ' + score + (cascading && ' & CASSCADING' || ''));
		DEBUG && console.log('');

		return {
			"score": score,
			"cascade": cascading,
			"uriData": data
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
		var matchedRoute, rGK, rI, enI, exI, uris, route, uI;

		if(typeof setupCallbacks === 'function') { setupCallbacks = [setupCallbacks]; }
		if(typeof tearDownCallbacks === 'function') { tearDownCallbacks = [tearDownCallbacks]; }

		setupCallbacks = setupCallbacks || [];
		tearDownCallbacks = tearDownCallbacks || [];

		//if the url is actually a array the loop through and bind each
		if(typeof url === 'object' && typeof url.push === 'function') {
			for(uI = 0; uI < url.length; uI += 1) {
				bindRoute(url[uI], setupCallbacks, tearDownCallbacks);
			}
			return;
		}

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
				if(getRoutes(url) || getPointer(url)) {
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
});