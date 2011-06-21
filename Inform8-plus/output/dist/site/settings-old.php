<?php 
/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
?><?php
	$site_name = 'JACK';
	date_default_timezone_set("Europe/Zurich");
	$defaultLanguage = "en";
	
  require_once 'sql/JQL.php';
  require_once 'sql/Join.php';
  require_once 'sql/OrderBy.php';
  require_once 'sql/Condition.php';
  require_once 'sql/Aggregate.php';
	
  // required classes (Generated)
  require_once 'requires.php';
  //table structure
  
  require_once 'common/tabledef/Table.php';
  require_once 'common/tabledef/TableDisplaySettings.php';
  require_once 'common/tabledef/TableMember.php';
  require_once 'common/tabledef/TableMemberDisplaySettings.php';
  require_once 'common/tabledef/TableMemberForeignKey.php';
  require_once 'common/tabledef/FieldTypes.php';
 
  
  // Display settings class
  require_once 'DisplaySettings.php';
  
  // json class
  require_once 'Json.php';  
  
  // ajax encode / decode
  require_once 'RequestResult.php';  
  require_once 'OperationResult.php';
  
  // default functions
  require_once 'Functions.php';

  // load the db
  require_once 'thedb.conn.php';
  
  // load the session + User class + language code
  require_once 'UserAuthenticate.php'; 
  require_once 'session.php';
  
  $authManager = $_SESSION["authmanager".$site_name];
  if ($authManager == NULL) {
	  $langcode = $defaultLanguage;
	  $helpLangcode = $defaultLanguage;
  }else {
	  $user = $authManager->getUser();
	  $lang = $user->getLanguageIdObject();
		
	  $langcode = $lang->getCode();
	  $helpLangcode = $lang->getCode();
		if (!file_exists($langcode . '.php')) {
			$langcode = $defaultLanguage;
		}
		if (!file_exists('help.' . $helpLangcode . '.php')) {
			$helpLangcode = $defaultLanguage;
		}	
  }
  
  // Load Site Language
  require_once $langcode . '.php';
  require_once 'Language.php';
  WebContext::getLanguage() = new Language($jack_language);

  mysql_query("SET NAMES 'utf8'");	
?>