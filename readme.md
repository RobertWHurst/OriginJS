OriginJS
========
Every route begins with an origin.

Introduction
============
OriginJS is am awesome clent slide router. It's lightweight, easy to use, and has a lot of very powerful features.
If your building a single page application, and javascript game, or anything else heavy in javascript, OriginJS will
make your application more accessable and might even help you code in a more organized way.

Examples
========
If your looking for examples and a bit more detail you should checkout the [OriginJS homepage (incomplete)](robertwhurst.github.com/OriginJS).
You some also have a look at the example applications in the examples directory.

Documentation
=============

Bind
----

    OriginJS.bind(route, setupCallback(urisArray, previousUrisArray)[, tearDownCallback(urisArray, previousUrisArray)]);

This method is the corner stone of this library. It binds your route logic to the routes of your application. To bind a
route you simply call `OriginJS.bind()` passing it a route (like /home, /about, etc...), and a setup callback that will
load the content of your route. You can optionally pass a teardown callback aswell if you wish to cleanup your loaded
content when a different route is followed. You can think of `setupCallback()` and `tearDownCallback()` as parellels to the
DOM's `onload` and `onunload` events.

### Arguments

- `route`: A route string or an array of route strings. The route can contain dynamic uris such as `*`, `+`, or `:someIdHere`.
- `setupCallback`: A function or array of functions that will be called when the route is followed.
- `tearDownCallback`: Optional. A function or array of functions that will be called when the navigating way from the route.

Both the `setupCallback()` and the `tearDownCallback()` are passed two arguments; A uris array for the current route,
and a uris array from the route followed prior to the current.

### Uris Arrays
Uris arrays contain each uri from the triggering hash url. So if your route is binded to `/home/*` and someone navigated
to `/home/cake` the uri array would be `['home', 'cake']`.

### Special Route Uris

- `*`: Wildcard uris will match any uri.
- `:[name]`: Dynamic uris are a colon followed by a key name. Examples `:key`, `:user`, `:cake`. Dynaimc uris will capture
the value of the uri they match and attach it the the uris array as a keyed value. `:key` becomes `urisArray.key`,
`:user` becomes `urisArray.user`, `:cake` becomes `urisArray.cake`.
- `+`: Catchall uris will match any uri and anything that follows it. It can be used to setup things like 404 pages and
other types of catchall pages.

Go
--

	OriginJS.go(url);

At some point you may want to trigger routes or open other pages programatically. This is what `OriginJS.go()` is for.
If `OriginJS.bind()` is ying, `OriginJS.go()` is yang.

### Arguments

- `url`: Any url you wish to follow. If the url is pointing to a binded route the router will load that route. No need to
prefix with `/#`. If the url is not pointing to a binded route it will redirect to the url. If the url contains a domain
it will open the url in a new tab (or window).

Update
------

	OriginJS.update();

The `OriginJS.update()` method is used to trigger force Origin to match the current hash url routes are defined. You should
call this after your routes are binded in your appication. You should only need to to call this function once.

Point
-----

	OriginJS.point(route[, ...]).to(route)
	OriginJS.point(route[, ...]).at(route)

At some point you may want to setup aliases or redirects. `OriginJS.point()` creates aliases and redrects with ease. It
takes any number route strings. and returns an object with two functions. These functions are `at()` and `to()`.

- `at(route)`: Creates an alias from the routes passed to `point()` and points them to a `route` passed.
- `to(route)`: Creates a redirect from the routes passed to `point()` and forwards them to a `route` passed.

Credits
=======

I (Robert Hurst) made this to enable me to build more robust applications without wasting time creating a half baked 
router. I'd like to share it with fellow devs. Feel free to fork this project and make your own changes.

[![endorse](http://api.coderwall.com/robertwhurst/endorsecount.png)](http://coderwall.com/robertwhurst)