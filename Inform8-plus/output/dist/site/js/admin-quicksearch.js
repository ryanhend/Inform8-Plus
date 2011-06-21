/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK Quick Search functions
 */

function processQuickSearch(gridId, formId) {
  // get all the inputs into an array.
  var $inputs = $('#' + formId + ' :input');

  // not sure if you wanted this, but I thought I'd add it.
  // get an associative array of just the values.
  var values = {};
  $inputs.each(function() {
    values[this.name] = $(this).val();
  });

  $("#" + gridId).jqGrid('setPostData', values);
  $("#" + gridId).trigger("reloadGrid");
  return false;
}

function clearQuickSearch(gridId) {
  $("#" + gridId).jqGrid('removePostDataItem', "field");
  $("#" + gridId).jqGrid('removePostDataItem', "value");
  $("#" + gridId).jqGrid('removePostDataItem', "searchoption");
  $("#" + gridId).jqGrid('removePostDataItem', "searchtype");
  $("#" + gridId).trigger("reloadGrid");
}

function resetSearchFields(quickSearchId) {
  showSearchFields(quickSearchId, false, false, false, false);

  var comboOptions = $("#" + quickSearchId + " > #searchoption");
  comboOptions.html("");
  comboOptions.hide();
}

function showSearchFields(quickSearchId, showValue, showDatePicker, showEnum, showFk) {
  var searchValue = $("#" + quickSearchId + " > #searchvalue");
  var searchDatePicker = $("#" + quickSearchId + " > #search-datepicker");
  var searchEnumSelect = $("#" + quickSearchId + " > #search-enumSelect");
  var searchFkSelect = $("#" + quickSearchId + " > #search-fkSelect");

  (showValue) ? searchValue.show() : searchValue.hide();
  (showDatePicker) ? searchDatePicker.show() : searchDatePicker.hide();
  (showEnum) ? searchEnumSelect.show() : searchEnumSelect.hide();
  (showFk) ? searchFkSelect.show() : searchFkSelect.hide();
}

/**
 * ids - searchfield searchoption searchvalue
 * 
 * types: http://sites.google.com/site/dmswiki/
 */
function updateSearch(tableMember, quickSearchId) {
  var searchType = $("#" + quickSearchId + " > #searchtype");
  var searchoption = $("#" + quickSearchId + " > #searchoption");
  var fkOptions = $("#" + quickSearchId + " > #search-fkSelect");

  if (tableMember == '') {
    showSearchFields(quickSearchId, false, false, false, false);
    searchoption.hide();
    return;
  }

  var tableAndMemObj = splitTableAndMember(tableMember);
  var daDef = getTableDef(tableAndMemObj.table);
  var tableMember = daDef.members[tableAndMemObj.member];
  searchoption.show();

  // enum + fk

  // boolean
  // date
  // text
  // numbers
  if (isFkType(tableMember)) {
    displayFkOptions(quickSearchId, tableMember);
    searchType.val("fk");
  } else if (isBooleanType(tableMember)) {
    displayBooleanOptions(quickSearchId);
    searchType.val("bl");
  } else if (isNumberType(tableMember)) {
    displayNumberOptions(quickSearchId);
    searchType.val("vl");
  } else if (isTextType(tableMember)) {
    displayTextOptions(quickSearchId);
    searchType.val("vl");
  } else if (isDateType(tableMember)) {
    displayDateOptions(quickSearchId);
    searchType.val("dt");
  } else if (isEnumType(tableMember)) {
    displayEnumOptions(quickSearchId, tableMember);
    searchType.val("en");
  }
}

function displayFkOptions(quickSearchId, tableMember) {
  showSearchFields(quickSearchId, false, false, false, true);

  var comboOptions = $("#" + quickSearchId + " > #searchoption");
  var fkOptions = $("#" + quickSearchId + " > #search-fkSelect");

  // keep and if we find in new list we should select
  var currVal = comboOptions.val();

  comboOptions.html("");
  $("<option value='eq'>" + getLanguageEntry('searchEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='neq'>" + getLanguageEntry('searchNotEqualTo') + "</option>").appendTo(comboOptions);

  populateComboWithFkData(fkOptions, tableMember);
}

function displayEnumOptions(quickSearchId, tableMember) {
  showSearchFields(quickSearchId, false, false, true, false);

  var comboOptions = $("#" + quickSearchId + " > #searchoption");
  var enumOptions = $("#" + quickSearchId + " > #search-enumSelect");

  // keep and if we find in new list we should select
  var currVal = comboOptions.val();

  comboOptions.html("");
  $("<option value='eq'>" + getLanguageEntry('searchEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='neq'>" + getLanguageEntry('searchNotEqualTo') + "</option>").appendTo(comboOptions);

  var enums = tableMember.displaySettings.properties.enumOptions;

  enumOptions.html("");
  var enumList = enums.split(",");
  for (i in enumList) {
    $("<option value='" + enumList[i] + "'>" + enumList[i] + "</option>").appendTo(enumOptions);
  }
}

function displayTextOptions(quickSearchId) {
  showSearchFields(quickSearchId, true, false, false, false);
  var comboOptions = $("#" + quickSearchId + " > #searchoption");

  // keep and if we find in new list we should select
  var currVal = comboOptions.val();

  comboOptions.html("");

  $("<option value='cnt'>" + getLanguageEntry('searchContains') + "</option>").appendTo(comboOptions);
  $("<option value='beg'>" + getLanguageEntry('searchStartsWith') + "</option>").appendTo(comboOptions);
  $("<option value='end'>" + getLanguageEntry('searchEndsWith') + "</option>").appendTo(comboOptions);
  $("<option value='eq'>" + getLanguageEntry('searchEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='neq'>" + getLanguageEntry('searchNotEqualTo') + "</option>").appendTo(comboOptions);

}

function displayNumberOptions(quickSearchId) {
  showSearchFields(quickSearchId, true, false, false, false);
  var comboOptions = $("#" + quickSearchId + " > #searchoption");
  // keep and if we find in new list we should select
  var currVal = comboOptions.val();

  comboOptions.html("");

  $("<option value='eq'>" + getLanguageEntry('searchEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='neq'>" + getLanguageEntry('searchNotEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='lt'>" + getLanguageEntry('searchLessThan') + "</option>").appendTo(comboOptions);
  $("<option value='lte'>" + getLanguageEntry('searchLessThanOrEqual') + "</option>").appendTo(comboOptions);
  $("<option value='gt'>" + getLanguageEntry('searchGreaterThan') + "</option>").appendTo(comboOptions);
  $("<option value='gte'>" + getLanguageEntry('searchGreaterThanOrEqual') + "</option>").appendTo(comboOptions);
}

function displayBooleanOptions(quickSearchId) {
  showSearchFields(quickSearchId, false, false, false, false);
  var comboOptions = $("#" + quickSearchId + " > #searchoption");
  // keep and if we find in new list we should select
  var currVal = comboOptions.val();

  comboOptions.html("");
  $("<option value='tru'>" + getLanguageEntry('searchYesTrue') + "</option>").appendTo(comboOptions);
  $("<option value='fls'>" + getLanguageEntry('searchNoFalse') + "</option>").appendTo(comboOptions);
}

function displayDateOptions(quickSearchId) {
  showSearchFields(quickSearchId, false, true, false, false);

  var comboOptions = $("#" + quickSearchId + " > #searchoption");
  // keep and if we find in new list we should select
  var currVal = comboOptions.val();

  comboOptions.html("");
  $("<option value='eq'>" + getLanguageEntry('searchEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='neq'>" + getLanguageEntry('searchNotEqualTo') + "</option>").appendTo(comboOptions);
  $("<option value='lt'>" + getLanguageEntry('searchBefore') + "</option>").appendTo(comboOptions);
  $("<option value='lte'>" + getLanguageEntry('searchBeforeOrEqual') + "</option>").appendTo(comboOptions);
  $("<option value='gt'>" + getLanguageEntry('searchAfter') + "</option>").appendTo(comboOptions);
  $("<option value='gte'>" + getLanguageEntry('searchAfterOrEqual') + "</option>").appendTo(comboOptions);
}