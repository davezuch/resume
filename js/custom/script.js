/**
 * scripts.js
 */
// (function($) {

// your code here

// }(jQuery));

/* global DZ, MBP, console */

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
			var self = this;
			el = this.match(el);
			evs = evs.split(' ');
			el.each(function(){
				for(var i=0, l=evs.length; i<l; i++) {
					self._addEvent(this, evs[i], fn);
				}
			});
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
			if(!css || typeof css !== 'string') { return false; }
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
			if(!style || style.tagName.toLowerCase() !== 'style') { return this.newStyle(css); }
			if(style.styleSheet) { style.styleSheet.cssText = css; }
			else { style.appendChild(document.createTextNode(css)); }
			return style;
		},

		replaceStyle: function(style, css) {
			if(!style || style.tagName.toLowerCase() !== 'style') { return this.newStyle(css); }
			style.parentNode.removeChild(style);
			return this.newStyle(css);
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

			/*if(sY <= hHeight) { DZ.updateStyle(stickyCSS, 'header div.belt { top: ' + -(sY / 2) + 'px; }'); }*/
		}

		var header = DZ.matchOne('header div.belt'),
			hHeight = header.scrollHeight,

			nav = DZ.matchOne('header nav'),
			//header = DZ.matchOne('header'),
			origOffsetY = nav.offsetTop,
			nHeight = nav.scrollHeight,
			stickyCSS = DZ.newStyle('body.sticky { padding-top: ' + nHeight + 'px; }');

		DZ.addEvent(document, 'scroll', onScroll);
	}

	var touch = ('orientation' in window), ev;
	if(touch) {
		DZ.addClass(document.body, 'touch');
	} else {
		DZ.addEvent(document, 'DOMContentLoaded', fixAdr);
		DZ.addEvent(window, 'load', fixAdr);
	}

	function scrollPage(target, time) {
		if(!target) {return;}
		time = time || 400;
		var el = document.documentElement,
			offset = DZ.matchOne('header').offsetHeight,
			from = el.scrollTop,
			to = isNaN(target) ? target.offsetTop + offset : target,
			start = new Date().getTime(),
			timer = setInterval(function() {
				var step = Math.min(1, (new Date().getTime()-start) / time);
				el.scrollTop = (from + step * (to - from));
				if(step === 1) {clearInterval(timer);}
			}, 25);
	}

	function onBodyClick(e) {
		var hash = e.target.hash;
		if(!hash) {return;}

		e.preventDefault();
		scrollPage(DZ.matchOne(hash));

		if(window.history.pushState) {
			window.history.pushState({'hash': hash}, hash, hash);
		}
	}

	function onPopState(e, data) {
		var hash = window.location.hash;
		e.preventDefault();

		if(hash) {
			scrollPage(DZ.matchOne(hash));
		} else {
			scrollPage(0);
		}
	}

	DZ.addEvent(document.documentElement, 'click', onBodyClick);
	DZ.addEvent(window, 'popstate', onPopState);

	/*DZ.addEvent(DZ.match('textarea'), 'change keypress', function(){
		DZ.removeClass(this, 'transit');
		var oh = this.offsetHeight;
		this.style.height = '';
		var h = this.scrollHeight;
		this.style.height = oh + 'px';
		DZ.addClass(this, 'transit');
		this.style.height = h + 'px';
	});*/

	DZ.match('.textbelt textarea').each(function(){
		var textarea = this,
			textbelt = this.parentNode,
			oh = this.offsetHeight,
			clone = (function(){
				/*var props = ['height', 'width', 'lineHeight'],
					propOb = {}, i = 0, l = props.length, prop;

				for(; i<l; i++) {
					prop = props[i];
					propOb[prop] = window.getComputedStyle(textarea)[prop];
				}*/

				var clone = textarea.cloneNode();
				clone.removeAttribute('name');
				clone.removeAttribute('id');
				DZ.addClass(clone, 'offscreen');
				clone.setAttribute('tabIndex', '-1');
				textbelt.parentNode.insertBefore(clone, textbelt);

				return clone;
			})(),
			lastScrollHeight = null,
			updateSize = function() {
				textbelt.scrollTop = 0;
				clone.style.height = '';
				clone.value = textarea.value;
				//clone.scrollHeight = 10000;

				//var scrollHeight = Math.max(clone.scrollHeight, oh);
				var scrollHeight = clone.scrollHeight - 3;

				if(lastScrollHeight === scrollHeight) { return; }
				lastScrollHeight = scrollHeight;

				textbelt.style.height = scrollHeight + 'px';
				clone.style.height = scrollHeight + 'px';
			};

		DZ.addEvent(textarea, 'keyup keydown change', updateSize);
	});

	DZ.match('h2, h3').each(function(){
		this.innerHTML = this.innerHTML.replace(/(.)$/, '<span class="last-letter">$1</span>');
	});
})();