/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * Jack Edit Fields
 */

function buildFields(tableDefinition, object, formContent, testDisplayinGrid, ignoredFields, formtype) {
	var build = new Object();
	build['rtes'] = new Array();
	
	var om = orderColumns(tableDefinition);	
	
	for (x=0; x < om.length; x++) {
		var theMember = om[x];
		if((ignoredFields == null || $.inArray(theMember, ignoredFields) < 0) && (!testDisplayinGrid || theMember.displaySettings.displayInGrid)) {
			var daValue = '';
			if (object != null) {
				daValue = object[theMember.name];
			}
			 
			if ($.inArray('hidden', theMember.displaySettings.labels) >= 0) {
				newHiddenField(tableDefinition, theMember, '').appendTo(formContent);
			
			}else if ('jsBuildFunction' in theMember.displaySettings.properties) {
				var theFunc = theMember.displaySettings.properties.jsBuildFunction;
				if (theFunc in window) {
					var res = window[theFunc](tableDefinition, theMember, daValue, formtype);
					if (res != null) {
						res.appendTo(formContent);
					}
				}
			}else if ($.inArray('readonlyedit', theMember.displaySettings.labels) >= 0 &&
				(formtype == 'quick-update' || formtype == 'update')) {
				newViewField(tableDefinition, theMember, daValue, object).appendTo(formContent);
			}else if ($.inArray('FILE', theMember.displaySettings.labels) >= 0) {
				newFileInput(tableDefinition, theMember, daValue).appendTo(formContent);
			}else if (theMember.type == 'varchar') {
				if ($.inArray('pwd', theMember.displaySettings.labels) >= 0) {
		  		newPasswordInput(tableDefinition, theMember, '').appendTo(formContent);
			  }
			  else {
		  		newTextInput(tableDefinition, theMember, daValue).appendTo(formContent);
				}
			}else if(theMember.type == 'boolean') {
				newBooleanInput(tableDefinition, theMember, daValue).appendTo(formContent);
			}else if(theMember.type == 'enum') {
				newEnumInput(tableDefinition, theMember, daValue).appendTo(formContent);
			}else if(theMember.type == 'int' || theMember.type == 'mediumint' || theMember.type == 'bigint' || theMember.type == 'largeint' || theMember.type == 'smallint' || theMember.type == 'tinyint') {
				newIntInput(tableDefinition, theMember, daValue).appendTo(formContent);
			}else if(theMember.type == 'text' || theMember.type == 'longtext') {
				if ($.inArray('rte', theMember.displaySettings.labels) >= 0) {
					var ta = newTextAreaForRTE(tableDefinition, theMember, daValue).appendTo(formContent);
					var block = newEditFieldBlock(tableDefinition, theMember, ta);
					ta.addClass('rte-zone');
					build.rtes.push(ta.rte({media_url:'plugins/rte/'}));
					block.appendTo(formContent);	
				}else {
					newTextAreaInput(tableDefinition, theMember, daValue).appendTo(formContent);	
				}
			}else if(theMember.type == 'decimal') {
				newDecimalInput(tableDefinition, theMember, daValue).appendTo(formContent);
			}else if(theMember.type == 'date') {
				newDateInput(tableDefinition, theMember, daValue).appendTo(formContent);
			}else if(theMember.type == 'datetime') {
				newDateTimeInput(tableDefinition, theMember, daValue).appendTo(formContent);				
			}else {
				if ($.inArray('creation-dbcreate', theMember.displaySettings.labels) < 0) {
					newTextInput(tableDefinition, theMember, daValue).appendTo(formContent);
				}
			}	
		}
	}
	return build;
}



function newEditFieldBlock(theTable, theFieldDefinition, daField) {
	var wrapper = newWrapper();
	newLabel(theTable, theFieldDefinition, true).appendTo(wrapper);
	daField.appendTo(newFieldWrapper().appendTo(wrapper));
	newClearLeft().appendTo(wrapper);
	return wrapper;
}



function newBooleanInput(theTable, theFieldDefinition, value) {
	var yesField = $('<input />').attr('name', theFieldDefinition.name).attr('type', 'radio').addClass('required').attr('value', 1);
	var noField = $('<input />').attr('name', theFieldDefinition.name).attr('type', 'radio').addClass('required').attr('value', 0);
	daField = $('<div />').append('Yes: ').append(yesField).append('&nbsp;&nbsp; No: ').append(noField);
	
	if (value == "0") {
		noField.attr('checked', true);
	}else if (value == "1") {
		yesField.attr('checked', true);
	}

	yesField.addClass("jack-field");
	yesField.addClass("jack-field-radio");
	
	noField.addClass("jack-field");
	noField.addClass("jack-field-radio");

	return newEditFieldBlock(theTable, theFieldDefinition, daField);
} 



function newPasswordInput(theTable, theFieldDefinition, value) {
	var daField = $('<input />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name)
		.attr('type', 'password');
	
	daField.addClass("jack-field");
	daField.addClass("jack-field-password");
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
} 



function newTextInput(theTable, theFieldDefinition, value) {

	var daField = $('<input />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name)
		.attr('type', 'text').attr('value', value);
	
  if ('length' in theFieldDefinition.displaySettings.properties && 
		  theFieldDefinition.displaySettings.properties.length > 0) {
  	daField.attr('maxlength', theFieldDefinition.displaySettings.properties.length);
  }
	if ('htmlLength' in theFieldDefinition.displaySettings.properties) {
  	daField.attr('size', theFieldDefinition.displaySettings.properties.htmlLength);
  }
		
	daField.addClass("jack-field");
	daField.addClass("jack-field-text");
		
	if($.inArray('WEB_ADDRESS', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("url");
	}
	if($.inArray('EMAIL', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("email");
	}
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("required");
	}

	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}



function newEnumInput(theTable, theFieldDefinition, value) {
	var daField = $('<select />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name);
	
	var enumOptions = theFieldDefinition.displaySettings.properties.enumOptions.split(",");
	for(opt in enumOptions) {
		var option = $('<option />').html(enumOptions[opt]);
		if (value == enumOptions[opt]) {
			option.attr('selected', true);
		}
		option.appendTo(daField);
	}
		
	daField.addClass("jack-field");
	daField.addClass("jack-field-enum");
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}



//
// Creates a new file input field.
// Should be used in conjunction with the iframe post plugin to do the file upload. 
// Ajax does not support file uploads
function newFileInput(theTable, theFieldDefinition, value) {

	var daField = $('<input />')
		.attr('name', theFieldDefinition.name)
		.attr('id', theTable.name + '-' + theFieldDefinition.name)
		.attr('type', 'file');
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}


function newIntInput(theTable, theFieldDefinition, value) {
	if($.inArray('priority-hml', theFieldDefinition.displaySettings.labels) >= 0) {
		return newPriorityInput(theTable, theFieldDefinition, value);
	}else if($.inArray('rating1-10', theFieldDefinition.displaySettings.labels) >= 0) {
		return newRating1To10Input(theTable, theFieldDefinition, value);
	}
	
	if( 'foriegnKey' in theFieldDefinition && theFieldDefinition.foriegnKey != null) { 
		return newFkIntInput(theTable, theFieldDefinition, value);
	}
	
	var daField = $('<input />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name)
		.attr('type', 'text').attr('value', value);

		
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("required");
	}
	
	daField.addClass("jack-field").addClass("jack-field-int").addClass("digits");
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}



function newFkIntInput(theTable, theFieldDefinition, value) {
	var daField = $('<select />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name);
	$('<option />').attr('id', '').text('Loading list please wait...').appendTo(daField);
	
	var fkid = theTable.name + "_" + theFieldDefinition.name + "__" + theFieldDefinition.foriegnKey.otherTable + "_" + theFieldDefinition.foriegnKey.otherField;
	var updateFunction = function() {
			daField.html('');
			
			if ($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) < 0) {
				var option = $('<option />');
				option.appendTo(daField);
			}
			
			var options = window.I8.fkdata[fkid];
			for(idx in options) {
				var option = $('<option />').attr('value', options[idx].id).text(options[idx].val)
				if (options[idx].id == value) {
					option.attr('selected', true);
				}
				option.appendTo(daField);	
			}
			return false;
	};

	if (window.I8.fkdata[fkid] === undefined) {
		getFkData(theFieldDefinition.foriegnKey, theTable, theFieldDefinition, updateFunction);
	}else {
		updateFunction();
	}

	var refresh = $('<a />').addClass('jk-fkrefresh').attr('href', '#').text('refresh').click(function() {
		daField.html('');
		$('<option />').text(getLanguageEntry('refreshing')).appendTo(daField);
		getFkData(theFieldDefinition.foriegnKey, theTable, theFieldDefinition, updateFunction)
	});
	var daFieldWrapepr = $('<div />').append(daField).append(refresh);
	
	return newEditFieldBlock(theTable, theFieldDefinition, daFieldWrapepr);
}


function newDecimalInput(theTable, theFieldDefinition, value) {
	var daField = $('<input />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name)
		.attr('type', 'text').attr('size', 10).attr('value', value);
		
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("required");
	}
	
	daField.addClass("number").addClass("jack-field").addClass("jack-field-int");
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}

function newPriorityInput(theTable, theFieldDefinition, value) {
	var highField = $('<input />').attr('name', theFieldDefinition.name).attr('type', 'radio').attr('value', 2);
	var mediumField = $('<input />').attr('name', theFieldDefinition.name).attr('type', 'radio').attr('value', 1);
	var lowField = $('<input />').attr('name', theFieldDefinition.name).attr('type', 'radio').attr('value', 0);
	
	daField = $('<div />').append('High: ').append(highField).append('&nbsp;&nbsp; Medium: ').append(mediumField).append('&nbsp;&nbsp; Low: ').append(lowField);
	
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		highField.addClass("required").addClass("jack-field").addClass("jack-field-hml");
		mediumField.addClass("required").addClass("jack-field-hml");
		lowField.addClass("required").addClass("jack-field-hml");
	}

	if (value == "0") {
  	lowField.attr('checked', true);
  }else if (value == "1") {
  	mediumField.attr('checked', true);
	}else if (value == "2") {
  	highField.attr('checked', true);
	}
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}


function newRating1To10Input(theTable, theFieldDefinition, value) {
	
	var daField = $('<select />').attr('name', theFieldDefinition.name);
	
	for ( var x = 0; x <= 10; x++) {
		var input = $('<option />').attr('value', x).text(x);
		if (value == x) {
			input.attr('selected', true);
		}
		daField.append(input);
	}
	
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("required").addClass("jack-field").addClass("jack-field-rating1to10");
	}
	
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}


function newTextAreaForRTE(theTable, theFieldDefinition, value){
	var daField = $('<textarea />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name + getRteIdx())
		.attr('rows', 5).attr('cols', 60).val(value);
	daField.addClass("jack-field");
	daField.addClass("jack-field-textarea");
	
	return daField;	
}

function newTextAreaInput(theTable, theFieldDefinition, value){
	var daField = $('<textarea />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name)
		.attr('rows', 5).attr('cols', 60).val(value);
		
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		daField.addClass("required");
	}
	
	daField.addClass("jack-field");
	daField.addClass("jack-field-textarea");
	

	var block = newEditFieldBlock(theTable, theFieldDefinition, daField);
	if($.inArray('rte', theFieldDefinition.displaySettings.labels) >= 0) {
		//console.log(daField);
		daField.addClass('rte-zone');
		daField.rte({media_url:'plugins/rte/'});
	}
	return block;
}

function newDateInput(theTable, theFieldDefinition, value){
	var millis = new Date().getTime();
	
	var daHiddenField = $('<input />').attr('name', theFieldDefinition.name)
		.attr('id', millis + '-' + theTable.name + '-' + theFieldDefinition.name).attr('type', 'hidden').attr('value', value);
	var daPickerField = $('<input />')
		.attr('name', theFieldDefinition.name + '-picker')
		.attr('id', millis + '-' + theTable.name + '-' + theFieldDefinition.name + '-picker')
		.attr('type', 'text');

	if (value != null && value != '') {
		var dpDateVals = value.split('-');
		daPickerField.attr('value', dpDateVals[2]+'-'+ dpDateVals[1]+'-'+ dpDateVals[0]);
	}
	
	daPickerField.addClass("jack-field").addClass("jack-field-date");
	
	if($.inArray('NOT_NULL', theFieldDefinition.displaySettings.labels) >= 0) {
		daPickerField.addClass("required");
	}	
	
	var daField = $('<div/>');
	daHiddenField.appendTo(daField);
	daPickerField.appendTo(daField);
	
	daPickerField.datepicker({altFormat: 'yy-mm-dd', altField: '#'+millis + '-' + theTable.name + '-' + theFieldDefinition.name, dateFormat: 'dd-mm-yy', buttonImage: 'images/calendar.png' });

	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}

function newDateTimeInput(theTable, theFieldDefinition, value){
	var millis = new Date().getTime();
	
	daField = $('<div />').timepicker();
	return newEditFieldBlock(theTable, theFieldDefinition, daField);
}


function getRteIdx() {
	if ('rtes' in window.I8) {
		window.I8.rtes.idx++;
	}else {
		window.I8.rtes = new Object();
		window.I8.rtes.idx = 0;
	}
	
	return window.I8.rtes.idx;
}