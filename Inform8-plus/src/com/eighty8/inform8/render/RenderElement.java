/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.render;

public interface RenderElement {

  enum RenderType {
    PLAIN_STRING, MEMBER, FK_MEMBER
  }
  
  public RenderType getType();
  
}
