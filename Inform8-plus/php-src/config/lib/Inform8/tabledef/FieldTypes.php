<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php
	class FieldType {	
		var $name;

		function __construct($name) {
			$this->name = $name;
		}
	}	

	class BooleanType extends FieldType {
		function __construct() {
			parent::__construct("boolean");
		}
	}

	class EnumType extends FieldType {
		function __construct() {
			parent::__construct("enum");
		}
	}	

	////////////////// Numeric Types

	class DecimalType extends FieldType {
		function __construct() {
			parent::__construct("decimal");
		}
	}

	class IntType extends FieldType {
		function __construct() {
			parent::__construct("int");
		}
	}
	
	class BigIntType extends FieldType {
		function __construct() {
			parent::__construct("bigint");
		}
	}	
		
	class MediumIntType extends FieldType {
		function __construct() {
			parent::__construct("mediumint");
		}
	}
	
	class SmallIntType extends FieldType {
		function __construct() {
			parent::__construct("smallint");
		}
	}	
	
	class TinyIntType extends FieldType {
		function __construct() {
			parent::__construct("tinyint");
		}
	}		

	////////////////// Text Types

	class VarcharType extends FieldType {
		function __construct() {
			parent::__construct("varchar");
		}
	}
	
	class TextType extends FieldType {
		function __construct() {
			parent::__construct("text");
		}
	}	
	
	class LongTextType extends FieldType {
		function __construct() {
			parent::__construct("longtext");
		}
	}
	
	////////////////// Date Types
	
	class TimestampType extends FieldType {
		function __construct() {
			parent::__construct("timestamp");
		}
	}	
	
	class DateType extends FieldType {
		function __construct() {
			parent::__construct("date");
		}
	}
	
?>