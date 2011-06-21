<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	
	class TableDisplaySettings {	
		
		var $labels = Array();
		var $properties = Array();
		
		function __construct($labels, $properties) {
			$this->labels = $labels;
			$this->properties = $properties;
		}
		
		function addLabel($label) {
			$this->labels[] = $label;
		}
		
		function addProperty($key, $prop) {
			$this->properties[$key] = $prop;
		}	

    function getProperty($key) {
      return $this->properties[$key];
    } 
		
		function hasLabel($lbl) {
			foreach ($this->labels as $value) {
			    if ($lbl == $value) {
			    	return true;
			    }
			}
			return false;
		}
	}
	
?>