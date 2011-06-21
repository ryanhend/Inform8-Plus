<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	class Table {	
	  	
	  var	$name;
	  var	$primaryKey;
	  var	$members;
	  var	$displaySettings;
	  var $fkDataField;
	  
	  function Table($name, $primaryKey, $fkDataField, $displaySettings) {
			$this->name = $name;
			$this->members = Array();
			$this->primaryKey = $primaryKey;
			$this->fkDataField = $fkDataField;
			$this->displaySettings = $displaySettings; 
		}
		
		function addMember($member) {
			$this->members[$member->name] = $member;
		}
		
		function getMembers() {
			return $this->members;
		}	

	    function getMember($name) {
			return $this->members[$name];
		}		
		
		function getDisplaySettings() {
			return $this->displaySettings;
		}			
		
		function getName() {
			return $this->name;
		}
	  
  	function getPrimaryKey() {
  		return $this->primaryKey;
  	}
	  
	}
	
?>