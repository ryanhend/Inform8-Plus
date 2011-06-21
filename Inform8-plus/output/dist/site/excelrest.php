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

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="export.xls"');
    header('Cache-Control: max-age=0');

	//TODO add security checks
	$reqobj = Request::getOrPost("object");
	$field = Request::getOrPost("field");
	$value = Request::getOrPost("value");
	$expanded = Request::getOrPost("expanded");

	$reqDao = $reqobj."Dao";
	$dao = new $reqDao();
	if ($field == 'ALL' && $value == 'ALL') {
		$objs = $dao->getAll();
	}else {
	   $objs = IQL::select($reqobj)->where(null, $field, '=', $value)->get();
	}
	if ($objs == -1) {
		die;
	}
	$objCount = count($objs);
		
	$reqBuilder = $reqobj."ExcelBuilder";
	$builder = new $reqBuilder();
	
	/** Include path **/
	ini_set('include_path', ini_get('include_path').':plugins/phpexcel/');

	/** PHPExcel */
	include 'PHPExcel.php';

	/** PHPExcel_Writer_Excel2007 */
	include 'PHPExcel/Writer/Excel5.php';

	// Create new PHPExcel object
	$objPHPExcel = new PHPExcel();

	// Set properties
	$objPHPExcel->getProperties()->setCreator("");
	$objPHPExcel->getProperties()->setLastModifiedBy("");
	$objPHPExcel->getProperties()->setTitle("");
	$objPHPExcel->getProperties()->setSubject("");
	$objPHPExcel->getProperties()->setDescription("");

	// Add some data
	$objPHPExcel->setActiveSheetIndex(0);
	
	if ($expanded == '1') {
		$builder->generateExpandedHeader(1, 0, $objPHPExcel, WebContext::getLanguage());
	}else {
		$builder->generateHeader(1, $objPHPExcel, WebContext::getLanguage());
	}
	
	for ($i=0; $i < $objCount; $i++) {
		if ($expanded == '1') {
			$builder->generateExpandedRow($objs[$i], $i+2, 0, $objPHPExcel);
		}else {
			$builder->generateRow($objs[$i], $i+2, $objPHPExcel);
		}
	}

	// Rename sheet
	$objPHPExcel->getActiveSheet()->setTitle($reqobj);

    $objWriter = new PHPExcel_Writer_Excel5($objPHPExcel);
	$objWriter->save('php://output'); 
		
?>