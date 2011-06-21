/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */

package com.eighty8.inform8;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;

import com.eighty8.inform8.config.PlusGeneratorConfig;
import com.eighty8.inform8.config.TableAndColumn;
import com.eighty8.inform8.config.TableAndColumnAndLabel;
import com.eighty8.inform8.config.TableColumnProperty;
import com.eighty8.inform8.config.TableLabel;
import com.eighty8.inform8.config.TableProperty;
import com.eighty8.inform8.db.table.MasterDetailForeignKey;
import com.eighty8.inform8.db.table.Table;
import com.eighty8.inform8.db.table.TableMember;
import com.eighty8.inform8.db.types.HtmlEditorType;
import com.eighty8.inform8.file.FileManager;
import com.eighty8.inform8.gen.ClassGen;
import com.eighty8.inform8.lang.LanguageGenerator;
import com.eighty8.inform8.menu.Menu;
import com.eighty8.inform8.parser.mysql.ForeignKeyParser;
import com.eighty8.inform8.parser.mysql.TableParser;
import com.eighty8.inform8.render.DisplayParser;
import com.eighty8.inform8.util.FileUtils;
import com.eighty8.inform8.velocity.DummyLogger;

public class PlusSqlFileParser {

  private File inSqlFile;

  private String sql;
  private PlusGeneratorConfig generatorConfig;
  private FileManager fileManager;

  private Menu siteMenu;

  private VelocityEngine velocityEngine;

  private List<Table> tables;

  private Map<String, Properties> langGenProperties;

  private final String configFolder;

  private final String env;

  private LanguageGenerator langGenerator;


  public PlusSqlFileParser(String env, String configFolder) throws Exception {
    this.env = env;
    this.configFolder = configFolder;

    System.out.println("Configuration Folder:" + configFolder);
    generatorConfig = new PlusGeneratorConfig(this.env, new File(configFolder, "gen.properties"));

    velocityEngine = new VelocityEngine(generatorConfig.getAllProperties());
    velocityEngine.setProperty(VelocityEngine.RUNTIME_LOG_LOGSYSTEM, new DummyLogger());
    velocityEngine.init();

    fileManager = new FileManager(generatorConfig);

    inSqlFile = new File(generatorConfig.getSqlFile());
    System.out.println("Log File: " + generatorConfig.getSqlFile() + " Exists: " + inSqlFile.exists());
  }


  private void generate() throws Exception {
    try {
      BufferedReader in = new BufferedReader(new FileReader(inSqlFile));
      String str;

      StringBuilder fileString = new StringBuilder();
      while ((str = in.readLine()) != null) {
        fileString.append(str).append("\n");
      }
      in.close();

      sql = fileString.toString();

      String[] split = sql.split(";");
      System.out.println(Arrays.asList(split));

      tables = new ArrayList<Table>();
      for (String string : split) {
        if (string.toLowerCase().indexOf("create table") >= 0) {
          Table gen = new TableParser(string.substring(string.toLowerCase().indexOf("create table"))).parseTable();
          tables.add(gen);
        }
      }

      List<MasterDetailForeignKey> fks = new ForeignKeyParser(tables).splitAlterTables(sql);
      System.out.println(fks);
      for (MasterDetailForeignKey foreignKey : fks) {
        foreignKey.getBaseTable().addForiegnKey(foreignKey);
        foreignKey.getOtherTable().addForiegnKey(foreignKey.opposite());
      }

      Map<String, String> tableFkColumns = generatorConfig.getTableFkColumns();
      Set<String> fkKeySet = tableFkColumns.keySet();
      for (String fkTable : fkKeySet) {
        findTable(fkTable, tables).setFkDataMemeber(tableFkColumns.get(fkTable));
      }

      List<TableAndColumn> tableHtmlEditors = generatorConfig.getTableHtmlColumns();
      for (TableAndColumn tableandcol : tableHtmlEditors) {
        findTable(tableandcol.getTable(), tables).setMemeberType(tableandcol.getColumn(), new HtmlEditorType());
      }

      Map<String, String> orderCols = generatorConfig.getTableOrderDisplayColumns();
      for (String table : orderCols.keySet()) {
        System.out.println("orderCols tbl: " + table);
        Table t = findTable(table, tables);
        System.out.println("orderCols tbl: " + t);
        t.setOrderDisplayElements(new DisplayParser(t, orderCols.get(table)).parse());
      }

      List<TableAndColumn> parentChildCols = generatorConfig.getTableParentChildColumns();
      for (TableAndColumn tableandcol : parentChildCols) {
        findTable(tableandcol.getTable(), tables).setParentChildMember(tableandcol.getColumn());
      }

      List<TableAndColumnAndLabel> tableFieldLabels = generatorConfig.getTableFieldLabels();
      for (TableAndColumnAndLabel tcl : tableFieldLabels) {
        System.out.println("tcl: " + tcl);
        findTable(tcl.getTable(), tables).getMember(tcl.getColumn()).getDisplaySettings().addLabel(tcl.getLabel());
      }

      List<TableColumnProperty> tableFieldProps = generatorConfig.getTableFieldProperties();
      for (TableColumnProperty prop : tableFieldProps) {
        System.out.println("prop: " + prop);
        findTable(prop.getTable(), tables).getMember(prop.getColumn()).getDisplaySettings().addProperty(prop.getLabel(), prop.getProperty());
      }

      List<TableLabel> tableLabels = generatorConfig.getTableLabels();
      for (TableLabel tl : tableLabels) {
        findTable(tl.getTable(), tables).getDisplaySettings().addLabel(tl.getLabel());
      }

      List<TableProperty> tableProps = generatorConfig.getTableProperties();
      for (TableProperty tp : tableProps) {
        findTable(tp.getTable(), tables).getDisplaySettings().addProperty(tp.getKey(), tp.getValue());
      }

      List<TableAndColumn> tableHiddenListColumns = generatorConfig.getHiddenListColumns();
      for (TableAndColumn tableandcol : tableHiddenListColumns) {
        Table tempTable = findTable(tableandcol.getTable(), tables);
        if (tempTable == null) {
          System.out.println("Table not found: " + tableandcol);
          System.exit(1);
        }
        TableMember member = tempTable.getMember(tableandcol.getColumn());
        if (member == null) {
          System.out.println("Table member not found: " + tableandcol);
          System.exit(1);
        }
        member.getDisplaySettings().setDisplayInGrid(false);
      }

      siteMenu = new Menu(generatorConfig.getMenus());
      siteMenu.merge(tables, generatorConfig);
      siteMenu.order(generatorConfig.getMenusInOrder());
      System.out.println("Menu -------------------> " + siteMenu);

      langGenerator = new LanguageGenerator(tables, siteMenu, configFolder);
      langGenProperties = langGenerator.getLanguageProperties();
      String[] languageTemplates = fileManager.getAllTemplates(".", ".php.lvm");
      if (languageTemplates.length > 0) {
        File outdir = new File("gen/php/admin");
        outdir.mkdirs();
        for (String templateName : languageTemplates) {
          Set<String> keySet = langGenProperties.keySet();
          System.out.println("Generating Language Files for template: " + templateName);
          for (String key : keySet) {
            HashMap<String, Object> extras = new HashMap<String, Object>();
            extras.put("currentLanguage", key);
            String daMerge = merge(tables, templateName, extras);
            FileUtils.saveFile(daMerge, key + ".php", new File("gen/php/admin/"));
          }
        }
      }

      for (Table table : tables) {
        new ClassGen(new File("gen//php"), generatorConfig, fileManager).gen(table);
      }

      List<File> folders = fileManager.getFolders();
      try {
        String[] tableTemplates = fileManager.getAllTemplates(".", ".php.vm", ".js.vm");
        if (tableTemplates.length > 0) {
          File outdir = new File("gen/php/admin");
          for (String templateName : tableTemplates) {
            String daMerge = merge(tables, templateName);
            FileUtils.saveFile(daMerge, templateName.replace(".vm", ""), outdir);
          }
        }
      } catch (Exception e) {
        e.printStackTrace();
      }

      try {
        for (File file : folders) {
          String[] tableTemplates = fileManager.getAllTemplates(file.getName(), ".php.vm", ".js.vm");
          if (tableTemplates.length > 0) {
            File outdir = new File(new File("gen/php/admin"), file.getName());
            outdir.mkdirs();
            for (String templateName : tableTemplates) {
              String daMerge = merge(tables, file.getName() + File.separator + templateName);
              FileUtils.saveFile(daMerge, templateName.replace(".vm", ""), new File("gen/php/admin/" + file.getName()));
            }
          }
        }
      } catch (Exception e) {
        e.printStackTrace();
      }

    } catch (IOException e) {
      e.printStackTrace();
    }

    System.out.println("Generation Warnings");
    for (Table table : tables) {
      if (!table.getPrimaryKey().getDetailForeignKeys().isEmpty() && table.getFkDataMember() == null) {
        System.out.println(table.getDbname() + " missing fk data member");
      }
    }

  }


  /**
   * 
   * @param name
   * @param tables
   * @return
   */
  public Table findTable(String name, List<Table> tables) {
    for (Table table : tables) {
      if (table.getDbname().equalsIgnoreCase(name)) {
        return table;
      }
    }
    return null;
  }


  private String merge(List<Table> tables, String template) throws Exception {
    return merge(tables, template, new HashMap<String, Object>());
  }


  /**
   * 
   * @param tables
   * @param template
   * @return
   * @throws Exception
   */
  private String merge(List<Table> tables, String template, HashMap<String, Object> extras) throws Exception {
    HashMap<String, Object> data = new HashMap<String, Object>();
    data.put("siteMenu", siteMenu);
    data.put("tables", tables);
    data.put("ds", "$");
    data.put("config", generatorConfig);
    data.put("allConfigs", generatorConfig.getAllProperties());
    data.put("langProps", langGenProperties);
    data.put("langGenerator", langGenerator);
    data.put("fileManager", this.fileManager);
    data.putAll(extras);

    VelocityContext vc = new VelocityContext(data);
    StringWriter stringWriter = new StringWriter();

    Template templ = velocityEngine.getTemplate(template);
    templ.merge(vc, stringWriter);

    return stringWriter.toString();
  }


  /**
   * 
   * @param args
   */
  public static void main(String[] args) {
    System.out.println("starting code gen");
    try {
      new PlusSqlFileParser(args[0], args[1]).generate();
    } catch (Exception e) {
      e.printStackTrace();
    }
    System.out.println("finished code gen");
  }

}
