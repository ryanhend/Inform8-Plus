/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.render;

import com.eighty8.inform8.db.table.Inform8Column;

public class TableMemberDisplayElement implements RenderElement{

  final Inform8Column theMemeber;

  public TableMemberDisplayElement(Inform8Column theMemeber) {
    this.theMemeber = theMemeber;
  }
  
  @Override
  public RenderType getType() {
    return RenderType.MEMBER;
  }
  
  public Inform8Column getTableMember() {
    return theMemeber;
  }
  
  @Override
  public String toString() {
    return theMemeber.getName();
  }
  
}
