/**
 * scripts.js
 */
// (function($) {

// your code here

// }(jQuery));

/* global DZ, MBP */

window.DZ = (function DZ(){

	Array.prototype.each = function(fn){
		for(var i=0, l=this.length; i<l; i++) {
			if(fn.call(this[i], i) === false) { break; }
		}
		return this;
	};

	var aps = Array.prototype.slice;

	return {
		getId: function(id, parent) {
			return (parent || document).getElementById(id);
		},

		getTags: function(tag, parent) {
			return aps.call((parent || document).getElementsByTagName(tag), 0);
		},

		matchOne: function(selector, parent) {
			if(selector.each && selector[0] && typeof selector[0] === 'string') { selector = selector[0]; }
			if(typeof selector === 'string') {
				// Experimental: if ID, match ID (faster), else match query
				if(/^#[^\s><+~*\[\]]+$/.test(selector)) { return this.getId(selector.substr(1)); }
				else { return (parent || document).querySelector(selector); }
			}
			return selector.each ? selector[0] : selector;
		},

		match: function(selector, parent) {
			if(selector.each && selector[0] && typeof selector[0] === 'string') { selector = selector.join(', '); }
			if(typeof selector === 'string') {  
				// Experimental: if ID, match ID (faster), else match query
				if(/^#[^\s><+~*\[\]]+$/.test(selector)) { return [this.getId(selector.substr(1))]; }
				else { return aps.call((parent || document).querySelectorAll(selector), 0); }
			}
			else if(selector.tagName || selector === window || selector === document) { return [selector]; }
			return selector;
		},

		// Class shortcuts
		hasClass: function(el, classNames) { // only needs to match one class, can add in option to match all classes
			el = this.matchOne(el);
			classNames = classNames.split(' ');
			for(var i=0, l=classNames.length, match=false; i<l; i++) {
				if (el && (' '+el.className+' ').indexOf(' '+classNames[i]+' ') !== -1) {
					match = true;
					break;
				}
			}
			return match;
		},

		removeClass: function(el, classNames) {
			el = this.match(el);
			classNames = classNames.split(' ');
			el.each(function(){
				if(this && 'className' in this) {
					for(var i=0, l=classNames.length; i<l; i++) {
						this.className = (' '+this.className+' ').replace(' '+classNames[i]+' ', ' ').trim();
					}
				}
			});
			return el;
		},

		addClass: function(el, classNames) {
			var self  = this;
			el = this.match(el);
			classNames = classNames.split(' ');
			el.each(function(){
				for(var i=0, l=classNames.length; i<l; i++) {
					if(this && !self.hasClass(this, classNames[i])) {
						this.className = this.className.trim() + ' ' + classNames[i];
					}
				}
			});
			return el;
		},

		toggleClass: function(el, classNames) {
			var self  = this;
			el = this.match(el);
			classNames = classNames.split(' ');
			el.each(function(){
				for(var i=0, l=classNames.length; i<l; i++) {
					if(self.hasClass(this, classNames[i])) { self.removeClass(this, classNames[i]); }
					else { self.addClass(this, classNames[i]); }
				}
			});
			return el;
		},

		addEvent: function(el, evs, fn) {
			evs = evs.split(' ');
			for(var i=0, l=evs.length; i<l; i++) {
				this._addEvent(el, evs[i], fn);
			}
		},

		_addEvent: function(el, ev, fn) {
			if(el.addEventListener) {
				el.addEventListener(ev, fn, false); //don't need the 'call' trick because in FF everything already works in the right way
			}
			else if(el.attachEvent) {//Internet Explorer
				/*if(ev === 'DOMContentLoaded') {
					el = window;
					ev = 'load';
				}*/
				el.attachEvent("on" + ev, function() {fn.call(el);});
			}
		},

		newStyle: function(css) {
			var head = document.getElementsByTagName('head')[0],
				style = document.createElement('style');

			style.type = 'text/css';
			style.media = 'screen';
			if(style.styleSheet) { style.styleSheet.cssText = css; }
			else { style.appendChild(document.createTextNode(css)); }

			head.appendChild(style);
			return style;
		},

		updateStyle: function(style, css) {
			if(!style || style.tagName.toLowerCase() !== 'style') { return false; }
			if(style.styleSheet) { style.styleSheet.cssText = css; }
			else { style.appendChild(document.createTextNode(css)); }
			return style;
		}
	};
})();

(function(){
	MBP.scaleFix();
	MBP.hideUrlBarOnLoad();
	MBP.enableActive();

	function fixAdr() {
		function onScroll(e) {
			var sY = window.scrollY;
			sY >= origOffsetY ? DZ.addClass(document.body, 'sticky') : DZ.removeClass(document.body, 'sticky');

			if(sY <= hHeight) { DZ.updateStyle(stickyCSS, 'header div.belt { top: ' + -(sY / 2.9) + 'px; }'); }
		}

		var header = DZ.matchOne('header div.belt'),
			hHeight = header.scrollHeight,

			contact = DZ.matchOne('header address'),
			//header = DZ.matchOne('header'),
			origOffsetY = contact.offsetTop,
			cHeight = contact.scrollHeight,
			stickyCSS = DZ.newStyle('body.sticky { padding-top: ' + cHeight + 'px; }');

		DZ.addEvent(document, 'scroll', onScroll);
	}

	var touch = ('orientation' in window), ev;
	if(touch) {
		DZ.addClass(document.body, 'touch');
	} else {
		DZ.addEvent(document, 'DOMContentLoaded', fixAdr);
		DZ.addEvent(window, 'load', fixAdr);
	}

	DZ.match('h2, h3').each(function(){
		this.innerHTML = this.innerHTML.replace(/(.)$/, '<span class="last-letter">$1</span>');
	});
})();