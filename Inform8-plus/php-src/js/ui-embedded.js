/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * Functions for embedded grids
 */

function buildEmbeddedCreateForm(title, tableDefinition, panel, formId, otherTableDefinition, otherTableFieldsDefinition, otherMember, baseObjectId, grid) {

  var formContent = newEmbeddedForm(formId, "createEmbedded" + otherTableDefinition.name, tableDefinition.name, null, otherTableDefinition.name, baseObjectId);
  var ignore = new Array(otherMember);

  var build = null;
  if (otherTableFieldsDefinition != null) {
    build = buildFields(otherTableFieldsDefinition, null, formContent, false, ignore, 'emb-create');
  } else {
    build = buildFields(otherTableDefinition, null, formContent, false, ignore, 'emb-create');
  }

  $('<input />').addClass('jack-crud-reset').attr("type", "reset").attr("value", "Reset").appendTo(formContent);
  $('<input />').addClass('jack-crud-save').attr("type", "submit").attr("value", "Save").appendTo(formContent);

  formContent.validate( {
    errorPlacement : function(error, element) {
      error.appendTo(element.parent());
    }
  });

  var processFn = function(data) {
    panel.dialog('close');
    reloadGrid(grid);
    if (data.result == 1) {
      displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
    } else {
      displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
    }
  }

  var submitFn = function() {
    if ($(this).valid()) {

      if (build != null && ('rtes' in build) && build.rtes.length > 0) {
        for (idx in build.rtes) {
          build.rtes[idx].rte('updateTa');
        }
      }

      var formdata = $(this).serialize();
      submitOptions = new Object();
      submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__saving');
      submitOptions.formdata = formdata;
      submitOptions.successCallback = processFn;
      submitForm(submitOptions);
    }
    return false;
  };

  var toCheck = otherTableDefinition;
  if (otherTableFieldsDefinition != null) {
    toCheck = otherTableFieldsDefinition;
  }

  if (tableColumnsWithLabel(tableDefinition.name, 'FILE').length >= 0) {
    submitOptions = new Object();
    submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__saving');
    submitOptions.successCallback = processFn;
    submitOptions.build = build;
    submitOptions.formContent = formContent;
    configureIFrameForm(submitOptions);
  } else {
    formContent.submit(submitFn);
  }

  var wrapper = $('<div />').addClass('jack-createviewupdate-form').append($('<div />').append($('<strong />').text(title))).append('<hr />').append('<br />')
      .append(formContent).appendTo(panel);
}

function buildEmbeddedLinkForm(title, tableDefinition, panel, formId, otherTableDefinition, otherMember, baseObjectId, grid) {

  var formContent = newEmbeddedForm(formId, "new" + otherTableDefinition.name + "Link", tableDefinition.name, null, otherTableDefinition.name, baseObjectId);

  var ignore = new Array(otherMember);

  buildFields(otherTableDefinition, null, formContent, false, ignore, 'link');

  var submitFn = function() {
    if ($(this).valid()) {
      var formdata = $(this).serialize();

      displayTempMessage('<img src="images/loading.gif" /> ' + getLanguageEntry('Tbl_' + otherTableDefinition.name + '__linking'), false);
      $.ajax( {
        type : "POST",
        url : "ajax.php",
        data : formdata,
        dataType : 'json',
        success : function(data) {
          panel.dialog('close');
          reloadGrid(grid);
          if (data.result == 1) {
            displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
          } else {
            displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
          }
        }
      });
    }
    return false;
  };
  formContent.submit(submitFn);

  $('<input />').addClass('jack-crud-save').attr("type", "submit").attr("value", getLanguageEntry('link')).appendTo(formContent);
  formContent.validate( {
    errorPlacement : function(error, element) {
      error.appendTo(element.parent());
    }
  });
  var wrapper = $('<div />').addClass('jack-createviewupdate-form').append($('<div />').append($('<strong />').text(title))).append('<hr />').append('<br />')
      .append(formContent).appendTo(panel);
}

function newEmbeddedForm(formId, action, object, id, embeddedObject, embeddedBaseObjectId) {
  var formContent = newForm(formId, action, object, id);
  $('<input />').attr("type", "hidden").attr("name", "embeddedObject").attr("value", embeddedObject).appendTo(formContent);
  $('<input />').attr("type", "hidden").attr("name", "embeddedBaseObjectId").attr("value", embeddedBaseObjectId).appendTo(formContent);
  return formContent;
}