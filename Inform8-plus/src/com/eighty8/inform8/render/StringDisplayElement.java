/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.render;

public class StringDisplayElement implements RenderElement{

  public final String text;

  public StringDisplayElement(String theString) {
    this.text = theString;
  }
  

  @Override
  public RenderType getType() {
    return RenderType.PLAIN_STRING;
  }
  
  public String getText() {
    return text;
  }
  
  @Override
  public String toString() {
    return text;
  }
  
}
