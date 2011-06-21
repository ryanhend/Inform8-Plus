<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	
	class ColumnAndOrder {

		var $columnName;
		var $columnOrderDirection;
		
		function ColumnAndOrder($col) {
			$this->columnName = $col;
			$this->columnOrderDirection = "asc";
		}
		
		function getColumnName() {
			return $this->columnName;
		}
		
		function setAscending() {
			$this->columnOrderDirection = "asc";
		}

		function setDescending() {
			$this->columnOrderDirection = "desc";
		}
		
		function isAscending() {
			return $this->columnOrderDirection == "asc";
		}

		function isDescending() {
			return $this->columnOrderDirection == "desc";
		}
		
		function switchOrder() {
			if ($this->isAscending()) {
				$this->setDescending();
			}else {
				$this->setAscending();
			}
		}
		
	}
	
	class DisplaySettings {
		
		// the table view these settings apply to
		var $table;
		// For the combo which determines if they see all, enabled, disabled.
		// Relevant only for tables with enabled property.
		var $enabledDisplaySetting;
		// Number of records tjo display per page
		var $perPageSize;
		// Curr page of results
		var $currPage;
		// Column ordering
		var $order;
		
		function DisplaySettings($table) {
			$this->table = $table;
			$this->enabledDisplaySetting = 'ENABLED';
			$this->perPageSize = 50;
			$this->currPage = 0;
			$this->order = Array();			
		}
		
		function setDisplayAll() {
			$this->enabledDisplaySetting = 'ALL';
		}
		
		function setDisplayEnabled() {
			$this->enabledDisplaySetting = 'ENABLED';
		}

		function setDisplayDisabled() {
			$this->enabledDisplaySetting = 'DISABLED';
		}
		
		function isDisplayAll() {
			return $this->enabledDisplaySetting == 'ALL';
		}
		
		function isDisplayEnabled() {
			return $this->enabledDisplaySetting == 'ENABLED';
		}

		function isDisplayDisabled() {
			return $this->enabledDisplaySetting == 'DISABLED';
		}		
		
		function setPrimaryOrder($orderColumn) {
			if( count($this->order)>0 ) {
				$primary = $this->order[0];
				if ($primary->getColumnName() == $orderColumn) {
					$primary->switchOrder();
				}else {
					$this->order[0] = new ColumnAndOrder($orderColumn);
					$this->order[1] = $primary;
				}
			} else {
				$co = new ColumnAndOrder($orderColumn);
				$this->order[0] = $co;
			}
		}
		
		function getOrder() {
			return $this->order;
		}
	}
?>