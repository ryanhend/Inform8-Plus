/* 
 * Copyright 2011 - Inform8
 * http://www.inform8.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * http://www.apache.org/licenses/LICENSE-2.0
 */
package com.eighty8.inform8;

import java.io.File;
import java.util.HashMap;
import java.util.List;

import org.apache.log4j.Logger;
import org.apache.velocity.app.VelocityEngine;

import com.eighty8.inform8.config.PlusGeneratorConfig;
import com.eighty8.inform8.config.TableAndColumnAndLabel;
import com.eighty8.inform8.config.TableColumnProperty;
import com.eighty8.inform8.config.TableLabel;
import com.eighty8.inform8.config.TableProperty;
import com.eighty8.inform8.db.DbConnection;
import com.eighty8.inform8.db.model.DatabaseModel;
import com.eighty8.inform8.db.model.ModelBuilder;
import com.eighty8.inform8.db.mysql.MysqlConnection;
import com.eighty8.inform8.db.mysql.MysqlModelBuilder;
import com.eighty8.inform8.db.table.Inform8Table;
import com.eighty8.inform8.displaysettings.Label;
import com.eighty8.inform8.menu.Menu;
import com.eighty8.inform8.velocity.DummyLogger;

/**
 * Launches the code generation process using the PHP Community Edition of Inform8
 * 
 * @author ryanhenderson
 */
public class Inform8 {

  static Logger LOG = Logger.getLogger(Inform8.class);

  /** The config used to perform the generation */
  private PlusGeneratorConfig generatorConfig;

  /** The Velocity engine used to parse the templates */
  private VelocityEngine velocityEngine;

  private Menu siteMenu;


  /**
   * 
   * @param configFile
   * @throws Exception
   */
  public Inform8(String configFile) throws Exception {
    LOG.info("Configuration File: " + configFile);

    GenerationContext.getInstance().setConfigPath(configFile);
    GenerationContext.getInstance().setConfig(generatorConfig = new PlusGeneratorConfig(new File(configFile)));
    LOG.trace("Configuration Loaded");

    velocityEngine = new VelocityEngine(generatorConfig.getAllProperties());
    velocityEngine.setProperty(VelocityEngine.RUNTIME_LOG_LOGSYSTEM, new DummyLogger());
    velocityEngine.init();
    LOG.trace("Velocity Loaded");

    GenerationContext.getInstance().setRefDbConnection(loadConnection());
  }


  /**
   * Loads the database connection ready for use.
   * 
   * @return the database connection or null if the server type is not supported.
   */
  private DbConnection loadConnection() {
    if (GenerationContext.getInstance().getDatabaseType().equalsIgnoreCase("mysql")) {
      return new MysqlConnection();
    }
    return null;
  }


  /**
   * Loads the appropriate model parser depending on the server type.
   * 
   * @return The model parser or null if the db server type is not supported.
   */
  private ModelBuilder getDbModelParser() {
    if (GenerationContext.getInstance().getDatabaseType().equalsIgnoreCase("mysql")) {
      return new MysqlModelBuilder(GenerationContext.getInstance().getRefDbConnection());
    }
    return null;
  }


  /**
   * Performs the generation process.
   * 
   * @throws Exception
   *           if any errors occur during generation.
   */
  private void generate() throws Exception {
    LOG.debug("Generation Started");

    ModelBuilder dbModelParser = getDbModelParser();
    DatabaseModel model = dbModelParser.extractModel();
    LOG.debug("Model Parsed");

    List<Inform8Table> tables = model.getTables();

    List<TableAndColumnAndLabel> tableFieldLabels = generatorConfig.getTableFieldLabels();
    for (TableAndColumnAndLabel tcl : tableFieldLabels) {
      if (tcl.getLabel().equals(Label.HIDDEN.toString())) {
        LOG.debug("Removing column: " + tcl.getColumn());
        Inform8Table tempTable = findTable(tcl.getTable(), tables);
        tempTable.removeColumn(tempTable.getColumn(tcl.getColumn()));
      }else {
        findTable(tcl.getTable(), tables).getColumn(tcl.getColumn()).getSettings().addLabel(tcl.getLabel());
      }
    }
    LOG.debug("Table Column Labels Applied");

    List<TableColumnProperty> tableFieldProps = generatorConfig.getTableFieldProperties();
    for (TableColumnProperty prop : tableFieldProps) {
      findTable(prop.getTable(), tables).getColumn(prop.getColumn()).getSettings().addProperty(prop.getLabel(), prop.getProperty());
    }
    LOG.debug("Table Column Properties Applied");

    List<TableLabel> tableLabels = generatorConfig.getTableLabels();
    for (TableLabel tl : tableLabels) {
      findTable(tl.getTable(), tables).getSettings().addLabel(tl.getLabel());  
    }
    LOG.debug("Table Labels Applied");

    List<TableProperty> tableProps = generatorConfig.getTableProperties();
    for (TableProperty tp : tableProps) {
      findTable(tp.getTable(), tables).getSettings().addProperty(tp.getKey(), tp.getValue());
    }
    LOG.debug("Table Properties Applied");

    siteMenu = new Menu(generatorConfig.getMenus());
    siteMenu.merge(tables, generatorConfig);
    siteMenu.order(generatorConfig.getMenusInOrder());
    System.out.println("Menu -------------------> " + siteMenu);

    HashMap<String, Object> extras = new HashMap<String, Object>();
    extras.put("siteMenu", siteMenu);
    
    LangGen langGen = new LangGen(generatorConfig);
    langGen.gen(tables, extras, siteMenu);
    
    LOG.debug("Table Specific Generation Starting ");
    ClassGen classGen = new ClassGen(generatorConfig);
    for (Inform8Table table : tables) {
      LOG.debug("Table Generation Starting - " + table.getName());
      classGen.gen(table, extras);
    }
    LOG.debug("Table Specific Generation Complete");

    LOG.debug("General Generation Starting");
    new Gen(generatorConfig).gen(tables, extras);
    LOG.debug("General Generation Complete");    
  }
  

  /**
   * 
   * @param name
   * @param tables
   * @return
   */
  public Inform8Table findTable(String name, List<Inform8Table> tables) {
    for (Inform8Table table : tables) {
      if (table.getName().equalsIgnoreCase(name)) {
        return table;
      }
    }
    return null;
  }


  /**
   * 
   * @param args
   */
  public static void main(String[] args) {
    if (args.length < 1) {
      System.out.println("Configuration file name argument missing.");
    }
    try {
      new Inform8(args[0]).generate();
    } catch (Exception e) {
      LOG.error("Generation failed", e);
      throw new RuntimeException(e);
    }
  }

}