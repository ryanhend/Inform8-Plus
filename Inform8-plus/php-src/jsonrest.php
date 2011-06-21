<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php
  // site settings + config + seession load
  require_once 'config/settings.php';

	//TODO add checks
	$reqobj = Request::getOrPost("object");
	$field = Request::getOrPost("field");
	$value = Request::getOrPost("value");
	$expanded = Request::getOrPost("expanded");

//	print($reqobj);
//	print($field);	
//	print($value);	
	
	$reqDao = $reqobj."Dao";
	$dao = new $reqDao();
	
	$reqJsonBuilder = $reqobj."JsonBuilder";
	$builder = new $reqJsonBuilder();
	
	if ($field == 'ALL' && $value == 'ALL') {
		$objs = $dao->getAll();
	} else {	
		$objs = IQL::select($reqobj)->where(NULL, $field, '=', $value)->get();
	}
	
	if ($objs != -1) {
		$objCount = count($objs);
		for ($i=0; $i < $objCount; $i++) {
			if ($i>0) echo "\n";
			$obj = $objs[$i];
			if ($expanded == '1') {
				echo $builder->toExpandedJson($obj);
			}else {
				echo $builder->toJson($obj);
			}
		}
	}
?>