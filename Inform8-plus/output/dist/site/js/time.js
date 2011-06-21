jQuery.fn.timepicker = function(settings) {
	var config = {
			'hour': 0,
			'minute': 0,
			'am': 1
	};

	keyCode = $.ui.keyCode,
	up = keyCode.UP,
	down = keyCode.DOWN,
	right = keyCode.RIGHT,
	left = keyCode.LEFT,
	home = keyCode.HOME,
	end = keyCode.END,
	pageUp = keyCode.PAGE_UP,
	pageDown = keyCode.PAGE_DOWN;

	
    if (settings) $.extend(config, settings);

    // can pass a date. We parse here
    if ('date' in config) {
    	config.hour = today.getHours();
    	config.minute = today.getMinutes();
    }

    function newInput(name, val){
		return $('<input type="text" name="'+name+'" class="'+name+'" value="'+val+'" />');
	}
    
	function isSpecialKey(keyCode) {
		for (var i=0; i<validKeys.length; i++) // predefined list of special keys
			if (validKeys[i] == keyCode) return true;
			
		return false;
	}
		
    
    this.each(function() {
    	eventNamespace = '.ui-spinner';
    	validKeys = [up, down, right, left, pageUp, pageDown, home, end, keyCode.BACKSPACE, keyCode.DELETE, keyCode.TAB];
    	
    	var hour = newInput('hour', config.hour);
    	var minute = newInput('minute', config.minute);
    	var ampm = $('<input type="text" name="ampm" class="ampm" value="AM" />');
    	
    	ampm.bind('keydown' + eventNamespace, function(e) {
			var dir, large, limit,
			
			keyCode = e.keyCode; // shortcut for minimization
			
			if (e.ctrl || e.alt) return true; // ignore these events
			
			if (isSpecialKey(keyCode))
				inSpecialKey = true;
			
			change=false;
			switch (keyCode) {
				case up:
				case pageUp:
				case down:
				case pageDown:					
					change = true;
					break;					
			}
			
			if (change) {
				ampm.val( (ampm.val() == 'AM') ? 'PM' : 'AM' ).select();
				return false;
			}
		});
    	

		ampm.bind('blur' + eventNamespace, function() {
			if (ampm.val() != 'AM' && ampm.val() != 'PM') {
				ampm.val('AM'); 
			}
		});
    	
    	var tp = $('<div class="ui-timepicker ui-component ui-component-content ui-clearfix"></div>');
    	tp.append(hour).append('<span class="colon">:</span>').append(minute).append(ampm);
    	hour.spinner({min: 1, max: 12, width: 2, showOn: 'never',   		
    		format: function(num, places, element){
				if (num<10) {
					return '0'+num;
				}
				return num;
				}  
    	});
    	minute.spinner({
    		min: 0, 
    		max: 59, 
    		width: 2,
    		showOn: 'never',
    		format: function(num, places, element){
    			if (num<10) {
    				return '0'+num;
    			}
    			return num;
    		} 
    	});
    	
    	tp.appendTo($(this));
    	return this;
    	
    });
 
    return this;
};
