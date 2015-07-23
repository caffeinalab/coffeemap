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
		var path_rect = $path[0].getBoundingClientRect();
		var path_offset = $path.offset();
		var map_offset = self.$svg.offset();
		var bounds = {
			left: path_offset.left - map_offset.left,
			top: path_offset.top - map_offset.top,
			width: path_rect.width,
			height: path_rect.height
		};

		// Call the function the will populate the tooltip
		self.opt.highlightCallback.call(self, obj_country);

		var x = bounds.left + ((obj_country['hc-middle-x'] || 0.5) * bounds.width) - (self.$tooltip.width() / 2) - 10;
		var y = bounds.top + ((obj_country['hc-middle-y'] || 0.5) * bounds.height) + 10;

		// Set the "parent" of tooltip
		self.$tooltip.uiShow({ top: y, left: x });
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
			var obj_country = self.paths[ id ];
			self.opt.clickableCallback.call(self, obj_country);
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
				self.paths[code][ this.tagName ] = jQuery(this).text();
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