<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	class RequestResult {	
		/**
		 * For single operations this field represents the oprations result.
		 * 
		 * For composite operations this value should represent the result of all operations.
		 * 1 = All operations were successful
		 * 0 = Some operations were successful
		 * -1 = No operations were successful
		 * */ 
		var $result;
		
		/**
		 * In single or composite operations this is the main message for all operations.
		 */
		var $displayMessage;
		
		/**
		 * Individual results for each operation performed.
		 * Should be for each main operation like 'Create X', 'Delete Y'
		 */
		var $operationResults = array();
		
		function setPassed() {
			$this->result = 1;
			return $this;
		}
		
				
		function isPassed() {
			return $this->result == 1;
		}
		
		function setFailed() {
			$this->result = -1;
			return $this;
		}		

		function setPartialFailure() {
			$this->result = 0;
			return $this;
		}		

		function addOperationResult($result) {
			$this->operationResults[] = $result;
		}
		
		/**
		 * if the object is null or == -1 it will create a failed result.
		 * otherwise considered passed...
		 */
		public static function newFromDbObject($obj) {
			$res = new RequestResult();
			if (is_null($obj) || (!is_object($obj) && $obj == -1) ) {
				$res->setFailed();
			}else{
				$res->setPassed();
			}
			return $res;	
		}
	}
?>