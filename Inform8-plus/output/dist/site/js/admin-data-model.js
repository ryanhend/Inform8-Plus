/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */

/**
 * JACK Data Model Functions
 * To discover certain information about the data model being used.
 */

/**
 * Table Functions
 */
function getTableDef(tableName) {
  return window.I8.td[tableName];
}

/**
 * returns and object with fields table member
 */
function splitTableAndMember(tableAndMember) {
  var split = tableAndMember.split(".");
  var tandm = new Object();
  tandm.table = split[0];
  tandm.member = split[1];
  return tandm;
}

function isNumberType(tableMember) {
  return tableMember.type == "int" || tableMember.type == "mediumint" || tableMember.type == "bigint" || tableMember.type == "tinyint"
      || tableMember.type == "smallint" || tableMember.type == "decimal";
}

function isDateType(tableMember) {
  return tableMember.type == "date" || tableMember.type == "timestamp";
}

function isEnumType(tableMember) {
  return tableMember.type == "enum";
}

function isTextType(tableMember) {
  return tableMember.type == "varchar" || tableMember.type == "text" || tableMember.type == "longtext";
}

function isBooleanType(tableMember) {
  return tableMember.type == "boolean" || tableMember.type == "tinyint";
}

function isFkType(tableMember) {
  return tableMember.foriegnKey != null;
}

function tableColumnsWithLabel(tableName, labelName) {
	var cols = new Array();
	var tbl = window.I8.td[tableName];
	for (i in tbl.members) {
		var tblMem = tbl.members[i];
		if ($.inArray(labelName, tblMem.displaySettings.labels) != -1) {
		  cols.push(tblMem);
		}
	}
	return cols;
}
