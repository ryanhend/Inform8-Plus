/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK JQ Grid functions/extensions
 */

/**
 * GRID FUNCTIONS
 */
function reloadGrid(gridId) {
  clearQuickSearch(gridId);
  jQuery("#" + gridId).trigger("reloadGrid");
}



function loadGrid(gridId, quickEditId, toolbarId, quickSearchFormId, xhr, tableDef)  {
	
	if(!(gridId in window.I8.grids)) {
		window.I8.grids[gridId] = new Object();
		window.I8.grids[gridId].rows = new Object();
		window.I8.grids[gridId].tbarLoaded = false;
	}
	
	
	var daRows = $.parseJSON(xhr.responseText).rows;
	var pkIdx = window.I8.td[tableDef.name].primaryKey.name;
	
	for(idx in daRows) {
		var r = daRows[idx];
		window.I8.grids[gridId].rows[r['id']] = new Object();
		
		for (cidx in r) {
			if (cidx != 'id' && cidx != 'EditButtons') {
				var memAndVal = $.parseJSON(r[cidx]);
				if (typeof(memAndVal) == 'object') {
					if ('lval' in memAndVal) {
						window.I8.grids[gridId].rows[r['id']][memAndVal.mem] = memAndVal.lval;
					}else {
						window.I8.grids[gridId].rows[r['id']][memAndVal.mem] = memAndVal.val;
					}
				}
			}
		}
		
	}

	var ids = $("#"+gridId).jqGrid('getDataIDs'); 
	for(var i=0;i < ids.length;i++){ 
		var cl = ids[i]; 
		quickEdit = " <a href='#' title='Quick Edit'  " +
			"onclick=\"buildQuickEditPanel('" + gridId + "', '" + cl + 
			"', window.I8.td." + tableDef.name +", '#" + quickEditId + "' ); return false;\" ><img src='images/smtb/edit.jpg' /></a>"; 
		fullEdit = " <a href='#' title='View/Edit in a new tab' onclick=\"newTab('ajax.php?action=Update&object=" + tableDef.name + "&id="+cl+"', '" + getLanguageEntry('Tbl_' + tableDef.name) + " " + cl + "'); return false;\" ><img src='images/smtb/advedit.jpg' /></a>";				
		$("#" + gridId).jqGrid('setRowData',ids[i],{EditButtons:quickEdit+fullEdit});
	}

	if (!window.I8.grids[gridId].tbarLoaded) {
		var shtml = $("#" + toolbarId).html();
		$("#t_" + gridId).html(shtml);
		$("#" + toolbarId).html('');
		
		window.I8.grids[gridId].tbarLoaded = true;
		
		if(quickSearchFormId != '') {
			$("#" + quickSearchFormId + " > #search-datepicker").datepicker({dateFormat: 'yy-mm-dd'});
		}
	}
} 