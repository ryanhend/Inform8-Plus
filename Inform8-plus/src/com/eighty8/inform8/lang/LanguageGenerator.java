/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
package com.eighty8.inform8.lang;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.Map.Entry;

import com.eighty8.inform8.db.table.Inform8Column;
import com.eighty8.inform8.db.table.Inform8Table;
import com.eighty8.inform8.menu.Menu;
import com.eighty8.inform8.menu.MenuItem;
import com.eighty8.inform8.util.StringUtils;

public class LanguageGenerator {

  private static final String TBL_PREFIX = "Tbl_";
  private final List<Inform8Table> tables;
  private Properties properties;

  private Map<String, Properties> languageProperties = new HashMap<String, Properties>();
  private final Menu menu;
  private FileWriter jackEntries;


  public LanguageGenerator(List<Inform8Table> tables, Menu menu, String configFolder) {
    this.tables = tables;
    this.menu = menu;

    File langFolder = new File(configFolder, "lang");

    try {
      jackEntries = new FileWriter(new File(langFolder, "jackentries.txt"));
    } catch (IOException e1) {
      e1.printStackTrace();
    }

    readDefaultEntries();
    generateTableEntries();
    generateMenuEntries();

    try {
      jackEntries.flush();
      jackEntries.close();
    } catch (IOException e1) {
      e1.printStackTrace();
    }

    String[] langFiles = langFolder.list(new FilenameFilter() {

      @Override
      public boolean accept(File dir, String name) {
        return name.endsWith(".properties");
      }
    });

    for (String langFileName : langFiles) {
      Properties tempProps = new Properties();
      addAll(properties, tempProps);
      System.out.println("langFile:" + langFileName);

      File theLangFile = new File(langFolder, langFileName);
      Properties tempLangProps = new Properties();
      try {
        tempLangProps.load(new FileInputStream(theLangFile));
        addAll(tempLangProps, tempProps);

      } catch (FileNotFoundException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
      } catch (IOException e) {
        // TODO Auto-generated catch block
        e.printStackTrace();
      }

      languageProperties.put(langFileName.split("\\.")[0], tempProps);
    }
  }


  public void addAll(Properties from, Properties into) {
    for (Entry<Object, Object> entry : from.entrySet()) {
      into.put(entry.getKey(), entry.getValue());
    }
  }


  /**
   * 
   */
  public void readDefaultEntries() {
    try {

      properties = new Properties();

      Properties temp = new Properties();
      temp.load(LanguageGenerator.class.getResourceAsStream("/com/eighty8/inform8/lang/lang.base.properties"));

      addAll(temp, properties);

    } catch (FileNotFoundException e) {
      e.printStackTrace();
    } catch (IOException e) {
      e.printStackTrace();
    }
  }


  public void addEntry(String key, String value) {
    try {
      jackEntries.write(key + "=" + saveConvert(value, false, false) + "\n");
    } catch (IOException e) {
    }
    properties.put(key, value);
  }


  public void addEmptyLine() {
    try {
      jackEntries.write("\n");
    } catch (IOException e) {
    }
  }


  public void addComment(String comment) {
    try {
      jackEntries.write("####################################" + "\n");
      jackEntries.write("# " + comment + "\n");
      jackEntries.write("####################################" + "\n");
    } catch (IOException e) {
    }
  }


  /**
   * 
   */
  public void generateTableEntries() {
    for (Inform8Table tbl : tables) {
      addEmptyLine();
      addEmptyLine();
      addComment("Entries for table: " + StringUtils.getCaseExplodedName(tbl.getName(), false));

      addEntry(TBL_PREFIX + tbl.getName(), StringUtils.getCaseExplodedName(tbl.getName(), false));
      addEntry(TBL_PREFIX + tbl.getName() + "__tab", StringUtils.getCaseExplodedName(tbl.getName(), false));
      addEntry(TBL_PREFIX + tbl.getName() + "__help", "");

      addEntry(TBL_PREFIX + tbl.getName() + "__saving", "Saving " + StringUtils.getCaseExplodedName(tbl.getName(), false) + "... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__saved", "Saved.");
      addEntry(TBL_PREFIX + tbl.getName() + "__saveFailed", "Failed to update item.");

      // create
      addEntry(TBL_PREFIX + tbl.getName() + "__creating", "Creating " + StringUtils.getCaseExplodedName(tbl.getName(), false) + "... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__created", "New " + StringUtils.getCaseExplodedName(tbl.getName(), false) + " created. ");
      addEntry(TBL_PREFIX + tbl.getName() + "__createFailed", "Failed to create new " + StringUtils.getCaseExplodedName(tbl.getName(), false) + ".");

      // delete
      addEntry(TBL_PREFIX + tbl.getName() + "__deleting", "Deleting " + StringUtils.getCaseExplodedName(tbl.getName(), false) + " item/s... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__deleted", "Items deleted.");
      addEntry(TBL_PREFIX + tbl.getName() + "__deleteFailed", "Failed to delete item/s.");

      // multiple delete
      addEntry(TBL_PREFIX + tbl.getName() + "__multipleDeleting", "Deleting " + StringUtils.getCaseExplodedName(tbl.getName(), false) + " item/s... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__multipleDeleted", "Items deleted.");
      addEntry(TBL_PREFIX + tbl.getName() + "__multipleDeleteFailed", "Failed to delete item/s.");
      addEntry(TBL_PREFIX + tbl.getName() + "__multipleDeletePartial", "Partial Success: Some items could not be deleted.");

      // link
      addEntry(TBL_PREFIX + tbl.getName() + "__linking", "Linking " + StringUtils.getCaseExplodedName(tbl.getName(), false) + " item... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__linked", "Items Linked.");
      addEntry(TBL_PREFIX + tbl.getName() + "__linkFailed", "Failed to link items.");
      addEntry(TBL_PREFIX + tbl.getName() + "__linkDeleted", "Linking " + StringUtils.getCaseExplodedName(tbl.getName(), false) + " item/s... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__linkDeleteFailed", "Items Linked.");

      // multiple link delete
      addEntry(TBL_PREFIX + tbl.getName() + "__linksDeletePartial", "Partial Success: Some links could not be deleted.");
      addEntry(TBL_PREFIX + tbl.getName() + "__linksDeleted", "Links Deleted.");
      addEntry(TBL_PREFIX + tbl.getName() + "__linksDeleteFailed", "Failed to delete links.");

      // Ordering of items.
      addEntry(TBL_PREFIX + tbl.getName() + "__ordering", "Ordering items... Please Wait.");
      addEntry(TBL_PREFIX + tbl.getName() + "__orderPartial", "Partial Success: Some items could not be ordered.");
      addEntry(TBL_PREFIX + tbl.getName() + "__ordered", "Items ordered.");
      addEntry(TBL_PREFIX + tbl.getName() + "__orderFailed", "Failed to order items.");

      // enabling of items.
      addEntry(TBL_PREFIX + tbl.getName() + "__enablePartial", "Partial Success: Some items could not be enabled.");
      addEntry(TBL_PREFIX + tbl.getName() + "__enabled", "Items enabled.");
      addEntry(TBL_PREFIX + tbl.getName() + "__enableFailed", "Failed to enable items.");

      // disabling of items.
      addEntry(TBL_PREFIX + tbl.getName() + "__disablePartial", "Partial Success: Some items could not be disabled.");
      addEntry(TBL_PREFIX + tbl.getName() + "__disabled", "Items disabled.");
      addEntry(TBL_PREFIX + tbl.getName() + "__disableFailed", "Failed to disable items.");

      // primary key
      addEntry(TBL_PREFIX + tbl.getName() + "_" + tbl.getPrimaryKey().getName(), StringUtils.getCaseExplodedName(tbl.getPrimaryKey().getName(), false));
      // other members
      for (Inform8Column mem : tbl.getColumns()) {
        addEntry(TBL_PREFIX + tbl.getName() + "_" + mem.getName(), StringUtils.getCaseExplodedName(mem.getName(), false));
        addEntry(TBL_PREFIX + tbl.getName() + "_" + mem.getName() + "__help", "");
      }
    }
  }


  public void generateMenuEntries() {
    for (MenuItem mi : menu.getMenus()) {
      addEmptyLine();
      addEmptyLine();
      addComment("Entries for Menu: " + mi.getName());

      addEntry("Menu_" + mi.getName(), mi.getCaseExplodedName());
      for (MenuItem submi : mi.getSubMenus()) {
        addEntry("SubMenu_" + submi.getName(), submi.getCaseExplodedName());
      }
    }

  }


  /**
   * 
   * @return
   */
  public Map<String, Properties> getLanguageProperties() {
    return languageProperties;
  }


  @SuppressWarnings("unchecked")
  public List<String> getSortedKeys(String languageKey) {
    Set<Object> keys = languageProperties.get(languageKey).keySet();

    List sortedKeyList = new ArrayList();
    sortedKeyList.addAll(keys);

    Collections.sort(sortedKeyList);

    return sortedKeyList;
  }


  private String saveConvert(String theString, boolean escapeSpace, boolean escapeUnicode) {
    int len = theString.length();
    int bufLen = len * 2;
    if (bufLen < 0) {
      bufLen = Integer.MAX_VALUE;
    }
    StringBuffer outBuffer = new StringBuffer(bufLen);

    for (int x = 0; x < len; x++) {
      char aChar = theString.charAt(x);
      // Handle common case first, selecting largest block that
      // avoids the specials below
      if ((aChar > 61) && (aChar < 127)) {
        if (aChar == '\\') {
          outBuffer.append('\\');
          outBuffer.append('\\');
          continue;
        }
        outBuffer.append(aChar);
        continue;
      }
      switch (aChar) {
      case ' ':
        if (x == 0 || escapeSpace)
          outBuffer.append('\\');
        outBuffer.append(' ');
        break;
      case '\t':
        outBuffer.append('\\');
        outBuffer.append('t');
        break;
      case '\n':
        outBuffer.append('\\');
        outBuffer.append('n');
        break;
      case '\r':
        outBuffer.append('\\');
        outBuffer.append('r');
        break;
      case '\f':
        outBuffer.append('\\');
        outBuffer.append('f');
        break;
      case '=': // Fall through
      case ':': // Fall through
      case '#': // Fall through
      case '!':
        outBuffer.append('\\');
        outBuffer.append(aChar);
        break;
      default:
        if (((aChar < 0x0020) || (aChar > 0x007e)) & escapeUnicode) {
          outBuffer.append('\\');
          outBuffer.append('u');
          outBuffer.append(toHex((aChar >> 12) & 0xF));
          outBuffer.append(toHex((aChar >> 8) & 0xF));
          outBuffer.append(toHex((aChar >> 4) & 0xF));
          outBuffer.append(toHex(aChar & 0xF));
        } else {
          outBuffer.append(aChar);
        }
      }
    }
    return outBuffer.toString();
  }


  private static char toHex(int nibble) {
    return hexDigit[(nibble & 0xF)];
  }

  /** A table of hex digits */
  private static final char[] hexDigit = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' };

}
