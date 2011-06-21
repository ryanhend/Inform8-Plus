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
import java.util.ArrayList;
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

/**
 * Responsible for the general code generation. Non table specific generation.
 * 
 * @author ryanhenderson
 * 
 */
public class Gen {

  static Logger LOG = Logger.getLogger(Gen.class);

  private final Config config;

  private VelocityEngine velocityEngine;

  private FileManager fileManager;

  private File outDir;


  /**
   * 
   * @param outDir
   * @param generatorConfig
   * @throws Exception
   */
  public Gen(Config generatorConfig) throws Exception {
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
   * @throws Exception
   *           Any exceptions raised during the merge process or IO errors
   */
  public void gen(List<Inform8Table> tables) throws Exception {

    String[] tableTemplates = fileManager.getAllTemplates(".", config.getGenericExtensions());
    if (tableTemplates.length > 0) {
      for (String templateName : tableTemplates) {
        String daMerge = merge(tables, templateName);
        FileUtils.saveFile(daMerge, templateName.replace(".vm", ""), outDir);
      }
    }

    List<String> folders = fileManager.getFolders();
    try {
      for (String file : folders) {
        tableTemplates = fileManager.getAllTemplates(file, config.getGenericExtensions());
        if (tableTemplates.length > 0) {
          File tempdir = new File(outDir, file);
          tempdir.mkdirs();
          for (String templateName : tableTemplates) {
            String daMerge = merge(tables, file + File.separator + templateName);
            FileUtils.saveFile(daMerge, templateName.replace(".vm", ""), new File(outDir, file));
          }
        }
      }
    } catch (Exception e) {
      LOG.error("General Generation Error");
      throw new RuntimeException(e);
    }
  }


  /**
   * 
   * @param tables
   * @param template
   * @return
   * @throws Exception
   */
  private String merge(List<Inform8Table> tables, String template) throws Exception {
    LOG.trace("Merging model with template " + template);
    
    HashMap<String, Object> data = new HashMap<String, Object>();
    data.put("tables", tables); // all tables
    data.put("ds", "$");
    data.put("config", config);

    VelocityContext vc = new VelocityContext(data);
    StringWriter stringWriter = new StringWriter();

    Template templ = velocityEngine.getTemplate(template);
    templ.merge(vc, stringWriter);

    return stringWriter.toString();
  }

}