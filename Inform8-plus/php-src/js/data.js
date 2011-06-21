/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * Functions to request data
 */

function getFkData(fk, table, tableMember, callback) {
	var fk = tableMember.foriegnKey;
	$.ajax({
	   	type: "POST",
	    url: "ajax.php",
	    data: 'action=FkData&object=' + fk.otherTable,
			dataType: 'json',
	    success: function(data) {
				var id = table.name + "_" + tableMember.name + "__" + fk.otherTable + "_" + fk.otherField;
				//console.log(id);
				window.I8.fkdata[id] = new Array(); 
	 			for (i in data) {
					window.I8.fkdata[id].push(data[i]);
				}
	    	callback();
			}
   });	
}
