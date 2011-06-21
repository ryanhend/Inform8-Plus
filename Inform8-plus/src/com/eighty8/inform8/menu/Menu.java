/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.menu;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.eighty8.inform8.config.PlusGeneratorConfig;
import com.eighty8.inform8.db.table.Inform8Table;

public class Menu {

  private final List<MenuItem> menus;


  public Menu(List<MenuItem> menus) {
    super();
    this.menus = menus == null ? new ArrayList<MenuItem>() : menus;
  }


  public void merge(List<Inform8Table> tables, PlusGeneratorConfig config) {
    for (Inform8Table table : tables) {
      if (config.shouldIgnoreInAdmin(table.getName()) || table.getSettings().hasLabel("hiddenjointable")
          || table.getSettings().hasLabel("nomanager") || table.getName().equalsIgnoreCase("JackHistory")) {
        continue;
      }
      if (!isTableInMenu(table)) {
        MenuItem menuItem = new MenuItem(table.getName());
        menuItem.addSubMenu(new MenuItem(table.getName()));
        menus.add(menuItem);
      }
    }
  }


  private boolean isTableInMenu(Inform8Table table) {
    for (MenuItem mi : menus) {
      if (mi.contains(table)) {
        return true;
      }
    }
    return false;
  }


  public List<MenuItem> getMenus() {
    Collections.sort(menus);
    return menus;
  }


  private MenuItem findMenuItem(String name) {
    for (MenuItem mi : menus) {
      if (mi.getName().equals(name)) {
        return mi;
      }
    }
    return null;
  }


  public void order(List<String> menusInOrder) {
    for (int i = 0; i < menusInOrder.size(); i++) {
      MenuItem findMenuItem = findMenuItem(menusInOrder.get(i));
      if (findMenuItem != null) {
        findMenuItem.setMenuOrder(i);
      }
    }
  }

}
