OriginJS
========
Every route begins with an origin.

Introduction
============
OriginJS is a very flexible and powerful router that's easy to use but still offers advanced features if and when
needed. Features like dynamic redirect and alias pointers, group binding, and scored route matching.

Getting Started
===============

First include origin.js in your page. You can do this with a script tag in the head of your page, or you can 
load it with [require.js](http://requirejs.org/).

Using Origin is very easy. Here's a very basic example.

	OriginJS.bind('/', function() {

		//home page logic goes here
		//loaded on /#/ or /

	});

	OriginJS.bind('/about', function() {

		//about page logic goes here
		//loaded on /#/about

	});
	
	//instruct the router to try and find then follow a route now that routes above have been added
	OriginJS.update()

Your links would look like this.

	<nav>
		<a href="#/">Home</a>
		<a href="#/about">About</a>
	</nav>

This is far to simple an example for serious applications though so here is an example with a bit more complexity.

	OriginJS.bind(['/:user/:profilePage', '/:user/:profilePage/+'], function(uris, data) {

		//will match hash urls such as
		// /#/RobertWHurst/Wall/
		// or even
		// /#/John_01/About/Data/1/0/1

		//get the dynamic data
		var user = data.user,
			profilePage = data.profilePage,
			profilePageSubUris = uris.splice(2);

		// load profile code here

	}, function(uris, data) {

		//cleanup code for profile here

	});

As you can see there is an optional callback for cleaning up when a different route is loaded. Also both callbacks get two
arguments. The first is an array with each uri from the current url in the location hash. Even more interesting is the
`:user` and `:profilePage` uris in the bind rules. These are id uris and capture any uri in the corresponding position
in the hash url. The uri value gets added to the data object passed to the callback under a key by the same name as the
rule uri. Here's an example of what I mean.

    Rule Uri = :user
                                     so                 data.user === 'RobertWHurst'
    Hash Uri = RobertWHurst

There there are two other operators you can use in your routes. The catchall, `+`, and the wild card uri, `*`. Catchalls
are self explanatory they will match any uri and all that follow it. Good for things like 404 or black hole pages.
Wildcards match like id Uris except the do not save the hash uri value to the data array.

Don't use location.hash to change routes!
=========================================
You don't always want to use anchor tags to navigate your app. Sometimes you want to do this programatically. You can use
location.hash if you really want to, it will work but you shouldn't. Origin has a method for redirecting to other places.
Its called `OriginJS.go` and can be uses as follows.

	//If a route has been set for /home this will redirect to /#/home/. if no route exists it will redirect /home/
    OriginJS.go('/home');

    //Opens a new tab (or window) containing http://google.com/
    OriginJS.go('http://google.com/');

    //holding control while ether of these fire will yield a new tab (or window) regardless of the passed url.

As you can see above `OriginJS.go(url)` Allows to to load any page you like, not just hash routes. You don't even have to think
about it. Its predictable and yet feels magical. The choice is yours but I would highly recommend `OriginJS.go(url)` over
`location.hash`.

Documentation
=============

Bind
----

    OriginJS.bind(route, setupCallback[, tearDownCallback]);

This method is the corner stone of this library. It binds your route logic to the routes of your application.


### Arguments

`route`: The route you wish to bind. The route can contain dynamic uris such as `*`, `+`, or `:someIdHere`. see `dynamic
uris` for more details.
`setupCallback`: Should be a function containing logic for constructing the content for the route.
`tearDownCallback`: Should be a function containing logic for removing the content for the route. This is optional.

Both the `setupCallback` and the `tearDownCallback` are passed two arguments; A uris array object for the current route,
and a uris array from the route prior to the current. See uris array for details.

Go
--

	OriginJS.go(url);

At some point you may want to trigger routes or open other pages programatically. This is what `OriginJS.go(url)` is for.
If `OriginJS.bind` is ying, `OriginJS.go` is yang.

### Arguments

`url`: Any url you wish to follow. If the url is pointing to a binded route the router will load that route. No need to
prefix with `/#`. If the url is not pointing to a binded route it will redirect to the url. If the url contains a domain
it will open the url in a new tab (or window).

Update
------

	OriginJS.update();

The `OriginJS.update` method is used to trigger force Origin to match the current hash url routes are defined. You should
call this after your routes are binded in your appication. You should only need to to call this function once.

Credits
=======

I (Robert Hurst) made this to enable me to build more robust applications without wasting time creating a half baked 
router. I'd like to share it with fellow devs. Feel free to fork this project and make your own changes.

[![endorse](http://api.coderwall.com/robertwhurst/endorsecount.png)](http://coderwall.com/robertwhurst)