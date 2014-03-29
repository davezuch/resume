
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
window.DZ = (function DZ(){

    Array.prototype.each = function(fn) {
        for (var i=0, l=this.length; i<l; i++) {
            if (false === fn.call(this[i], i)) { break; }
        }
        return this;
    };

    var win = window,
        doc = win.document,
        viewportmeta = doc.querySelector && doc.querySelector('meta[name="viewport"]'),
        ua = navigator.userAgent,
        aps = Array.prototype.slice;

    return {
        UA: ua,

        scaleFix: function() {
            if (viewportmeta && /iPhone|iPad|iPod/.test(ua) && !/Opera Mini/.test(ua)) {
                viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0';
                document.addEventListener('gesturestart', this.gestureStart, false);
            }
        },

        gestureStart: function() {
            viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
        },

        hideUrlBarOnLoad: function() {
            var self = this,
                bodycheck;

            // If there's a hash, or addEventListener is undefined, stop here
            if (!location.hash && win.addEventListener) {

                // scroll to 1
                win.scrollTo( 0, 1 );
                self.BODY_SCROLL_TOP = 1;

                // reset to 0 on bodyready, if needed
                bodycheck = setInterval(function() {
                    if (doc.body) {
                        clearInterval(bodycheck);
                        self.BODY_SCROLL_TOP = self.getScrollTop();
                        self.hideUrlBar();
                    }
                }, 15);

                self.addEvent(win, 'load', function() {
                    setTimeout(function() {
                        if (self.getScrollTop() < 20) {
                            self.hideUrlBar();
                        }
                    }, 0);
                });
            }
        },

        hideUrlBar: function() {
            if (!location.hash && this.BODY_SCROLL_TOP !== false) {
                win.scrollTo(0, this.BODY_SCROLL_TOP === 1 ? 0 : 1);
            }
        },

        getScrollTop: function() {
            return win.pageYOffset || doc.compatMode === 'CSS1Compat' && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        },

        enableActive: function() {
            doc.addEventListener('touchstart', function() {}, false);
        },

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
        },

        getStyle: function(el, prop) {
            var self = this;
            el = this.matchOne(el);
            if(window.getComputedStyle) { // standard
                return window.getComputedStyle(el)[prop];
            } else if(el.currentStyle) { // IE
                return el.currentStyle[prop];
            } else { // May as well try
                return el.style[prop];
            }
        }
    };
})();
/**
 * scripts.js
 */
// (function($) {

// your code here

// }(jQuery));

/* global DZ, Modernizr, console */

Modernizr.addTest('backgroundclip',function() {
	var div = document.createElement('div');
	if ('webkitBackgroundClip' in div.style) {return true;}

	'Webkit Moz O ms Khtml'.replace(/([A-Za-z]*)/g, function(val) { 
		if (val + 'BackgroundClip' in div.style) {return true;}
	});
});

(function(){
	DZ.scaleFix();
	DZ.hideUrlBarOnLoad();
	DZ.enableActive();

	var scrollEl = DZ.UA.match(/webkit/i) ? document.body : document.documentElement;

	function fixNav() {
		var header = DZ.matchOne('header div.belt'),
			hHeight = header.scrollHeight,

			nav = DZ.matchOne('header nav'),
			//header = DZ.matchOne('header'),
			origOffsetY = nav.offsetTop,
			nHeight = nav.scrollHeight,
			stickyCSS = DZ.newStyle('body.sticky { padding-top: ' + nHeight + 'px; }');

		function onScroll(e) {
			var sY = scrollEl.scrollTop;
			if(sY >= origOffsetY) {
				DZ.addClass(scrollEl, 'sticky');
			} else {
				DZ.removeClass(scrollEl, 'sticky');
			}

			/*if(sY <= hHeight) { DZ.updateStyle(stickyCSS, 'header div.belt { top: ' + -(sY / 2) + 'px; }'); }*/
		}

		DZ.addEvent(document, 'scroll', onScroll);
	}

	var touch = ('orientation' in window), ev;
	/*if(touch) {
		DZ.addClass(document.body, 'touch');
	} else {*/
		DZ.addEvent(document, 'DOMContentLoaded', fixNav);
		DZ.addEvent(window, 'load', fixNav);
	//}

	function scrollPage(target, time) {
		if(!target) {return;}
		time = time || 500;
		var offset = DZ.matchOne('header').offsetHeight,
			from = scrollEl.scrollTop,
			to = isNaN(target) ? target.offsetTop + offset : target,
			start = new Date().getTime(),
			timer = setInterval(function() {
				var step = Math.min(1, (new Date().getTime()-start) / time);
				scrollEl.scrollTop = (from + step * (to - from));
				if(step === 1) {clearInterval(timer);}
			}, 25);
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

	var navEl = DZ.getId('nav-belt'),
		navShown = false;

	function showNav(e) {
		//console.log('showNav', e);
		DZ.addClass(navEl, 'show');
		navShown = true;
	}

	function hideNav() {
		DZ.removeClass(navEl, 'show');
		navShown = false;
	}

	function onBodyClick(e) {
		//console.log('bodyClick', e);
		if(navShown && e.target.id !== 'nav-toggle') {
			hideNav();
		}

		var hash = e.target.hash;
		if(!hash) {
			return;
		}

		e.preventDefault();
		scrollPage(DZ.matchOne(hash));

		if(window.history.pushState) {
			window.history.pushState({'hash': hash}, hash, hash);
		}
	}

	DZ.addEvent(document.documentElement, 'click touchend', onBodyClick);
	DZ.addEvent(window, 'popstate', onPopState);
	DZ.addEvent('#nav-toggle', 'click', showNav);

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

	var loaderEl = DZ.getId('loader'),
		errEl = DZ.getId('form-error'),
		panEls = DZ.match('.pan'),
		thanksEl = DZ.getId('thanks'),
		draftEl = DZ.getId('draft'),
		pEl = DZ.matchOne('p', thanksEl),
		sentData = [],
		revertText;

	function sendEmail(form) {
		var self = this,
			data = encodeURIComponent(JSON.stringify({
				'name': form.name.value,
				'email': form.email.value,
				'subject': form.subject.value,
				'message': form.message.value
			})),
			req = new XMLHttpRequest();

		if(sentData.indexOf(data) > -1) {
			return showThanks('I appreciate your enthusiasm to reach me, but the first email sent succesfully, there\'s no need for a duplicate. :)');
		}

		DZ.addClass(loaderEl, 'on');
		//console.log(serialize(data));

		req.onreadystatechange = function(e) {
			console.log('readyState:', req.readyState);
			if(4 === req.readyState) {
				//console.log('status:', req.status);
				DZ.removeClass(loaderEl, 'on');
				if(200 === req.status) {
					sentData.push(data);
					showThanks();
				} else {
					errEl.innerHTML = ['Sorry, there was an error with your submission. Please try again or send an email to: <a href="mailto:resume', 'davidzuch.me">resume', 'davidzuch.me</a>'].join('@');
					DZ.removeClass(errEl, 'hide');

					var errH = errEl.offsetHeight;
					errEl.style.height = '0';
					setTimeout(function(){errEl.style.height = errH + 'px';}, 1);
				}
			}
		};
		req.open('POST', '/send', true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		//req.setRequestHeader('Connection', 'close');
		req.send('data=' + data);
	}

	function showThanks(msg) {
		if(msg) {
			revertText = pEl.innerHTML;
			pEl.innerHTML = msg;
		}

		panEls.each(function() {
			this.style.left = '-100%';
		});
		panEls[0].style.height = draftEl.offsetHeight + 'px';
		setTimeout(function(){panEls[0].style.height = thanksEl.offsetHeight + 'px';}, 1);
	}

	function showForm() {
		panEls.each(function() {
			this.style.left = '0';
		});
		panEls[0].style.height = thanksEl.offsetHeight + 'px';
		setTimeout(function(){panEls[0].style.height = draftEl.offsetHeight + 'px';}, 1);

		if(revertText) {
			setTimeout(function() {
				pEl.innerHTML = revertText;
				revertText = '';
			}, 500);
		}
	}

	function onSubmit(e) {
		e.preventDefault();
		var form = this,
			errors = validate(form);

		DZ.removeClass(DZ.match('.error', form), 'error');

		DZ.addClass(errEl, 'hide');
		errEl.innerHTML = '';
		errEl.style.height = '';

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
	DZ.addEvent('#return', 'click', showForm);

	DZ.match('h2, h3').each(function(){
		this.innerHTML = this.innerHTML.replace(/(.)$/, '<span class="last-letter">$1</span>');
	});
})();