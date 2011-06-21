/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JQuery tabs functions
 */

function selectOrCreateTab(page, title) {
  var found = false;
  $('#content ul li a.jack_tabs_menuTab').each(function() {
    if ($(this).text() == title) {
      found = true;
      $(this).click();
    }
  });

  if (!found) {
    newTab(page, title);
  }
}

function newTab(page, title) {
  $("#content").tabs("add", page, title);
}
