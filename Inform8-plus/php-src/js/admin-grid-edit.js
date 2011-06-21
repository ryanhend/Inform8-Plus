/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK Grid Editing functions
 * To support CRUD operations
 */

/**
 * Save/Create Functions
 */
function create(formdata, tableName, dacallback) {
  displayTempMessage('<img src="images/loading.gif" class="feeback-loading-img" /> Creating ' + tableName + '... please wait.', false);
  $.ajax( {
    type : "POST",
    url : "ajax.php",
    data : formdata,
    dataType : 'json',
    success : function(data) {
      if (data.result == 1) {
        displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
        dacallback();
      } else {
        displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
      }
    }
  });
}

function enableSelected(table, enable, gridId, enableColumn) {
  var ids = jQuery("#" + gridId).jqGrid('getGridParam', 'selarrrow');
  var formdata = 'action=enableMultiple&object=' + table + '&ids=' + ids + '&enable=' + enable;

  if (enable) {
    displayTempMessage('<img src="images/loading.gif" /> Enabling items... please wait.', false);
  } else {
    displayTempMessage('<img src="images/loading.gif" /> Disabling items... please wait.', false);
  }

  $.ajax( {
    type : "POST",
    url : "ajax.php",
    data : formdata,
    dataType : 'json',
    success : function(data) {
      if (data.result == 1) {
        displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
        for (i in data.operationResults) {
          jQuery("#" + gridId).jqGrid('setCell', data.operationResults[i].id, enableColumn, data.operationResults[i].displayContent);

          window.I8.grids[gridId].rows[data.operationResults[i].id][enableColumn] = $.parseJSON(data.operationResults[i].displayContent).val;
        }
      } else {
        displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
      }
    }
  });

  return false;
}

/** Delete Functions */
function deleteSelected(table, gridId) {

  var conf = confirm("Are you sure you want to delete the selected items?");
  if (!conf) {
    return false;
  }

  var ids = jQuery("#" + gridId).jqGrid('getGridParam', 'selarrrow');
  var formdata = 'action=deleteMultiple&object=' + table + '&ids=' + ids;
  displayTempMessage('<img src="images/loading.gif" /> Deleting items... please wait.', false);

  $.ajax( {
    type : "POST",
    url : "ajax.php",
    data : formdata,
    dataType : 'json',
    success : function(data) {
      if (data.result == 1) {
        displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
        var opResults = data.operationResults;
        for (i in opResults) {
          jQuery("#" + gridId).jqGrid('delRowData', opResults[i].id);
        }
      } else {
        displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
      }
    }
  });

  return false;
}

function deleteSelectedLinks(objId, objTable, linkedTable, gridId) {

  var conf = confirm("Are you sure you want to delete the selected items?");
  if (!conf) {
    return false;
  }

  var ids = jQuery("#" + gridId).jqGrid('getGridParam', 'selarrrow');
  var formdata = 'action=deleteMultiple' + linkedTable + 'Links&objId=' + objId + '&object=' + objTable + '&linkedIds=' + ids;
  displayTempMessage('<img src="images/loading.gif" /> Deleting items... please wait.', false);

  $.ajax( {
    type : "POST",
    url : "ajax.php",
    data : formdata,
    dataType : 'json',
    success : function(data) {
      if (data.result == 1) {
        displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
        var opResults = data.operationResults;
        for (i in opResults) {
          jQuery("#" + gridId).jqGrid('delRowData', opResults[i].id);
        }
      } else {
        displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
      }
    }
  });

  return false;
}
