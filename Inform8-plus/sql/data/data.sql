--  ====================================== 
--  Base language of English
--  ======================================
INSERT INTO Language (Code, Name) VALUES("en", "English");



--  ====================================== 
--  Standard User
--  Note: password = test
--  ======================================
INSERT INTO `User`(Enabled, Firstname, Lastname, Username, Password, LanguageId) VALUES(1, 'Ryan', 'Henderson', 'test', '098f6bcd4621d373cade4e832627b4f6', 1);



--  ====================================== 
--  Empty storage settings
--  ======================================
INSERT INTO Storage(StorageFolder, AccessLocation) VALUES ('','');