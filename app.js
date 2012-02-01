$(document).ready(function() {

	//Elements
	var $panel = $('.panel'),
		$home = $('.home'),
		$about = $('.about'),
		$docs = $('.docs'),
		$autoHeight = $('.autoHeight'),
		$autoWidth = $('.autoWidth'),
		$nav = $('nav'),

	//Views
		home = Home(),
		about = About(),
		docs = Docs(),

	//get inner with and height
		windowHeight,
		windowWidth;

	//Routes
	Origin.bind('/', home.load, home.cleanup);
	Origin.bind('/about', about.load, about.cleanup);
	Origin.bind('/docs', docs.load, docs.cleanup);

	//update the router
	Origin.update();

	//force resize
	setInterval(function() {
		$(window).trigger('resize');
		$('.wrapper').css('opacity', '1');
		$('nav').css('opacity', '1');

		//get inner with and height
		windowHeight = innerHeight,
		windowWidth = innerWidth;

		//set the min height and width
		if(windowWidth < 1024) { windowWidth = 1024 }
		if(windowHeight < 520) { windowHeight = 520 }

		//set the height of home
		$autoHeight.height(windowHeight - 160);
		$autoWidth.width(windowWidth - 160);
	}, 100);


	//View Class Definitions

	/**
	 * Sets up the home page
	 */
	function Home() {

		var api = {
			"load": load,
			"cleanup": cleanup
		};

		function load() {

			$(window).on('resize.home', alignContent);
			alignContent();

			function alignContent() {

				//center the screen on the home div
				$panel.css({
					"top": windowHeight - $panel.height() - 80,
					"left": Math.round(windowWidth / 2) - Math.round($panel.width() / 2)
				});

				//get the width of each nav item
				var width = 0;
				$nav.children('a').each(function() {
					width += $(this).outerWidth();
				});

				//center the page in the panel
				$home.css('left', '-' + (Math.round($home.width() / 2) - Math.round($panel.width() / 2)) + 'px');

				//center the nav
				$nav.css({
					"top": Math.round(windowHeight / 2) - Math.round($nav.height() / 2) - 30,
					"left": Math.round(windowWidth / 2) - Math.round(width / 2)
				});
			}

		}

		function cleanup() {

			$(window).off('resize.home');

		}

		return api;
	}

	/**
	 * Sets up the about page
	 */
	function About() {

		var api = {
			"load": load,
			"cleanup": cleanup
		};

		function load() {

			$(window).on('resize.about', alignContent);

			function alignContent() {

				//center the screen on the about div
				$panel.css({
					"top": Math.round(windowHeight / 2) - Math.round($panel.height() / 2),
					"left": windowWidth - $panel.width() - 80
				});

				//get the width of each nav item
				var width = 0;
				$nav.children('a').each(function() {
					width += $(this).outerWidth();
				});

				//center the page in the panel
				$about.css('top', '-' + (Math.round($home.height() / 2) - Math.round($panel.height() / 2)) + 'px');

				//center the nav
				$nav.css({
					"top": 60,
					"left": 60
				});
			}
		}

		function cleanup() {

			$(window).off('resize.about');

		}
		return api;
	}

	/**
	 * Sets up the docs page
	 */
	function Docs() {

		var api = {
			"load": load,
			"cleanup": cleanup
		};

		function load() {

			$(window).on('resize.docs', alignContent);

			function alignContent() {

				//center the screen on the home div
				$panel.css({
					"left": 20,
					"top": 120,
					"-webkit-transform": "rotateZ(-45deg)"
				});

				//get the width of each nav item
				var width = 0;
				$nav.children('a').each(function() {
					width += $(this).outerWidth();
				});

				//center the nav
				$nav.css({
					"top": windowHeight - 120,
					"left": 60
				});
			}

		}

		function cleanup() {

			$(window).off('resize.docs');
			$panel.css({
				"-webkit-transform": "rotateZ(0deg)"
			});

		}

		return api;
	}
});