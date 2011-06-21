/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * General Functions
 */

function showEdit(editId, viewId, saveButtonId) {
  $("#" + editId).show();
  $("#" + saveButtonId).show();
  $("#" + viewId).hide();
}

function showView(editId, viewId, saveButtonId) {
  $("#" + editId).hide();
  $("#" + saveButtonId).hide();
  $("#" + viewId).show();
}

function displayImage(imgSrc) {
  var dialog = $('#jack-img-dialog');
  dialog.empty();

  $('<img />').attr('src', imgSrc).appendTo(dialog);

  dialog.dialog('open');
}

function deleteItem(table, ids, viewId, editId, saveId, deleteId) {

  var conf = confirm("Are you sure you want to delete this item?");
  if (!conf) {
    return false;
  }

  var formdata = 'action=deleteMultiple&object=' + table + '&ids=' + ids;
  displayTempMessage('<img src="images/loading.gif" /> Deleting item... please wait.', false);

  $.ajax( {
    type : "POST",
    url : "ajax.php",
    data : formdata,
    dataType : 'json',
    success : function(data) {
      if (data.result == 1) {
        var ids = data.content;

        showView(editId, viewId, saveId);

        $('#' + editId).empty()
        $('#' + editId).html('<br><br>Item deleted.')

        displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);

        $('#' + saveId).empty();
        $('#' + deleteId).empty();
      } else {
        showView(editId, viewId, saveId);
        displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
      }

    }
  });

  return false;
}

function populateComboWithFkData(fkOptions, tableMember) {

  fkOptions.html("");
  $("<option value=''>Loading list.....</option>").appendTo(fkOptions);
  var fk = tableMember.foriegnKey;
  $.ajax( {
    type : "POST",
    url : "ajax.php",
    data : 'action=FkData&object=' + fk.otherTable,
    dataType : 'json',
    success : function(data) {
      fkOptions.html("");
      for (i in data) {
        $("<option value='" + data[i].id + "'>" + data[i].val + "</option>").appendTo(fkOptions);
      }
    }
  });
}