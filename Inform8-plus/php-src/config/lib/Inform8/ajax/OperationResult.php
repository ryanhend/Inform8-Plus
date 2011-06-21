<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php 
	class OperationResult {	
		/**
		 * this field represents the oprations result.
		 * 1 = The operations was successful
		 * 0 = Some operations were successful
		 * */ 
		var $result;
		
		var $id;

		var $displayMessage;

		var $displayContent;
		
		var $errorCode;

		function setPassed() {
			$this->result = 1;
			return $this;
		}
		
		function setFailed() {
			$this->result = 0;
			return $this;
		}

		/**
		 * Convenience method for single operation requests to easily create a corresponding opresults  
		 */		
		public static function fromRequestResult($reqResult) {
			$opres = new OperationResult();
			if($reqResult->isPassed()) {
				$opres->setPassed();
			}else {
				$opres->setFailed();
			}
		}
				
	}
?>