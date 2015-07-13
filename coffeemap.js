function CoffeeMap(opt) {
	var self = this;
	opt = _.extend({

		containerSelector: 'body',
		mapName: 'world',
		baseSVGPath: '/svg',

		highlightedCountries: [],
		highlightCallback: function(obj_country) {
			this.$tooltip.html(obj_country.name);
		},

		clickableCountries: [],
		clickableCallback: function(obj_country) {
			console.log('Clicked', obj_country);
		}

	}, opt);


	/**
	 * @property $container
	 * @type {Object}
	 */
	self.$container = $(opt.containerSelector);
	self.$container.addClass('coffeemap-container');


	/**
	 * @property parsableCountries
	 * @type {Object}
	 */
	self.parsableCountries = {};

	var parseCountry = function(code, attribute) {
		var $dom = self._svg.find('#' + code);
		if ($dom.length > 0) {
			$dom.attr(attribute, true);
			self.parsableCountries[ code ] = self.parsableCountries[ code ] || {
				code: code,
				name: $dom.find('> desc > name').text(),
			};
		}
	};


	/**
	 * @method buildAndAppendSVG
	 * @param  {Object} xhr
	 */
	self.buildAndAppendSVG = function(xhr) {
		self._svg = $(xhr.responseXML.documentElement);
		self._svg.attr({
			"class": 'coffeemap-map',
			width: '100%',
			height: '100%',
			preserveAspectRatio: true,
			viewBox: '0 0 700 700'
		});


		_.each(opt.clickableCountries, function(c) { parseCountry(c, 'clickable'); });
		_.each(opt.highlightedCountries, function(c) { parseCountry(c, 'highlighted'); });

		// Add effect. to the DOM
		self.$container.append( self._svg );
	};

	/**
	 * @method buildAndAppendMobilist
	 */
	self.buildAndAppendMobilist = function() {
		var $mobilist = $('<ul/>', {
			"class": 'coffeemap-mobilist',
		});

		_.each(opt.clickableCountries, function(id) {
			$mobilist.append($('<li/>', {
				html: self.parsableCountries[id].name,
				"data-id": id
			}));
		});

		self.$container.append( $mobilist );
	};


	////////////////////////
	// Tooltip generator //
	////////////////////////

	/**
	 * @property $tooltip
	 * @type {DOM}
	 */
	self.$tooltip = $('<div/>', {
		'class': 'coffeemap-tooltip',
	});

	self.$tooltip.referral = false;
	self.$tooltip.isHover = false;

	self.$tooltip.uiHide = function() {
		if (!self.$tooltip.isHover) {
			if (!self.$tooltip.referral) {
				if (self.$tooltip.hasClass('visible')) {
					self.$tooltip.removeClass('visible');
				}
			}
		}
	};

	self.$tooltip.uiShow = function(opt) {
		if (opt != null) self.$tooltip.css(opt);
		if (!self.$tooltip.hasClass('visible')) {
			self.$tooltip.addClass('visible');
		}
	};

	self.$tooltip.hover(
		function() {
			self.$tooltip.isHover = true;
			self.$tooltip.uiShow();
		},
		function() {
			self.$tooltip.isHover = false;
			self.$tooltip.uiHide();
		}
	);

	self.$container.append( self.$tooltip );


	///////////////////////
	// Mouse enter path //
	///////////////////////

	self.$container.on('mouseenter', 'path', function(e) {
		var $path = $(e.target);
		if ($path.attr('highlighted') == null) return;

		// Get the country object
		var id = $path[0].id;
		self.$tooltip.referral = id;

		var obj_country = self.parsableCountries[ id ];

		// Calculate the best position for the tooltip
		var bounds = $path[0].getBoundingClientRect();
		var offset = $path.offset();

		var offset_map = self.$container.find('.coffeemap-map').offset();
		offset.left -= offset_map.left;
		offset.top -= offset_map.top;

		// Call the function the will populate the tooltip
		opt.highlightCallback.call(self, obj_country);

		// Set the "parent" of tooltip
		self.$tooltip.uiShow({
			top: offset.top + bounds.height,
			left: offset.left + (bounds.width / 2) - (self.$tooltip.width() / 2)
		});
	});

	///////////////////////
	// Mouse leave path //
	///////////////////////

	self.$container.on('mouseleave', 'path', function(e) {
		var isOverOn = $(e.target)[0].id;
		var wasOverOn = self.$tooltip.referral;

		self.$tooltip.referral = false;

		// Actually "hide" the tooltip after 500ms
		self.$tooltip.hideTimeout = setTimeout(self.$tooltip.uiHide, 500);
	});

	////////////////////
	// Click on path //
	////////////////////

	self.$container.on('click', '.coffeemap-map path', function(e) {
		var $path = $(e.target);
		var id = $path[0].id;

		if ($path.attr('clickable') != null) {
			if (_.isFunction(opt.clickableCallback)) {
				var obj_country = self.parsableCountries[ id ];
				opt.clickableCallback.call(self, obj_country);
			}
		}
	});

	self.$container.on('click', '.coffeemap-mobilist li', function(e) {
		var $li = $(e.target);
		var id = $li.data('id');

		if (_.isFunction(opt.clickableCallback)) {
			opt.clickableCallback.call(self, id);
		}
	});

	// Maps are taken from http://code.highcharts.com/mapdata/1.0.0/

	/////////////////////////
	// Load the SVG async //
	/////////////////////////

	$.ajax({
		url: opt.baseSVGPath + '/' + opt.mapName + '.svg',
		dataType: 'xml',
		success: function(svgContent, status, xhr) {
			self.buildAndAppendSVG(xhr);
			self.buildAndAppendMobilist();
		}
	});

}