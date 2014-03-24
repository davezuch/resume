/**
 * MBP - Mobile boilerplate helper functions
 */

/* global MBP */

(function(document) {

    window.MBP = window.MBP || {};

    /**
     * Fix for iPhone viewport scale bug
     * http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/
     */

    MBP.viewportmeta = document.querySelector && document.querySelector('meta[name="viewport"]');
    MBP.ua = navigator.userAgent;

    MBP.scaleFix = function() {
        if (MBP.viewportmeta && /iPhone|iPad|iPod/.test(MBP.ua) && !/Opera Mini/.test(MBP.ua)) {
            MBP.viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
            document.addEventListener('gesturestart', MBP.gestureStart, false);
        }
    };

    MBP.gestureStart = function() {
        MBP.viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
    };

    /**
     * Normalized hide address bar for iOS & Android
     * (c) Scott Jehl, scottjehl.com
     * MIT License
     */

    // If we split this up into two functions we can reuse
    // this function if we aren't doing full page reloads.

    // If we cache this we don't need to re-calibrate everytime we call
    // the hide url bar
    MBP.BODY_SCROLL_TOP = false;

    // So we don't redefine this function everytime we
    // we call hideUrlBar
    MBP.getScrollTop = function() {
        var win = window;
        var doc = document;

        return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    };

    // It should be up to the mobile
    MBP.hideUrlBar = function() {
        var win = window;

        // if there is a hash, or MBP.BODY_SCROLL_TOP hasn't been set yet, wait till that happens
        if (!location.hash && MBP.BODY_SCROLL_TOP !== false) {
            win.scrollTo( 0, MBP.BODY_SCROLL_TOP === 1 ? 0 : 1 );
        }
    };

    MBP.hideUrlBarOnLoad = function() {
        var win = window;
        var doc = win.document;
        var bodycheck;

        // If there's a hash, or addEventListener is undefined, stop here
        if ( !location.hash && win.addEventListener ) {

            // scroll to 1
            window.scrollTo( 0, 1 );
            MBP.BODY_SCROLL_TOP = 1;

            // reset to 0 on bodyready, if needed
            bodycheck = setInterval(function() {
                if ( doc.body ) {
                    clearInterval( bodycheck );
                    MBP.BODY_SCROLL_TOP = MBP.getScrollTop();
                    MBP.hideUrlBar();
                }
            }, 15 );

            win.addEventListener('load', function() {
                setTimeout(function() {
                    // at load, if user hasn't scrolled more than 20 or so...
                    if (MBP.getScrollTop() < 20) {
                        // reset to hide addr bar at onload
                        MBP.hideUrlBar();
                    }
                }, 0);
            });
        }
    };

    /**
     * Fast Buttons - read wiki below before using
     * https://github.com/h5bp/mobile-boilerplate/wiki/JavaScript-Helper
     */

    MBP.fastButton = function(element, handler, pressedClass) {
        this.handler = handler;
        // styling of .pressed is defined in the project's CSS files
        this.pressedClass = typeof pressedClass === 'undefined' ? 'pressed' : pressedClass;

        MBP.listenForGhostClicks();

        if (element.length && element.length > 1) {
            for (var singleElIdx in element) {
                this.addClickEvent(element[singleElIdx]);
            }
        } else {
            this.addClickEvent(element);
        }
    };

    MBP.fastButton.prototype.handleEvent = function(event) {
        event = event || window.event;

        switch (event.type) {
            case 'touchstart': this.onTouchStart(event); break;
            case 'touchmove': this.onTouchMove(event); break;
            case 'touchend': this.onClick(event); break;
            case 'click': this.onClick(event); break;
        }
    };

    MBP.fastButton.prototype.onTouchStart = function(event) {
        var element = event.target || event.srcElement;
        event.stopPropagation();
        element.addEventListener('touchend', this, false);
        document.body.addEventListener('touchmove', this, false);
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;

        element.className+= ' ' + this.pressedClass;
    };

    MBP.fastButton.prototype.onTouchMove = function(event) {
        if (Math.abs(event.touches[0].clientX - this.startX) > 10 ||
            Math.abs(event.touches[0].clientY - this.startY) > 10) {
            this.reset(event);
        }
    };

    MBP.fastButton.prototype.onClick = function(event) {
        event = event || window.event;
        var element = event.target || event.srcElement;
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        this.reset(event);
        this.handler.apply(event.currentTarget, [event]);
        if (event.type === 'touchend') {
            MBP.preventGhostClick(this.startX, this.startY);
        }
        var pattern = new RegExp(' ?' + this.pressedClass, 'gi');
        element.className = element.className.replace(pattern, '');
    };

    MBP.fastButton.prototype.reset = function(event) {
        var element = event.target || event.srcElement;
        rmEvt(element, 'touchend', this, false);
        rmEvt(document.body, 'touchmove', this, false);

        var pattern = new RegExp(' ?' + this.pressedClass, 'gi');
        element.className = element.className.replace(pattern, '');
    };

    MBP.fastButton.prototype.addClickEvent = function(element) {
        addEvt(element, 'touchstart', this, false);
        addEvt(element, 'click', this, false);
    };

    MBP.preventGhostClick = function(x, y) {
        MBP.coords.push(x, y);
        window.setTimeout(function() {
            MBP.coords.splice(0, 2);
        }, 2500);
    };

    MBP.ghostClickHandler = function(event) {
        if (!MBP.hadTouchEvent && MBP.dodgyAndroid) {
            // This is a bit of fun for Android 2.3...
            // If you change window.location via fastButton, a click event will fire
            // on the new page, as if the events are continuing from the previous page.
            // We pick that event up here, but MBP.coords is empty, because it's a new page,
            // so we don't prevent it. Here's we're assuming that click events on touch devices
            // that occur without a preceding touchStart are to be ignored.
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        for (var i = 0, len = MBP.coords.length; i < len; i += 2) {
            var x = MBP.coords[i];
            var y = MBP.coords[i + 1];
            if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };

    // This bug only affects touch Android 2.3 devices, but a simple ontouchstart test creates a false positive on
    // some Blackberry devices. https://github.com/Modernizr/Modernizr/issues/372
    // The browser sniffing is to avoid the Blackberry case. Bah
    MBP.dodgyAndroid = ('ontouchstart' in window) && (navigator.userAgent.indexOf('Android 2.3') !== -1);

    MBP.listenForGhostClicks = (function() {
        var alreadyRan = false;

        return function() {
            if(alreadyRan) {
                return;
            }

            if (document.addEventListener) {
                document.addEventListener('click', MBP.ghostClickHandler, true);
            }
            addEvt(document.documentElement, 'touchstart', function() {
                MBP.hadTouchEvent = true;
            }, false);

            alreadyRan = true;
        };
    })();

    MBP.coords = [];

    // fn arg can be an object or a function, thanks to handleEvent
    // read more about the explanation at: http://www.thecssninja.com/javascript/handleevent
    function addEvt(el, evt, fn, bubble) {
        if ('addEventListener' in el) {
            // BBOS6 doesn't support handleEvent, catch and polyfill
            try {
                el.addEventListener(evt, fn, bubble);
            } catch(e) {
                if (typeof fn === 'object' && fn.handleEvent) {
                    el.addEventListener(evt, function(e){
                        // Bind fn as this and set first arg as event object
                        fn.handleEvent.call(fn,e);
                    }, bubble);
                } else {
                    throw e;
                }
            }
        } else if ('attachEvent' in el) {
            // check if the callback is an object and contains handleEvent
            if (typeof fn === 'object' && fn.handleEvent) {
                el.attachEvent('on' + evt, function(){
                    // Bind fn as this
                    fn.handleEvent.call(fn);
                });
            } else {
                el.attachEvent('on' + evt, fn);
            }
        }
    }

    function rmEvt(el, evt, fn, bubble) {
        if ('removeEventListener' in el) {
            // BBOS6 doesn't support handleEvent, catch and polyfill
            try {
                el.removeEventListener(evt, fn, bubble);
            } catch(e) {
                if (typeof fn === 'object' && fn.handleEvent) {
                    el.removeEventListener(evt, function(e){
                        // Bind fn as this and set first arg as event object
                        fn.handleEvent.call(fn,e);
                    }, bubble);
                } else {
                    throw e;
                }
            }
        } else if ('detachEvent' in el) {
            // check if the callback is an object and contains handleEvent
            if (typeof fn === 'object' && fn.handleEvent) {
                el.detachEvent("on" + evt, function() {
                    // Bind fn as this
                    fn.handleEvent.call(fn);
                });
            } else {
                el.detachEvent('on' + evt, fn);
            }
        }
    }

    /**
     * Autogrow
     * http://googlecode.blogspot.com/2009/07/gmail-for-mobile-html5-series.html
     */

    MBP.autogrow = function(element, lh) {
        function handler(e) {
            var newHeight = this.scrollHeight;
            var currentHeight = this.clientHeight;
            if (newHeight > currentHeight) {
                this.style.height = newHeight + 3 * textLineHeight + 'px';
            }
        }

        var setLineHeight = (lh) ? lh : 12;
        var textLineHeight = element.currentStyle ? element.currentStyle.lineHeight : getComputedStyle(element, null).lineHeight;

        textLineHeight = (textLineHeight.indexOf('px') === -1) ? setLineHeight : parseInt(textLineHeight, 10);

        element.style.overflow = 'hidden';
        element.addEventListener ? element.addEventListener('input', handler, false) : element.attachEvent('onpropertychange', handler);
    };

    /**
     * Enable CSS active pseudo styles in Mobile Safari
     * http://alxgbsn.co.uk/2011/10/17/enable-css-active-pseudo-styles-in-mobile-safari/
     */

    MBP.enableActive = function() {
        document.addEventListener('touchstart', function() {}, false);
    };

    /**
     * Prevent default scrolling on document window
     */

    MBP.preventScrolling = function() {
        document.addEventListener('touchmove', function(e) {
            if (e.target.type === 'range') { return; }
            e.preventDefault();
        }, false);
    };

    /**
     * Prevent iOS from zooming onfocus
     * https://github.com/h5bp/mobile-boilerplate/pull/108
     * Adapted from original jQuery code here: http://nerd.vasilis.nl/prevent-ios-from-zooming-onfocus/
     */

    MBP.preventZoom = function() {
        var formFields = document.querySelectorAll('input, select, textarea');
        var contentString = 'width=device-width,initial-scale=1,maximum-scale=';
        var i = 0;
        var fieldLength = formFields.length;

        var setViewportOnFocus = function() {
            MBP.viewportmeta.content = contentString + '1';
        };

        var setViewportOnBlur = function() {
            MBP.viewportmeta.content = contentString + '10';
        };

        for (; i < fieldLength; i++) {
            formFields[i].onfocus = setViewportOnFocus;
            formFields[i].onblur = setViewportOnBlur;
        }
    };

    /**
     * iOS Startup Image helper
     */

    MBP.startupImage = function() {
        var portrait;
        var landscape;
        var pixelRatio;
        var head;
        var link1;
        var link2;

        pixelRatio = window.devicePixelRatio;
        head = document.getElementsByTagName('head')[0];

        if (navigator.platform === 'iPad') {
            portrait = pixelRatio === 2 ? 'img/startup/startup-tablet-portrait-retina.png' : 'img/startup/startup-tablet-portrait.png';
            landscape = pixelRatio === 2 ? 'img/startup/startup-tablet-landscape-retina.png' : 'img/startup/startup-tablet-landscape.png';

            link1 = document.createElement('link');
            link1.setAttribute('rel', 'apple-touch-startup-image');
            link1.setAttribute('media', 'screen and (orientation: portrait)');
            link1.setAttribute('href', portrait);
            head.appendChild(link1);

            link2 = document.createElement('link');
            link2.setAttribute('rel', 'apple-touch-startup-image');
            link2.setAttribute('media', 'screen and (orientation: landscape)');
            link2.setAttribute('href', landscape);
            head.appendChild(link2);
        } else {
            portrait = pixelRatio === 2 ? "img/startup/startup-retina.png" : "img/startup/startup.png";
            portrait = screen.height === 568 ? "img/startup/startup-retina-4in.png" : portrait;
            link1 = document.createElement('link');
            link1.setAttribute('rel', 'apple-touch-startup-image');
            link1.setAttribute('href', portrait);
            head.appendChild(link1);
        }

        //hack to fix letterboxed full screen web apps on 4" iPhone / iPod
        if (navigator.platform.match(/iPhone|iPod/i) && (screen.height === 568)) {
            if (MBP.viewportmeta) {
                MBP.viewportmeta.content = MBP.viewportmeta.content
                    .replace(/\bwidth\s*=\s*320\b/, 'width=320.1')
                    .replace(/\bwidth\s*=\s*device-width\b/, '');
            }
        }
    };

})(document);

//
// Selectors API Level 1 (http://www.w3.org/TR/selectors-api/)
// http://ajaxian.com/archives/creating-a-queryselector-for-ie-that-runs-at-native-speed
//
if (!document.querySelectorAll) {
	document.querySelectorAll = function(selectors) {
		var style = document.createElement('style'),
			elements = [],
			element;
		document.documentElement.firstChild.appendChild(style);
		document._qsa = [];

		style.styleSheet.cssText = selectors + '{x-qsa:expression(document._qsa && document._qsa.push(this))}';
		window.scrollBy(0, 0);
		style.parentNode.removeChild(style);

		while (document._qsa.length) {
			element = document._qsa.shift();
			element.style.removeAttribute('x-qsa');
			elements.push(element);
		}
		document._qsa = null;
		return elements;
	};
}

if (!document.querySelector) {
	document.querySelector = function(selectors) {
		var elements = document.querySelectorAll(selectors);
		return (elements.length) ? elements[0] : null;
	};
}
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
			if(false === fn.call(this[i], i)) { break; }
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
			if(selector.each && selector[0] && 'string' === typeof selector[0]) { selector = selector[0]; }
			if('string' === typeof selector) {
				// Experimental: if ID, match ID (faster), else match query
				if(/^#[^\s><+~*\[\]]+$/.test(selector)) { return this.getId(selector.substr(1)); }
				else { return (parent || document).querySelector(selector); }
			}
			return selector.each ? selector[0] : selector;
		},

		match: function(selector, parent) {
			if(selector.each && selector[0] && 'string' === typeof selector[0]) { selector = selector.join(', '); }
			if('string' === typeof selector) {
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
			if(style && style.tagName.toLowerCase() === 'style') {
				style.parentNode.removeChild(style);
			}
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
				//clone.className = 'offscreen';
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

		DZ.addEvent(textarea, 'keyup keydown change blur', updateSize);
	});

	function validate(form) {
		var fields = DZ.match('.required', form),
			errors = [];

		fields.each(function(){
			if(!this.value) {
				return errors.push({
					'field': this,
					'msg': 'This field is required.'
				});
			}
			if('email' === this.type && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
				return errors.push({
					'field': this,
					'msg': 'Please enter a valid email address.'
				});
			}
		});

		return errors;
	}

	function liftError() {
		if(!this.value) {return;}
		if('email' === this.type && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {return;}

		var parent = this.parentNode;
		if(DZ.hasClass(parent, 'textbelt')) {
			parent = parent.parentNode;
		}
		DZ.removeClass(parent, 'error');
	}

	function serialize(data) {
		var arr = [];
		for (var prop in data) {
			arr.push(prop + '=' + data[prop]);
		}
		return arr.join('&');
	}

	function sendEmail(form) {
		var data = {
				'name': form.name.value,
				'email': form.email.value,
				'subject': form.subject.value,
				'message': form.message.value
			},
			req = new XMLHttpRequest();
		//console.log(serialize(data));
		req.onreadystatechange = function(e) {
			console.log('readyState:', req.readyState);
			if(4 === req.readyState) {
				console.log('status:', req.status);
				if(200 === req.status) {

				} else {

				}
			}
		};
		req.open('POST', '/send', true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.setRequestHeader('Connection', 'close');
		req.send('data=' + encodeURIComponent(JSON.stringify(data)));
	}

	function onSubmit(e) {
		e.preventDefault();
		var form = this,
			errors = validate(form);

		DZ.removeClass(DZ.match('.error', form), 'error');

		if(errors.length) {
			errors.each(function(){
				DZ.addClass(this.field.parentNode, 'error');
			});
			errors[0].field.focus();
		} else {
			sendEmail(form);
		}
	}

	DZ.addEvent('form', 'submit', onSubmit);
	DZ.addEvent('.required', 'keyup change blur', liftError);

	DZ.match('h2, h3').each(function(){
		this.innerHTML = this.innerHTML.replace(/(.)$/, '<span class="last-letter">$1</span>');
	});
})();