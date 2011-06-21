/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK general form functions
 * @author Ryan Henderson
 */

function resetForm(id) {
  $('#' + id)[0].reset();
}

function copySelectValueToText(selectId, textId) {
  var daVal = $(selectId + " option:selected").val();
  $(textId).val(daVal);
}