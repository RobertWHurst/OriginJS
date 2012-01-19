/*!
 * Origin
 *
 * Copyright 2011, Robert William Hurst
 * Licenced under the BSD License.
 * See https://raw.github.com/RobertWHurst/Origin/master/license.txt
 */
(function (factory) {

	if(typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		window.Origin = factory();
	}

})(function() {

	//vars
	var routes = {};
	var currentRoute = false;
	var url404 = '/404';

	//bind to the has change event
	$(window).on('hashchange', handleCurrentRoute);

	/**
	 * Reads the location hash and tries to find a follow a matching route
	 */
	function handleCurrentRoute() {

		//add the hash if it doesn't exist
		if (!location.hash) {
			location.hash = '/';
			return;
		}

		//get the route
		var uris = urlToUris(location.hash.substr(1));
		var route = getRoute(location.hash.substr(1));

		//get the 404 page
		//if(!route) { route = getRoute(url404); }

		//if we get the page then follow it
		if(route) {
			for(var i = 0; i < route.callbacks.length; i += 1) {
				route.callbacks[i](uris, route.data);
			}
		}

		//fire the exit callback
		if(currentRoute) {
			for(var i = 0; i < currentRoute.exitCallbacks.length; i += 1) {
				currentRoute.exitCallbacks[i](uris, currentRoute.data);
			}
		}
	}

	/**
	 * Converts a url to a uri array and cleans out garbage
	 * @param url
	 */
	function urlToUris(url) {
		var rawUris = url.split('/');
		var uris = [];

		//loop through the uris
		for(var uI = 0; uI < rawUris.length; uI += 1) {
			if(rawUris[uI]) { uris.push(rawUris[uI]); }
		}

		return uris;
	}

	/**
	 * Converts an array of uris to a url and prepends a forward slash
	 * @param uris
	 */
	function urisToUrl(uris) {
		return '/' + uris.join('/');
	}

	/**
	 * Uses urlToUris and urisToUrl to clean a url
	 * @param url
	 */
	function cleanUrl(url) {
		return urisToUrl(urlToUris(url));
	}

	/**
	 * Finds a route that a target url matches then returns the route with dynamic data attached
	 * @param url
	 */
	function getRoute(url) {

		//clean the url
		url = cleanUrl(url);
		if(!url) { return false; }

		//explode the target url
		var targetUris = urlToUris(url);
		var matchedRoute = false;
		var sortedRoutes = [];

		//loop through each route group
		for(var rGK in routes) {
			if(!routes.hasOwnProperty(rGK)) { continue; }
			sortedRoutes.unshift(routes[rGK]);
		}

		for(var sRGI = 0; sRGI < sortedRoutes.length; sRGI += 1) {
			var routeGroup = sortedRoutes[sRGI];

			//loop through each route
			for(var rI = 0; rI < routeGroup.length; rI += 1) {
				var route = routeGroup[rI];
				var matchedUri = false;
				var routeData = {};

				//explode the route url
				var routeUris = urlToUris(route.url);

				//handle the case for root
				if(targetUris.length === 0 && routeUris.length === 0) {
					matchedUri = true;
				}

				//loop through the target uris and check for a match
				for(var rUI = 0; rUI < routeUris.length; rUI += 1) {
					var targetUri = targetUris[rUI];
					var routeUri = routeUris[rUI];

					//if ether the target or the route doesn't have this uri then break
					if(!targetUri || !routeUri) {

						matchedUri = false;
						break;
					}

					//compare the target uri to the route uri

					//if a direct match
					if(routeUri === targetUri) {

						//declare a match
						matchedUri = true;

					}

					//if a dynamic uri
					else if(routeUri.substr(0, 1) === ':') {

						//get the key
						var key = routeUri.substr(1);

						//get the value
						var value = targetUri;

						//make sure both the key and the value are real
						if(key.length && value.length) {

							//save the data to the uriData object
							routeData[key] = value;

							//declare a match
							matchedUri = true;
						}

					}

					//if wild uri segment
					else if(routeUri === '*') {

						//make sure the target uri has content
						if(targetUri) {
							//declare a match
							matchedUri = true;
						}

					}

					//if catch-all
					else if(routeUri === '+') {

						//declare a match and exit the uri loop
						matchedUri = true;
						break;


					//if the uri is unmatched
					} else {
						matchedUri = false;
						break;
					}
					if(!matchedUri) { break; }
				}
				if(matchedUri) { matchedRoute = route; matchedRoute.data = routeData; }
			}
			if(matchedRoute) { break; }
		}

		//return the matched route
		return matchedRoute;
	}

	/**
	 * Binds a route url to a callback that is fired when the route is triggered.
	 * An optional second callback can be passed that is executed when a
	 * different route is triggered. This is useful for doing cleanup.
	 * @param url
	 * @param enterCallback
	 * @param exitCallback
	 */
	function bindRoute(url, enterCallback, exitCallback) {

		//make sure the url and callback is defined
		if(typeof url !== 'string' || typeof enterCallback !== 'function') {
			return false;
		}

		//clean the url
		var url = cleanUrl(url);
		if(!url) { return false; }

		//try and get the route if it exists
		var matchedRoute = false;
		for(var rGK in routes) {
			for(var rI = 0; rI < routes[rGK].length; rI += 1) {
				if(routes[rGK][rI].url === url) {
					matchedRoute = routes[rGK][rI];
				}
			}
		}

		if(matchedRoute) {

			matchedRoute.callbacks.push(enterCallback);
			if(exitCallback) { matchedRoute.exitCallbacks.push(exitCallbacks); }

		} else {

			var uris = urlToUris(url);

			if(!routes[uris.length]) { routes[uris.length] = []; }

			var route = {
				"url": url,
				"callbacks": [enterCallback],
				"exitCallbacks": []
			};

			if(exitCallback) { route.exitCallbacks.push(exitCallbacks); }
			routes[uris.length].push(route);
		}
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
				if(getRoute(url)) {
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
		"go": go
	}
});