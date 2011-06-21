<?php

    include 'lib/Inform8/loadall-plus.php';
    StaticConfig::addPreProcessor(new PlusPreProcessor());
    
  /**
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
  */
  
  // Load Site Language
  //require_once $langcode . '.php';
?>