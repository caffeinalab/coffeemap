"use strict";

function CoffeeMap(opt) {
	var self = this;

	if (opt.containerSelector == null) {
		throw new Error('CoffeeMap: define a container selector');
	}

	self.opt = _.defaults(opt, {

		containerSelector: null,
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

	});


	self.paths = {};

	self.$container = jQuery(self.opt.containerSelector).addClass('coffeemap-container');

	self.$container.on('mouseenter', 'path', function(e) {
		var $path = jQuery(e.target);
		if ($path.attr('highlighted') == null) return;

		// Get the country object
		var id = $path[0].id;
		self.$tooltip.referral = id;

		var obj_country = self.paths[ id ];

		// Calculate the best position for the tooltip
		var bounds = $path[0].getBoundingClientRect();
		var offset = $path.offset();

		var offset_map = self.$container.find('.coffeemap-map').offset();
		offset.left -= offset_map.left;
		offset.top -= offset_map.top;

		// Call the function the will populate the tooltip
		self.opt.highlightCallback.call(self, obj_country);

		// Set the "parent" of tooltip
		self.$tooltip.uiShow({
			top: offset.top + bounds.height,
			left: offset.left + (bounds.width / 2) - (self.$tooltip.width() / 2) - 10
		});
	});

	///////////////////////
	// Mouse leave path //
	///////////////////////

	self.$container.on('mouseleave', 'path', function(e) {
		var isOverOn = jQuery(e.target)[0].id;
		var wasOverOn = self.$tooltip.referral;

		self.$tooltip.referral = false;

		// Actually "hide" the tooltip after 500ms
		self.$tooltip.hideTimeout = setTimeout(self.$tooltip.uiHide, 500);
	});

	////////////////////
	// Click on path //
	////////////////////

	self.$container.on('click', '.coffeemap-map path', function(e) {
		var $path = jQuery(e.target);
		var id = $path[0].id;

		if ($path.attr('clickable') != null) {
			if (_.isFunction(self.opt.clickableCallback)) {
				var obj_country = self.paths[ id ];
				self.opt.clickableCallback.call(self, obj_country);
			}
		}
	});

	///////////////////////////
	// Click on the mobilist //
	///////////////////////////

	self.$container.on('click', '.coffeemap-mobilist li', function(e) {
		var $li = jQuery(e.target);
		var id = $li.data('id');

		if (_.isFunction(self.opt.clickableCallback)) {
			self.opt.clickableCallback.call(self, id);
		}
	});


	/////////////////////////////////////////////////
	// Get the SVG async and append all the things //
	/////////////////////////////////////////////////

	$.ajax({
		url: self.opt.baseSVGPath + '/' + self.opt.mapName + '.svg',
		dataType: 'xml',
		success: function(svgContent, status, xhr) {
			self.buildAndAppendSVG(xhr);
			self.buildAndAppendMobilist();
			self.buildAndAppendTooltip();
		}
	});

}

CoffeeMap.prototype.parseCountry = function(code, attribute) {
	var self = this;

	var $dom = self.$svg.find('#' + code);
	if ($dom.length > 0) {
		$dom.attr(attribute, true);
		if (!self.paths[code]) {
			self.paths[code] = { code : code };
			$dom.find('> desc > *').each(function() {
				self.paths[code][ this.tagName ] = jQuery(this).html();
			});
		}
	}
};

CoffeeMap.prototype.buildAndAppendSVG = function(xhr) {
	var self = this;

	self.$svg = jQuery(xhr.responseXML.documentElement);
	self.$svg.attr({
		"class": 'coffeemap-map',
		width: '100%',
		preserveAspectRatio: true,
	});

	// Add clickable and hightlighed countries
	_.each(self.opt.clickableCountries, function(c) { self.parseCountry(c, 'clickable'); });
	_.each(self.opt.highlightedCountries, function(c) { self.parseCountry(c, 'highlighted'); });

	// Add effect. to the DOM
	self.$container.append( self.$svg );
};

CoffeeMap.prototype.buildAndAppendMobilist = function() {
	var self = this;

	var $mobilist = jQuery('<ul/>', {
		"class": 'coffeemap-mobilist',
	});

	_.each(self.opt.clickableCountries, function(id) {
		$mobilist.append(jQuery('<li/>', {
			html: self.paths[id].name,
			"data-id": id
		}));
	});

	// Add effect. the mobilist
	self.$container.append( $mobilist );
};

CoffeeMap.prototype.buildAndAppendTooltip = function() {
	var self = this;

	self.$tooltip = jQuery('<div/>', {
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

	// add effect. the tooltip
	self.$container.append( self.$tooltip );
};

////////////////////////
// jQuery integration //
////////////////////////

jQuery.fn.coffeeMap = function() {
	jQuery(this).each(function() {
		var $t = jQuery(this);
		$t.data('coffeemap', new CoffeeMap({
			containerSelector: $t,
			mapName: $t.data('map-name'),
			baseSVGPath: $t.data('base-svg-path'),
			highlightedCountries: $t.data('highlighted-countries'),
			clickableCountries: $t.data('clickable-countries')
		}));
	});
};