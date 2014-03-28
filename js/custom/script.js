/**
 * scripts.js
 */
// (function($) {

// your code here

// }(jQuery));

/* global DZ, console */

(function(){
	DZ.scaleFix();
	DZ.hideUrlBarOnLoad();
	DZ.enableActive();

	function fixNav() {
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
		DZ.addEvent(document, 'DOMContentLoaded', fixNav);
		DZ.addEvent(window, 'load', fixNav);
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
			return showThanks('I appreciate your desire to contact me, but the first email sent just fine, no need for another.');
		}

		DZ.addClass(loaderEl, 'on');
		//console.log(serialize(data));

		req.onreadystatechange = function(e) {
			console.log('readyState:', req.readyState);
			if(4 === req.readyState) {
				console.log('status:', req.status);
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