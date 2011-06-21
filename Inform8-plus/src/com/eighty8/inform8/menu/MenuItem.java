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

import org.apache.commons.lang.builder.ToStringBuilder;

import com.eighty8.inform8.db.table.Inform8Table;
import com.eighty8.inform8.util.StringUtils;

public class MenuItem implements Comparable<MenuItem> {

  private final String name;
  List<MenuItem> subMenus = new ArrayList<MenuItem>();

  /**
   * For presentation in the menu. 0 is the highest Default Integer.MAX_VALUE-100
   */
  private int menuOrder = Integer.MAX_VALUE - 100;


  public MenuItem(String name) {
    this.name = name;
  }


  public List<MenuItem> getSubMenus() {
    Collections.sort(subMenus);
    return subMenus;
  }


  public void addSubMenu(MenuItem m) {
    subMenus.add(m);
  }


  public String getName() {
    return name;
  }


  public boolean contains(Inform8Table t) {
    if (name.equalsIgnoreCase(t.getName())) {
      return true;
    }
    for (MenuItem m : subMenus) {
      if (m.contains(t)) {
        return true;
      }
    }
    return false;
  }


  @Override
  public String toString() {
    // TODO Auto-generated method stub
    return new ToStringBuilder(this).append("name", getName()).append("subMenu", getSubMenus()).toString();
  }


  public int getMenuOrder() {
    return menuOrder;
  }


  public void setMenuOrder(int menuOrder) {
    this.menuOrder = menuOrder;
  }


  @Override
  public int compareTo(MenuItem other) {
    return getMenuOrder() - other.getMenuOrder();
  }


  public String getCaseExplodedName() {
    return StringUtils.getCaseExplodedName(StringUtils.uppercaseFirstChar(name), false);
  }
}
