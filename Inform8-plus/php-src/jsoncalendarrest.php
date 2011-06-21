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
	
	$calendarEntries = array();
	
	$tables = Request::getSafeGetOrPost('object');
	$tableList = array();
	
	if($tables == 'ALL') {
    $tableCount = count($JACK_TABLE_LIST);
    for ($i = 0; $i < $tableCount; $i++) {
      $table = $JACK_TABLE_LIST[$i];
      //echo $table;
      $reqDef = $table."Definition";
      $def = new $reqDef();
      if($def->getTable()->getDisplaySettings()->hasLabel('calendar')) {
        $tableList[] = $def->getTable()->getName();
	    }
	  }
	}else {
     $tableList = explode(',', $tables);
	}
	
	$tableCount = count($tableList);
	for ($i = 0; $i < $tableCount; $i++) {
		$table = $tableList[$i];
		//echo $table;
    $reqDef = $table."Definition";
    $def = new $reqDef();
   	if($def->getTable()->getDisplaySettings()->hasLabel('calendar')) { 

			$members = $def->getTable()->getMembers();
			$startField = "";
			$titleField = "";
			$endField = NULL;
			$completeField = NULL;
			$descriptionField = NULL;
			
			
    	foreach ( $members as $member ) {
      	if($member->getDisplaySettings()->hasLabel('calendar-start')) {
					$startField = $member->getName();
       	}else if($member->getDisplaySettings()->hasLabel('calendar-end')) {
       		$endField = $member->getName();
       	}else if($member->getDisplaySettings()->hasLabel('calendar-complete')) {
       		$completeField = $member->getName();
       	}else if($member->getDisplaySettings()->hasLabel('calendar-description')) {
       		$descriptionField = $member->getName();
       	}else if($member->getDisplaySettings()->hasLabel('calendar-title')) {
       		$titleField = $member->getName();
       	}
			}

			$reqDao = $table."Dao";
			$dao = new $reqDao();
			$objs = $dao->getAll();
			if (!is_null($objs) && $objs != -1) {
	    	foreach ( $objs as $obj ) {
	       	$tempEntry = array(
						'id' => $obj->getPk(),
						'title' => $obj->$titleField,
						'start' => $obj->$startField,
					  'url' => viewInNewTabJs('Update', $table,  $obj->getPk(), WebContext::getLanguage()->get($table) . ' ' . $obj->getPk()) 
					);
					if($endField != NULL) {
						$tempEntry['end'] = $obj->$endField;
					}
					$tempClassName = 'cal-'.$def->getTable()->name;
					if ($completeField != NULL) {
						if ($obj->$completeField) {
							$tempClassName .= ' jack-cal-complete';  
							$tempEntry['title'] = 'COMPLETE:' . $tempEntry['title'];
						}else {
							$tempClassName .= ' jack-cal-incomplete';
							$tempEntry['title'] = 'PENDING: ' . $tempEntry['title'];
						}
					}
					if($descriptionField != NULL && $obj->$descriptionField != NULL && $obj->$descriptionField != '') {
						$tempEntry['description'] = $obj->$descriptionField;
					}
					$tempEntry['className'] = $tempClassName;
					$calendarEntries[] = $tempEntry;
				}
			}
    }
	}
	

	//	$year = date('Y');
	//	$month = date('m');
	echo json_encode($calendarEntries);
?>