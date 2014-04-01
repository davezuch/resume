/**
 * scripts.js
 */
// (function($) {

// your code here

// }(jQuery));

/* global $:true, deez, Modernizr, console */

Modernizr.addTest('backgroundclip',function() {
	var div = document.createElement('div');
	if ('webkitBackgroundClip' in div.style) {return true;}

	'Webkit Moz O ms Khtml'.replace(/([A-Za-z]*)/g, function(val) { 
		if (val + 'BackgroundClip' in div.style) {return true;}
	});
});

(function() {
	var ascope = this,
		$ = deez,
		win = window,
		doc = window.document,
		scrollEl = $.scrollEl,
		touch = ('orientation' in window),

		$navBelt = $('#nav-belt'),
		navShown = false,
		sticky = false,
		stickyHeight = 0,

		$formErr = $('#form-error'),
		$pan = $('.pan'),
		$thanks = $('#thanks'),
		$draft = $('#draft'),
		$thanksP = $('p', $thanks),
		sentData = [],
		revertText,

		R = function() {
			var self = this;

			$.initMobileFixes();
			$.setScrollOffset(function(){
				return $('header').prop('offsetHeight') - (sticky ? stickyHeight : 0);
			});

			$.bindAll(this, 'fixNav', 'onBodyClick', 'onPopState', 'showNav', 'onSubmit', 'liftError', 'showForm');

			$.on(doc, 'DOMContentLoaded', this.fixNav);
			$.on(win, 'load', this.fixNav);
			$.on(doc.body, 'click touchend', this.onBodyClick);
			$.on(win, 'popstate', this.onPopState);
			$('#nav-toggle').on('click', this.showNav);
			$('form').on('submit', this.onSubmit);
			$('.required').on('keyup change blur', this.liftError);
			$('#return').on('click', this.showForm);

			this.fixHeaders();
			this.initFlexText();

			// preserving for callbacks with lost scope
			this.$formErr = $formErr;

			setTimeout(function(){
				if($('shinebar').length) {
					$('html').style('margin-top', '');
				}
			}, 500);

			// force repaint to fix FOUC issue
			setTimeout(function(){
				scrollEl.style.display='none';
				scrollEl.offsetHeight;
				scrollEl.style.display='';
			}, 1);
		};

	R.prototype = {
		fixNav: function() {
			var nav = $.matchId('toc'),
				offset = nav.offsetTop,
				stickyCSS,

				onScroll = function(e) {
					var scroll = scrollEl.scrollTop;
					if (scroll >= offset) {
						sticky = true;
						$.addClass(scrollEl, 'sticky');
					} else {
						sticky = false;
						$.removeClass(scrollEl, 'sticky');
					}
				};

			stickyHeight = nav.scrollHeight;
			stickyCSS = $.newStyle('body.sticky, html.sticky body { padding-top: ' + stickyHeight + 'px; }');

			$.on(doc, 'scroll', onScroll);
		},

		showNav: function() {
			$navBelt.addClass('show');
			navShown = true;
		},

		hideNav: function() {
			$navBelt.removeClass('show');
			navShown = false;
		},

		onBodyClick: function(e) {
			if (navShown && 'nav-toggle' !== e.target.id) {
				this.hideNav();
			}

			var hash = e.target.hash;
			if (!hash) { return; }

			e.preventDefault();
			$(hash).scrollPage();

			if (win.history.pushState) {
				win.history.pushState({'hash': hash}, hash, hash);
			}
		},

		onPopState: function(e, data) {
			e.preventDefault();
			var hash = win.location.hash;

			if (hash) {
				$(hash).scrollPage();
			} else {
				$.scrollPage(0);
			}
		},

		fixHeaders: function() {
			$('h2, h3').each(function() {
				this.innerHTML = this.innerHTML.replace(/(.)$/, '<span class="last-letter">$1</span>');
			});
		},

		initFlexText: function() {
			$('.textbelt textarea').each(function() {
				var textarea = this,
					textbelt = this.parentNode,
					clone = (function() {
						var clone = textarea.cloneNode(),
							$clone = $(clone);

						$clone.attr({
							'name': '',
							'id': '',
							'tabIndex': '-1'
						});
						$clone.addClass('offscreen');
						textbelt.parentNode.insertBefore(clone, textbelt);

						return clone;
					})(),
					lastScrollHeight = null,
					updateSize = function() {
						textbelt.scrollTop = 0;
						clone.style.height = '';
						clone.value = textarea.value;

						var scrollHeight = clone.scrollHeight - 3;

						if (lastScrollHeight === scrollHeight) { return; }
						lastScrollHeight = scrollHeight;

						textbelt.style.height = scrollHeight + 'px';
						clone.style.height = scrollHeight + 'px';
					};

				$.on(textarea, 'keyup keydown change blur', updateSize);
			});
		},

		validate: function(form) {
			var $fields = $('.required', form),
				errors = [];

			$fields.each(function() {
				if (!this.value) {
					return errors.push({
						'field': this,
						'msg': 'This field is required.'
					});
				}
				if ('email' === this.type && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
					return errors.push({
						'field': this,
						'msg': 'Please enter a valid email address.'
					});
				}
			});

			return errors;
		},

		liftError: function(e) {
			var field = e.target;
			if (!field.value || ('email' === field.type && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value))) { return; }

			var parent = field.parentNode;
			if ($.hasClass(parent, 'textbelt')) {
				parent = parent.parentNode;
			}
			$.removeClass(parent, 'error');
		},

		sendEmail: function(form) {
			var self = this,
				data = encodeURIComponent(JSON.stringify({
					'name': form.name.value,
					'email': form.email.value,
					'subject': form.subject.value,
					'message': form.message.value
				})),
				req = new XMLHttpRequest(),
				$loader = $('#loader');

			if (sentData.indexOf(data) > -1) {
				return this.showThanks('I appreciate your enthusiasm to reach me, but the first email sent succesfully, there\'s no need for a duplicate. :)');
			}

			$loader.addClass('on');

			req.onreadystatechange = function(e) {
				if (4 === req.readyState) {
					$loader.removeClass('on');
					if (200 === req.status) {
						sentData.push(data);
						self.showThanks();
					} else {
						$formErr
							.html(['Sorry, there was an error with your submission. Please try again or send an email to: <a href="mailto:resume', 'davidzuch.me">resume', 'davidzuch.me</a>'].join('@'))
							.removeClass('hide');

						var height = $formErr.prop('offsetHeight');
						$formErr.style('height', '0');
						setTimeout(function() {
							$formErr.style('height', height + 'px');
						}, 1);
					}
				}
			};
			req.open('POST', '/send', true);
			req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			req.send('data=' + data);
		},

		showThanks: function(msg) {
			if (msg) {
				revertText = $thanksP.html();
				$thanksP.html(msg);
			}

			$pan.style('left', '-100%');
			$pan[0].style.height = $draft.prop('offsetHeight') + 'px';
			setTimeout(function() {
				$pan[0].style.height = $thanks.prop('offsetHeight') + 'px';
			}, 1);
		},

		showForm: function() {
			$pan.style('left', '0');
			$pan[0].style.height = $thanks.prop('offsetHeight') + 'px';
			setTimeout(function() {
				$pan[0].style.height = $draft.prop('offsetHeight') + 'px';
			}, 1);
			setTimeout(function() {
				$pan[0].style.height = '';
			}, 500);

			if (revertText) {
				setTimeout(function() {
					$thanksP.html(revertText);
					revertText = '';
				}, 500);
			}
		},

		onSubmit: function(e) {
			console.log($, $formErr);
			e.preventDefault();
			var form = e.target,
				errors = this.validate(form);

			$('.error', form).removeClass('error');
			$formErr.addClass('hide').html('').style('height', '');

			if (errors.length) {
				$.each(errors, function() {
					$.addClass(this.field.parentNode, 'error');
				});
				errors[0].field.focus();
			} else {
				this.sendEmail(form);
			}
		}
	};

	new R();
})();