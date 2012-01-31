OriginJS
========
Every route begins at the origin.

Getting Started
===============

First include origin.js in your page. You can do this with a script tag in the head of your page, or you can 
load it with [require.js](http://requirejs.org/).

Using Origin is very easy. Here's a very basic example.

	Origin.bind('/', function() {

		//home page logic goes here
		//loaded on /#/ or /

	});

	Origin.bind('/about', function() {

		//about page logic goes here
		//loaded on /#/about

	});

Your links would look like this.

	<nav>
		<a href="#/">Home</a>
		<a href="#/about">About</a>
	</nav>

This is far to simple an example for serious applications though so here is an example with a bit more complexity.

	Origin.bind(['/:user/:profilePage', '/:user/:profilePage/+'], function(uris, data) {

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
Its called `Origin.go` and can be uses as follows.

	//If a route has been set for /home this will redirect to /#/home/. if no route exists it will redirect /home/
    Origin.go('/home');

    //Opens a new tab (or window) containing http://google.com/
    Origin.go('http://google.com/');

    //holding control while ether of these fire will yield a new tab (or window) regardless of the passed url.

As you can see above `Origin.go(url)` Allows to to load any page you like, not just hash routes. You don't even have to think
about it. Its predictable and yet feels magical. The choice is yours but I would highly recommend `Origin.go(url)` over
`location.hash`.

Documentation
=============

Bind
----

    Origin.bind(route, entryCallback[, exitCallback]);

This method is the corner stone of this library. It binds your route logic to the routes of your application.


### Arguments

`route`: The route you wish to bind. The route can contain dynamic uris such as `*`, `+`, or `:someIdHere`.
`entryCallback`: The callback that will be executed when you route has been followed.
`exitCallback`: The callback that will be executed when a different route is loaded.

Both the entry callback and the exit callback are passed two arguments; the uris from the hash url, and an object with
data from any `:someIdHere`s you may have in your route.

Go
--

	Origin.go(url);

At some point you may want to trigger routes or open other pages programatically. This is what `Origin.go(url)` is for.
If `Origin.bind` is ying, `Origin.go` is yang.

### Arguments

`url`: Any url you wish to follow. If the url is pointing to a binded route the router will load that route. No need to
prefix with `/#`. If the url is not pointing to a binded route it will redirect to the url. If the url contains a domain
it will open the url in a new tab (or window).

Update
------

	Origin.update();

The `Origin.update` method should never need to be called, however in the event that something weird happens, for example
your application looses focus on a hash change event, calling this function will force Origin to re check the hash and
execute matching routes.

Credits
-------

I (Robert Hurst) made this to enable me to build more robust applications without wasting time creating a half baked 
router. I'd like to share it with fellow devs. Feel free to fork this project and make your own changes.

[![endorse](http://api.coderwall.com/robertwhurst/endorsecount.png)](http://coderwall.com/robertwhurst)