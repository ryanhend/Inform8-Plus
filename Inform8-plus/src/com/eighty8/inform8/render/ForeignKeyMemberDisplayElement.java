/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.render;

import com.eighty8.inform8.db.table.Inform8Column;

/**
 * Used to navigate to another table via a FK and render the associated member.
 * 
 * For example: You have a Table CompanyAddress and a Table Company.
 * When rendering in the context of CompanyAddress you may wish to render the 
 * Name field of the Company.
 *  
 * @author ryanhenderson
 *
 */
public class ForeignKeyMemberDisplayElement implements RenderElement {

  final Inform8Column theFk;
  final Inform8Column theMember;
  
  public ForeignKeyMemberDisplayElement(Inform8Column theFk, Inform8Column theMember) {
    this.theFk = theFk;
    this.theMember = theMember;
  }

  @Override
  public RenderType getType() {
    return RenderType.FK_MEMBER;
  }

  /**
   * The member on the originating table, with the linking fk to the other table.
   * @return
   */
  public Inform8Column getFkMember() {
    return theFk;
  }
  
  /**
   * The memeber on the other table.
   * @return
   */
  public Inform8Column getOtherMember() {
    return theMember;
  }
  
}
