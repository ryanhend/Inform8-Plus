/* 
 * Copyright 2011 - Inform8
 * http://www.inform8.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * http://www.apache.org/licenses/LICENSE-2.0
 */
package com.eighty8.inform8;

import java.io.File;
import java.io.StringWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import org.apache.log4j.Logger;
import org.apache.velocity.Template;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;

import com.eighty8.inform8.config.Config;
import com.eighty8.inform8.db.table.Inform8Table;
import com.eighty8.inform8.file.FileManager;
import com.eighty8.inform8.util.FileUtils;
import com.eighty8.inform8.velocity.DummyLogger;

public class ClassGen {

  static Logger LOG = Logger.getLogger(ClassGen.class);

  /** The directory any output files are sent to */
  private File outDir;

  /** the configuration for the generation engine */
  private final Config config;

  /** The templating engine */
  private VelocityEngine velocityEngine;

  /** The file manager to access the local file system */
  private FileManager fileManager;


  /**
   * 
   * @param outDir
   * @param generatorConfig
   * @throws Exception
   */
  public ClassGen(Config generatorConfig) throws Exception {
    this.config = generatorConfig;
    this.outDir = new File(generatorConfig.getGenFolder());

    fileManager = new FileManager(generatorConfig);

    velocityEngine = new VelocityEngine(generatorConfig.getAllProperties());
    velocityEngine.setProperty(VelocityEngine.RUNTIME_LOG_LOGSYSTEM, new DummyLogger());
    velocityEngine.init();
  }


  /**
   * Simplified Generation section, generating for a few files...
   * 
   * @param table
   *          the table to generate for
   * @throws Exception
   *           Any exceptions raised during the merge process or IO errors
   */
  public void gen(Inform8Table table) throws Exception {
    String[] tableTemplates = fileManager.getAllTemplates(".", config.getTableExtensions());
    if (tableTemplates.length > 0) {
      for (String templateName : tableTemplates) {
        String daMerge = merge(table, templateName);
        FileUtils.saveFile(daMerge, templateName.replace(".tbl.vm", ""), outDir);
      }
    }

    List<String> folders = fileManager.getFolders();
    for (String file : folders) {
      tableTemplates = fileManager.getAllTemplates(file, config.getTableExtensions());
      if (tableTemplates.length > 0) {
        File tempdir = new File(outDir, file);
        tempdir.mkdirs();
        for (String templateName : tableTemplates) {
          System.out.println(templateName);
          String daMerge = merge(table, file + File.separator + templateName);
          FileUtils.saveFile(daMerge, table.getName() + templateName.replace(".tbl.vm", ""), new File(outDir, file));
        }
      }
    }
  }


  /**
   * 
   * @param t
   * @param template
   * @return
   * @throws Exception
   */
  private String merge(Inform8Table t, String template) throws Exception {
    LOG.trace("Merging table " + t.getName() + " with template " + template);
    
    HashMap<String, Object> data = new HashMap<String, Object>();
    data.put("table", t); // the current table
    data.put("ds", "$"); //dollar sign
    data.put("config", config); // all config

    VelocityContext vc = new VelocityContext(data);
    StringWriter stringWriter = new StringWriter();

    Template templ = velocityEngine.getTemplate(template);
    templ.merge(vc, stringWriter);

    return stringWriter.toString();
  }

}
