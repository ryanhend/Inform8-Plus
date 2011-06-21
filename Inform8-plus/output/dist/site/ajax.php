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

    $auth = Session::getInstance()->getAuthenticationManager()->isAuthenticated();
    if (!$auth) {
        die();
    }
    
  //TODO add checks
    $reqobj = Request::getSafeGetOrPost("object");
    $action = Request::getSafeGetOrPost("jackaction");
    if ($action == null) {
      // old option, conflicts with the file upload plugin though... form
      // action attribute does not get set...
      $action = Request::getSafeGetOrPost("action");
    }
  
  if($action == 'help') {
    include ('config/authenticatedajax/help.php');
  }else if($action == 'home') {
    include ('config/authenticatedajax/home.php');
  }else if($action == 'calendar') {
    include ('config/authenticatedajax/calendar.php');
  }else if($action == 'Manager' || $action == 'Update' || $action == 'View'
   || $action == 'Create' || $action == 'Order' || $action == 'FkData' 
   || $action == 'Upload' || $action == 'Send') {
    require ('config/authenticatedajax/' . $reqobj . $action . '.php');
  }else {
    require ('config/authenticatedajax/' . $reqobj . 'Crud' . '.php');
    $crudName = $reqobj . 'Crud';
    $crud = new $crudName(WebContext::getLanguage());
    $res = $crud->$action();
    
    $wrapWithTa = Request::getSafeGetOrPost("wta");
    if ($wrapWithTa == 1) {
      echo '<textarea>' . json_encode($res) . '</textarea>';
    }else{
      echo json_encode($res);
    }
  }
  
?>