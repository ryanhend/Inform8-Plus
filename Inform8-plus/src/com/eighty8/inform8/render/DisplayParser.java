/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.render;

import java.util.ArrayList;
import java.util.List;

import com.eighty8.inform8.db.table.Inform8Table;

/* Given a context can parse a display string to work out each
 * renderable element.
 */
public class DisplayParser {
  
  private final Inform8Table context;
  private final String display;
 
  
  
  public DisplayParser(Inform8Table context, String display) {
    this.context = context;
    this.display = display;
  }
  
  public List<RenderElement> parse() {
    List<RenderElement> parsedElements = new ArrayList<RenderElement>();
    
    String tdisplay = display;
    while (tdisplay.length() > 0) {
      int nextBlock = tdisplay.indexOf('{');
      if (nextBlock == 0) {
        // at member block now
        tdisplay = tdisplay.substring(nextBlock+1);
        int endBlock = tdisplay.indexOf('}');
        String memEl = tdisplay.substring(0, endBlock);
        if (memEl.indexOf('.') > 0) {
          String[] parts = memEl.split("\\.");
          parsedElements.add(new ForeignKeyMemberDisplayElement(
              context.getColumn(parts[0]), 
              context.getColumn(parts[0]).getChildForeignKey().getMasterTable().getColumn(parts[1])));
        }else {
          parsedElements.add(new TableMemberDisplayElement(context.getColumn(memEl)));
        }
        tdisplay = chopFrom(tdisplay, endBlock+1);
        
      }else if (nextBlock > 0) { //String element first
        parsedElements.add(new StringDisplayElement(tdisplay.substring(0, nextBlock)));
        tdisplay = chopFrom(tdisplay, nextBlock);
        
      }else {
        // rest is string
        parsedElements.add(new StringDisplayElement(tdisplay));
        tdisplay = "";
      }
    }
    return parsedElements;
  }

  public String chopFrom(String s, int idx) {
    if (idx >= s.length()-1) {
      return "";
    }else {
      return s.substring(idx);
    }
  }
  
  
}