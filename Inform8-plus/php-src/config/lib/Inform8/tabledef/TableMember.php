<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	
	class TableMember {	
		var $name;
		var $notNull;
		var $defaultValue;

		/** 
		 * The type of field
		 */		
		var $type;
		
		/** 
		 * 	details of a foriegn key connection
		 */
		var $foriegnKey;
		
		var $displaySettings;
		
		function __construct($name, $type, $defaultValue, $notNull, $foriegnKey, $displaySettings) {
			$this->name = $name;
			$this->type = $type;
			$this->defaultValue = $defaultValue;
			$this->notNull = $notNull;
			$this->foriegnKey = $foriegnKey;
			$this->displaySettings = $displaySettings;
		}	
		
		function getName() {
			return $this->name;
		}
		
		function isNotNull() {
			return $this->notNull;
		}		
		
		function getDefaultValue() {
			return $this->defaultValue;
		}
		
		function getType() {
			return $this->type;
		}
		
		function getForeignKey() {
			return $this->foriegnKey;
		}	
		
		function getDisplaySettings() {
			return $this->displaySettings;
		}	

		function getFromObject($obj) {
		  $m = "get".$this->name;
		  return $obj->m();
		}
	}	
	
?>