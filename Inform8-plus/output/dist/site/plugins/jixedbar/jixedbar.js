/*
 * JACK Feedback bar.
 * Some code originating from:
 * jixedbar - jQuery fixed bar - http://code.google.com/p/jixedbar/ - MIT license
 */
(function($) {

	// jixedbar plugin
	$.fn.jackfeedback = function(options) {
		var constants = {
			constOverflow: "hidden",
			constBottom: "0px"
		};
		
		var defaults = {
		};

		var ie6 = (navigator.appName == "Microsoft Internet Explorer" 
			&& parseInt(navigator.appVersion) == 4 
			&& navigator.appVersion.indexOf("MSIE 6.0") != -1);		
		
		if (options && typeof(options) == 'object') {
		    // build main options before element iteration
			var options = $.extend(defaults, options);
 		}else {
			if (options == 'clear') {
				return this.each(function() {
					$(this).find('#jack-feedback-tmsg').empty();
				});
			} else if (options == 'displayMessage') {
			}				
		}
		
		this.each(function() {
			var obj = $(this);
			var screen = jQuery(this);
			
			// set html and body style for jixedbar to work
			if ($.browser.msie && ie6) {
                $("html").css({"overflow" : "hidden", "height" : "100%"});
                $("body").css({"margin": "0px", "overflow": "auto", "height": "100%"});
			} else {
				$("html").css({"height" : "100%"});
				$("body").css({"margin": "0px", "height": "100%"});
			}

			if ($.browser.msie && ie6) {
				pos = "absolute";
			} else {
				pos = "fixed";
			}
			
			$(this).addClass("jack-feedback");
			
			// temp feedback Section
			$("<div>").attr("id", "jack-feedback-tmsg")
				.addClass("jack-feedback-tmsg").appendTo($(this));
			
			var perm = $("<div>").attr("id","jack-feedback-messages")
				.addClass("jack-feedback-messages").hide();
			
			//heading section
			var header = $("<div>").attr("id","jack-feedback-header")
				.addClass("jack-feedback-header").addClass('ui-corner-top').appendTo($(this));
			$("<div>").attr("id","jack-feedback-heading")
				.addClass("jack-feedback-heading").appendTo(header).text("Messages");
			$("<div>").attr("id","jack-feedback-expandcollapse")
				.addClass("jack-feedback-expandcollapse")
				.addClass("ui-icon")
				.addClass("ui-icon-circle-triangle-s")
				.click(function(){
					perm.toggle();
					if (perm.css("display") === "none") {
						$(this).removeClass("ui-icon-circle-triangle-n");
						$(this).addClass("ui-icon-circle-triangle-s");
					}else {
						$(this).removeClass("ui-icon-circle-triangle-s");
						$(this).addClass("ui-icon-circle-triangle-n");
					}
				})
				.appendTo(header);
			$("<div>").addClass("clear").appendTo(header);
				
			// perm feedback section
			$(perm).appendTo($(this));

			// initialize bar
			$(this).css({
				"overflow": constants['constOverflow'],
				"position": pos,
				"bottom": constants['constBottom']
			});
			
			// add bar style (theme)
			$(this).addClass("jui-bar");
			$(this).css({'margin-left': 20});
			
			// fix image vertical alignment and border
			$("img", obj).css({
				"vertical-align": "bottom",
				"border": "#ffffff solid 0px" // no border
			});
			
			// fix PNG transparency problem in IE6
			if ($.browser.msie && ie6) {
				$(this).find('li').each(function() {
					$(this).find('img').each(function() {
						imgPath = $(this).attr("src");
						altName = $(this).attr("alt");
						srcText = $(this).parent().html();
						$(this).parent().html( // wrap with span element
							'<span style="cursor:pointer;display:inline-block;filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'' + imgPath + '\');">' + srcText + '</span>' + altName
						);
					});
					$(this).find('img').each(function() {
						$(this).attr("style", "filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);"); // show image
					})
				});
			}
			
			
		});
		
		return this;
		
	};
	
	
	$.fn.buildMessageContainer = function(msg, closeFunction) {
		var barMessageID = "__jackMsg__"; // set a tooltip ID
		
		var tempElement = $("<div />");
		tempElement.attr("id", barMessageID).addClass("jack-ui-msg-wrapper");

		var container = $('<div />').addClass('ui-corner-top');
		container.appendTo(tempElement);

		// build message element
		var msgElement = $("<div />").css({"float": "left"});
		msgElement.addClass("jack-ui-msg").html(msg).appendTo(container);
		
		var closeIconWrapper = $('<div />').css({"float": "right", "margin":"1px"}).addClass('ui-state-default').hover(function(){$(this).addClass("ui-state-hover");},function(){$(this).removeClass("ui-state-hover");}).addClass('ui-corner-all');
		$('<span>close</span>').css({"cursor":"pointer"}).addClass('ui-icon').addClass('ui-icon-close').click(function() {
			closeFunction();
		}).appendTo(closeIconWrapper);	
		closeIconWrapper.appendTo(container);
		
		$('<br />').css({"clear": "both"}).appendTo(container);
		
		return tempElement;
	}
	
	
	$.fn.displayMessage = function(msg, autoHide, perm) {

		var d = new Date();
		var time = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + 
			":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes()) + 
			":" + (d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds()) +
			" &nbsp;&nbsp;&nbsp;";
		
		var newMessage = time + msg;
		
		var tempElement = this.buildMessageContainer(newMessage, function(){
			$("#jack-feedback").jackfeedback('clear');
		});
		
		tempElement.appendTo("#jack-feedback-tmsg");
		
		if (perm) {
			$("#jack-feedback-messages").prepend($("<div/>")
				.addClass("jack-feedback-message").html(newMessage));
		}
		
		if(autoHide) {
			//animateh
			tempElement.fadeIn(100).animate({opacity: 1.0}, 4000).fadeOut(2000);
		}else {
			tempElement.fadeIn(100);
		}

	};
	
})(jQuery);