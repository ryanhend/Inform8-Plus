/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.config;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.eighty8.inform8.menu.MenuItem;

public class PlusGeneratorConfig extends Config {

  protected final List<MenuItem> menus = new ArrayList<MenuItem>();
  protected final List<String> menusInOrder = new ArrayList<String>();

  private List<String> adminIgnores = new ArrayList<String>();

  public PlusGeneratorConfig(File configFile) {
    super(configFile);
    
    parseAdminIgnores();
    parseMenus();
    parseMenuOrder();
  }


  private void parseMenus() {
    Set<Object> keySet = config.keySet();
    for (Object key : keySet) {
      if (key.toString().toLowerCase().startsWith("menu.")) {
        MenuItem menuItem = new MenuItem(key.toString().substring(5));
        String[] split = config.getProperty(key.toString()).trim().split(",");
        for (int i = 0; i < split.length; i++) {
          menuItem.addSubMenu(new MenuItem(split[i]));
        }
        menus.add(menuItem);
      }
    }
  }


  private void parseMenuOrder() {
    String menuOrder = config.getProperty("menuorder", "");
    if (menuOrder != null && !menuOrder.isEmpty()) {
      String[] menus = menuOrder.split(",");
      for (int i = 0; i < menus.length; i++) {
        this.menusInOrder.add(menus[i].trim());
      }
    }
  }
  
  private void parseAdminIgnores() {
    Set<Object> keySet = config.keySet();
    for (Object key : keySet) {
      if (key.toString().toLowerCase().startsWith("admin.ignore.")) {
        adminIgnores.add(config.getProperty(key.toString()).trim());
      }
    }
  }
  
  
//  private void parseOrderDisplayColumns() {
//    Set<Object> keySet = config.keySet();
//    for (Object key : keySet) {
//      if (key.toString().toLowerCase().startsWith(".order.display")) {
//        String tableAndMember = config.getProperty(key.toString()).trim();
//        String[] split = tableAndMember.split("\\:", 2);
//        tableOrderDisplayColumns.put(split[0], split[1]);
//      }
//    }  


  public List<MenuItem> getMenus() {
    return menus;
  }


  public List<String> getMenusInOrder() {
    return menusInOrder;
  }
  
  public boolean shouldIgnoreInAdmin(String tableName) {
    return adminIgnores.contains(tableName);
  }

}