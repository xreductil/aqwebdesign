(function($) {
	"use strict"

	// Connect the pages in this static template. The original theme ships most
	// anchors as "#", so keep the shared navigation rules in one place.
	function connectSiteLinks() {
		var page = window.location.pathname.split('/').pop() || 'index.html';
		var navLinks = {
			'Home': 'index.html',
			'Hot Deals': 'index.html#hot-deal',
			'Categories': 'store.html',
			'Laptops': 'store.html?category=laptops',
			'Smartphones': 'store.html?category=smartphones',
			'Cameras': 'store.html?category=cameras',
			'Accessories': 'store.html?category=accessories'
		};

		$('.header-logo .logo').attr('href', 'index.html');
		$('.main-nav a').each(function () {
			var label = $.trim($(this).text());
			if (navLinks[label]) $(this).attr('href', navLinks[label]);
		});

		$('.main-nav li').removeClass('active');
		if (page === 'index.html') {
			$('.main-nav a').filter(function () { return $.trim($(this).text()) === 'Home'; }).parent().addClass('active');
		} else if (page === 'store.html') {
			$('.main-nav a').filter(function () { return $.trim($(this).text()) === 'Categories'; }).parent().addClass('active');
		}

		$('.shop .cta-btn, #hot-deal .cta-btn').attr('href', 'store.html');
		$('.product-name a').attr('href', 'product.html');
		$('.review-link').attr('href', '#tab3').attr('data-toggle', 'tab');

		$('.cart-btns a').each(function () {
			var isCheckout = $.trim($(this).text()).toLowerCase().indexOf('checkout') !== -1;
			$(this).attr('href', isCheckout ? 'checkout.html' : 'checkout.html#cart');
		});
		$('.header-ctn > div:first-child > a').attr('href', 'blank.html#wishlist');

		$('.breadcrumb-tree a, .footer-links a').each(function () {
			var label = $.trim($(this).text());
			var destination = navLinks[label];
			if (label === 'Hot deals') destination = 'index.html#hot-deal';
			if (label === 'All Categories') destination = 'store.html';
			if (label === 'View Cart') destination = 'checkout.html#cart';
			if (label === 'My Account') destination = 'blank.html#account';
			if (label === 'Wishlist') destination = 'blank.html#wishlist';
			if (label === 'Track My Order') destination = 'blank.html#track-order';
			if (label === 'Help') destination = 'blank.html#help';
			if (label === 'About Us') destination = 'blank.html#about';
			if (label === 'Contact Us') destination = 'blank.html#contact';
			if (label === 'Privacy Policy') destination = 'blank.html#privacy';
			if (label === 'Orders and Returns') destination = 'blank.html#returns';
			if (label === 'Terms & Conditions' || label === 'terms & conditions') destination = 'blank.html#terms';
			if (destination) $(this).attr('href', destination);
		});

		$('.header-links a, .footer-links a').each(function () {
			var text = $.trim($(this).text());
			if ($(this).find('.fa-phone').length) $(this).attr('href', 'tel:+021955184');
			if ($(this).find('.fa-envelope-o').length) $(this).attr('href', 'mailto:email@email.com');
			if ($(this).find('.fa-map-marker').length) $(this).attr('href', 'https://maps.google.com/?q=' + encodeURIComponent(text)).attr('target', '_blank').attr('rel', 'noopener');
			if ($(this).find('.fa-user-o').length) $(this).attr('href', 'blank.html#account');
		});

		var socialLinks = {
			'fa-facebook': 'https://www.facebook.com/',
			'fa-twitter': 'https://twitter.com/',
			'fa-instagram': 'https://www.instagram.com/',
			'fa-pinterest': 'https://www.pinterest.com/',
			'fa-google-plus': 'https://accounts.google.com/',
			'fa-envelope': 'mailto:email@email.com'
		};
		$.each(socialLinks, function (icon, url) {
			$('a:has(.' + icon + ')').attr('href', url);
			if (url.indexOf('http') === 0) $('a:has(.' + icon + ')').attr('target', '_blank').attr('rel', 'noopener');
		});

		$('.header-search form').on('submit', function (e) {
			e.preventDefault();
			var query = $.trim($(this).find('input').val());
			window.location.href = 'store.html' + (query ? '?search=' + encodeURIComponent(query) : '');
		});

		if (page === 'blank.html') {
			var info = {
				'account': ['My Account', 'Manage your account, saved details and preferences here.'],
				'wishlist': ['Wishlist', 'Your saved products will appear here.'],
				'track-order': ['Track My Order', 'Enter your order information to check its delivery status.'],
				'help': ['Help', 'Find answers and contact our support team.'],
				'about': ['About Us', 'Learn more about Electro and our products.'],
				'contact': ['Contact Us', 'Call +021-95-51-84 or email email@email.com.'],
				'privacy': ['Privacy Policy', 'Read how we handle and protect customer information.'],
				'returns': ['Orders and Returns', 'Review order and return information here.'],
				'terms': ['Terms & Conditions', 'Review the terms that apply when using this store.']
			};
			function renderInfoPage() {
				var section = window.location.hash.substring(1) || 'about';
				var content = info[section] || info.about;
				$('.breadcrumb-header').text(content[0]);
				$('.breadcrumb-tree .active').text(content[0]);
				$('#breadcrumb').next('.section').find('.container .row').first().html('<div class="col-md-8 col-md-offset-2"><h2>' + content[0] + '</h2><p>' + content[1] + '</p><p><a class="primary-btn" href="store.html">Browse products</a></p></div>');
			}
			renderInfoPage();
			$(window).on('hashchange', renderInfoPage);
		}
	}

	connectSiteLinks();

	// Mobile Nav toggle
	$('.menu-toggle > a').on('click', function (e) {
		e.preventDefault();
		$('#responsive-nav').toggleClass('active');
	})

	// Fix cart dropdown from closing
	$('.cart-dropdown').on('click', function (e) {
		e.stopPropagation();
	});

	/////////////////////////////////////////

	// Products Slick
	$('.products-slick').each(function() {
		var $this = $(this),
				$nav = $this.attr('data-nav');

		$this.slick({
			slidesToShow: 4,
			slidesToScroll: 1,
			autoplay: true,
			infinite: true,
			speed: 300,
			dots: false,
			arrows: true,
			appendArrows: $nav ? $nav : false,
			responsive: [{
	        breakpoint: 991,
	        settings: {
	          slidesToShow: 2,
	          slidesToScroll: 1,
	        }
	      },
	      {
	        breakpoint: 480,
	        settings: {
	          slidesToShow: 1,
	          slidesToScroll: 1,
	        }
	      },
	    ]
		});
	});

	// Products Widget Slick
	$('.products-widget-slick').each(function() {
		var $this = $(this),
				$nav = $this.attr('data-nav');

		$this.slick({
			infinite: true,
			autoplay: true,
			speed: 300,
			dots: false,
			arrows: true,
			appendArrows: $nav ? $nav : false,
		});
	});

	/////////////////////////////////////////

	// Product Main img Slick
	$('#product-main-img').slick({
    infinite: true,
    speed: 300,
    dots: false,
    arrows: true,
    fade: true,
    asNavFor: '#product-imgs',
  });

	// Product imgs Slick
  $('#product-imgs').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    centerMode: true,
    focusOnSelect: true,
		centerPadding: 0,
		vertical: true,
    asNavFor: '#product-main-img',
		responsive: [{
        breakpoint: 991,
        settings: {
					vertical: false,
					arrows: false,
					dots: true,
        }
      },
    ]
  });

	// Product img zoom
	var zoomMainProduct = document.getElementById('product-main-img');
	if (zoomMainProduct) {
		$('#product-main-img .product-preview').zoom();
	}

	/////////////////////////////////////////

	// Input number
	$('.input-number').each(function() {
		var $this = $(this),
		$input = $this.find('input[type="number"]'),
		up = $this.find('.qty-up'),
		down = $this.find('.qty-down');

		down.on('click', function () {
			var value = parseInt($input.val()) - 1;
			value = value < 1 ? 1 : value;
			$input.val(value);
			$input.change();
			updatePriceSlider($this , value)
		})

		up.on('click', function () {
			var value = parseInt($input.val()) + 1;
			$input.val(value);
			$input.change();
			updatePriceSlider($this , value)
		})
	});

	var priceInputMax = document.getElementById('price-max'),
			priceInputMin = document.getElementById('price-min');

	if (priceInputMax) {
		priceInputMax.addEventListener('change', function(){
			updatePriceSlider($(this).parent() , this.value)
		});
	}

	if (priceInputMin) {
		priceInputMin.addEventListener('change', function(){
			updatePriceSlider($(this).parent() , this.value)
		});
	}

	function updatePriceSlider(elem , value) {
		if ( elem.hasClass('price-min') ) {
			console.log('min')
			priceSlider.noUiSlider.set([value, null]);
		} else if ( elem.hasClass('price-max')) {
			console.log('max')
			priceSlider.noUiSlider.set([null, value]);
		}
	}

	// Price Slider
	var priceSlider = document.getElementById('price-slider');
	if (priceSlider) {
		noUiSlider.create(priceSlider, {
			start: [1, 999],
			connect: true,
			step: 1,
			range: {
				'min': 1,
				'max': 999
			}
		});

		priceSlider.noUiSlider.on('update', function( values, handle ) {
			var value = values[handle];
			handle ? priceInputMax.value = value : priceInputMin.value = value
		});
	}

})(jQuery);
