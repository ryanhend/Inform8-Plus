--  ====================================== 
--        IP Blacklist for blocking IP's
--  ======================================
CREATE TABLE `IpBlacklist` (
  `IpBlacklistId` smallint unsigned NOT NULL auto_increment,
  `Ip` varchar(255) NOT NULL,
  `Expires` Date NOT NULL,
  PRIMARY KEY  (`IpBlacklistId`)
) ENGINE=InnoDB CHARSET=utf8;



--  ====================================== 
--        Templates & General Variables
--  ======================================
CREATE TABLE `EmailTemplate` (
  `TemplateId` smallint unsigned NOT NULL auto_increment,
  `Enabled` tinyint(1) default NULL,
  `Name` varchar(255) NOT NULL,
  `SubjectTemplate` varchar(512) NOT NULL,
  `HtmlTemplate` text,
  `TextTemplate` text,
  PRIMARY KEY  (`TemplateId`)
) ENGINE=InnoDB CHARSET=utf8;

CREATE TABLE `TemplateFile` (
  `TemplateFileId` smallint unsigned NOT NULL auto_increment,
  `Enabled` tinyint(1) default NULL,
  `Name` varchar(255) NOT NULL,
  `Filename` varchar(255),
  `TemplateId` smallint unsigned NOT NULL,
  PRIMARY KEY  (`TemplateFileId`)
) ENGINE=InnoDB CHARSET=utf8;
ALTER TABLE `TemplateFile` ADD CONSTRAINT FOREIGN KEY (`TemplateId`) REFERENCES `EmailTemplate` (`TemplateId`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `Variable` (
  `VariableId` smallint unsigned NOT NULL auto_increment,
  `Enabled` tinyint(1) default NULL,
  `Name` varchar(32) NOT NULL,
  `Value` varchar(256) NOT NULL,
  `TemplateId` smallint unsigned,
  PRIMARY KEY  (`VariableId`)
) ENGINE=InnoDB CHARSET=utf8;
ALTER TABLE `Variable` ADD CONSTRAINT FOREIGN KEY (`TemplateId`) REFERENCES `EmailTemplate` (`TemplateId`) ON DELETE CASCADE ON UPDATE CASCADE;



--  ====================================== 
--  Generic user and language table.
--  ======================================
CREATE TABLE  `Language` (
  `LanguageId` SMALLINT NOT NULL auto_increment,
  `Code` varchar(4) NOT NULL,
  `Name` varchar(255) NOT NULL,
  PRIMARY KEY  (`LanguageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE  `User` (
  `UserId` BIGINT NOT NULL auto_increment,
  `Enabled` tinyint(1) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `LanguageId` SMALLINT,
  PRIMARY KEY  (`UserId`),
  UNIQUE KEY `Username` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `User` ADD CONSTRAINT FOREIGN KEY (`LanguageId`) REFERENCES `Language` (`LanguageId`) ON DELETE SET NULL ON UPDATE CASCADE;



--  ====================================== 
--        Record History Storage 
--  ======================================
CREATE TABLE  `History` (
  `HistoryId` SMALLINT NOT NULL auto_increment,
  `TableName` varchar(255) NOT NULL,
  `RecordId` BIGINT NOT NULL,
  `Json` LONGTEXT NOT NULL,
  `Created` TIMESTAMP,
  `ModifiedBy` BIGINT,	
  `ModifiedByName` varchar(255),
  PRIMARY KEY  (`HistoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `History` ADD CONSTRAINT FOREIGN KEY (`ModifiedBy`) REFERENCES `User` (`UserId`) ON DELETE SET NULL ON UPDATE CASCADE;



--  ====================================== 
--        File Storage settings 
--  ======================================
CREATE TABLE  `Storage` (
  `StorageId` SMALLINT unsigned NOT NULL auto_increment,
  `StorageFolder` text NOT NULL,
  `AccessLocation` text NOT NULL,
  PRIMARY KEY  (`StorageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




--  ====================================== 
--        Render settings for display 
--  ======================================
CREATE TABLE `TableRenderSettings` (
  `TableRenderSettingsId` smallint unsigned NOT NULL auto_increment,
  `Tablename` varchar(255) NOT NULL,
  PRIMARY KEY  (`TableRenderSettingsId`)
) ENGINE=InnoDB CHARSET=utf8;

CREATE TABLE `ColumnRenderSettings` (
  `ColumnRenderSettingsId` smallint unsigned NOT NULL auto_increment,
  `Columnname` varchar(255) NOT NULL,
  `DisplayIndex` smallint unsigned DEFAULT 999,
  `TableRenderSettingsId` smallint unsigned,
  PRIMARY KEY  (`ColumnRenderSettingsId`)
) ENGINE=InnoDB CHARSET=utf8;

ALTER TABLE `ColumnRenderSettings` ADD CONSTRAINT FOREIGN KEY (`TableRenderSettingsId`) REFERENCES `TableRenderSettings` (`TableRenderSettingsId`) ON DELETE SET NULL ON UPDATE CASCADE; 