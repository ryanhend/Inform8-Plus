/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK Grid Formatting/Rendering functions 
 * Used to correctly render the data as required in the grid.
 */

function formatTableLink(cellvalue, options, rowObject) {
	var daCell = $.parseJSON(cellvalue);
	return "<a class=\"aunderline\" href=\"#\" " +
	  "onclick=\"newTab('ajax.php?action=Update&object=" + daCell.otbl + 
	  "&id=" + daCell.lval + "', '" + getLanguageEntry('Tbl_' + daCell.otbl) + 
	  " " + daCell.lval + "'); return false;\">" + daCell.dval + "</a>";
}

function formatCell(cellvalue, options, rowObject) {
	var daCell = $.parseJSON(cellvalue);
	var daDef = window.I8.td[daCell.tbl];
	var type = daDef.members[daCell.mem].type;
 	
// console.log(daCell + "-" + daDef.table.members[daCell.mem].name + "-" + type);
	
	var jqCellVal = '';
	if(type=='boolean') {
		jqCellVal = formatBooleanCell(daCell, daDef, options, rowObject);
	}else if ($.inArray('fileViewAsImage', daDef.members[daCell.mem].displaySettings.labels) >= 0) {
		jqCellVal = formatFileAsImage(daCell, daDef, options, rowObject);
	}else if ($.inArray('fileViewAsLink', daDef.members[daCell.mem].displaySettings.labels) >= 0) {
		jqCellVal = formatFileAsLink(daCell, daDef, options, rowObject);		
	}else if (type=='varchar') {
		jqCellVal = formatVarChar(daCell, daDef, options, rowObject);
	}else if ($.inArray('priority-hml', daDef.members[daCell.mem].displaySettings.labels) >= 0) {
		jqCellVal = formatPriority(daCell, daDef, options, rowObject);
	}else if (daCell.val == null) {
		return '';
	}else{
		jqCellVal = daCell.val;
	}
	
	return jqCellVal;
}	


function formatVarChar(daCell, daDef, options, rowObject) {
	if ($.inArray('www', daDef.members[daCell.mem].displaySettings.labels) >= 0) {
		return '<a target="_blank" href="' + daCell.val + '">' + daCell.val + '</a>';
	}else if ($.inArray('email', daDef.members[daCell.mem].displaySettings.labels) >= 0 &&
			daCell.val != null) {
		return '<a href="mailto:' + daCell.val + '">' + daCell.val + '</a>';
	}else if (daCell.val == null) {
		return '';
	}
	return daCell.val;
}

function formatBooleanCell(daCell, daDef, options, rowObject) {
	var img="enabled.png";
	if (daCell.val == 0) {
		var img="disabled.png";
	}
	return '<img src="images/' + img + '" />';
}

function formatPriority(daCell, daDef, options, rowObject) {
	if (daCell.val == 2) {
		return '<span class="jack-ui-priority-high">High</span>';
	}else if (daCell.val == 1) {
		return '<span class="jack-ui-priority-medium">Medium</span>';
	}else if (daCell.val == 0) {
		return '<span class="jack-ui-priority-low">Low</span>';
	}
	return '-';
}

function formatFileAsImage(daCell, daDef, options, rowObject) {
	if (daCell.val != null && daCell.val != '') {
		return '<a href="#" onclick="displayImage(\'' + window.I8.storage.adminAccessFolder + '/' + daCell.val +  '\'); return false;">View Image</a>';
	}	
	return '';
}

function formatFileAsLink(daCell, daDef, options, rowObject) {
	if (daCell.val != null && daCell.val != '') {
		return '<a target="_blank" href="' + window.I8.storage.adminAccessFolder + '/' + daCell.val +  '">Download</a>';
	}	
	return '';
}
