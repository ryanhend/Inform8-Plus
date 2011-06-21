<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	
	class TableMemberForeignKey {
		var $otherTable;
		var $otherField;
		var $otherFkType;
		
		/** the side this represents */
		var $fkType;
				
		function __construct($fkType, $otherTable, $otherField, $otherFkType) {
			$this->fkType = $fkType;
			$this->otherTable = $otherTable;
			$this->otherField = $otherField;
			$this->otherFkType = $otherFkType;
		}
		
		function getOtherTable() {
			return $this->otherTable;
		}

		function getOtherField() {
			return $this->otherField;	
		}
		
		function getOtherFkType() {
			return $this->$otherFkType;	
		}			
		
		function getFkType() {
			return $this->fkType;	
		}		
	}
	
?>