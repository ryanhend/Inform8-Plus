/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * Generic UI functions
 */

function buildViewFields(tableDefinition, object, viewContent) {
	for (x in tableDefinition.members) {
		var daMem = tableDefinition.members[x];
		var daValue = '';
		if (object != null) {
			daValue = object[daMem.name];
		}
		
		if ($.inArray('hidden', daMem.displaySettings.labels) >= 0) {
			continue;
		}
		
		newViewField(tableDefinition, daMem, daValue, object).appendTo(viewContent);
	}
}



function newViewField(tableDefinition, tableMember, value, object) {
	if ($.inArray('fileViewAsImage', tableMember.displaySettings.labels) >= 0) {
		return newFileViewAsImage(tableDefinition, tableMember, value);
	}else if ($.inArray('fileViewAsLink', tableMember.displaySettings.labels) >= 0) {
		return newFileViewAsLink(tableDefinition, tableMember, value);
	}else if (tableMember.type == 'varchar') {
		if ($.inArray('pwd', tableMember.displaySettings.labels) < 0) {
			return newTextView(tableDefinition, tableMember, value);
		}
	}else if(tableMember.type == 'boolean') {
		return newBooleanView(tableDefinition, tableMember, value)
	}else if(tableMember.type == 'int' || tableMember.type == 'bigint' 
		|| tableMember.type == 'mediumint' || tableMember.type == 'largeint' 
		|| tableMember.type == 'smallint' || tableMember.type == 'tinyint') {
		return newIntView(tableDefinition, tableMember, value, object);
	}
	
	return newTextView(tableDefinition, tableMember, value);
}



function newViewFieldBlock(theTable, theFieldDefinition, daField) {
	var wrapper = newWrapper();
	newLabel(theTable, theFieldDefinition, false).appendTo(wrapper);
	daField.appendTo(newFieldWrapper().appendTo(wrapper));
	newClearLeft().appendTo(wrapper);
	return wrapper;
}


function newBooleanView(theTable, theFieldDefinition, value) {
	
	var daField = $('<div />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name);
	
	var img="enabled.png";
	if (value == "0") {
			var img="disabled.png";
  }
 	$('<img />').attr('src', 'images/' + img).appendTo(daField);

	return newViewFieldBlock(theTable, theFieldDefinition, daField);
} 



function newTextView(theTable, theFieldDefinition, value) {

	var daField = $('<div />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name);
	
	if($.inArray('www', theFieldDefinition.displaySettings.labels) >= 0 && value != null) {
		$('<a />').attr('href', value).text(value).appendTo(daField);
	}else if($.inArray('email', theFieldDefinition.displaySettings.labels) >= 0  && value != null) {
		$('<a />').attr('href', 'mailto:'+value).text(value).appendTo(daField);
	}else if($.inArray('rte', theFieldDefinition.displaySettings.labels) >= 0 && value != null) {
		daField.html(value);
	}else {
		daField.text(value);
	}
	return newViewFieldBlock(theTable, theFieldDefinition, daField);
}



function newFileViewAsImage(theTable, theFieldDefinition, value) {

	var daField = $('<div />')
		.attr('name', theFieldDefinition.name)
		.attr('id', theTable.name + '-' + theFieldDefinition.name);
	if (value != null && value != '') {
		var img = $('<img />')
	 	  .attr('src', window.I8.storage.adminAccessFolder + '/' + value)
		  .attr('width', 80);
	
		img.appendTo(daField);
	}
	
	return newViewFieldBlock(theTable, theFieldDefinition, daField);
}

function newFileViewAsLink(theTable, theFieldDefinition, value) {

	var daField = $('<div />')
		.attr('name', theFieldDefinition.name)
		.attr('id', theTable.name + '-' + theFieldDefinition.name);
	if (value != null && value != '') {
		var link = $('<a />')
		  .attr('href', window.I8.storage.adminAccessFolder + '/' + value)
		  .attr('target', '_blank')
		  .text('Download');
		link.appendTo(daField);
	}
	
	return newViewFieldBlock(theTable, theFieldDefinition, daField);
}


function newIntView(theTable, theFieldDefinition, value, object) {
	if($.inArray('priority-hml', theFieldDefinition.displaySettings.labels) >= 0) {
		return newPriorityView(theTable, theFieldDefinition, value);
	}else if($.inArray('rating1-10', theFieldDefinition.displaySettings.labels) >= 0) {
		return newRating1To10View(theTable, theFieldDefinition, value);
	}
	
	if( 'foriegnKey' in theFieldDefinition && theFieldDefinition.foriegnKey != null && value != null) {
		
		var theobj = $.parseJSON(object[theFieldDefinition.name+'Object']);
		var fkField = window.I8.td[theFieldDefinition.foriegnKey.otherTable].fkDataField.name;
		var daField = $('<div />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name);
		var title = getLanguageEntry('Tbl_' + theFieldDefinition.foriegnKey.otherTable) + " " + value;

		console.log('javascript:newTab("ajax.php?action=Update&object='+theFieldDefinition.foriegnKey.otherTable+'&id='+value+'", "' + title + '"); return false;');
		
		$('<a />').attr('href', '#')
			.text(theobj[fkField])
			.click(function () {
				newTab('ajax.php?action=Update&object=' + theFieldDefinition.foriegnKey.otherTable + '&id=' + value,  title); 
				return false; 
			})
			.appendTo(daField);
			
		return newViewFieldBlock(theTable, theFieldDefinition, daField);
	}
	return newTextView(theTable, theFieldDefinition, value);
}


function newPriorityView(theTable, theFieldDefinition, value) {
	var displayValue = '-';
	var displayClass = '';
	if (value == 2) {
		displayValue = 'High';
		displayClass = 'jack-ui-priority-high';
	}else if (value == 1) {
		displayValue = 'Medium';
		displayClass = 'jack-ui-priority-medium';
	}else if (value == 0) {
		displayValue = 'Low';
		displayClass = 'jack-ui-priority-low';
	}
	var daField = $('<div />')
		.attr('name', theFieldDefinition.name)
		.attr('id', theTable.name + '-' + theFieldDefinition.name)
		.text(displayValue).addClass(displayClass);
	
	return newViewFieldBlock(theTable, theFieldDefinition, daField);
}

function newRating1To10View(theTable, theFieldDefinition, value) {
	var displayValue = $('<div />');
	
	for ( var x = 0; x < value; x++) {
		displayValue.append($('<img />').attr('src', 'images/16/star.png'));
	}
	
	var displayClass = 'jack-ui-rating-' + value;

	var daField = $('<div />')
		.attr('title', value)
		.attr('name', theFieldDefinition.name)
		.attr('id', theTable.name + '-' + theFieldDefinition.name)
		.append(displayValue).addClass(displayClass);
	
	return newViewFieldBlock(theTable, theFieldDefinition, daField);
}