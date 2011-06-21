<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	
	class TableMemberDisplaySettings {	
		
		/** index for display */
		var $displayIndex = 1;
		
		/** By default is displayed in the GridView */
		var $displayInGrid = true;

		var $labels = Array();
		
		var $properties = Array();
		
		function __construct($displayIndex, $displayInGrid, $labels, $properties) {
			$this->displayIndex = $displayIndex;
			$this->displayInGrid = $displayInGrid;
			$this->labels = $labels;
			$this->properties = $properties;
		}
		
		function getDisplayIndex() {
			return $this->displayIndex;
		}
		
		function getDisplayInGrid() {
			return $this->displayInGrid;
		}
		
		function addLabel($label) {
			$this->labels[] = $label;
		}
		
		function addProperty($key, $label) {
			$this->properties[$key] = $label;
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