/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * Generic UI Form functions
 */

function wrapWithForm(id, action, method, submitFunction, toWrapHtml) {
  var html = $('<form />').attr("id", id).attr("action", action).attr("method", method).submit(submitFunction);
  toWrapHtml.appendTo(html);
  return html;
}

function newHiddenField(theTable, theFieldDefinition, value) {
  var daField = $('<input />').attr('name', theFieldDefinition.name).attr('id', theTable.name + '-' + theFieldDefinition.name).attr('type', 'hidden').attr(
      'value', value);
  return daField;
}