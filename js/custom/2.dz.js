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