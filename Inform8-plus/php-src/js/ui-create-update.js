/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * Jack create and update form functions
 */

function displayNewDialog(tableDefinition, gridId) {
	var dialog = $('#jack-new-dialog');
	dialog.empty();
	
	buildCreateFormInDialog(tableDefinition, dialog, gridId);
	
	dialog.dialog('open');
}


function buildQuickEditPanel(gridId, id, tableDefinition, panel) {
	$(panel).empty();
	var origVals = window.I8.grids[gridId].rows[id];

	var dialog = $('#jack-quick-edit-dialog');
	dialog.empty();
	
	var formContent = newForm('', "quickEditupdate", tableDefinition.name, id);
	
	newIdLabel(tableDefinition, tableDefinition.primaryKey, id).appendTo(formContent);
	var build = buildFields(tableDefinition, origVals, formContent, true, null, 'quick-update');
	$('<input />').attr("type", "submit").attr("value", getLanguageEntry('save')).appendTo(formContent);
	formContent.validate({
  	errorPlacement: function(error, element) {
      error.appendTo( element.parent() );
   	}
 	});	

	var processFn = function(data) {
		$('#jack-quick-edit-dialog').dialog('close');
		for (cidx in data.operationResults[0].displayContent) {
			if (cidx != 'id' && cidx != 'EditButtons') {
				var memAndVal = $.parseJSON(data.operationResults[0].displayContent[cidx]);
				console.log(memAndVal);
				if ('mem' in memAndVal) {
					
					// update table
					$('#'+gridId).jqGrid('setCell', id, memAndVal.mem, data.operationResults[0].displayContent[cidx], null, null, null);
					
					//update local data
					if ('lval' in memAndVal) {
						window.I8.grids[gridId].rows[id][memAndVal.mem] = memAndVal.lval;
					}else {
						window.I8.grids[gridId].rows[id][memAndVal.mem] = memAndVal.val;
					}
				}
			}
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
	
	if (tableColumnsWithLabel(tableDefinition.name, 'FILE').length >= 0) {
		submitOptions = new Object();
		submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__saving');
		submitOptions.successCallback = processFn;
		submitOptions.build = build;
		submitOptions.formContent = formContent;
		configureIFrameForm(submitOptions);
	}else {
		formContent.submit(submitFn);
	}
	
	formContent.appendTo(dialog);
	dialog.dialog('open');
}

/**
 * 
 * @param {Object} tableDefinition
 * @param {Object} object
 * @param {Object} panel
 */
function buildEditForm(tableDefinition, object, panel, viewPanel, formId) {
	
	var id = object[tableDefinition.primaryKey.name];
		
	var formContent = newForm(formId, "update", tableDefinition.name, id);
	
	newIdLabel(tableDefinition, tableDefinition.primaryKey, id).appendTo(formContent);
	var build = buildFields(tableDefinition, object, formContent, false, null, 'update');
	$('<input />').attr("type", "submit").attr("value", getLanguageEntry('save')).appendTo(formContent);
	
	var processFn = function(data) {
		buildViewForm(tableDefinition, 
			$.parseJSON(data.operationResults[0].displayContent),
			viewPanel); 
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
	
	formContent.validate({
		errorPlacement: function(error, element) {
			error.appendTo( element.parent() );
   		}
 	});		
	
	if (tableColumnsWithLabel(tableDefinition.name, 'FILE').length >= 0) {
		submitOptions = new Object();
		submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__saving');
		submitOptions.successCallback = processFn;
		submitOptions.build = build;
		submitOptions.formContent = formContent;
		configureIFrameForm(submitOptions);
	}else {
		formContent.submit(submitFn);
	}
	
	panel.empty();
	var wrapper = $('<div />').addClass('jack-createviewupdate-form').append(formContent).appendTo(panel);
	
	var postEditFunctionCall = 'build' + tableDefinition.name + 'EditFormComplete';
	if (postEditFunctionCall in window) {
		window[postEditFunctionCall](tableDefinition, object, panel, viewPanel, formId);
	}
}

/**
 * 
 * @param {Object} tableDefinition
 * @param {Object} object
 * @param {Object} panel
 */
function buildCreateForm(tableDefinition, panel, formId) {
	
	var formContent = newForm(formId, "create", tableDefinition.name, null);
	var build = buildFields(tableDefinition, null, formContent, false, null, 'create');
	$('<input />').addClass('jack-crud-reset').attr("type", "reset").attr("value", getLanguageEntry('reset')).appendTo(formContent);
	$('<input />').addClass('jack-crud-save').attr("type", "submit").attr("value", getLanguageEntry('save')).appendTo(formContent);
	
	var submitFn = function() {
		if ($(this).valid()) {
    		
			if (build != null && ('rtes' in build) && build.rtes.length > 0) {
				for (idx in build.rtes) {
					build.rtes[idx].rte('updateTa');
				}
			}			
			
			var formdata = $(this).serialize();
			submitOptions = new Object();
			submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__creating');
			submitOptions.formdata = formdata;
			submitForm(submitOptions);
   		}
    	return false;	
	};
	
	
	if (tableColumnsWithLabel(tableDefinition.name, 'FILE').length >= 0) {
		submitOptions = new Object();
		submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__saving');
		submitOptions.build = build;
		submitOptions.formContent = formContent;
		configureIFrameForm(submitOptions);
	}else {
		formContent.submit(submitFn);
	}
	
	formContent.validate({
		errorPlacement: function(error, element) {
			error.appendTo( element.parent() );
   		}
 	});		
	var wrapper = $('<div />').addClass('jack-createviewupdate-form').append(formContent).appendTo(panel);
}

function buildCreateFormInDialog(tableDefinition, dialog, gridId) {
	var formContent = newForm("", "create", tableDefinition.name, null);
	var build = buildFields(tableDefinition, null, formContent, false, null, 'create');
	
	var inputs = $('<div />');
	
	$('<input />').addClass('jack-crud-reset').attr("type", "reset").attr("value", getLanguageEntry('reset')).appendTo(inputs);
	$('<input />').addClass('jack-crud-save').attr("type", "submit").attr("value", getLanguageEntry('save')).appendTo(inputs);
	
	inputs.appendTo(formContent);
	
	var processFn = function() {
		dialog.dialog('close');
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
			submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__creating');
			submitOptions.formdata = formdata;
			submitOptions.gridId = gridId;
			submitOptions.successCallback = processFn;
			submitForm(submitOptions);
   		}
    	return false;	
	};
	if (tableColumnsWithLabel(tableDefinition.name, 'FILE').length > 0) {
		submitOptions = new Object();
		submitOptions.loadingMessage = getLanguageEntry('Tbl_' + tableDefinition.name + '__saving');
		submitOptions.build = build;
		submitOptions.successCallback = processFn;
		submitOptions.formContent = formContent;
		submitOptions.gridId = gridId;
		configureIFrameForm(submitOptions);
	}else {
		formContent.submit(submitFn);
	}
	
	formContent.validate({
		errorPlacement: function(error, element) {
			error.appendTo( element.parent() );
   		}
 	});
	$('<div />').addClass('jack-createviewupdate-form').append(formContent).appendTo(dialog);
}

function configureIFrameForm(submitOptions) {
	submitOptions.formContent.attr('action', 'ajax.php');
	submitOptions.formContent.attr('enctype', 'multipart/form-data');
	submitOptions.formContent.attr('method', 'POST');
	submitOptions.formContent.append(
	  $('<input />').attr('type', 'hidden').attr('name', 'wta').attr('value', '1')
	);
	
	submitOptions.formContent.iframePostForm({
		
		post : function () {
			if ($(this).valid()) {
				
				if (submitOptions.build != null && ('rtes' in submitOptions.build) && submitOptions.build.rtes.length > 0) {
					for (idx in submitOptions.build.rtes) {
						submitOptions.build.rtes[idx].rte('updateTa');
					}
				}				

				if ('loadingMessage' in submitOptions) {
					displayTempMessage('<img src="images/loading.gif" /> ' + submitOptions.loadingMessage, false);
				}
			}
        },
        complete : function (theresponse) {
        	data = $.parseJSON(theresponse);
        	
	    	if (data.result == 1) {
	      		displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
	      		if ('successCallback' in submitOptions) {
	      			submitOptions.successCallback(data);
	      		}
	      		if ('gridId' in submitOptions) {
	      			reloadGrid(submitOptions.gridId);
	      		}
	    	}else {
	      		displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
			}      
        }
    });				
}


function submitForm(submitOptions) {
	if ('loadingMessage' in submitOptions) {
		displayTempMessage('<img src="images/loading.gif" /> ' + submitOptions.loadingMessage, false);
	}
	$.ajax({
	  	type: "POST",
	    url: "ajax.php",
	    data: submitOptions.formdata,
	    dataType: 'json',
	    success: function(data){
	    	if (data.result == 1) {
	      		displayMessage('<img src="images/pass.png" class="feeback-success-img" /> ' + data.displayMessage);
	      		if ('successCallback' in submitOptions) {
	      			submitOptions.successCallback(data);
	      		}
	      		if ('gridId' in submitOptions) {
	      			
	      			reloadGrid(submitOptions.gridId);
	      		}
	    	}else {
	      		displayMessage('<img src="images/failed.png" class="feeback-success-img" /> ' + data.displayMessage);
	      		if ('failureCallback' in submitOptions) {
	      			submitOptions.failureCallback(data);
	      		}
			}      
		}
	});
}


function buildViewForm(tableDefinition, object, panel) {
	var viewContent = $('<div />').addClass('jack-createviewupdate-view');
	var id = object[tableDefinition.primaryKey.name];
	
	newIdLabel(tableDefinition, tableDefinition.primaryKey, id).appendTo(viewContent);
	buildViewFields(tableDefinition, object, viewContent);
	panel.empty();
	viewContent.appendTo(panel);
}


function newForm(formId, action, object, id) {
	var formContent = $('<form />').attr('id', formId);
	//set the object
	$('<input />').attr("type", "hidden").attr("name", "jackaction").attr("value",action).appendTo(formContent);
	//set the action
	$('<input />').attr("type", "hidden").attr("name", "object").attr("value",object).appendTo(formContent);
	if (id!=null) {
		$('<input />').attr("type", "hidden").attr("name", "id").attr("value",id).appendTo(formContent);
	}
	return formContent;
}
