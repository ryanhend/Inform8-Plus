// Input 0
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
*
*
 */

/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 */
var goog = goog || {}; // Check to see if already defined in current scope


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Creates object stubs for a namespace. When present in a file, goog.provide
 * also indicates that the file defines the indicated object. Calls to
 * goog.provide are resolved by the compiler if --closure_pass is set.
 * @param {string} name name of the object that this file defines.
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


if (!COMPILED) {
  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {Object} The object or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (cur[part]) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};



/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @param {string} rule Rule to include, in the form goog.package.part.
 */
goog.require = function(rule) {

  // if the object already exists we do not need do do anything
  // TODO(user): If we start to support require based on file name this has
  //            to change
  // TODO(user): If we allow goog.foo.* this has to change
  // TODO(user): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.getObjectByName(rule)) {
      return;
    }
    var path = goog.getPathFromDeps_(rule);
    if (path) {
      goog.included_[path] = true;
      goog.writeScripts_();
    } else {
      var errorMessage = 'goog.require could not find: ' + rule;
      if (goog.global.console) {
        goog.global.console['error'](errorMessage);
      }

      
        throw Error(errorMessage);
        
    }
  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * Null function used for default values of callbacks, etc.
 * @type {!Function}
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    visited: {}, // used when resolving dependencies to prevent us from
                 // visiting the file twice
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    }
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var l = src.length;
      if (src.substr(l - 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Writes a script tag if, and only if, that script hasn't already been added
   * to the document.  (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_() &&
        !goog.dependencies_.written[src]) {
      goog.dependencies_.written[src] = true;
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' +
                src + '"></' + 'script>');
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls writeScriptTag_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName]);
          } else if (!goog.getObjectByName(requireName)) {
            // If the required name is defined, we assume that this
            // dependency was bootstapped by other means. Otherwise,
            // throw an exception.
            throw Error('Undefined nameToPath for ' + requireName);
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.writeScriptTag_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.writeScriptTag_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // We cannot use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if (value instanceof Array ||  // Works quickly in same execution context.
          // If value is from a different execution context then
          // !(value instanceof Object), which lets us early out in the common
          // case when value is from the same context but not an array.
          // The {if (value)} check above means we don't have to worry about
          // undefined behavior of Object.prototype.toString on null/undefined.
          //
          // HACK: In order to use an Object prototype method on the arbitrary
          //   value, the compiler requires the value be cast to type Object,
          //   even though the ECMA spec explicitly allows it.
          (!(value instanceof Object) &&
           (Object.prototype.toString.call(
               /** @type {Object} */ (value)) == '[object Array]') ||

           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if (!(value instanceof Object) &&
          (Object.prototype.toString.call(
              /** @type {Object} */ (value)) == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  // In Safari typeof nodeList returns 'function', and on Firefox
  // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
  // and RegExps.  We would like to return object for those and we can
  // detect an invalid function by making sure that the function
  // object has a call method.
  } else if (s == 'function' && typeof value.call == 'undefined') {
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // In IE, DOM nodes do not extend Object so they do not have this method.
  // we need to check hasOwnProperty because the proto might have this set.
  if (obj.hasOwnProperty && obj.hasOwnProperty(goog.UID_PROPERTY_)) {
    return obj[goog.UID_PROPERTY_];
  }
  if (!obj[goog.UID_PROPERTY_]) {
    obj[goog.UID_PROPERTY_] = ++goog.uidCounter_;
  }
  return obj[goog.UID_PROPERTY_];
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 *
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.bind = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * A macro for defining composite types.
 *
 * By assigning goog.typedef to a name, this tells JSCompiler that this is not
 * the name of a class, but rather it's the name of a composite type.
 *
 * For example,
 * /** @type {Array|NodeList} / goog.ArrayLike = goog.typedef;
 * will tell JSCompiler to replace all appearances of goog.ArrayLike in type
 * definitions with the union of Array and NodeList.
 *
 * Does nothing in uncompiled code.
 */
goog.typedef = true;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * Without JS Compiler the arguments are simple joined with a hyphen and passed
 * through unaltered.
 *
 * With the JS Compiler the arguments are inlined, e.g:
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If a CSS renaming map is passed to the compiler it will replace symbols in
 * the classname.  If one argument is passed it will be processed, if two are
 * passed only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * Names are split on 'hyphen' and processed in parts such that the following
 * are equivalent:
 *   var base = goog.getCssName('baseclass');
 *   goog.getCssName(base, 'modifier');
 *   goog.getCSsName('baseclass-modifier');
 *
 * If any part does not appear in the renaming map a warning is logged and the
 * original, unobfuscated class name is inlined.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var cssName = className + (opt_modifier ? '-' + opt_modifier : '');
  return (goog.cssNameMapping_ && (cssName in goog.cssNameMapping_)) ?
      goog.cssNameMapping_[cssName] : cssName;
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog-menu": "a",
 *   "goog-menu-disabled": "a-b",
 *   "CSS_LOGO": "b",
 *   "hidden": "c"
 * });
 *
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog-menu') + ' ' + goog.getCssName('goog-menu', 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 */
goog.setCssNameMapping = function(mapping) {
  goog.cssNameMapping_ = mapping;
};


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), values[key]);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 *
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};




// Input 1
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is corectly maintained.
 *
*
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Ensure there is a stack trace.
  this.stack = new Error().stack || '';

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @inheritDoc */
goog.debug.Error.prototype.name = 'CustomError';

// Input 2
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
*
*
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  // This appears to be slow, but testing shows it compares more or less
  // equivalent to the regex.exec method.
  for (var i = 1; i < arguments.length; i++) {
    // We cast to String in case an argument is a Function.  Replacing $&, for
    // example, with $$$& stops the replace from subsituting the whole match
    // into the resultant string.  $$$& in the first replace becomes $$& in the
    //  second, which leaves $& in the resultant string.  Also:
    // $$, $`, $', $n $nn
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, empty, or whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * Regular expression used for determining if a string needs to be encoded.
 * @type {RegExp}
 * @private
 */
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;

/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  str = String(str);
  // Checking if the search matches before calling encodeURIComponent avoids an
  // extra allocation in IE6. This adds about 10us time in FF and a similiar
  // over head in IE6 for lower working set apps, but for large working set
  // apps like Gmail, it saves about 70us per call.
  if (!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str);
  }
  return str;
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escape double quote '"' characters in addition to '&', '<', and '>' so that a
 * string can be included in an HTML tag attribute value within double quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, '&amp;')
          .replace(goog.string.ltRe_, '&lt;')
          .replace(goog.string.gtRe_, '&gt;')
          .replace(goog.string.quotRe_, '&quot;');

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.allRe_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.amperRe_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.ltRe_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.gtRe_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, '&quot;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.amperRe_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.ltRe_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.gtRe_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.quotRe_ = /\"/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @type {RegExp}
 * @private
 */
goog.string.allRe_ = /[&<>\"]/;


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    // If the string contains < then there could be a script tag in there and in
    // that case we fall back to a non DOM solution as well.
    if ('document' in goog.global && !goog.string.contains(str, '<')) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM. Don't use this function directly, it
 * should only be used by unescapeEntities. If used directly you will be
 * vulnerable to XSS attacks.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global['document']['createElement']('a');
  el['innerHTML'] = str;
  // Accesing the function directly triggers some virus scanners.
  if (el[goog.string.NORMALIZE_FN_]) {
    el[goog.string.NORMALIZE_FN_]();
  }
  str = el['firstChild']['nodeValue'];
  el['innerHTML'] = '';
  return str;
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};

/**
 * String name for the node.normalize function. Anti-virus programs use this as
 * a signature for some viruses so we need a work around (temporary).
 * @private
 * @type {string}
 */
goog.string.NORMALIZE_FN_ = 'normalize';

/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that charater.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Takes a string and creates a map (Object) in which the keys are the
 * characters in the string. The value for the key is set to true. You can
 * then use goog.object.map or goog.array.map to change the values.
 * @param {string} s The string to build the map from.
 * @return {Object} The map of characters used.
 */
// TODO(user): It seems like we should have a generic goog.array.toMap. But do
//            we want a dependency on goog.array in goog.string?
goog.string.toMap = function(s) {
  var rv = {};
  for (var i = 0; i < s.length; i++) {
    rv[s.charAt(i)] = true;
  }
  return rv;
};


/**
 * Checks whether a string contains a given character.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
                   replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  return Math.floor(Math.random() * 2147483648).toString(36) +
         (Math.floor(Math.random() * 2147483648) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
    // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Ininity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};

// Input 3
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
*
 * @author agrieve@google.com (Andrew Grieve)
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.string');

// TODO(nicksantos): Add return values for all these functions, so that they
// can be chained like:
// eatNumber(goog.asserts.isNumber(foo));
// for more lisp-y asserts.

/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;


/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @inheritDoc */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  throw new goog.asserts.AssertionError('' + message, args || []);
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {!Function} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
         opt_message, Array.prototype.slice.call(arguments, 3));
  }
};


// Input 4
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
*
*
*
 */


goog.provide('goog.array');

goog.require('goog.asserts');



/**
 * @type {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike = goog.typedef;


/**
 * Returns the last element in an array without removing it.
 * @param {goog.array.ArrayLike} array The array.
 * @return {*} Last item in array.
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE(user): Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified
 * value, or -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 */
goog.array.indexOf = goog.array.ARRAY_PROTOTYPE_.indexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 */
goog.array.lastIndexOf = goog.array.ARRAY_PROTOTYPE_.lastIndexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored. The function is called only for indexes of the array
 *     which have assigned values; it is not called for indexes which have
 *     been deleted or which have never been assigned values.
 *
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 */
goog.array.forEach = goog.array.ARRAY_PROTOTYPE_.forEach ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array in which only elements that passed the test are
 *     present.
 */
goog.array.filter = goog.array.ARRAY_PROTOTYPE_.filter ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return something. The result will be inserted into a new array.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array with the results from f.
 */
goog.array.map = goog.array.ARRAY_PROTOTYPE_.map ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {*} Result of evaluating f repeatedly across the values of the array.
 */
goog.array.reduce = function(arr, f, val, opt_obj) {
  if (arr.reduce) {
    if (opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduce(f, val);
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {*} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 */
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if (arr.reduceRight) {
    if (opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduceRight(f, val);
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {goog.array.ArrayLike} arr The array to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 */
goog.array.some = goog.array.ARRAY_PROTOTYPE_.some ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {goog.array.ArrayLike} arr The array to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 */
goog.array.every = goog.array.ARRAY_PROTOTYPE_.every ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr || goog.isString(arr));
      goog.asserts.assertNumber(arr.length);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {*} The first array element that passes the test, or null if no
 *     element is found.
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {*} The last array element that passes the test, or null if no
 *     element is found.
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array} arr Array into which to insert the item.
 * @param {*} obj Value to add.
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {*=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {*} obj Object to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr || goog.isString(arr));
  goog.asserts.assertNumber(arr.length);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Does a shallow copy of an array.
 * @param {goog.array.ArrayLike} arr  Array or array-like object to clone.
 * @return {!Array} Clone of the input array.
 */
goog.array.clone = function(arr) {
  if (goog.isArray(arr)) {
    return goog.array.concat(/** @type {!Array} */ (arr));
  } else { // array like
    // Concat does not work with non arrays.
    var rv = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      rv[i] = arr[i];
    }
    return rv;
  }
};


/**
 * Converts an object to an array.
 * @param {goog.array.ArrayLike} object  The object to convert to an array.
 * @return {!Array} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 */
goog.array.toArray = function(object) {
  if (goog.isArray(object)) {
    // This fixes the JS compiler warning and forces the Object to an Array type
    return goog.array.concat(/** @type {!Array} */ (object));
  }
  // Clone what we hope to be an array-like object to an array.
  // We could check isArrayLike() first, but no check we perform would be as
  // reliable as simply making the call.
  return goog.array.clone(/** @type {Array} */ (object));
};


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array} arr1  The array to modify.
 * @param {...*} var_args The elements or arrays of elements to add to arr1.
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // If we have an Array or an Arguments object we can just call push
    // directly.
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Detect Arguments. ES5 says that the [[Class]] of an Arguments object
        // is "Arguments" but only V8 and JSC/Safari gets this right. We instead
        // detect Arguments by checking for array like and presence of "callee".
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // The getter for callee throws an exception in strict mode
            // according to section 10.6 in ES5 so check for presence instead.
            arr2.hasOwnProperty('callee')) {
      arr1.push.apply(arr1, arr2);

    // Otherwise loop over arr2 to prevent copying the object.
    } else if (isArrayLike) {
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...*} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array} the removed elements.
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr || goog.isString(arr));
  goog.asserts.assertNumber(arr.length);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array from which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array} A new array containing the specified segment of the original
 *     array.
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr || goog.isString(arr));
  goog.asserts.assertNumber(arr.length);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {goog.array.ArrayLike} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var rv = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var uid = goog.isObject(current) ? goog.getUid(current) : current;
    if (!Object.prototype.hasOwnProperty.call(seen, uid)) {
      seen[uid] = true;
      rv[cursorInsert++] = current;
    }
  }
  rv.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} target The sought value.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative integer, zero, or a positive integer depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySelect(arr,
      goog.partial(opt_compareFn || goog.array.defaultCompare, target));
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} evaluator Evaluator function that receives 3 arguments
 *     (the element, the index and the array).  Should return a negative
 *     integer, zero, or a positive integer depending on whether the
 *     desired index is before, at, or after the element passed to it.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var evalResult = evaluator.call(opt_obj, arr[middle], middle, arr);
    if (evalResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !evalResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array} arr The array to be sorted.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative integer, zero, or a positive integer depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(user): Update type annotation since null is not accepted.
  goog.asserts.assert(arr || goog.isString(arr));
  goog.asserts.assertNumber(arr.length);

  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array} arr The array to be sorted.
 * @param {function(*, *): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative integer, zero, or a positive integer depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * @deprecated Use {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr1 See {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr2 See {@link goog.array.equals}.
 * @param {Function=} opt_equalsFn See {@link goog.array.equals}.
 * @return {boolean} See {@link goog.array.equals}.
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} a negative integer, zero, or a positive integer
 *     as the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array} array The array to modify.
 * @param {*} value The object to insert.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and
 *     return a negative integer, zero, or a positive integer depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {boolean} True if an element was inserted.
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {Array} array The array to modify.
 * @param {*} value The object to remove.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and
 *     return a negative integer, zero, or a positive integer depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @return {boolean} True if an element was removed.
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array} array The array.
 * @param {Function} sorter Function to call for every element.  This
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a valid object key (a string, number, etc), or undefined, if
 *     that object should not be placed in a bucket.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array.<*>} An array with the repeated value.
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array.<*>} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<*>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<*>} The array.
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array || goog.isString(array));
  goog.asserts.assertNumber(array.length);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};

// Input 5
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition the goog.debug.RelativeTimeProvider class.
 *
*
 */

goog.provide('goog.debug.RelativeTimeProvider');

/**
 * A simple object to keep track of a timestamp considered the start of
 * something. The main use is for the logger system to maintain a start time
 * that is occasionally reset. For example, in Gmail, we reset this relative
 * time at the start of a user action so that timings are offset from the
 * beginning of the action. This class also provides a singleton as the default
 * behavior for most use cases is to share the same start time.
 *
 * @constructor
 */
goog.debug.RelativeTimeProvider = function() {
  /**
   * The start time.
   * @type {number}
   * @private
   */
  this.relativeTimeStart_ = goog.now();
};


/**
 * Default instance.
 * @type {goog.debug.RelativeTimeProvider}
 * @private
 */
goog.debug.RelativeTimeProvider.defaultInstance_ =
    new goog.debug.RelativeTimeProvider();


/**
 * Sets the start time to the specified time.
 * @param {number} timeStamp The start time.
 */
goog.debug.RelativeTimeProvider.prototype.set = function(timeStamp) {
  this.relativeTimeStart_ = timeStamp;
};


/**
 * Resets the start time to now.
 */
goog.debug.RelativeTimeProvider.prototype.reset = function() {
  this.set(goog.now());
};

/**
 * @return {number} The start time.
 */
goog.debug.RelativeTimeProvider.prototype.get = function() {
  return this.relativeTimeStart_;
};


/**
 * @return {goog.debug.RelativeTimeProvider} The default instance.
 */
goog.debug.RelativeTimeProvider.getDefaultInstance = function() {
  return goog.debug.RelativeTimeProvider.defaultInstance_;
};

// Input 6
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of various formatters for logging. Please minimize
 * dependencies this file has on other closure classes as any dependency it
 * takes won't be able to use the logging infrastructure.
 *
*
 */

goog.provide('goog.debug.Formatter');
goog.provide('goog.debug.HtmlFormatter');
goog.provide('goog.debug.TextFormatter');

goog.require('goog.debug.RelativeTimeProvider');
goog.require('goog.string');

/**
 * Base class for Formatters. A Formatter is used to format a LogRecord into
 * something that can be displayed to the user.
 *
 * @param {string=} opt_prefix The prefix to place before text records.
 * @constructor
 */
goog.debug.Formatter = function(opt_prefix) {
  this.prefix_ = opt_prefix || '';

  /**
   * A provider that returns the relative start time.
   * @type {goog.debug.RelativeTimeProvider}
   * @private
   */
  this.startTimeProvider_ =
      goog.debug.RelativeTimeProvider.getDefaultInstance();
};

/**
 * Whether to show absolute time in the DebugWindow
 * @type {boolean}
 */
goog.debug.Formatter.prototype.showAbsoluteTime = true;

/**
 * Whether to show relative time in the DebugWindow
 * @type {boolean}
 */
goog.debug.Formatter.prototype.showRelativeTime = true;

/**
 * Whether to show the logger name in the DebugWindow
 * @type {boolean}
 */
goog.debug.Formatter.prototype.showLoggerName = true;

/**
 * Whether to show the logger exception text
 * @type {boolean}
 */
goog.debug.Formatter.prototype.showExceptionText = false;

/**
 * Whether to show the severity level
 * @type {boolean}
 */
goog.debug.Formatter.prototype.showSeverityLevel = false;


/**
 * Formats a record
 * @param {goog.debug.LogRecord} logRecord the logRecord to format.
 * @return {string} The formatted string.
 */
goog.debug.Formatter.prototype.formatRecord = goog.abstractMethod;


/**
 * Sets the start time provider. By default, this is the default instance
 * but can be changed.
 * @param {goog.debug.RelativeTimeProvider} provider The provider to use.
 */
goog.debug.Formatter.prototype.setStartTimeProvider = function(provider) {
  this.startTimeProvider_ = provider;
};


/**
 * Returns the start time provider. By default, this is the default instance
 * but can be changed.
 * @return {goog.debug.RelativeTimeProvider} The start time provider.
 */
goog.debug.Formatter.prototype.getStartTimeProvider = function() {
  return this.startTimeProvider_;
};


/**
 * Resets the start relative time.
 */
goog.debug.Formatter.prototype.resetRelativeTimeStart = function() {
  this.startTimeProvider_.reset();
};


/**
 * Returns a string for the time/date of the LogRecord.
 * @param {goog.debug.LogRecord} logRecord The record to get a time stamp for.
 * @return {string} A string representation of the time/date of the LogRecord.
 * @private
 */
goog.debug.Formatter.getDateTimeStamp_ = function(logRecord) {
  var time = new Date(logRecord.getMillis());
  return goog.debug.Formatter.getTwoDigitString_((time.getFullYear() - 2000)) +
         goog.debug.Formatter.getTwoDigitString_((time.getMonth() + 1)) +
         goog.debug.Formatter.getTwoDigitString_(time.getDate()) + ' ' +
         goog.debug.Formatter.getTwoDigitString_(time.getHours()) + ':' +
         goog.debug.Formatter.getTwoDigitString_(time.getMinutes()) + ':' +
         goog.debug.Formatter.getTwoDigitString_(time.getSeconds()) + '.' +
         goog.debug.Formatter.getTwoDigitString_(
             Math.floor(time.getMilliseconds() / 10));
};

/**
 * Returns the number as a two-digit string, meaning it prepends a 0 if the
 * number if less than 10.
 * @param {number} n The number to format.
 * @return {string} A two-digit string representation of {@code n}.
 * @private
 */
goog.debug.Formatter.getTwoDigitString_ = function(n) {
  if (n < 10) {
    return '0' + n;
  }
  return String(n);
};


/**
 * Returns a string for the number of seconds relative to the start time.
 * Prepads with spaces so that anything less than 1000 seconds takes up the
 * same number of characters for better formatting.
 * @param {goog.debug.LogRecord} logRecord The log to compare time to.
 * @param {number} relativeTimeStart The start time to compare to.
 * @return {string} The number of seconds of the LogRecord relative to the
 *     start time.
 * @private
 */
goog.debug.Formatter.getRelativeTime_ = function(logRecord,
                                                  relativeTimeStart) {
  var ms = logRecord.getMillis() - relativeTimeStart;
  var sec = ms / 1000;
  var str = sec.toFixed(3);

  var spacesToPrepend = 0;
  if (sec < 1) {
    spacesToPrepend = 2;
  } else {
    while (sec < 100) {
      spacesToPrepend++;
      sec *= 10;
    }
  }
  while (spacesToPrepend-- > 0) {
    str = ' ' + str;
  }
  return str;
};

/**
 * Formatter that returns formatted html. See formatRecord for the classes
 * it uses for various types of formatted output.
 *
 * @param {string=} opt_prefix The prefix to place before text records.
 * @constructor
 * @extends {goog.debug.Formatter}
 */
goog.debug.HtmlFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix);
};
goog.inherits(goog.debug.HtmlFormatter, goog.debug.Formatter);

/**
 * Whether to show the logger exception text
 * @type {boolean}
 */
goog.debug.HtmlFormatter.prototype.showExceptionText = true;


/**
 * Formats a record
 * @param {goog.debug.LogRecord} logRecord the logRecord to format.
 * @return {string} The formatted string as html.
 */
goog.debug.HtmlFormatter.prototype.formatRecord = function(logRecord) {
  var className;
  switch (logRecord.getLevel().value) {
    case goog.debug.Logger.Level.SHOUT.value:
      className = 'dbg-sh';
      break;
    case goog.debug.Logger.Level.SEVERE.value:
      className = 'dbg-sev';
      break;
    case goog.debug.Logger.Level.WARNING.value:
      className = 'dbg-w';
      break;
    case goog.debug.Logger.Level.INFO.value:
      className = 'dbg-i';
      break;
    case goog.debug.Logger.Level.FINE.value:
    default:
      className = 'dbg-f';
      break;
  }

  // Build message html
  var sb = [];
  sb.push(this.prefix_, ' ');
  if (this.showAbsoluteTime) {
    sb.push('[', goog.debug.Formatter.getDateTimeStamp_(logRecord), '] ');
  }
  if (this.showRelativeTime) {
    sb.push('[',
        goog.string.whitespaceEscape(
            goog.debug.Formatter.getRelativeTime_(logRecord,
                this.startTimeProvider_.get())),
        's] ');
  }

  if (this.showLoggerName) {
    sb.push('[', goog.string.htmlEscape(logRecord.getLoggerName()), '] ');
  }
  sb.push('<span class="', className, '">',
      goog.string.newLineToBr(goog.string.whitespaceEscape(
          goog.string.htmlEscape(logRecord.getMessage()))));

  if (this.showExceptionText && logRecord.getException()) {
    sb.push('<br>',
        goog.string.newLineToBr(goog.string.whitespaceEscape(
            logRecord.getExceptionText() || '')));
  }
  sb.push('</span><br>');

  // If the logger is enabled, open window and write html message to log
  // otherwise save it
  return sb.join('');
};


/**
 * Formatter that returns formatted plain text
 *
 * @param {string=} opt_prefix The prefix to place before text records.
 * @constructor
 * @extends {goog.debug.Formatter}
 */
goog.debug.TextFormatter = function(opt_prefix) {
  goog.debug.Formatter.call(this, opt_prefix);
};
goog.inherits(goog.debug.TextFormatter, goog.debug.Formatter);


/**
 * Formats a record as text
 * @param {goog.debug.LogRecord} logRecord the logRecord to format.
 * @return {string} The formatted string.
 */
goog.debug.TextFormatter.prototype.formatRecord = function(logRecord) {
  // Build message html
  var sb = [];
  sb.push(this.prefix_, ' ');
  if (this.showAbsoluteTime) {
    sb.push('[', goog.debug.Formatter.getDateTimeStamp_(logRecord), '] ');
  }
  if (this.showRelativeTime) {
    sb.push('[', goog.debug.Formatter.getRelativeTime_(logRecord,
        this.startTimeProvider_.get()), 's] ');
  }

  if (this.showLoggerName) {
    sb.push('[', logRecord.getLoggerName(), '] ');
  }
  if (this.showSeverityLevel) {
    sb.push('[', logRecord.getLevel().name, '] ');
  }
  sb.push(logRecord.getMessage(), '\n');
  if (this.showExceptionText && logRecord.getException()) {
    sb.push(logRecord.getExceptionText(), '\n');
  }
  // If the logger is enabled, open window and write html message to log
  // otherwise save it
  return sb.join('');
};

// Input 7
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
*
*
*
 */

goog.provide('goog.object');


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and the return value is irrelevant.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This
 *     function takes 3 arguments (the element, the index and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {!Object} a new object in which only elements that passed the test
 *     are present.
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {!Object} a new object with the results from f.
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object} obj The object to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object} obj The object to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a value from.
 * @return {*} The value or undefined if the object is empty.
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object} obj The object in which to look for val.
 * @param {*} val The object for which to check.
 * @return {boolean} true if val is present.
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the values.
 * @return {!Array} The values in the object/map/hash.
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array.<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object} obj The object in which to look for val.
 * @param {*} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object} obj The object to search in.
 * @param {function(*, string, Object): boolean} f The function to call for
 *     every element. Takes 3 arguments (the value, the key and the object) and
 *     should return a boolean.
 * @param {Object=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object} obj The object to search in.
 * @param {function(*, string, Object): boolean} f The function to call for
 *     every element. Takes 3 arguments (the value, the key and the object) and
 *     should return a boolean.
 * @param {Object=} opt_this An optional "this" context for the function.
 * @return {*} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  // Some versions of IE has problems if we delete keys from the beginning
  var keys = goog.object.getKeys(obj);
  for (var i = keys.length - 1; i >= 0; i--) {
    goog.object.remove(obj, keys[i]);
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} val The value to add.
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {*=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {*} The value for the given key.
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} value The value to add.
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} value The value to add if the key wasn't present.
 * @return {*} The value of the entry at the end of the function.
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object} obj Object to clone.
 * @return {!Object} Clone of the input object.
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {c: 2});
 * o; // {a: 0, b: 1, c: 2}
 *
 * @param {Object} target  The object to modify.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};

// Input 8
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Generics method for collection-like classes and objects.
 *
*
 *
 * This file contains functions to work with collections. It supports using
 * Map, Set, Array and Object and other classes that implement collection-like
 * methods.
 */


goog.provide('goog.structs');

goog.require('goog.array');
goog.require('goog.object');


// We treat an object as a dictionary if it has getKeys or it is an object that
// isn't arrayLike.


/**
 * Returns the number of values in the collection-like object.
 * @param {Object} col The collection-like object.
 * @return {number} The number of values in the collection-like object.
 */
goog.structs.getCount = function(col) {
  if (typeof col.getCount == 'function') {
    return col.getCount();
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return col.length;
  }
  return goog.object.getCount(col);
};


/**
 * Returns the values of the collection-like object.
 * @param {Object} col The collection-like object.
 * @return {!Array} The values in the collection-like object.
 */
goog.structs.getValues = function(col) {
  if (typeof col.getValues == 'function') {
    return col.getValues();
  }
  if (goog.isString(col)) {
    return col.split('');
  }
  if (goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for (var i = 0; i < l; i++) {
      rv.push(col[i]);
    }
    return rv;
  }
  return goog.object.getValues(col);
};


/**
 * Returns the keys of the collection. Some collections have no notion of
 * keys/indexes and this function will return undefined in those cases.
 * @param {Object} col The collection-like object.
 * @return {!Array|undefined} The keys in the collection.
 */
goog.structs.getKeys = function(col) {
  if (typeof col.getKeys == 'function') {
    return col.getKeys();
  }
  // if we have getValues but no getKeys we know this is a key-less collection
  if (typeof col.getValues == 'function') {
    return undefined;
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for (var i = 0; i < l; i++) {
      rv.push(i);
    }
    return rv;
  }

  return goog.object.getKeys(col);
};


/**
 * Whether the collection contains the given value. This is O(n) and uses
 * equals (==) to test the existence.
 * @param {Object} col The collection-like object.
 * @param {*} val The value to check for.
 * @return {boolean} True if the map contains the value.
 */
goog.structs.contains = function(col, val) {
  if (typeof col.contains == 'function') {
    return col.contains(val);
  }
  if (typeof col.containsValue == 'function') {
    return col.containsValue(val);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(/** @type {Array} */ (col), val);
  }
  return goog.object.containsValue(col, val);
};


/**
 * Whether the collection is empty.
 * @param {Object} col The collection-like object.
 * @return {boolean} True if empty.
 */
goog.structs.isEmpty = function(col) {
  if (typeof col.isEmpty == 'function') {
    return col.isEmpty();
  }

  // We do not use goog.string.isEmpty because here we treat the string as
  // collection and as such even whitespace matters

  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(/** @type {Array} */ (col));
  }
  return goog.object.isEmpty(col);
};


/**
 * Removes all the elements from the collection.
 * @param {Object} col The collection-like object.
 */
goog.structs.clear = function(col) {
  // NOTE(user): This should not contain strings because strings are immutable
  if (typeof col.clear == 'function') {
    col.clear();
  } else if (goog.isArrayLike(col)) {
    goog.array.clear((/** @type {goog.array.ArrayLike} */ col));
  } else {
    goog.object.clear(col);
  }
};


/**
 * Calls a function for each value in a collection. The function takes
 * three arguments; the value, the key and the collection.
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and the return value is irrelevant.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within {@code f}.
 */
goog.structs.forEach = function(col, f, opt_obj) {
  if (typeof col.forEach == 'function') {
    col.forEach(f, opt_obj);
  } else if (goog.isArrayLike(col) || goog.isString(col)) {
    goog.array.forEach(/** @type {Array} */ (col), f, opt_obj);
  } else {
    var keys = goog.structs.getKeys(col);
    var values = goog.structs.getValues(col);
    var l = values.length;
    for (var i = 0; i < l; i++) {
      f.call(opt_obj, values[i], keys && keys[i], col);
    }
  }
};


/**
 * Calls a function for every value in the collection. When a call returns true,
 * adds the value to a new collection (Array is returned by default).
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean. If the
 *     return value is true the value is added to the result collection. If it
 *     is false the value is not included.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {!Object|!Array} A new collection where the passed values are
 *     present. If col is a key-less collection an array is returned.  If col
 *     has keys and values a plain old JS object is returned.
 */
goog.structs.filter = function(col, f, opt_obj) {
  if (typeof col.filter == 'function') {
    return col.filter(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(/** @type {!Array} */ (col), f, opt_obj);
  }

  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0; i < l; i++) {
      if (f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i];
      }
    }
  } else {
    // We should not use goog.array.filter here since we want to make sure that
    // the index is undefined as well as make sure that col is passed to the
    // function.
    rv = [];
    for (var i = 0; i < l; i++) {
      if (f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i]);
      }
    }
  }
  return rv;
};


/**
 * Calls a function for every value in the collection and adds the result into a
 * new collection (defaults to creating a new Array).
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function
 *     takes 3 arguments (the value, the key or undefined if the collection has
 *     no notion of keys, and the collection) and should return something. The
 *     result will be used as the value in the new collection.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {!Object|!Array} A new collection with the new values.  If col is a
 *     key-less collection an array is returned.  If col has keys and values a
 *     plain old JS object is returned.
 */
goog.structs.map = function(col, f, opt_obj) {
  if (typeof col.map == 'function') {
    return col.map(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(/** @type {!Array} */ (col), f, opt_obj);
  }

  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if (keys) {
    rv = {};
    for (var i = 0; i < l; i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col);
    }
  } else {
    // We should not use goog.array.map here since we want to make sure that
    // the index is undefined as well as make sure that col is passed to the
    // function.
    rv = [];
    for (var i = 0; i < l; i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col);
    }
  }
  return rv;
};


/**
 * Calls f for each value in a collection. If any call returns true this returns
 * true (without checking the rest). If all returns false this returns false.
 *
 * @param {Object|Array|string} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {boolean} True if any value passes the test.
 */
goog.structs.some = function(col, f, opt_obj) {
  if (typeof col.some == 'function') {
    return col.some(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(/** @type {!Array} */ (col), f, opt_obj);
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    if (f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls f for each value in a collection. If all calls return true this return
 * true this returns true. If any returns false this returns false at this point
 *  and does not continue to check the remaining values.
 *
 * @param {Object} col The collection-like object.
 * @param {Function} f The function to call for every value. This function takes
 *     3 arguments (the value, the key or undefined if the collection has no
 *     notion of keys, and the collection) and should return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within {@code f}.
 * @return {boolean} True if all key-value pairs pass the test.
 */
goog.structs.every = function(col, f, opt_obj) {
  if (typeof col.every == 'function') {
    return col.every(f, opt_obj);
  }
  if (goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(/** @type {!Array} */ (col), f, opt_obj);
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    if (!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false;
    }
  }
  return true;
};

// Input 9
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Python style iteration utilities.
*
 */


goog.provide('goog.iter');
goog.provide('goog.iter.Iterator');
goog.provide('goog.iter.StopIteration');

goog.require('goog.array');


/**
 * @type {goog.iter.Iterator|{length:number}|{__iterator__}}
 */
goog.iter.Iterable = goog.typedef;


// For script engines that already support iterators.
if ('StopIteration' in goog.global) {
  /**
   * Singleton Error object that is used to terminate iterations.
   * @type {Error}
   */
  goog.iter.StopIteration = goog.global['StopIteration'];
} else {
  /**
   * Singleton Error object that is used to terminate iterations.
   * @type {Error}
   * @suppress {duplicate}
   */
  goog.iter.StopIteration = Error('StopIteration');
}



/**
 * Class/interface for iterators.  An iterator needs to implement a {@code next}
 * method and it needs to throw a {@code goog.iter.StopIteration} when the
 * iteration passes beyond the end.  Iterators have no {@code hasNext} method.
 * It is recommended to always use the helper functions to iterate over the
 * iterator or in case you are only targeting JavaScript 1.7 for in loops.
 * @constructor
 */
goog.iter.Iterator = function() {};


/**
 * Returns the next value of the iteration.  This will throw the object
 * {@see goog.iter#StopIteration} when the iteration passes the end.
 * @return {*} Any object or value.
 */
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};


/**
 * Returns the {@code Iterator} object itself.  This is used to implement
 * the iterator protocol in JavaScript 1.7
 * @param {boolean=} opt_keys  Whether to return the keys or values. Default is
 *     to only return the values.  This is being used by the for-in loop (true)
 *     and the for-each-in loop (false).  Even though the param gives a hint
 *     about what the iterator will return there is no guarantee that it will
 *     return the keys when true is passed.
 * @return {!goog.iter.Iterator} The object itself.
 */
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this;
};



/**
 * Returns an iterator that knows how to iterate over the values in the object.
 * @param {goog.iter.Iterable} iterable  If the object is an iterator it
 *     will be returned as is.  If the object has a {@code __iterator__} method
 *     that will be called to get the value iterator.  If the object is an
 *     array-like object we create an iterator for that.
 * @return {!goog.iter.Iterator} An iterator that knows how to iterate over the
 *     values in {@code iterable}.
 */
goog.iter.toIterator = function(iterable) {
  if (iterable instanceof goog.iter.Iterator) {
    return iterable;
  }
  if (typeof iterable.__iterator__ == 'function') {
    return iterable.__iterator__(false);
  }
  if (goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while (true) {
        if (i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        // Don't include deleted elements.
        if (!(i in iterable)) {
          i++;
          continue;
        }
        return iterable[i++];
      }
    };
    return newIter;
  }


  // TODO(user): Should we fall back on goog.structs.getValues()?
  throw Error('Not implemented');
};


/**
 * Calls a function for each element in the iterator with the element of the
 * iterator passed as argument.
 *
 * @param {goog.iter.Iterable} iterable  The iterator to iterate
 *     over.  If the iterable is an object {@code toIterator} will be called on
 *     it.
 * @param {Function} f  The function to call for every element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and the
 *     return value is irrelevant.  The reason for passing undefined as the
 *     second argument is so that the same function can be used in
 *     {@see goog.array#forEach} as well as others.
 * @param {Object=} opt_obj  The object to be used as the value of 'this' within
 *     {@code f}.
 */
goog.iter.forEach = function(iterable, f, opt_obj) {
  if (goog.isArrayLike(iterable)) {
    /** @preserveTry */
    try {
      goog.array.forEach((/** @type {goog.array.ArrayLike} */ iterable), f,
                         opt_obj);
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
       throw ex;
      }
    }
  } else {
    iterable = goog.iter.toIterator(iterable);
    /** @preserveTry */
    try {
      while (true) {
        f.call(opt_obj, iterable.next(), undefined, iterable);
      }
    } catch (ex) {
      if (ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};


/**
 * Calls a function for every element in the iterator, and if the function
 * returns true adds the element to a new iterator.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {Function} f The function to call for every element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and should
 *     return a boolean.  If the return value is true the element will be
 *     included  in the returned iteror.  If it is false the element is not
 *     included.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator in which only elements that
 *     passed the test are present.
 */
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      var val = iterable.next();
      if (f.call(opt_obj, val, undefined, iterable)) {
        return val;
      }
    }
  };
  return newIter;
};


/**
 * Creates a new iterator that returns the values in a range.  This function
 * can take 1, 2 or 3 arguments:
 * <pre>
 * range(5) same as range(0, 5, 1)
 * range(2, 5) same as range(2, 5, 1)
 * </pre>
 *
 * @param {number} startOrStop  The stop value if only one argument is provided.
 *     The start value if 2 or more arguments are provided.  If only one
 *     argument is used the start value is 0.
 * @param {number=} opt_stop  The stop value.  If left out then the first
 *     argument is used as the stop value.
 * @param {number=} opt_step  The number to increment with between each call to
 *     next.  This can be negative.
 * @return {!goog.iter.Iterator} A new iterator that returns the values in the
 *     range.
 */
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if (arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop;
  }
  if (step == 0) {
    throw Error('Range step argument must not be zero');
  }

  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if (step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv;
  };
  return newIter;
};


/**
 * Joins the values in a iterator with a delimiter.
 * @param {goog.iter.Iterable} iterable  The iterator to get the values from.
 * @param {string} deliminator  The text to put between the values.
 * @return {string} The joined value string.
 */
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator);
};


/**
 * For every element in the iterator call a function and return a new iterator
 * with that value.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {Function} f The function to call for every element.  This function
 *     takes 3 arguments (the element, undefined, and the iterator) and should
 *     return a new value.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator that returns the results of
 *     applying the function to each element in the original iterator.
 */
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable);
    }
  };
  return newIter;
};


/**
 * Passes every element of an iterator into a function and accumulates the
 * result.
 *
 * @param {goog.iter.Iterable} iterable The iterator to iterate over.
 * @param {Function} f The function to call for every element. This function
 *     takes 2 arguments (the function's previous result or the initial value,
 *     and the value of the current element).
 *     function(previousValue, currentElement) : newValue.
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {*} Result of evaluating f repeatedly across the values of
 *     the iterator.
 */
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val);
  });
  return rval;
};


/**
 * Goes through the values in the iterator. Calls f for each these and if any of
 * them returns true, this returns true (without checking the rest). If all
 * return false this will return false.
 *
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {boolean} true if any value passes the test.
 */
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  /** @preserveTry */
  try {
    while (true) {
      if (f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false;
};


/**
 * Goes through the values in the iterator. Calls f for each these and if any of
 * them returns false this returns false (without checking the rest). If all
 * return true this will return true.
 *
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {boolean} true if every value passes the test.
 */
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  /** @preserveTry */
  try {
    while (true) {
      if (!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true;
};


/**
 * Takes zero or more iterators and returns one iterator that will iterate over
 * them in the order chained.
 * @param {...goog.iter.Iterator} var_args  Any number of iterator objects.
 * @return {!goog.iter.Iterator} Returns a new iterator that will iterate over
 *     all the given iterators' contents.
 */
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;

  /**
   * @return {*} The next item in the iteration.
   * @this {goog.iter.Iterator}
   */
  newIter.next = function() {
    /** @preserveTry */
    try {
      if (i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next();
    } catch (ex) {
      if (ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      } else {
        // In case we got a StopIteration increment counter and try again.
        i++;
        return this.next();
      }
    }
  };

  return newIter;
};


/**
 * Builds a new iterator that iterates over the original, but skips elements as
 * long as a supplied function returns true.
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this' within
 *     {@code f}.
 * @return {!goog.iter.Iterator} A new iterator that drops elements from the
 *     original iterator as long as {@code f} is true.
 */
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while (true) {
      var val = iterable.next();
      if (dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue;
      } else {
        dropping = false;
      }
      return val;
    }
  };
  return newIter;
};


/**
 * Builds a new iterator that iterates over the original, but only as long as a
 * supplied function returns true.
 * @param {goog.iter.Iterable} iterable  The iterator object.
 * @param {Function} f  The function to call for every value. This function
 *     takes 3 arguments (the value, undefined, and the iterator) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object in f when called.
 * @return {!goog.iter.Iterator} A new iterator that keeps elements in the
 *     original iterator as long as the function is true.
 */
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while (true) {
      if (taking) {
        var val = iterable.next();
        if (f.call(opt_obj, val, undefined, iterable)) {
          return val;
        } else {
          taking = false;
        }
      } else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter;
};


/**
 * Converts the iterator to an array
 * @param {goog.iter.Iterable} iterable  The iterator to convert to an array.
 * @return {!Array} An array of the elements the iterator iterates over.
 */
goog.iter.toArray = function(iterable) {
  // Fast path for array-like.
  if (goog.isArrayLike(iterable)) {
    return goog.array.toArray((/** @type {!goog.array.ArrayLike} */ iterable));
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val);
  });
  return array;
};


/**
 * Iterates over 2 iterators and returns true if they contain the same sequence
 * of elements and have the same length.
 * @param {goog.iter.Iterable} iterable1  The first iterable object.
 * @param {goog.iter.Iterable} iterable2  The second iterable object.
 * @return {boolean} true if the iterators contain the same sequence of
 *     elements and have the same length.
 */
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  /** @preserveTry */
  try {
    while (true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if (val1 != val2) {
        return false;
      }
    }
  } catch (ex) {
    if (ex !== goog.iter.StopIteration) {
      throw ex;
    } else {
      if (b1 && !b2) {
        // iterable1 done but iterable2 is not done.
        return false;
      }
      if (!b2) {
        /** @preserveTry */
        try {
          // iterable2 not done?
          val2 = iterable2.next();
          // iterable2 not done but iterable1 is done
          return false;
        } catch (ex1) {
          if (ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          // iterable2 done as well... They are equal
          return true;
        }
      }
    }
  }
  return false;
};


/**
 * Advances the iterator to the next position, returning the given default value
 * instead of throwing an exception if the iterator has no more entries.
 * @param {goog.iter.Iterable} iterable The iterable object.
 * @param {*} defaultValue The value to return if the iterator is empty.
 * @return {*} The next item in the iteration, or defaultValue if the iterator
 *     was empty.
 */
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next();
  } catch (e) {
    if (e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue;
  }
};

// Input 10
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: Hash Map.
 *
*
*
 *
 * This file contains an implementation of a Map structure. It implements a lot
 * of the methods used in goog.structs so those functions work on hashes.  For
 * convenience with common usage the methods accept any type for the key, though
 * internally they will be cast to strings.
 */


goog.provide('goog.structs.Map');

goog.require('goog.iter.Iterator');
goog.require('goog.iter.StopIteration');
goog.require('goog.object');
goog.require('goog.structs');


/**
 * Class for Hash Map datastructure.
 * @param {*=} opt_map Map or Object to initialize the map with.
 * @param {...*} var_args If 2 or more arguments are present then they
 *     will be used as key-value pairs.
 * @constructor
 */
goog.structs.Map = function(opt_map, var_args) {

  /**
   * Underlying JS object used to implement the map.
   * @type {!Object}
   * @private
   */
  this.map_ = {};

  /**
   * An array of keys. This is necessary for two reasons:
   *   1. Iterating the keys using for (var key in this.map_) allocates an
   *      object for every key in IE which is really bad for IE6 GC perf.
   *   2. Without a side data structure, we would need to escape all the keys
   *      as that would be the only way we could tell during iteration if the
   *      key was an internal key or a property of the object.
   *
   * This array can contain deleted keys so it's necessary to check the map
   * as well to see if the key is still in the map (this doesn't require a
   * memory allocation in IE).
   * @type {!Array.<string>}
   * @private
   */
  this.keys_ = [];

  var argLength = arguments.length;

  if (argLength > 1) {
    if (argLength % 2) {
      throw Error('Uneven number of arguments');
    }
    for (var i = 0; i < argLength; i += 2) {
      this.set(arguments[i], arguments[i + 1]);
    }
  } else if (opt_map) {
    this.addAll(/** @type {Object} */ (opt_map));
  }
};


/**
 * The number of key value pairs in the map.
 * @private
 * @type {number}
 */
goog.structs.Map.prototype.count_ = 0;


/**
 * Version used to detect changes while iterating.
 * @private
 * @type {number}
 */
goog.structs.Map.prototype.version_ = 0;

/**
 * @return {number} The number of key-value pairs in the map.
 */
goog.structs.Map.prototype.getCount = function() {
  return this.count_;
};


/**
 * Returns the values of the map.
 * @return {!Array} The values in the map.
 */
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();

  var rv = [];
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key]);
  }
  return rv;
};


/**
 * Returns the keys of the map.
 * @return {!Array.<string>} Array of string values.
 */
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return /** @type {!Array.<string>} */ (this.keys_.concat());
};


/**
 * Whether the map contains the given key.
 * @param {*} key The key to check for.
 * @return {boolean} Whether the map contains the key.
 */
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key);
};


/**
 * Whether the map contains the given value. This is O(n).
 * @param {*} val The value to check for.
 * @return {boolean} Whether the map contains the value.
 */
goog.structs.Map.prototype.containsValue = function(val) {
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Whether this map is equal to the argument map.
 * @param {goog.structs.Map} otherMap The map against which to test equality.
 * @param {function(*, *) : boolean=} opt_equalityFn Optional equality function
 *     to test equality of values. If not specified, this will test whether
 *     the values contained in each map are identical objects.
 * @return {boolean} Whether the maps are equal.
 */
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if (this === otherMap) {
    return true;
  }

  if (this.count_ != otherMap.getCount()) {
    return false;
  }

  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;

  this.cleanupKeysArray_();
  for (var key, i = 0; key = this.keys_[i]; i++) {
    if (!equalityFn(this.get(key), otherMap.get(key))) {
      return false;
    }
  }

  return true;
};


/**
 * Default equality test for values.
 * @param {*} a The first value.
 * @param {*} b The second value.
 * @return {boolean} Whether a and b reference the same object.
 */
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b;
};


/**
 * @return {boolean} Whether the map is empty.
 */
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0;
};


/**
 * Removes all key-value pairs from the map.
 */
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0;
};

/**
 * Removes a key-value pair based on the key. This is O(logN) amortized due to
 * updating the keys array whenever the count becomes half the size of the keys
 * in the keys array.
 * @param {*} key  The key to remove.
 * @return {boolean} Whether object was removed.
 */
goog.structs.Map.prototype.remove = function(key) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;

    // clean up the keys array if the threshhold is hit
    if (this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_();
    }

    return true;
  }
  return false;
};


/**
 * Cleans up the temp keys array by removing entries that are no longer in the
 * map.
 * @private
 */
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if (this.count_ != this.keys_.length) {
    // First remove keys that are no longer in the map.
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }

  if (this.count_ != this.keys_.length) {
    // If the count still isn't correct, that means we have duplicates. This can
    // happen when the same key is added and removed multiple times. Now we have
    // to allocate one extra Object to remove the duplicates. This could have
    // been done in the first pass, but in the common case, we can avoid
    // allocating an extra object by only doing this when necessary.
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while (srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if (!(goog.structs.Map.hasKey_(seen, key))) {
        this.keys_[destIndex++] = key;
        seen[key] = 1;
      }
      srcIndex++;
    }
    this.keys_.length = destIndex;
  }
};


/**
 * Returns the value for the given key.  If the key is not found and the default
 * value is not given this will return {@code undefined}.
 * @param {*} key The key to get the value for.
 * @param {*=} opt_val The value to return if no item is found for the given
 *     key, defaults to undefined.
 * @return {*} The value for the given key.
 */
goog.structs.Map.prototype.get = function(key, opt_val) {
  if (goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the map.
 * @param {*} key The key.
 * @param {*} value The value to add.
 */
goog.structs.Map.prototype.set = function(key, value) {
  if (!(goog.structs.Map.hasKey_(this.map_, key))) {
    this.count_++;
    this.keys_.push(key);
    // Only change the version if we add a new key.
    this.version_++;
  }
  this.map_[key] = value;
};


/**
 * Adds multiple key-value pairs from another goog.structs.Map or Object.
 * @param {Object} map  Object containing the data to add.
 */
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if (map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues();
  } else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map);
  }
  // we could use goog.array.forEach here but I don't want to introduce that
  // dependency just for this.
  for (var i = 0; i < keys.length; i++) {
    this.set(keys[i], values[i]);
  }
};


/**
 * Clones a map and returns a new map.
 * @return {!goog.structs.Map} A new map with the same key-value pairs.
 */
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this);
};


/**
 * Returns a new map in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * It acts very similarly to {goog.object.transpose(Object)}.
 *
 * @return {!goog.structs.Map} The transposed map.
 */
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map();
  for (var i = 0; i < this.keys_.length; i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key);
  }

  return transposed;
};


/**
 * Returns an iterator that iterates over the keys in the map.  Removal of keys
 * while iterating might have undesired side effects.
 * @return {!goog.iter.Iterator} An iterator over the keys in the map.
 */
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true);
};


/**
 * Returns an iterator that iterates over the values in the map.  Removal of
 * keys while iterating might have undesired side effects.
 * @return {!goog.iter.Iterator} An iterator over the values in the map.
 */
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false);
};


/**
 * Returns an iterator that iterates over the values or the keys in the map.
 * This throws an exception if the map was mutated since the iterator was
 * created.
 * @param {boolean=} opt_keys True to iterate over the keys. False to iterate
 *     over the values.  The default value is false.
 * @return {!goog.iter.Iterator} An iterator over the values or keys in the map.
 */
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  // Clean up keys to minimize the risk of iterating over dead keys.
  this.cleanupKeysArray_();

  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;

  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while (true) {
      if (version != selfObj.version_) {
        throw Error('The map has changed since the iterator was created');
      }
      if (i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key];
    }
  };
  return newIter;
};


/**
 * Safe way to test for hasOwnProperty.  It even allows testing for
 * 'hasOwnProperty'.
 * @param {Object} obj The object to test for presence of the given key.
 * @param {*} key The key to check for.
 * @return {boolean} Whether the object has the key.
 * @private
 */
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

// Input 11
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: Set.
 *
*
*
 *
 * This class implements a set data structure. Adding and removing is O(1). It
 * supports both object and primitive values. Be careful because you can add
 * both 1 and new Number(1), because these are not the same. You can even add
 * multiple new Number(1) because these are not equal.
 */


goog.provide('goog.structs.Set');

goog.require('goog.structs');
goog.require('goog.structs.Map');


/**
 * A set that can contain both primitives and objects.  Adding and removing
 * elements is O(1).  Primitives are treated as identical if they have the same
 * type and convert to the same string.  Objects are treated as identical only
 * if they are references to the same object.  WARNING: A goog.structs.Set can
 * contain both 1 and (new Number(1)), because they are not the same.  WARNING:
 * Adding (new Number(1)) twice will yield two distinct elements, because they
 * are two different objects.  WARNING: Any object that is added to a
 * goog.structs.Set will be modified!  Because goog.getUid() is used to
 * identify objects, every object in the set will be mutated.
 * @param {Array|Object=} opt_values Initial values to start with.
 * @constructor
 */
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if (opt_values) {
    this.addAll(opt_values);
  }
};


/**
 * Obtains a unique key for an element of the set.  Primitives will yield the
 * same key if they have the same type and convert to the same string.  Object
 * references will yield the same key only if they refer to the same object.
 * @param {*} val Object or primitive value to get a key for.
 * @return {string} A unique key for this value/object.
 * @private
 */
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if (type == 'object' && val || type == 'function') {
    return 'o' + goog.getUid(/** @type {Object} */ (val));
  } else {
    return type.substr(0, 1) + val;
  }
};


/**
 * @return {number} The number of elements in the set.
 */
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount();
};


/**
 * Add a primitive or an object to the set.
 * @param {*} element The primitive or object to add.
 */
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element);
};


/**
 * Adds all the values in the given collection to this set.
 * @param {Array|Object} col A collection containing the elements to add.
 */
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    this.add(values[i]);
  }
};


/**
 * Removes all values in the given collection from this set.
 * @param {Array|Object} col A collection containing the elements to remove.
 */
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for (var i = 0; i < l; i++) {
    this.remove(values[i]);
  }
};


/**
 * Removes the given element from this set.
 * @param {*} element The primitive or object to remove.
 * @return {boolean} Whether the element was found and removed.
 */
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element));
};


/**
 * Removes all elements from this set.
 */
goog.structs.Set.prototype.clear = function() {
  this.map_.clear();
};


/**
 * Tests whether this set is empty.
 * @return {boolean} True if there are no elements in this set.
 */
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty();
};


/**
 * Tests whether this set contains the given element.
 * @param {*} element The primitive or object to test for.
 * @return {boolean} True if this set contains the given element.
 */
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element));
};


/**
 * Tests whether this set contains all the values in a given collection.
 * Repeated elements in the collection are ignored, e.g.  (new
 * goog.structs.Set([1, 2])).containsAll([1, 1]) is True.
 * @param {Object} col A collection-like object.
 * @return {boolean} True if the set contains all elements.
 */
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this);
};


/**
 * Finds all values that are present in both this set and the given collection.
 * @param {Array|Object} col A collection.
 * @return {goog.structs.Set} A new set containing all the values (primitives
 *     or objects) present in both this set and the given collection.
 */
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set();

  var values = goog.structs.getValues(col);
  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    if (this.contains(value)) {
      result.add(value);
    }
  }

  return result;
};


/**
 * Returns an array containing all the elements in this set.
 * @return {Array} An array containing all the elements in this set.
 */
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues();
};


/**
 * Creates a shallow clone of this set.
 * @return {goog.structs.Set} A new set containing all the same elements as
 *     this set.
 */
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this);
};


/**
 * Tests whether the given collection consists of the same elements as this set,
 * regardless of order, without repetition.  Primitives are treated as equal if
 * they have the same type and convert to the same string; objects are treated
 * as equal if they are references to the same object.  This operation is O(n).
 * @param {Object} col A collection.
 * @return {boolean} True if the given collection consists of the same elements
 *     as this set, regardless of order, without repetition.
 */
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col);
};


/**
 * Tests whether the given collection contains all the elements in this set.
 * Primitives are treated as equal if they have the same type and convert to the
 * same string; objects are treated as equal if they are references to the same
 * object.  This operation is O(n).
 * @param {Object} col A collection.
 * @return {boolean} True if this set is a subset of the given collection.
 */
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if (this.getCount() > colCount) {
    return false;
  }
  // TODO(user) Find the minimal collection size where the conversion makes
  // the contains() method faster.
  if (!(col instanceof goog.structs.Set) && colCount > 5) {
    // Convert to a goog.structs.Set so that goog.structs.contains runs in
    // O(1) time instead of O(n) time.
    col = new goog.structs.Set(col);
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value);
  });
};


/**
 * Returns an iterator that iterates over the elements in this set.
 * @param {boolean=} opt_keys This argument is ignored.
 * @return {goog.iter.Iterator} An iterator over the elements in this set.
 */
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false);
};

// Input 12
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.



goog.provide('goog.debug');

goog.require('goog.array');
goog.require('goog.string');
goog.require('goog.structs.Set');


/**
 * Catches onerror events fired by windows and similar objects.
 * @param {function(Object)} logFunc The function to call with the error
 *    information.
 * @param {boolean=} opt_cancel Whether to stop the error from reaching the
 *    browser.
 * @param {Object=} opt_target Object that fires onerror events.
 */
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  target.onerror = function(message, url, line) {
    if (oldErrorHandler) {
      oldErrorHandler(message, url, line);
    }
    var file = String(url).split(/[\/\\]/).pop();
    logFunc({
      message: message,
      fileName: file,
      line: line
    });
    return Boolean(opt_cancel);
  };
};


/**
 * Creates a string representing an object and all its properties.
 * @param {Object|null|undefined} obj Object to expose.
 * @param {boolean=} opt_showFn Show the functions as well as the properties,
 *     default is false.
 * @return {string} The string representation of {@code obj}.
 */
goog.debug.expose = function(obj, opt_showFn) {
  if (typeof obj == 'undefined') {
    return 'undefined';
  }
  if (obj == null) {
    return 'NULL';
  }
  var str = [];

  for (var x in obj) {
    if (!opt_showFn && goog.isFunction(obj[x])) {
      continue;
    }
    var s = x + ' = ';
    /** @preserveTry */
    try {
      s += obj[x];
    } catch (e) {
      s += '*** ' + e + ' ***';
    }
    str.push(s);
  }
  return str.join('\n');
};


/**
 * Creates a string representing a given primitive or object, and for an
 * object, all its properties and nested objects.  WARNING: If an object is
 * given, it and all its nested objects will be modified.  To detect reference
 * cycles, this method identifies objects using goog.getUid() which mutates the
 * object.
 * @param {*} obj Object to expose.
 * @param {boolean=} opt_showFn Also show properties that are functions (by
 *     default, functions are omitted).
 * @return {string} A string representation of {@code obj}.
 */
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set();
  var str = [];

  var helper = function(obj, space) {
    var nestspace = space + '  ';

    var indentMultiline = function(str) {
      return str.replace(/\n/g, '\n' + space);
    };

    /** @preserveTry */
    try {
      if (!goog.isDef(obj)) {
        str.push('undefined');
      } else if (goog.isNull(obj)) {
        str.push('NULL');
      } else if (goog.isString(obj)) {
        str.push('"' + indentMultiline(obj) + '"');
      } else if (goog.isFunction(obj)) {
        str.push(indentMultiline(String(obj)));
      } else if (goog.isObject(obj)) {
        if (previous.contains(obj)) {
          // TODO(user): This is a bug; it falsely detects non-loops as loops
          // when the reference tree contains two references to the same object.
          str.push('*** reference loop detected ***');
        } else {
          previous.add(obj);
          str.push('{');
          for (var x in obj) {
            if (!opt_showFn && goog.isFunction(obj[x])) {
              continue;
            }
            str.push('\n');
            str.push(nestspace);
            str.push(x + ' = ');
            helper(obj[x], nestspace);
          }
          str.push('\n' + space + '}');
        }
      } else {
        str.push(obj);
      }
    } catch (e) {
      str.push('*** ' + e + ' ***');
    }
  };

  helper(obj, '');
  return str.join('');
};


/**
 * Recursively outputs a nested array as a string.
 * @param {Array} arr The array.
 * @return {string} String representing nested array.
 */
goog.debug.exposeArray = function(arr) {
  var str = [];
  for (var i = 0; i < arr.length; i++) {
    if (goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]));
    } else {
      str.push(arr[i]);
    }
  }
  return '[ ' + str.join(', ') + ' ]';
};


/**
 * Exposes an exception that has been caught by a try...catch and outputs the
 * error with a stack trace.
 * @param {Object} err Error object or string.
 * @param {Function=} opt_fn Optional function to start stack trace from.
 * @return {string} Details of exception.
 */
goog.debug.exposeException = function(err, opt_fn) {
  /** @preserveTry */
  try {
    var e = goog.debug.normalizeErrorObject(err);

    // Create the error message
    var error = 'Message: ' + goog.string.htmlEscape(e.message) +
        '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' +
        e.fileName + '</a>\nLine: ' + e.lineNumber + '\n\nBrowser stack:\n' +
        goog.string.htmlEscape(e.stack + '-> ') +
        '[end]\n\nJS stack traversal:\n' + goog.string.htmlEscape(
            goog.debug.getStacktrace(opt_fn) + '-> ');
    return error;
  } catch (e2) {
    return 'Exception trying to expose exception! You win, we lose. ' + e2;
  }
};


/**
 * Normalizes the error/exception object between browsers.
 * @param {Object} err Raw error object.
 * @return {Object} Normalized error object.
 */
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName('window.location.href');
  return (typeof err == 'string') ?
      {
        'message': err,
        'name': 'Unknown error',
        'lineNumber': 'Not available',
        'fileName': href,
        'stack': 'Not available'
      } :

      // The IE Error object contains only the name and the message
      // The Safari Error object uses the line and sourceURL fields
      (!err.lineNumber || !err.fileName || !err.stack) ?
      {
        'message': err.message,
        'name': err.name,
        'lineNumber': err.lineNumber || err.line || 'Not available',
        'fileName': err.fileName || err.filename || err.sourceURL || href,
        'stack': err.stack || 'Not available'
      } :

      // Standards error object
      err;
};


/**
 * Converts an object to an Error if it's a String,
 * adds a stacktrace if there isn't one,
 * and optionally adds an extra message.
 * @param {Error|string} err  the original thrown object or string.
 * @param {string=} opt_message  optional additional message to add to the
 *     error.
 * @return {Error} If err is a string, it is used to create a new Error,
 *     which is enhanced and returned.  Otherwise err itself is enhanced
 *     and returned.
 */
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == 'string' ? Error(err) : err;
  if (!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller);
  }
  if (opt_message) {
    // find the first unoccupied 'messageX' property
    var x = 0;
    while (error['message' + x]) {
      ++x;
    }
    error['message' + x] = String(opt_message);
  }
  return error;
};


/**
 * Gets the current stack trace. Simple and iterative - doesn't worry about
 * catching circular references or getting the args.
 * @param {number=} opt_depth Optional maximum depth to trace back to.
 * @return {string} A string with the function names of all functions in the
 *     stack, separated by \n.
 */
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;

  while (fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push('()\n');
    /** @preserveTry */
    try {
      fn = fn.caller;
    } catch (e) {
      sb.push('[exception trying to get caller]\n');
      break;
    }
    depth++;
    if (depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push('[...long stack...]');
      break;
    }
  }
  if (opt_depth && depth >= opt_depth) {
    sb.push('[...reached max depth limit...]');
  } else {
    sb.push('[end]');
  }

  return sb.join('');
};


/**
 * Max length of stack to try and output
 * @type {number}
 */
goog.debug.MAX_STACK_DEPTH = 50;


/**
 * Gets the current stack trace, either starting from the caller or starting
 * from a specified function that's currently on the call stack.
 * @param {Function=} opt_fn Optional function to start getting the trace from.
 *     If not provided, defaults to the function that called this.
 * @return {string} Stack trace.
 */
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, []);
};


/**
 * Private helper for getStacktrace().
 * @param {Function} fn Function to start getting the trace from.
 * @param {Array} visited List of functions visited so far.
 * @return {string} Stack trace starting from function fn.
 * @private
 */
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];

  // Circular reference, certain functions like bind seem to cause a recursive
  // loop so we need to catch circular references
  if (goog.array.contains(visited, fn)) {
    sb.push('[...circular reference...]');

  // Traverse the call stack until function not found or max depth is reached
  } else if (fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
    sb.push(goog.debug.getFunctionName(fn) + '(');
    var args = fn.arguments;
    for (var i = 0; i < args.length; i++) {
      if (i > 0) {
        sb.push(', ');
      }
      var argDesc;
      var arg = args[i];
      switch (typeof arg) {
        case 'object':
          argDesc = arg ? 'object' : 'null';
          break;

        case 'string':
          argDesc = arg;
          break;

        case 'number':
          argDesc = String(arg);
          break;

        case 'boolean':
          argDesc = arg ? 'true' : 'false';
          break;

        case 'function':
          argDesc = goog.debug.getFunctionName(arg);
          argDesc = argDesc ? argDesc : '[fn]';
          break;

        case 'undefined':
        default:
          argDesc = typeof arg;
          break;
      }

      if (argDesc.length > 40) {
        argDesc = argDesc.substr(0, 40) + '...';
      }
      sb.push(argDesc);
    }
    visited.push(fn);
    sb.push(')\n');
    /** @preserveTry */
    try {
      sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited));
    } catch (e) {
      sb.push('[exception trying to get caller]\n');
    }

  } else if (fn) {
    sb.push('[...long stack...]');
  } else {
    sb.push('[end]');
  }
  return sb.join('');
};


/**
 * Gets a function name
 * @param {Function} fn Function to get name of.
 * @return {string} Function's name.
 */
goog.debug.getFunctionName = function(fn) {
  var functionSource = String(fn);
  if (!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if (matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method;
    } else {
      goog.debug.fnNameCache_[functionSource] = '[Anonymous]';
    }
  }

  return goog.debug.fnNameCache_[functionSource];
};


/**
 * Makes whitespace visible by replacing it with printable characters.
 * This is useful in finding diffrences between the expected and the actual
 * output strings of a testcase.
 * @param {string} string whose whitespace needs to be made visible.
 * @return {string} string whose whitespace is made visible.
 */
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, '[_]')
               .replace(/\f/g, '[f]')
               .replace(/\n/g, '[n]\n')
               .replace(/\r/g, '[r]')
               .replace(/\t/g, '[t]');
};


/**
 * Hash map for storing function names that have already been looked up.
 * @type {Object}
 * @private
 */
goog.debug.fnNameCache_ = {};

// Input 13
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the LogRecord class. Please minimize
 * dependencies this file has on other closure classes as any dependency it
 * takes won't be able to use the logging infrastructure.
 *
*
 */

goog.provide('goog.debug.LogRecord');

/**
 * LogRecord objects are used to pass logging requests between
 * the logging framework and individual log Handlers.
 * @constructor
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 * @param {number=} opt_time Time this log record was created if other than now.
 *     If 0, we use #goog.now.
 * @param {number=} opt_sequenceNumber Sequence number of this log record. This
 *     should only be passed in when restoring a log record from persistence.
 */
goog.debug.LogRecord = function(level, msg, loggerName,
      opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber);
};


/**
 * Time the LogRecord was created.
 * @type {number}
 * @private
 */
goog.debug.LogRecord.prototype.time_;


/**
 * Level of the LogRecord
 * @type {goog.debug.Logger.Level}
 * @private
 */
goog.debug.LogRecord.prototype.level_;


/**
 * Message associated with the record
 * @type {string}
 * @private
 */
goog.debug.LogRecord.prototype.msg_;


/**
 * Name of the logger that created the record.
 * @type {string}
 * @private
 */
goog.debug.LogRecord.prototype.loggerName_;



/**
 * Sequence number for the LogRecord. Each record has a unique sequence number
 * that is greater than all log records created before it.
 * @type {number}
 * @private
 */
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;


/**
 * Exception associated with the record
 * @type {Object}
 * @private
 */
goog.debug.LogRecord.prototype.exception_ = null;


/**
 * Exception text associated with the record
 * @type {?string}
 * @private
 */
goog.debug.LogRecord.prototype.exceptionText_ = null;


/**
 * @define {boolean} Whether to enable log sequence numbers.
 */
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;


/**
 * A sequence counter for assigning increasing sequence numbers to LogRecord
 * objects.
 * @type {number}
 * @private
 */
goog.debug.LogRecord.nextSequenceNumber_ = 0;


/**
 * Sets all fields of the log record.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 * @param {number=} opt_time Time this log record was created if other than now.
 *     If 0, we use #goog.now.
 * @param {number=} opt_sequenceNumber Sequence number of this log record. This
 *     should only be passed in when restoring a log record from persistence.
 */
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName,
      opt_time, opt_sequenceNumber) {
  if (goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == 'number' ?
        opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++;
  }

  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_;
};


/**
 * Get the source Logger's name.
 *
 * @return {string} source logger name (may be null).
 */
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_;
};


/**
 * Get the exception that is part of the log record.
 *
 * @return {Object} the exception.
 */
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_;
};


/**
 * Set the exception that is part of the log record.
 *
 * @param {Object} exception the exception.
 */
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception;
};


/**
 * Get the exception text that is part of the log record.
 *
 * @return {?string} Exception text.
 */
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_;
};


/**
 * Set the exception text that is part of the log record.
 *
 * @param {string} text The exception text.
 */
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text;
};


/**
 * Get the source Logger's name.
 *
 * @param {string} loggerName source logger name (may be null).
 */
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName;
};


/**
 * Get the logging message level, for example Level.SEVERE.
 * @return {goog.debug.Logger.Level} the logging message level.
 */
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_;
};


/**
 * Set the logging message level, for example Level.SEVERE.
 * @param {goog.debug.Logger.Level} level the logging message level.
 */
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level;
};


/**
 * Get the "raw" log message, before localization or formatting.
 *
 * @return {string} the raw message string.
 */
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_;
};


/**
 * Set the "raw" log message, before localization or formatting.
 *
 * @param {string} msg the raw message string.
 */
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg;
};


/**
 * Get event time in milliseconds since 1970.
 *
 * @return {number} event time in millis since 1970.
 */
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_;
};


/**
 * Set event time in milliseconds since 1970.
 *
 * @param {number} time event time in millis since 1970.
 */
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time;
};


/**
 * Get the sequence number.
 * <p>
 * Sequence numbers are normally assigned in the LogRecord
 * constructor, which assigns unique sequence numbers to
 * each new LogRecord in increasing order.
 * @return {number} the sequence number.
 */
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_;
};


// Input 14
// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A buffer for log records. The purpose of this is to improve
 * logging performance by re-using old objects when the buffer becomes full and
 * to eliminate the need for each app to implement their own log buffer. The
 * disadvantage to doing this is that log handlers cannot maintain references to
 * log records and expect that they are not overwriten at a later point.
 *
 * @author agrieve@google.com (Andrew Grieve)
 */

goog.provide('goog.debug.LogBuffer');

goog.require('goog.asserts');
goog.require('goog.debug.LogRecord');



/**
 * Creates the log buffer.
 * @constructor
 */
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(),
      'Cannot use goog.debug.LogBuffer without defining ' +
      'goog.debug.LogBuffer.CAPACITY.');
  this.clear();
};

/**
 * A static method that always returns the same instance of LogBuffer.
 * @return {!goog.debug.LogBuffer} The LogBuffer singleton instance.
 */
goog.debug.LogBuffer.getInstance = function() {
  if (!goog.debug.LogBuffer.instance_) {
  // This function is written with the return statement after the assignment to
  // avoid the jscompiler StripCode bug described in http://b/issue?id=2608064
  // After that bug is fixed this can be refactored.
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer();
  }
  return goog.debug.LogBuffer.instance_;
};

/**
 * @define {number} The number of log records to buffer. 0 means disable
 * buffering.
 */
goog.debug.LogBuffer.CAPACITY = 0;


/**
 * The array to store the records.
 * @type {!Array.<!goog.debug.LogRecord|undefined>}
 * @private
 */
goog.debug.LogBuffer.prototype.buffer_;


/**
 * The index of the most recently added record or -1 if there are no records.
 * @type {number}
 * @private
 */
goog.debug.LogBuffer.prototype.curIndex_;


/**
 * Whether the buffer is at capacity.
 * @type {boolean}
 * @private
 */
goog.debug.LogBuffer.prototype.isFull_;


/**
 * Adds a log record to the buffer, possibly overwriting the oldest record.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {string} loggerName The name of the source logger.
 * @return {!goog.debug.LogRecord} The log record.
 */
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if (this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret;
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] =
      new goog.debug.LogRecord(level, msg, loggerName);
};


/**
 * @return {boolean} Whether the log buffer is enabled.
 */
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0;
};


/**
 * Removes all buffered log records.
 */
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false;
};


/**
 * Calls the given function for each buffered log record, starting with the
 * oldest one.
 * @param {function(!goog.debug.LogRecord)} func The function to call.
 */
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  // Corner case: no records.
  if (!buffer[0]) {
    return;
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(/** @type {!goog.debug.LogRecord} */ (buffer[i]));
  } while (i != curIndex);
};


// Input 15
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the Logger class. Please minimize dependencies
 * this file has on other closure classes as any dependency it takes won't be
 * able to use the logging infrastructure.
 *
*
 * @see ../demos/debug.html
 */

goog.provide('goog.debug.LogManager');
goog.provide('goog.debug.Logger');
goog.provide('goog.debug.Logger.Level');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.debug');
goog.require('goog.debug.LogBuffer');
goog.require('goog.debug.LogRecord');

/**
 * The Logger is an object used for logging debug messages. Loggers are
 * normally named, using a hierarchical dot-separated namespace. Logger names
 * can be arbitrary strings, but they should normally be based on the package
 * name or class name of the logged component, such as goog.net.BrowserChannel.
 *
 * The Logger object is loosely based on the java class
 * java.util.logging.Logger. It supports different levels of filtering for
 * different loggers.
 *
 * The logger object should never be instantiated by application code. It
 * should always use the goog.debug.Logger.getLogger function.
 *
 * @constructor
 * @param {string} name The name of the Logger.
 */
goog.debug.Logger = function(name) {
  /**
   * Name of the Logger. Generally a dot-separated namespace
   * @type {string}
   * @private
   */
  this.name_ = name;
};


/**
 * Parent Logger.
 * @type {goog.debug.Logger}
 * @private
 */
goog.debug.Logger.prototype.parent_ = null;


/**
 * Level that this logger only filters above. Null indicates it should
 * inherit from the parent.
 * @type {goog.debug.Logger.Level}
 * @private
 */
goog.debug.Logger.prototype.level_ = null;


/**
 * Map of children loggers. The keys are the leaf names of the children and
 * the values are the child loggers.
 * @type {Object}
 * @private
 */
goog.debug.Logger.prototype.children_ = null;


/**
 * Handlers that are listening to this logger.
 * @type {Array.<Function>}
 * @private
 */
goog.debug.Logger.prototype.handlers_ = null;


/**
 * @define {boolean} Toggles whether loggers other than the root logger can have
 *     log handlers attached to them and whether they can have their log level
 *     set. Logging is a bit faster when this is set to false.
 */
goog.debug.Logger.ENABLE_HIERARCHY = true;


if (!goog.debug.Logger.ENABLE_HIERARCHY) {
  /**
   * @type {!Array.<Function>}
   * @private
   */
  goog.debug.Logger.rootHandlers_ = [];


  /**
   * @type {goog.debug.Logger.Level}
   * @private
   */
  goog.debug.Logger.rootLevel_;
}


/**
 * The Level class defines a set of standard logging levels that
 * can be used to control logging output.  The logging Level objects
 * are ordered and are specified by ordered integers.  Enabling logging
 * at a given level also enables logging at all higher levels.
 * <p>
 * Clients should normally use the predefined Level constants such
 * as Level.SEVERE.
 * <p>
 * The levels in descending order are:
 * <ul>
 * <li>SEVERE (highest value)
 * <li>WARNING
 * <li>INFO
 * <li>CONFIG
 * <li>FINE
 * <li>FINER
 * <li>FINEST  (lowest value)
 * </ul>
 * In addition there is a level OFF that can be used to turn
 * off logging, and a level ALL that can be used to enable
 * logging of all messages.
 *
 * @param {string} name The name of the level.
 * @param {number} value The numeric value of the level.
 * @constructor
 */
goog.debug.Logger.Level = function(name, value) {
  /**
   * The name of the level
   * @type {string}
   */
  this.name = name;

  /**
   * The numeric value of the level
   * @type {number}
   */
  this.value = value;
};


/**
 * @return {string} String representation of the logger level.
 */
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name;
};


/**
 * OFF is a special level that can be used to turn off logging.
 * This level is initialized to <CODE>Number.MAX_VALUE</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.OFF =
    new goog.debug.Logger.Level('OFF', Infinity);

/**
 * SHOUT is a message level for extra debugging loudness.
 * This level is initialized to <CODE>1200</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level('SHOUT', 1200);

/**
 * SEVERE is a message level indicating a serious failure.
 * This level is initialized to <CODE>1000</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level('SEVERE', 1000);

/**
 * WARNING is a message level indicating a potential problem.
 * This level is initialized to <CODE>900</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level('WARNING', 900);


/**
 * INFO is a message level for informational messages.
 * This level is initialized to <CODE>800</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level('INFO', 800);


/**
 * CONFIG is a message level for static configuration messages.
 * This level is initialized to <CODE>700</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level('CONFIG', 700);


/**
 * FINE is a message level providing tracing information.
 * This level is initialized to <CODE>500</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level('FINE', 500);

/**
 * FINER indicates a fairly detailed tracing message.
 * This level is initialized to <CODE>400</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level('FINER', 400);

/**
 * FINEST indicates a highly detailed tracing message.
 * This level is initialized to <CODE>300</CODE>.
 * @type {!goog.debug.Logger.Level}
 */

goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level('FINEST', 300);

/**
 * ALL indicates that all messages should be logged.
 * This level is initialized to <CODE>Number.MIN_VALUE</CODE>.
 * @type {!goog.debug.Logger.Level}
 */
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level('ALL', 0);


/**
 * The predefined levels.
 * @type {!Array.<!goog.debug.Logger.Level>}
 * @final
 */
goog.debug.Logger.Level.PREDEFINED_LEVELS = [
  goog.debug.Logger.Level.OFF,
  goog.debug.Logger.Level.SHOUT,
  goog.debug.Logger.Level.SEVERE,
  goog.debug.Logger.Level.WARNING,
  goog.debug.Logger.Level.INFO,
  goog.debug.Logger.Level.CONFIG,
  goog.debug.Logger.Level.FINE,
  goog.debug.Logger.Level.FINER,
  goog.debug.Logger.Level.FINEST,
  goog.debug.Logger.Level.ALL];


/**
 * A lookup map used to find the level object based on the name or value of
 * the level object.
 * @type {Object}
 * @private
 */
goog.debug.Logger.Level.predefinedLevelsCache_ = null;


/**
 * Creates the predefined levels cache and populates it.
 * @private
 */
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for (var i = 0, level; level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
       i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level;
  }
};


/**
 * Gets the predefined level with the given name.
 * @param {string} name The name of the level.
 * @return {goog.debug.Logger.Level} The level, or null if none found.
 */
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if (!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_();
  }

  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null;
};


/**
 * Gets the highest predefined level <= #value.
 * @param {number} value Level value.
 * @return {goog.debug.Logger.Level} The level, or null if none found.
 */
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if (!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_();
  }

  if (value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value];
  }

  for (var i = 0; i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length; ++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if (level.value <= value) {
      return level;
    }
  }
  return null;
};


/**
 * Find or create a logger for a named subsystem. If a logger has already been
 * created with the given name it is returned. Otherwise a new logger is
 * created. If a new logger is created its log level will be configured based
 * on the LogManager configuration and it will configured to also send logging
 * output to its parent's handlers. It will be registered in the LogManager
 * global namespace.
 *
 * @param {string} name A name for the logger. This should be a dot-separated
 * name and should normally be based on the package name or class name of the
 * subsystem, such as goog.net.BrowserChannel.
 * @return {!goog.debug.Logger} The named logger.
 */
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name);
};


/**
 * Gets the name of this logger.
 * @return {string} The name of this logger.
 */
goog.debug.Logger.prototype.getName = function() {
  return this.name_;
};


/**
 * Adds a handler to the logger. This doesn't use the event system because
 * we want to be able to add logging to the event system.
 * @param {Function} handler Handler function to add.
 */
goog.debug.Logger.prototype.addHandler = function(handler) {
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    if (!this.handlers_) {
      this.handlers_ = [];
    }
    this.handlers_.push(handler);
  } else {
    goog.asserts.assert(!this.name_,
        'Cannot call addHandler on a non-root logger when ' +
        'goog.debug.Logger.ENABLE_HIERARCHY is false.');
    goog.debug.Logger.rootHandlers_.push(handler);
  }
};


/**
 * Removes a handler from the logger. This doesn't use the event system because
 * we want to be able to add logging to the event system.
 * @param {Function} handler Handler function to remove.
 * @return {boolean} Whether the handler was removed.
 */
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ :
      goog.debug.Logger.rootHandlers_;
  return !!handlers && goog.array.remove(handlers, handler);
};


/**
 * Returns the parent of this logger.
 * @return {goog.debug.Logger} The parent logger or null if this is the root.
 */
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Returns the children of this logger as a map of the child name to the logger.
 * @return {!Object} The map where the keys are the child leaf names and the
 *     values are the Logger objects.
 */
goog.debug.Logger.prototype.getChildren = function() {
  if (!this.children_) {
    this.children_ = {};
  }
  return this.children_;
};


/**
 * Set the log level specifying which message levels will be logged by this
 * logger. Message levels lower than this value will be discarded.
 * The level value Level.OFF can be used to turn off logging. If the new level
 * is null, it means that this node should inherit its level from its nearest
 * ancestor with a specific (non-null) level value.
 *
 * @param {goog.debug.Logger.Level} level The new level.
 */
goog.debug.Logger.prototype.setLevel = function(level) {
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level;
  } else {
    goog.asserts.assert(!this.name_,
        'Cannot call setLevel() on a non-root logger when ' +
        'goog.debug.Logger.ENABLE_HIERARCHY is false.');
    goog.debug.Logger.rootLevel_ = level;
  }
};


/**
 * Gets the log level specifying which message levels will be logged by this
 * logger. Message levels lower than this value will be discarded.
 * The level value Level.OFF can be used to turn off logging. If the level
 * is null, it means that this node should inherit its level from its nearest
 * ancestor with a specific (non-null) level value.
 *
 * @return {goog.debug.Logger.Level} The level.
 */
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_;
};


/**
 * Returns the effective level of the logger based on its ancestors' levels.
 * @return {goog.debug.Logger.Level} The level.
 */
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if (!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_;
  }
  if (this.level_) {
    return this.level_;
  }
  if (this.parent_) {
    return this.parent_.getEffectiveLevel();
  }
  goog.asserts.fail('Root logger has no level set.');
  return null;
};


/**
 * Check if a message of the given level would actually be logged by this
 * logger. This check is based on the Loggers effective level, which may be
 * inherited from its parent.
 * @param {goog.debug.Logger.Level} level The level to check.
 * @return {boolean} Whether the message would be logged.
 */
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value;
};


/**
 * Log a message. If the logger is currently enabled for the
 * given message level then the given message is forwarded to all the
 * registered output Handler objects.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {Error|Object=} opt_exception An exception associated with the
 *     message.
 */
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  // java caches the effective level, not sure it's necessary here
  if (this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception));
  }
};


/**
 * Creates a new log record and adds the exception (if present) to it.
 * @param {goog.debug.Logger.Level} level One of the level identifiers.
 * @param {string} msg The string message.
 * @param {Error|Object=} opt_exception An exception associated with the
 *     message.
 * @return {!goog.debug.LogRecord} A log record.
 */
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if (goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord =
        goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_);
  } else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_);
  }
  if (opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(
        goog.debug.exposeException(opt_exception, arguments.callee.caller));
  }
  return logRecord;
};


/**
 * Log a message at the Logger.Level.SHOUT level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.SEVERE level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.WARNING level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.INFO level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.CONFIG level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.FINE level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.FINER level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception);
};


/**
 * Log a message at the Logger.Level.FINEST level.
 * If the logger is currently enabled for the given message level then the
 * given message is forwarded to all the registered output Handler objects.
 * @param {string} msg The string message.
 * @param {Error=} opt_exception An exception associated with the message.
 */
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception);
};


/**
 * Log a LogRecord. If the logger is currently enabled for the
 * given message level then the given message is forwarded to all the
 * registered output Handler objects.
 * @param {goog.debug.LogRecord} logRecord A log record to log.
 */
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if (this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord);
  }
};


/**
 * Log a LogRecord.
 * @param {goog.debug.LogRecord} logRecord A log record to log.
 * @private
 */
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while (target) {
      target.callPublish_(logRecord);
      target = target.getParent();
    }
  } else {
    for (var i = 0, handler; handler = goog.debug.Logger.rootHandlers_[i++]; ) {
      handler(logRecord);
    }
  }
};


/**
 * Calls the handlers for publish.
 * @param {goog.debug.LogRecord} logRecord The log record to publish.
 * @private
 */
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if (this.handlers_) {
    for (var i = 0, handler; handler = this.handlers_[i]; i++) {
      handler(logRecord);
    }
  }
};


/**
 * Sets the parent of this logger. This is used for setting up the logger tree.
 * @param {goog.debug.Logger} parent The parent logger.
 * @private
 */
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent;
};


/**
 * Adds a child to this logger. This is used for setting up the logger tree.
 * @param {string} name The leaf name of the child.
 * @param {goog.debug.Logger} logger The child logger.
 * @private
 */
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger;
};


/**
 * There is a single global LogManager object that is used to maintain a set of
 * shared state about Loggers and log services. This is loosely based on the
 * java class java.util.logging.LogManager.
 */
goog.debug.LogManager = {};

/**
 * Map of logger names to logger objects
 *
 * @type {!Object}
 * @private
 */
goog.debug.LogManager.loggers_ = {};

/**
 * The root logger which is the root of the logger tree.
 * @type {goog.debug.Logger}
 * @private
 */
goog.debug.LogManager.rootLogger_ = null;

/**
 * Initialize the LogManager if not already initialized
 */
goog.debug.LogManager.initialize = function() {
  if (!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger('');
    goog.debug.LogManager.loggers_[''] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG);
  }
};

/**
 * Returns all the loggers
 * @return {!Object} Map of logger names to logger objects.
 */
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_;
};


/**
 * Returns the root of the logger tree namespace, the logger with the empty
 * string as its name
 *
 * @return {!goog.debug.Logger} The root logger.
 */
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return /** @type {!goog.debug.Logger} */ (goog.debug.LogManager.rootLogger_);
};


/**
 * Method to find a named logger.
 *
 * @param {string} name A name for the logger. This should be a dot-separated
 * name and should normally be based on the package name or class name of the
 * subsystem, such as goog.net.BrowserChannel.
 * @return {!goog.debug.Logger} The named logger.
 */
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name);
};


/**
 * Creates a function that can be passed to goog.debug.catchErrors. The function
 * will log all reported errors using the given logger.
 * @param {goog.debug.Logger=} opt_logger The logger to log the errors to.
 *     Defaults to the root logger.
 * @return {function(Object)} The created function.
 */
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe('Error: ' + info.message + ' (' + info.fileName +
                  ' @ Line: ' + info.line + ')');
  };
};


/**
 * Creates the named logger. Will also create the parents of the named logger
 * if they don't yet exist.
 * @param {string} name The name of the logger.
 * @return {!goog.debug.Logger} The named logger.
 * @private
 */
goog.debug.LogManager.createLogger_ = function(name) {
  // find parent logger
  var logger = new goog.debug.Logger(name);
  if (goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf('.');
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);

    // tell the parent about the child and the child about the parent
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger);
  }

  goog.debug.LogManager.loggers_[name] = logger;
  return logger;
};

// Input 16
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines the goog.dom.TagName enum.  This enumerates
 * all html tag names specified by the W3C HTML 4.01 Specification.
 * Reference http://www.w3.org/TR/html401/index/elements.html.
*
 */
goog.provide('goog.dom.TagName');

/**
 * Enum of all html tag names specified by the W3C HTML 4.01 Specification.
 * Reference http://www.w3.org/TR/html401/index/elements.html
 * @enum {string}
 */
goog.dom.TagName = {
  A: 'A',
  ABBR: 'ABBR',
  ACRONYM: 'ACRONYM',
  ADDRESS: 'ADDRESS',
  APPLET: 'APPLET',
  AREA: 'AREA',
  B: 'B',
  BASE: 'BASE',
  BASEFONT: 'BASEFONT',
  BDO: 'BDO',
  BIG: 'BIG',
  BLOCKQUOTE: 'BLOCKQUOTE',
  BODY: 'BODY',
  BR: 'BR',
  BUTTON: 'BUTTON',
  CAPTION: 'CAPTION',
  CENTER: 'CENTER',
  CITE: 'CITE',
  CODE: 'CODE',
  COL: 'COL',
  COLGROUP: 'COLGROUP',
  DD: 'DD',
  DEL: 'DEL',
  DFN: 'DFN',
  DIR: 'DIR',
  DIV: 'DIV',
  DL: 'DL',
  DT: 'DT',
  EM: 'EM',
  FIELDSET: 'FIELDSET',
  FONT: 'FONT',
  FORM: 'FORM',
  FRAME: 'FRAME',
  FRAMESET: 'FRAMESET',
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
  HEAD: 'HEAD',
  HR: 'HR',
  HTML: 'HTML',
  I: 'I',
  IFRAME: 'IFRAME',
  IMG: 'IMG',
  INPUT: 'INPUT',
  INS: 'INS',
  ISINDEX: 'ISINDEX',
  KBD: 'KBD',
  LABEL: 'LABEL',
  LEGEND: 'LEGEND',
  LI: 'LI',
  LINK: 'LINK',
  MAP: 'MAP',
  MENU: 'MENU',
  META: 'META',
  NOFRAMES: 'NOFRAMES',
  NOSCRIPT: 'NOSCRIPT',
  OBJECT: 'OBJECT',
  OL: 'OL',
  OPTGROUP: 'OPTGROUP',
  OPTION: 'OPTION',
  P: 'P',
  PARAM: 'PARAM',
  PRE: 'PRE',
  Q: 'Q',
  S: 'S',
  SAMP: 'SAMP',
  SCRIPT: 'SCRIPT',
  SELECT: 'SELECT',
  SMALL: 'SMALL',
  SPAN: 'SPAN',
  STRIKE: 'STRIKE',
  STRONG: 'STRONG',
  STYLE: 'STYLE',
  SUB: 'SUB',
  SUP: 'SUP',
  TABLE: 'TABLE',
  TBODY: 'TBODY',
  TD: 'TD',
  TEXTAREA: 'TEXTAREA',
  TFOOT: 'TFOOT',
  TH: 'TH',
  THEAD: 'THEAD',
  TITLE: 'TITLE',
  TR: 'TR',
  TT: 'TT',
  U: 'U',
  UL: 'UL',
  VAR: 'VAR'
};

// Input 17
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for adding, removing and setting classes.
 *
*
*
 */


goog.provide('goog.dom.classes');

goog.require('goog.array');


/**
 * Sets the entire class name of an element.
 * @param {Node} element DOM node to set class of.
 * @param {string} className Class name(s) to apply to element.
 */
goog.dom.classes.set = function(element, className) {
  element.className = className;
};


/**
 * Gets an array of class names on an element
 * @param {Node} element DOM node to get class of.
 * @return {Array} Class names on {@code element}.
 */
goog.dom.classes.get = function(element) {
  var className = element.className;
  // Some types of elements don't have a className in IE (e.g. iframes).
  // Furthermore, in Firefox, className is not a string when the element is
  // an SVG element.
  return className && typeof className.split == 'function' ?
      className.split(/\s+/) : [];
};


/**
 * Adds a class or classes to an element. Does not add multiples of class names.
 * @param {Node} element DOM node to add class to.
 * @param {...string} var_args Class names to add.
 * @return {boolean} Whether class was added (or all classes were added).
 */
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);

  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(' ');

  return b;
};


/**
 * Removes a class or classes from an element.
 * @param {Node} element DOM node to remove class from.
 * @param {...string} var_args Class name(s) to remove.
 * @return {boolean} Whether all classes in {@code var_args} were found and
 *     removed.
 */
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);

  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(' ');

  return b;
};


/**
 * Helper method for {@link goog.dom.classes.add} and
 * {@link goog.dom.classes.addRemove}. Adds one or more classes to the supplied
 * classes array.
 * @param {Array.<string>} classes All class names for the element, will be
 *     updated to have the classes supplied in {@code args} added.
 * @param {Array.<string>} args Class names to add.
 * @return {boolean} Whether all classes in were added.
 * @private
 */
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for (var i = 0; i < args.length; i++) {
    if (!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++;
    }
  }
  return rv == args.length;
};


/**
 * Helper method for {@link goog.dom.classes.remove} and
 * {@link goog.dom.classes.addRemove}. Removes one or more classes from the
 * supplied classes array.
 * @param {Array.<string>} classes All class names for the element, will be
 *     updated to have the classes supplied in {@code args} removed.
 * @param {Array.<string>} args Class names to remove.
 * @return {boolean} Whether all classes in were found and removed.
 * @private
 */
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for (var i = 0; i < classes.length; i++) {
    if (goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++;
    }
  }
  return rv == args.length;
};


/**
 * Switches a class on an element from one to another without disturbing other
 * classes. If the fromClass isn't removed, the toClass won't be added.
 * @param {Node} element DOM node to swap classes on.
 * @param {string} fromClass Class to remove.
 * @param {string} toClass Class to add.
 * @return {boolean} Whether classes were switched.
 */
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);

  var removed = false;
  for (var i = 0; i < classes.length; i++) {
    if (classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true;
    }
  }

  if (removed) {
    classes.push(toClass);
    element.className = classes.join(' ');
  }

  return removed;
};


/**
 * Adds zero or more classes to and element and and removes zero or more as a
 * single operation. Unlike calling {@link goog.dom.classes.add} and
 * {@link goog.dom.classes.remove} separately this is more efficient as it only
 * parses the class property once.
 *
 * If a class is in both the remove and add lists, it will be added. Thus,
 * you can use this instead of {@link goog.dom.classes.swap} when you have
 * more than two class names that you want to swap.
 *
 * @param {Node} element DOM node to swap classes on.
 * @param {string|Array.<string>|null} classesToRemove Class or classes to
 *     remove, if null no classes are removed.
 * @param {string|Array.<string>|null} classesToAdd Class or classes to add, if
 *     null no classes are added.
 */
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if (goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove);
  } else if (goog.isArray(classesToRemove)) {
    goog.dom.classes.remove_(classes, classesToRemove);
  }

  if (goog.isString(classesToAdd) &&
      !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd);
  } else if (goog.isArray(classesToAdd)) {
    goog.dom.classes.add_(classes, classesToAdd);
  }

  element.className = classes.join(' ');
};


/**
 * Returns true if an element has a class.
 * @param {Node} element DOM node to test.
 * @param {string} className Class name to test for.
 * @return {boolean} Whether element has the class.
 */
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className);
};


/**
 * Adds or removes a class depending on the enabled argument.
 * @param {Node} element DOM node to add or remove the class on.
 * @param {string} className Class name to add or remove.
 * @param {boolean} enabled Whether to add or remove the class (true adds,
 *     false removes).
 */
goog.dom.classes.enable = function(element, className, enabled) {
  if (enabled) {
    goog.dom.classes.add(element, className);
  } else {
    goog.dom.classes.remove(element, className);
  }
};


/**
 * Removes a class if an element has it, and adds it the element doesn't have
 * it.  Won't affect other classes on the node.
 * @param {Node} element DOM node to toggle class on.
 * @param {string} className Class to toggle.
 * @return {boolean} True if class was added, false if it was removed
 *     (in other words, whether element has the class after this function has
 *     been called).
 */
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add;
};

// Input 18
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing two-dimensional positions.
*
 */


goog.provide('goog.math.Coordinate');


/**
 * Class for representing coordinates and positions.
 * @param {number=} opt_x Left, defaults to 0.
 * @param {number=} opt_y Top, defaults to 0.
 * @constructor
 */
goog.math.Coordinate = function(opt_x, opt_y) {
  /**
   * X-value
   * @type {number}
   */
  this.x = goog.isDef(opt_x) ? opt_x : 0;

  /**
   * Y-value
   * @type {number}
   */
  this.y = goog.isDef(opt_y) ? opt_y : 0;
};


/**
 * Returns a new copy of the coordinate.
 * @return {!goog.math.Coordinate} A clone of this coordinate.
 */
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing the coordinate.
   * @return {string} In the form (50, 73).
   */
  goog.math.Coordinate.prototype.toString = function() {
    return '(' + this.x + ', ' + this.y + ')';
  };
}


/**
 * Compares coordinates for equality.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {boolean} True iff the coordinates are equal, or if both are null.
 */
goog.math.Coordinate.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.x == b.x && a.y == b.y;
};


/**
 * Returns the distance between two coordinates.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {number} The distance between {@code a} and {@code b}.
 */
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};


/**
 * Returns the squared distance between two coordinates. Squared distances can
 * be used for comparisons when the actual value is not required.
 *
 * Performance note: eliminating the square root is an optimization often used
 * in lower-level languages, but the speed difference is not nearly as
 * pronounced in JavaScript (only a few percent.)
 *
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {number} The squared distance between {@code a} and {@code b}.
 */
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy;
};


/**
 * Returns the difference between two coordinates as a new
 * goog.math.Coordinate.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {goog.math.Coordinate} A Coordinate representing the difference
 *     between {@code a} and {@code b}.
 */
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y);
};


/**
 * Returns the sum of two coordinates as a new goog.math.Coordinate.
 * @param {goog.math.Coordinate} a A Coordinate.
 * @param {goog.math.Coordinate} b A Coordinate.
 * @return {goog.math.Coordinate} A Coordinate representing the sum of the two
 *     coordinates.
 */
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y);
};

// Input 19
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing two-dimensional sizes.
*
*
 */


goog.provide('goog.math.Size');



/**
 * Class for representing sizes consisting of a width and height. Undefined
 * width and height support is deprecated and results in compiler warning.
 * @param {number} width Width.
 * @param {number} height Height.
 * @constructor
 */
goog.math.Size = function(width, height) {
  /**
   * Width
   * @type {number}
   */
  this.width = width;

  /**
   * Height
   * @type {number}
   */
  this.height = height;
};


/**
 * Compares sizes for equality.
 * @param {goog.math.Size} a A Size.
 * @param {goog.math.Size} b A Size.
 * @return {boolean} True iff the sizes have equal widths and equal
 *     heights, or if both are null.
 */
goog.math.Size.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.width == b.width && a.height == b.height;
};


/**
 * @return {goog.math.Size} A new copy of the Size.
 */
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing size.
   * @return {string} In the form (50 x 73).
   */
  goog.math.Size.prototype.toString = function() {
    return '(' + this.width + ' x ' + this.height + ')';
  };
}


/**
 * @return {number} The longer of the two dimensions in the size.
 */
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};


/**
 * @return {number} The shorter of the two dimensions in the size.
 */
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};


/**
 * @return {number} The area of the size (width * height).
 */
goog.math.Size.prototype.area = function() {
  return this.width * this.height;
};


/**
 * @return {number} The ratio of the size's width to its height.
 */
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};


/**
 * @return {boolean} True if the size has zero area, false if both dimensions
 *     are non-zero numbers.
 */
goog.math.Size.prototype.isEmpty = function() {
  return !this.area();
};


/**
 * Clamps the width and height parameters upward to integer values.
 * @return {goog.math.Size} This size with ceil'd components.
 */
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};


/**
 * @param {goog.math.Size} target The target size.
 * @return {boolean} True if this Size is the same size or smaller than the
 *     target size in both dimensions.
 */
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height;
};


/**
 * Clamps the width and height parameters downward to integer values.
 * @return {goog.math.Size} This size with floored components.
 */
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};


/**
 * Rounds the width and height parameters to integer values.
 * @return {goog.math.Size} This size with rounded components.
 */
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};


/**
 * Scales the size uniformly by a factor.
 * @param {number} s The scale factor.
 * @return {goog.math.Size} This Size object after scaling.
 */
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this;
};


/**
 * Uniformly scales the size to fit inside the dimensions of a given size. The
 * original aspect ratio will be preserved.
 *
 * This function assumes that both Sizes contain strictly positive dimensions.
 * @param {goog.math.Size} target The target size.
 * @return {goog.math.Size} This Size object, after optional scaling.
 */
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ?
      target.width / this.width :
      target.height / this.height;

  return this.scale(s);
};

// Input 20
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Rendering engine detection.
 * @see <a href="http://www.useragentstring.com/">User agent strings</a>
 * For information on the browser brand (such as Safari versus Chrome), see
 * goog.userAgent.product.
*
*
 * @see ../demos/useragent.html
 */

goog.provide('goog.userAgent');

goog.require('goog.string');


/**
 * @define {boolean} Whether we know at compile-time that the browser is IE.
 */
goog.userAgent.ASSUME_IE = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is GECKO.
 */
goog.userAgent.ASSUME_GECKO = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is WEBKIT.
 */
goog.userAgent.ASSUME_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is a
 *     mobile device running WebKit e.g. iPhone or Android.
 */
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;


/**
 * @define {boolean} Whether we know at compile-time that the browser is OPERA.
 */
goog.userAgent.ASSUME_OPERA = false;


/**
 * Whether we know the browser engine at compile-time.
 * @type {boolean}
 * @private
 */
goog.userAgent.BROWSER_KNOWN_ =
    goog.userAgent.ASSUME_IE ||
    goog.userAgent.ASSUME_GECKO ||
    goog.userAgent.ASSUME_MOBILE_WEBKIT ||
    goog.userAgent.ASSUME_WEBKIT ||
    goog.userAgent.ASSUME_OPERA;


/**
 * Returns the userAgent string for the current browser.
 * Some user agents (I'm thinking of you, Gears WorkerPool) do not expose a
 * navigator object off the global scope.  In that case we return null.
 *
 * @return {?string} The userAgent string or null if there is none.
 */
goog.userAgent.getUserAgentString = function() {
  return goog.global['navigator'] ? goog.global['navigator'].userAgent : null;
};


/**
 * @return {Object} The native navigator object.
 */
goog.userAgent.getNavigator = function() {
  // Need a local navigator reference instead of using the global one,
  // to avoid the rare case where they reference different objects.
  // (goog.gears.FakeWorkerPool, for example).
  return goog.global['navigator'];
};


/**
 * Initializer for goog.userAgent.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.init_ = function() {
  /**
   * Whether the user agent string denotes Opera.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedOpera_ = false;

  /**
   * Whether the user agent string denotes Internet Explorer. This includes
   * other browsers using Trident as its rendering engine. For example AOL
   * and Netscape 8
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedIe_ = false;

  /**
   * Whether the user agent string denotes WebKit. WebKit is the rendering
   * engine that Safari, Android and others use.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWebkit_ = false;

  /**
   * Whether the user agent string denotes a mobile device.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMobile_ = false;

  /**
   * Whether the user agent string denotes Gecko. Gecko is the rendering
   * engine used by Mozilla, Mozilla Firefox, Camino and many more.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedGecko_ = false;

  var ua;
  if (!goog.userAgent.BROWSER_KNOWN_ &&
      (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf('Opera') == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('MSIE') != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ &&
        ua.indexOf('WebKit') != -1;
    // WebKit also gives navigator.product string equal to 'Gecko'.
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ &&
        ua.indexOf('Mobile') != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ &&
        !goog.userAgent.detectedWebkit_ && navigator.product == 'Gecko';
  }
};


if (!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_();
}


/**
 * Whether the user agent is Opera.
 * @type {boolean}
 */
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;


/**
 * Whether the user agent is Internet Explorer. This includes other browsers
 * using Trident as its rendering engine. For example AOL and Netscape 8
 * @type {boolean}
 */
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;


/**
 * Whether the user agent is Gecko. Gecko is the rendering engine used by
 * Mozilla, Mozilla Firefox, Camino and many more.
 * @type {boolean}
 */
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_GECKO :
    goog.userAgent.detectedGecko_;


/**
 * Whether the user agent is WebKit. WebKit is the rendering engine that
 * Safari, Android and others use.
 * @type {boolean}
 */
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ?
    goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT :
    goog.userAgent.detectedWebkit_;


/**
 * Whether the user agent is running on a mobile device.
 * @type {boolean}
 */
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT ||
                        goog.userAgent.detectedMobile_;


/**
 * Used while transitioning code to use WEBKIT instead.
 * @type {boolean}
 * @deprecated Use {@link goog.userAgent.product.SAFARI} instead.
 * TODO(nicksantos): Delete this from goog.userAgent.
 */
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;


/**
 * @return {string} the platform (operating system) the user agent is running
 *     on. Default to empty string because navigator.platform may not be defined
 *     (on Rhino, for example).
 * @private
 */
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || '';
};


/**
 * The platform (operating system) the user agent is running on. Default to
 * empty string because navigator.platform may not be defined (on Rhino, for
 * example).
 * @type {string}
 */
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();


/**
 * @define {boolean} Whether the user agent is running on a Macintosh operating
 *     system.
 */
goog.userAgent.ASSUME_MAC = false;


/**
 * @define {boolean} Whether the user agent is running on a Windows operating
 *     system.
 */
goog.userAgent.ASSUME_WINDOWS = false;


/**
 * @define {boolean} Whether the user agent is running on a Linux operating
 *     system.
 */
goog.userAgent.ASSUME_LINUX = false;


/**
 * @define {boolean} Whether the user agent is running on a X11 windowing
 *     system.
 */
goog.userAgent.ASSUME_X11 = false;


/**
 * @type {boolean}
 * @private
 */
goog.userAgent.PLATFORM_KNOWN_ =
    goog.userAgent.ASSUME_MAC ||
    goog.userAgent.ASSUME_WINDOWS ||
    goog.userAgent.ASSUME_LINUX ||
    goog.userAgent.ASSUME_X11;


/**
 * Initialize the goog.userAgent constants that define which platform the user
 * agent is running on.
 * @private
 */
goog.userAgent.initPlatform_ = function() {
  /**
   * Whether the user agent is running on a Macintosh operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Mac');

  /**
   * Whether the user agent is running on a Windows operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedWindows_ = goog.string.contains(
      goog.userAgent.PLATFORM, 'Win');

  /**
   * Whether the user agent is running on a Linux operating system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM,
      'Linux');

  /**
   * Whether the user agent is running on a X11 windowing system.
   * @type {boolean}
   * @private
   */
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() &&
      goog.string.contains(goog.userAgent.getNavigator()['appVersion'] || '',
          'X11');
};


if (!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_();
}


/**
 * Whether the user agent is running on a Macintosh operating system.
 * @type {boolean}
 */
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;


/**
 * Whether the user agent is running on a Windows operating system.
 * @type {boolean}
 */
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;


/**
 * Whether the user agent is running on a Linux operating system.
 * @type {boolean}
 */
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;


/**
 * Whether the user agent is running on a X11 windowing system.
 * @type {boolean}
 */
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ?
    goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;


/**
 * @return {string} The string that describes the version number of the user
 *     agent.
 * @private
 */
goog.userAgent.determineVersion_ = function() {
  // All browsers have different ways to detect the version and they all have
  // different naming schemes.

  // version is a string rather than a number because it may contain 'b', 'a',
  // and so on.
  var version = '', re;

  if (goog.userAgent.OPERA && goog.global['opera']) {
    var operaVersion = goog.global['opera'].version;
    version = typeof operaVersion == 'function' ? operaVersion() : operaVersion;
  } else {
    if (goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/;
    } else if (goog.userAgent.IE) {
      re = /MSIE\s+([^\);]+)(\)|;)/;
    } else if (goog.userAgent.WEBKIT) {
      // WebKit/125.4
      re = /WebKit\/(\S+)/;
    }
    if (re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : '';
    }
  }
  return version;
};


/**
 * The version of the user agent. This is a string because it might contain
 * 'b' (as in beta) as well as multiple dots.
 * @type {string}
 */
goog.userAgent.VERSION = goog.userAgent.determineVersion_();


/**
 * Compares two version numbers.
 *
 * @param {string} v1 Version of first item.
 * @param {string} v2 Version of second item.
 *
 * @return {number}  1 if first argument is higher
 *                   0 if arguments are equal
 *                  -1 if second argument is higher.
 * @deprecated Use goog.string.compareVersions.
 */
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};


/**
 * Cache for {@link goog.userAgent.isVersion}. Calls to compareVersions are
 * surprisingly expensive and as a browsers version number is unlikely to change
 * during a session we cache the results.
 * @type {Object}
 * @private
 */
goog.userAgent.isVersionCache_ = {};


/**
 * Whether the user agent version is higher or the same as the given version.
 * NOTE: When checking the version numbers for Firefox and Safari, be sure to
 * use the engine's version, not the browser's version number.  For example,
 * Firefox 3.0 corresponds to Gecko 1.9 and Safari 3.0 to Webkit 522.11.
 * Opera and Internet Explorer versions match the product release number.<br>
 * @see <a href="http://en.wikipedia.org/wiki/Safari_(web_browser)">Webkit</a>
 * @see <a href="http://en.wikipedia.org/wiki/Gecko_engine">Gecko</a>
 *
 * @param {string|number} version The version to check.
 * @return {boolean} Whether the user agent version is higher or the same as
 *     the given version.
 */
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] ||
      (goog.userAgent.isVersionCache_[version] =
          goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0);
};

// Input 21
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating the browser's Document Object Model
 * Inspiration taken *heavily* from mochikit (http://mochikit.com/).
 *
 * You can use {@link goog.dom.DomHelper} to create new dom helpers that refer
 * to a different document object.  This is useful if you are working with
 * frames or multiple windows.
 *
*
*
 */


// TODO(user): Rename/refactor getTextContent and getRawTextContent. The problem
// is that getTextContent should mimic the DOM3 textContent. We should add a
// getInnerText (or getText) which tries to return the visible text, innerText.


goog.provide('goog.dom');
goog.provide('goog.dom.DomHelper');
goog.provide('goog.dom.NodeType');

goog.require('goog.array');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.userAgent');


/**
 * @define {boolean} Whether we know at compile time that the browser is in
 * quirks mode.
 */
goog.dom.ASSUME_QUIRKS_MODE = false;


/**
 * @define {boolean} Whether we know at compile time that the browser is in
 * standards compliance mode.
 */
goog.dom.ASSUME_STANDARDS_MODE = false;


/**
 * Whether we know the compatibility mode at compile time.
 * @type {boolean}
 * @private
 */
goog.dom.COMPAT_MODE_KNOWN_ =
    goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;


/**
 * Enumeration for DOM node types (for reference)
 * @enum {number}
 */
goog.dom.NodeType = {
  ELEMENT: 1,
  ATTRIBUTE: 2,
  TEXT: 3,
  CDATA_SECTION: 4,
  ENTITY_REFERENCE: 5,
  ENTITY: 6,
  PROCESSING_INSTRUCTION: 7,
  COMMENT: 8,
  DOCUMENT: 9,
  DOCUMENT_TYPE: 10,
  DOCUMENT_FRAGMENT: 11,
  NOTATION: 12
};


/**
 * Gets the DomHelper object for the document where the element resides.
 * @param {Node|Window=} opt_element If present, gets the DomHelper for this
 *     element.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ?
      new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) :
      (goog.dom.defaultDomHelper_ ||
          (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper()));
};


/**
 * Cached default DOM helper.
 * @type {goog.dom.DomHelper}
 * @private
 */
goog.dom.defaultDomHelper_;


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.getDocument = function() {
  return document;
};


/**
 * Alias for getElementById. If a DOM node is passed in then we just return
 * that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.getElement = function(element) {
  return goog.isString(element) ?
      document.getElementById(element) : element;
};


/**
 * Alias for getElement.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.getElement} instead.
 */
goog.dom.$ = goog.dom.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. This function
 * is a useful, if limited, way of collecting a list of DOM elements
 * with certain characteristics.  {@code goog.dom.query} offers a
 * more powerful and general solution which allows matching on CSS3
 * selector expressions, but at increased cost in code size. If all you
 * need is particular tags belonging to a single class, this function
 * is fast and sleek.
 *
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class,
                                                opt_el);
};


/**
 * Helper for {@code getElementsByTagNameAndClass}.
 * @param {!Document} doc The document to get the elements in.
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 * @private
 */
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class,
                                                  opt_el) {
  var parent = opt_el || doc;
  var tagName = (opt_tag && opt_tag != '*') ? opt_tag.toUpperCase() : '';

  // Prefer the standardized (http://www.w3.org/TR/selectors-api/), native and
  // fast W3C Selectors API. However, the version of WebKit that shipped with
  // Safari 3.1 and Chrome has a bug where it will not correctly match mixed-
  // case class name selectors in quirks mode.
  if (parent.querySelectorAll &&
      (tagName || opt_class) &&
      (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(doc) ||
       goog.userAgent.isVersion('528'))) {
    var query = tagName + (opt_class ? '.' + opt_class : '');
    return parent.querySelectorAll(query);
  }

  // Use the native getElementsByClassName if available, under the assumption
  // that even when the tag name is specified, there will be fewer elements to
  // filter through when going by class than by tag name
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);

    if (tagName) {
      var arrayLike = {};
      var len = 0;

      // Filter for specific tags if requested.
      for (var i = 0, el; el = els[i]; i++) {
        if (tagName == el.nodeName) {
          arrayLike[len++] = el;
        }
      }
      arrayLike.length = len;

      return arrayLike;
    } else {
      return els;
    }
  }

  var els = parent.getElementsByTagName(tagName || '*');

  if (opt_class) {
    var arrayLike = {};
    var len = 0;
    for (var i = 0, el; el = els[i]; i++) {
      var className = el.className;
      // Check if className has a split function since SVG className does not.
      if (typeof className.split == 'function' &&
          goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el;
      }
    }
    arrayLike.length = len;
    return arrayLike;
  } else {
    return els;
  }
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 * @deprecated Use {@link goog.dom.getElementsByTagNameAndClass} instead.
 */
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;


/**
 * Sets multiple properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if (key == 'style') {
      element.style.cssText = val;
    } else if (key == 'class') {
      element.className = val;
    } else if (key == 'for') {
      element.htmlFor = val;
    } else if (key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
      element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
    } else {
      element[key] = val;
    }
  });
};


/**
 * Map of attributes that should be set using
 * element.setAttribute(key, val) instead of element[key] = val.  Used
 * by goog.dom.setProperties.
 *
 * @type {Object}
 * @private
 */
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'rowspan': 'rowSpan',
  'valign': 'vAlign',
  'height': 'height',
  'width': 'width',
  'usemap': 'useMap',
  'frameborder': 'frameBorder',
  'type': 'type'
};


/**
 * Gets the dimensions of the viewport.
 *
 * Gecko Standards mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of body element.
 *
 * docEl.clientHeight Height of viewport excluding scrollbar.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of document.
 *
 * Gecko Backwards compatible mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight Height of document.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * IE6/7 Standards mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Undefined.
 * body.clientWidth   Width of body element.
 *
 * docEl.clientHeight Height of viewport excluding scrollbar.
 * win.innerHeight    Undefined.
 * body.clientHeight  Height of document element.
 *
 * IE5 + IE6/7 Backwards compatible mode:
 * docEl.clientWidth  0.
 * win.innerWidth     Undefined.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight 0.
 * win.innerHeight    Undefined.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * Opera 9 Standards and backwards compatible mode:
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * win.innerWidth     Width of viewport including scrollbar.
 * body.clientWidth   Width of viewport excluding scrollbar.
 *
 * docEl.clientHeight Height of document.
 * win.innerHeight    Height of viewport including scrollbar.
 * body.clientHeight  Height of viewport excluding scrollbar.
 *
 * WebKit:
 * Safari 2
 * docEl.clientHeight Same as scrollHeight.
 * docEl.clientWidth  Same as innerWidth.
 * win.innerWidth     Width of viewport excluding scrollbar.
 * win.innerHeight    Height of the viewport including scrollbar.
 * frame.innerHeight  Height of the viewport exluding scrollbar.
 *
 * Safari 3 (tested in 522)
 *
 * docEl.clientWidth  Width of viewport excluding scrollbar.
 * docEl.clientHeight Height of viewport excluding scrollbar in strict mode.
 * body.clientHeight  Height of viewport excluding scrollbar in quirks mode.
 *
 * @param {Window=} opt_window Optional window element to test.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.getViewportSize = function(opt_window) {
  // TODO(user): This should not take an argument
  return goog.dom.getViewportSize_(opt_window || window);
};


/**
 * Helper for {@code getViewportSize}.
 * @param {Window} win The window to get the view port size for.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 * @private
 */
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;

  if (goog.userAgent.WEBKIT && !goog.userAgent.isVersion('500') &&
      !goog.userAgent.MOBILE) {
    // TODO(user): Sometimes we get something that isn't a valid window
    // object. In this case we just revert to the current window. We need to
    // figure out when this happens and find a real fix for it.
    // See the comments on goog.dom.getWindow.
    if (typeof win.innerHeight == 'undefined') {
      win = window;
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;

    if (win == win.top) {
      if (scrollHeight < innerHeight) {
        innerHeight -= 15; // Scrollbars are 15px wide on Mac
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight);
  }

  var readsFromDocumentElement = goog.dom.isCss1CompatMode_(doc);
  if (goog.userAgent.OPERA && !goog.userAgent.isVersion('9.50')) {
    // Older versions of Opera used to read from document.body, but this
    // changed with 9.5.
    readsFromDocumentElement = false;
  }
  var el = readsFromDocumentElement ? doc.documentElement : doc.body;

  return new goog.math.Size(el.clientWidth, el.clientHeight);
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the current document.
 */
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};

/**
 * Calculates the height of the document of the given window.
 *
 * Function code copied from the opensocial gadget api:
 *   gadgets.window.adjustHeight(opt_height)
 *
 * @private
 * @param {Window} win The window whose document height to retrieve.
 * @return {number} The height of the document of the given window.
 */
goog.dom.getDocumentHeight_ = function(win) {
  // NOTE(user): This method will return the window size rather than the document
  // size in webkit quirks mode.
  var doc = win.document;
  var height = 0;

  if (doc) {
    // Calculating inner content height is hard and different between
    // browsers rendering in Strict vs. Quirks mode.  We use a combination of
    // three properties within document.body and document.documentElement:
    // - scrollHeight
    // - offsetHeight
    // - clientHeight
    // These values differ significantly between browsers and rendering modes.
    // But there are patterns.  It just takes a lot of time and persistence
    // to figure out.

    // Get the height of the viewport
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      // In Strict mode:
      // The inner content height is contained in either:
      //    document.documentElement.scrollHeight
      //    document.documentElement.offsetHeight
      // Based on studying the values output by different browsers,
      // use the value that's NOT equal to the viewport height found above.
      height = docEl.scrollHeight != vh ?
          docEl.scrollHeight : docEl.offsetHeight;
    } else {
      // In Quirks mode:
      // documentElement.clientHeight is equal to documentElement.offsetHeight
      // except in IE.  In most browsers, document.documentElement can be used
      // to calculate the inner content height.
      // However, in other browsers (e.g. IE), document.body must be used
      // instead.  How do we know which one to use?
      // If document.documentElement.clientHeight does NOT equal
      // document.documentElement.offsetHeight, then use document.body.
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if (docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight;
      }

      // Detect whether the inner content height is bigger or smaller
      // than the bounding box (viewport).  If bigger, take the larger
      // value.  If smaller, take the smaller value.
      if (sh > vh) {
        // Content is larger
        height = sh > oh ? sh : oh;
      } else {
        // Content is smaller
        height = sh < oh ? sh : oh;
      }
    }
  }

  return height;
};


/**
 * Gets the page scroll distance as a coordinate object.
 *
 * @param {Window=} opt_window Optional window element to test.
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 * @deprecated Use {@link goog.dom.getDocumentScroll} instead.
 */
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll();
};


/**
 * Gets the document scroll distance as a coordinate object.
 *
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 */
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};


/**
 * Helper for {@code getDocumentScroll}.
 *
 * @param {!Document} doc The document to get the scroll for.
 * @return {!goog.math.Coordinate} Object with values 'x' and 'y'.
 * @private
 */
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  return new goog.math.Coordinate(el.scrollLeft, el.scrollTop);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};


/**
 * Helper for {@code getDocumentScrollElement}.
 * @param {!Document} doc The document to get the scroll element for.
 * @return {Element} Scrolling element.
 * @private
 */
goog.dom.getDocumentScrollElement_ = function(doc) {
  // Safari (2 and 3) needs body.scrollLeft in both quirks mode and strict mode.
  return !goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ?
      doc.documentElement : doc.body;
};


/**
 * Gets the window object associated with the given document.
 *
 * @param {Document=} opt_doc  Document object to get window for.
 * @return {Window} The window associated with the given document.
 */
goog.dom.getWindow = function(opt_doc) {
  // TODO(user): This should not take an argument.
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window;
};


/**
 * Helper for {@code getWindow}.
 *
 * @param {!Document} doc  Document object to get window for.
 * @return {!Window} The window associated with the given document.
 * @private
 */
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or NodeList,i
 *     its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments);
};

/**
 * Helper for {@code createDom}.
 * @param {!Document} doc The document to create the DOM in.
 * @param {Arguments} args Argument object passed from the callers. See
 *     {@code goog.dom.createDom} for details.
 * @return {!Element} Reference to a DOM node.
 * @private
 */
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];

  // Internet Explorer is dumb: http://msdn.microsoft.com/workshop/author/
  //                            dhtml/reference/properties/name_2.asp
  // Also does not allow setting of 'type' attribute on 'input' or 'button'.
  if (goog.userAgent.IE && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ['<', tagName];
    if (attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name),
                      '"');
    }
    if (attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type),
                      '"');

      // Clone attributes map to remove 'type' without mutating the input.
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type;
    }
    tagNameArr.push('>');
    tagName = tagNameArr.join('');
  }

  var element = doc.createElement(tagName);

  if (attributes) {
    if (goog.isString(attributes)) {
      element.className = attributes;
    } else {
      goog.dom.setProperties(element, attributes);
    }
  }

  if (args.length > 2) {
    var childHandler = function(child) {
      // TODO(user): More coercion, ala MochiKit?
      if (child) {
        element.appendChild(goog.isString(child) ?
            doc.createTextNode(child) : child);
      }
    };

    for (var i = 2; i < args.length; i++) {
      var arg = args[i];
      // TODO(user): Fix isArrayLike to return false for a text node.
      if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
        // If the argument is a node list, not a real array, use a clone,
        // because forEach can't be used to mutate a NodeList.
        goog.array.forEach(goog.dom.isNodeList(arg) ?
            goog.array.clone(arg) : arg,
            childHandler);
      } else {
        childHandler(arg);
      }
    }
  }

  return element;
};

/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {string|Object=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array, its
 *     children will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.createDom} instead.
 */
goog.dom.$dom = goog.dom.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.createElement = function(name) {
  return document.createElement(name);
};


/**
 * Creates a new text node.
 * @param {string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content);
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};


/**
 * Create a table.
 * @param {!Document} doc Document object to use to create the table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean} fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 * @private
 */
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ['<tr>'];
  for (var i = 0; i < columns; i++) {
    rowHtml.push(fillWithNbsp ? '<td>&nbsp;</td>' : '<td></td>');
  }
  rowHtml.push('</tr>');
  rowHtml = rowHtml.join('');
  var totalHtml = ['<table>'];
  for (i = 0; i < rows; i++) {
    totalHtml.push(rowHtml);
  }
  totalHtml.push('</table>');

  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join('');
  return /** @type {!Element} */ (elem.removeChild(elem.firstChild));
};


/**
 * Converts an HTML string into a document fragment.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting document fragment.
 */
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString);
};


/**
 * Helper for {@code htmlToDocumentFragment}.
 *
 * @param {!Document} doc The document.
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting document fragment.
 * @private
 */
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement('div');
  tempDiv.innerHTML = htmlString;
  if (tempDiv.childNodes.length == 1) {
    return /** @type {!Node} */ (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = doc.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


/**
 * Returns the compatMode of the document.
 * @return {string} The result is either CSS1Compat or BackCompat.
 * @deprecated use goog.dom.isCss1CompatMode instead.
 */
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? 'CSS1Compat' : 'BackCompat';
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @param {Document} doc The document to check.
 * @return {boolean} True if in CSS1-compatible mode.
 * @private
 */
goog.dom.isCss1CompatMode_ = function(doc) {
  if (goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE;
  }

  return doc.compatMode == 'CSS1Compat';
};


/**
 * Determines if the given node can contain children.
 * @param {Node} node The node to check.
 * @return {boolean} Whether the node can contain children.
 */
goog.dom.canHaveChildren = function(node) {
  if (node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false;
  }
  if ('canHaveChildren' in node) {
    // IE supports this natively.
    return node.canHaveChildren;
  }
  switch (node.tagName) {
    case goog.dom.TagName.APPLET:
    case goog.dom.TagName.AREA:
    case goog.dom.TagName.BASE:
    case goog.dom.TagName.BR:
    case goog.dom.TagName.COL:
    case goog.dom.TagName.FRAME:
    case goog.dom.TagName.HR:
    case goog.dom.TagName.IMG:
    case goog.dom.TagName.INPUT:
    case goog.dom.TagName.IFRAME:
    case goog.dom.TagName.ISINDEX:
    case goog.dom.TagName.LINK:
    case goog.dom.TagName.NOFRAMES:
    case goog.dom.TagName.NOSCRIPT:
    case goog.dom.TagName.META:
    case goog.dom.TagName.OBJECT:
    case goog.dom.TagName.PARAM:
    case goog.dom.TagName.SCRIPT:
    case goog.dom.TagName.STYLE:
      return false;
  }
  return true;
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child);
};


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.removeChildren = function(node) {
  // Note: Iterations over live collections can be slow, this is the fastest
  // we could find. The double parenthesis are used to prevent JsCompiler and
  // strict warnings.
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};


/**
 * Inserts a new node before an existing reference node (i.e. as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
 */
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }
};


/**
 * Inserts a new node after an existing reference node (i.e. as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  }
};


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
};


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * Does nothing if the element is not in the document.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children; or undefined, if the element was not in the
 *     document to begin with.
 */
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    // Use IE DOM method (supported by Opera too) if available
    if (element.removeNode) {
      return /** @type {Element} */ (element.removeNode(false));
    } else {
      // Move all children of the original node up one level.
      while ((child = element.firstChild)) {
        parent.insertBefore(child, element);
      }

      // Detach the original element.
      return /** @type {Element} */ (goog.dom.removeNode(element));
    }
  }
};


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.getFirstElementChild = function(node) {
  return goog.dom.getNextElementNode_(node.firstChild, true);
};


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.getLastElementChild = function(node) {
  return goog.dom.getNextElementNode_(node.lastChild, false);
};


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.getNextElementSibling = function(node) {
  return goog.dom.getNextElementNode_(node.nextSibling, true);
};


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.getPreviousElementSibling = function(node) {
  return goog.dom.getNextElementNode_(node.previousSibling, false);
};


/**
 * Returns the first node that is an element in the specified direction,
 * starting with {@code node}.
 * @param {Node} node The node to get the next element from.
 * @param {boolean} forward Whether to look forwards or backwards.
 * @return {Element} The first element.
 * @private
 */
goog.dom.getNextElementNode_ = function(node, forward) {
  while (node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling;
  }

  return /** @type {Element} */ (node);
};


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.getNextNode = function(node) {
  if (!node) {
    return null;
  }

  if (node.firstChild) {
    return node.firstChild;
  }

  while (node && !node.nextSibling) {
    node = node.parentNode;
  }

  return node ? node.nextSibling : null;
};


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.getPreviousNode = function(node) {
  if (!node) {
    return null;
  }

  if (!node.previousSibling) {
    return node.parentNode;
  }

  node = node.previousSibling;
  while (node && node.lastChild) {
    node = node.lastChild;
  }

  return node;
};


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0;
};


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.contains = function(parent, descendant) {
  // We use browser specific methods for this if available since it is faster
  // that way.

  // IE DOM
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }

  // W3C DOM Level 3
  if (typeof parent.compareDocumentPosition != 'undefined') {
    return parent == descendant ||
        Boolean(parent.compareDocumentPosition(descendant) & 16);
  }

  // W3C DOM Level 1
  while (descendant && parent != descendant) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
};


/**
 * Compares the document order of two nodes, returning 0 if they are the same
 * node, a negative number if node1 is before node2, and a positive number if
 * node2 is before node1.  Note that we compare the order the tags appear in the
 * document so in the tree <b><i>text</i></b> the B node is considered to be
 * before the I node.
 *
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} 0 if the nodes are the same node, a negative number if node1
 *     is before node2, and a positive number if node2 is before node1.
 */
goog.dom.compareNodeOrder = function(node1, node2) {
  // Fall out quickly for equality.
  if (node1 == node2) {
    return 0;
  }

  // Use compareDocumentPosition where available
  if (node1.compareDocumentPosition) {
    // 4 is the bitmask for FOLLOWS.
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }

  // Process in IE using sourceIndex - we check to see if the first node has
  // a source index or if its parent has one.
  if ('sourceIndex' in node1 ||
      (node1.parentNode && 'sourceIndex' in node1.parentNode)) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;

    if (isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex;
    } else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;

      if (parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2);
      }

      if (!isElement1 && goog.dom.contains(parent1, node2)) {
        return -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2);
      }


      if (!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1);
      }

      return (isElement1 ? node1.sourceIndex : parent1.sourceIndex) -
             (isElement2 ? node2.sourceIndex : parent2.sourceIndex);
    }
  }

  // For Safari, we compare ranges.
  var doc = goog.dom.getOwnerDocument(node1);

  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);

  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);

  return range1.compareBoundaryPoints(goog.global['Range'].START_TO_END,
      range2);
};


/**
 * Utility function to compare the position of two nodes, when
 * {@code textNode}'s parent is an ancestor of {@code node}.  If this entry
 * condition is not met, this function will attempt to reference a null object.
 * @param {Node} textNode The textNode to compare.
 * @param {Node} node The node to compare.
 * @return {number} -1 if node is before textNode, +1 otherwise.
 * @private
 */
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    // If textNode is a child of node, then node comes first.
    return -1;
  }
  var sibling = node;
  while (sibling.parentNode != parent) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};


/**
 * Utility function to compare the position of two nodes known to be non-equal
 * siblings.
 * @param {Node} node1 The first node to compare.
 * @param {Node} node2 The second node to compare.
 * @return {number} -1 if node1 is before node2, +1 otherwise.
 * @private
 */
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while ((s = s.previousSibling)) {
    if (s == node1) {
      // We just found node1 before node2.
      return -1;
    }
  }

  // Since we didn't find it, node1 must be after node2.
  return 1;
};


/**
 * Find the deepest common ancestor of the given nodes.
 * @param {...Node} var_args The nodes to find a common ancestor of.
 * @return {Node} The common ancestor of the nodes, or null if there is none.
 *     null will only be returned if two or more of the nodes are from different
 *     documents.
 */
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if (!count) {
    return null;
  } else if (count == 1) {
    return arguments[0];
  }

  var paths = [];
  var minLength = Infinity;
  for (i = 0; i < count; i++) {
    // Compute the list of ancestors.
    var ancestors = [];
    var node = arguments[i];
    while (node) {
      ancestors.unshift(node);
      node = node.parentNode;
    }

    // Save the list for comparison.
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0; i < minLength; i++) {
    var first = paths[0][i];
    for (var j = 1; j < count; j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};


/**
 * Returns the owner document for a node.
 * @param {Node|Window} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.getOwnerDocument = function(node) {
  // TODO(user): Remove IE5 code.
  // IE5 uses document instead of ownerDocument
  return /** @type {!Document} */ (
      node.nodeType == goog.dom.NodeType.DOCUMENT ? node :
      node.ownerDocument || node.document);
};


/**
 * Cross-browser function for getting the document element of a frame or iframe.
 * @param {Element} frame Frame element.
 * @return {!Document} The frame content document.
 */
goog.dom.getFrameContentDocument = function(frame) {
  var doc;
  if (goog.userAgent.WEBKIT) {
    doc = (frame.document || frame.contentWindow.document);
  } else {
    doc = (frame.contentDocument || frame.contentWindow.document);
  }
  return doc;
};


/**
 * Cross-browser function for getting the window of a frame or iframe.
 * @param {HTMLIFrameElement|HTMLFrameElement} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow ||
      goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame));
};


/**
 * Cross-browser function for setting the text content of an element.
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content.
 */
goog.dom.setTextContent = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
    // If the first child is a text node we just change its data and remove the
    // rest of the children.
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    goog.dom.removeChildren(element);
    var doc = goog.dom.getOwnerDocument(element);
    element.appendChild(doc.createTextNode(text));
  }
};


/**
 * Gets the outerHTML of a node, which islike innerHTML, except that it
 * actually contains the HTML of the node itself.
 * @param {Element} element The element to get the HTML of.
 * @return {string} The outerHTML of the given element.
 */
goog.dom.getOuterHtml = function(element) {
  // IE, Opera and WebKit all have outerHTML.
  if ('outerHTML' in element) {
    return element.outerHTML;
  } else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement('div');
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
};


/**
 * Finds the first descendant node that matches the filter function, using
 * a depth first search. This function offers the most general purpose way
 * of finding a matching element. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.
 * @see goog.dom.query
 *
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Node|undefined} The found node or undefined if none is found.
 */
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined;
};


/**
 * Finds all the descendant nodes that match the filter function, using a
 * a depth first search. This function offers the most general-purpose way
 * of finding a set of matching elements. You may also wish to consider
 * {@code goog.dom.query} which can express many matching criteria using
 * CSS selector expressions. These expressions often result in a more
 * compact representation of the desired result.

 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Array.<Node>} The found nodes or an empty array if none are found.
 */
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv;
};


/**
 * Finds the first or all the descendant nodes that match the filter function,
 * using a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @param {Array.<Node>} rv The found nodes are added to this array.
 * @param {boolean} findOne If true we exit after the first found node.
 * @return {boolean} Whether the search is complete or not. True in case findOne
 *     is true and the node is found. False otherwise.
 * @private
 */
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if (root != null) {
    for (var i = 0, child; child = root.childNodes[i]; i++) {
      if (p(child)) {
        rv.push(child);
        if (findOne) {
          return true;
        }
      }
      if (goog.dom.findNodes_(child, p, rv, findOne)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Map of tags whose content to ignore when calculating text length.
 * @type {Object}
 * @private
 */
goog.dom.TAGS_TO_IGNORE_ = {
  'SCRIPT': 1,
  'STYLE': 1,
  'HEAD': 1,
  'IFRAME': 1,
  'OBJECT': 1
};


/**
 * Map of tags which have predefined values with regard to whitespace.
 * @type {Object}
 * @private
 */
goog.dom.PREDEFINED_TAG_VALUES_ = {'IMG': ' ', 'BR': '\n'};


/**
 * Returns true if the element has a tab index that allows it to receive
 * keyboard focus (tabIndex >= 0), false otherwise.  Note that form elements
 * natively support keyboard focus, even if they have no tab index.  See
 * http://go/tabindex for more info.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index that allows keyboard
 *     focus.
 */
goog.dom.isFocusableTabIndex = function(element) {
  // IE returns 0 for an unset tabIndex, so we must use getAttributeNode(),
  // which returns an object with a 'specified' property if tabIndex is
  // specified.  This works on other browsers, too.
  var attrNode = element.getAttributeNode('tabindex'); // Must be lowercase!
  if (attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0;
  }
  return false;
};


/**
 * Enables or disables keyboard focus support on the element via its tab index.
 * Only elements for which {@link goog.dom.isFocusableTabIndex} returns true
 * (or elements that natively support keyboard focus, like form elements) can
 * receive keyboard focus.  See http://go/tabindex for more info.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to set or remove a tab index on the element
 *     that supports keyboard focus.
 */
goog.dom.setFocusableTabIndex = function(element, enable) {
  if (enable) {
    element.tabIndex = 0;
  } else {
    element.removeAttribute('tabIndex'); // Must be camelCase!
  }
};


/**
 * Returns the text content of the current node, without markup and invisible
 * symbols. New lines are stripped and whitespace is collapsed,
 * such that each character would be visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.getTextContent = function(node) {
  var textContent;
  // Note(user): Both Opera and Safara 3 supports innerText but they include
  // text nodes in script tags. So we revert to use a user agent test here.
  if (goog.userAgent.IE && ('innerText' in node)) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
    // Unfortunately .innerText() returns text with &shy; symbols
    // We need to filter it out and then remove duplicate whitespaces
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join('');
  }

  // Strip &shy; entities. goog.format.insertWordBreaks inserts them in Opera.
  textContent = textContent.replace(/\xAD/g, '');

  textContent = textContent.replace(/ +/g, ' ');
  if (textContent != ' ') {
    textContent = textContent.replace(/^\s*/, '');
  }

  return textContent;
};


/**
 * Returns the text content of the current node, without markup.
 *
 * Unlike {@code getTextContent} this method does not collapse whitespaces
 * or normalize lines breaks.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The raw text content.
 */
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);

  return buf.join('');
};


/**
 * Recursive support function for text content retrieval.
 *
 * @param {Node} node The node from which we are getting content.
 * @param {Array} buf string buffer.
 * @param {boolean} normalizeWhitespace Whether to normalize whitespace.
 * @private
 */
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    // ignore certain tags
  } else if (node.nodeType == goog.dom.NodeType.TEXT) {
    if (normalizeWhitespace) {
      buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ''));
    } else {
      buf.push(node.nodeValue);
    }
  } else if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
    buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
  } else {
    var child = node.firstChild;
    while (child) {
      goog.dom.getTextContent_(child, buf, normalizeWhitespace);
      child = child.nextSibling;
    }
  }
};


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by goog.dom.getNodeTextLength.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent The node relative to which the offset will
 *     be calculated. Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while (node && node != root) {
    var cur = node;
    while ((cur = cur.previousSibling)) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  // Trim left to deal with FF cases when there might be line breaks and empty
  // nodes at the front of the text
  return goog.string.trimLeft(buf.join('')).replace(/ +/g, ' ').length;
};


/**
 * Returns the node at a given offset in a parent node.  If an object is
 * provided for the optional third parameter, the node and the remainder of the
 * offset will stored as properties of this object.
 * @param {Node} parent The parent node.
 * @param {number} offset The offset into the parent node.
 * @param {Object=} opt_result Object to be used to store the return value. The
 *     return value will be stored in the form {node: Node, remainder: number}
 *     if this object is provided.
 * @return {Node} The node at the given offset.
 */
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while (stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
      // ignore certain tags
    } else if (cur.nodeType == goog.dom.NodeType.TEXT) {
      var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, '').replace(/ +/g, ' ');
      pos += text.length;
    } else if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
      pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
    } else {
      for (var i = cur.childNodes.length - 1; i >= 0; i--) {
        stack.push(cur.childNodes[i]);
      }
    }
  }
  if (goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur;
  }

  return cur;
};


/**
 * Returns true if the object is a {@code NodeList}.  To qualify as a NodeList,
 * the object must have a numeric length property and an item function (which
 * has type 'string' on IE for some reason).
 * @param {Object} val Object to test.
 * @return {boolean} Whether the object is a NodeList.
 */
goog.dom.isNodeList = function(val) {
  // TODO(user): Now the isNodeList is part of goog.dom we can use
  // goog.userAgent to make this simpler.
  // A NodeList must have a length property of type 'number' on all platforms.
  if (val && typeof val.length == 'number') {
    // A NodeList is an object everywhere except Safari, where it's a function.
    if (goog.isObject(val)) {
      // A NodeList must have an item function (on non-IE platforms) or an item
      // property of type 'string' (on IE).
      return typeof val.item == 'function' || typeof val.item == 'string';
    } else if (goog.isFunction(val)) {
      // On Safari, a NodeList is a function with an item property that is also
      // a function.
      return typeof val.item == 'function';
    }
  }

  // Not a NodeList.
  return false;
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?string=} opt_tag The tag name to match (or null/undefined to match
 *     any node regardless of tag name). Must be uppercase (goog.dom.TagName).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match any node regardless of class name).
 * @return {Node} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element,
      function(node) {
        return (!tagName || node.nodeName == tagName) &&
               (!opt_class || goog.dom.classes.has(node, opt_class));
      }, true);
};


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.getAncestor = function(
    element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if (!opt_includeNode) {
    element = element.parentNode;
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while (element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if (matcher(element)) {
      return element;
    }
    element = element.parentNode;
    steps++;
  }
  // Reached the root of the DOM without a match
  return null;
};


/**
 * Create an instance of a DOM helper with a new document object.
 * @param {Document=} opt_document Document object to associate with this
 *     DOM helper.
 * @constructor
 */
goog.dom.DomHelper = function(opt_document) {
  /**
   * Reference to the document object to use
   * @type {!Document}
   * @private
   */
  this.document_ = opt_document || goog.global.document || document;
};


/**
 * Gets the dom helper object for the document where the element resides.
 * @param {Node=} opt_node If present, gets the DomHelper for this node.
 * @return {!goog.dom.DomHelper} The DomHelper.
 */
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;


/**
 * Sets the document object.
 * @param {!Document} document Document object.
 */
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};


/**
 * Gets the document object being used by the dom library.
 * @return {!Document} Document object.
 */
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};


/**
 * Alias for {@code getElementById}. If a DOM node is passed in then we just
 * return that.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 */
goog.dom.DomHelper.prototype.getElement = function(element) {
  if (goog.isString(element)) {
    return this.document_.getElementById(element);
  } else {
    return element;
  }
};


/**
 * Alias for {@code getElement}.
 * @param {string|Element} element Element ID or a DOM node.
 * @return {Element} The element with the given ID, or the node passed in.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.getElement} instead.
 */
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;


/**
 * Looks up elements by both tag and class name, using browser native functions
 * ({@code querySelectorAll}, {@code getElementsByTagName} or
 * {@code getElementsByClassName}) where possible. The returned array is a live
 * NodeList or a static list depending on the code path taken.
 *
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name or * for all tags.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag,
                                                                     opt_class,
                                                                     opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag,
                                                opt_class, opt_el);
};


/**
 * Alias for {@code getElementsByTagNameAndClass}.
 * @deprecated Use DomHelper getElementsByTagNameAndClass.
 * @see goog.dom.query
 *
 * @param {?string=} opt_tag Element tag name.
 * @param {?string=} opt_class Optional class name.
 * @param {Element=} opt_el Optional element to look in.
 * @return { {length: number} } Array-like list of elements (only a length
 *     property and numerical indices are guaranteed to exist).
 */
goog.dom.DomHelper.prototype.$$ =
    goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;


/**
 * Sets a number of properties on a node.
 * @param {Element} element DOM node to set properties on.
 * @param {Object} properties Hash of property:value pairs.
 */
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;


/**
 * Gets the dimensions of the viewport.
 * @param {Window=} opt_window Optional window element to test. Defaults to
 *     the window of the Dom Helper.
 * @return {!goog.math.Size} Object with values 'width' and 'height'.
 */
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  // TODO(user): This should not take an argument. That breaks the rule of a
  // a DomHelper representing a single frame/window/document.
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};


/**
 * Calculates the height of the document.
 *
 * @return {number} The height of the document.
 */
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};


/**
 * Returns a dom node with a set of attributes.  This function accepts varargs
 * for subsequent nodes to be added.  Subsequent nodes will be added to the
 * first node as childNodes.
 *
 * So:
 * <code>createDom('div', null, createDom('p'), createDom('p'));</code>
 * would return a div with two child paragraphs
 *
 * An easy way to move all child nodes of an existing element to a new parent
 * element is:
 * <code>createDom('div', null, oldElement.childNodes);</code>
 * which will remove all child nodes from the old element and add them as
 * child nodes of the new DIV.
 *
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes or
 *     strings for text nodes. If one of the var_args is an array or
 *     NodeList, its elements will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 */
goog.dom.DomHelper.prototype.createDom = function(tagName,
                                                  opt_attributes,
                                                  var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};


/**
 * Alias for {@code createDom}.
 * @param {string} tagName Tag to create.
 * @param {Object|string=} opt_attributes If object, then a map of name-value
 *     pairs for attributes. If a string, then this is the className of the new
 *     element.
 * @param {...Object|string|Array|NodeList} var_args Further DOM nodes
 *     or strings for text nodes.  If one of the var_args is an array, its
 *     children will be added as childNodes instead.
 * @return {!Element} Reference to a DOM node.
 * @deprecated Use {@link goog.dom.DomHelper.prototype.createDom} instead.
 */
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;


/**
 * Creates a new element.
 * @param {string} name Tag name.
 * @return {!Element} The new element.
 */
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name);
};


/**
 * Creates a new text node.
 * @param {string} content Content.
 * @return {!Text} The new text node.
 */
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content);
};


/**
 * Create a table.
 * @param {number} rows The number of rows in the table.  Must be >= 1.
 * @param {number} columns The number of columns in the table.  Must be >= 1.
 * @param {boolean=} opt_fillWithNbsp If true, fills table entries with nsbps.
 * @return {!Element} The created table.
 */
goog.dom.DomHelper.prototype.createTable = function(rows, columns,
    opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns,
      !!opt_fillWithNbsp);
};


/**
 * Converts an HTML string into a node or a document fragment.  A single Node
 * is used if the {@code htmlString} only generates a single node.  If the
 * {@code htmlString} generates multiple nodes then these are put inside a
 * {@code DocumentFragment}.
 *
 * @param {string} htmlString The HTML string to convert.
 * @return {!Node} The resulting node.
 */
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString);
};


/**
 * Returns the compatMode of the document.
 * @return {string} The result is either CSS1Compat or BackCompat.
 * @deprecated use goog.dom.DomHelper.prototype.isCss1CompatMode instead.
 */
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? 'CSS1Compat' : 'BackCompat';
};


/**
 * Returns true if the browser is in "CSS1-compatible" (standards-compliant)
 * mode, false otherwise.
 * @return {boolean} True if in CSS1-compatible mode.
 */
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};


/**
 * Gets the window object associated with the document.
 * @return {!Window} The window associated with the given document.
 */
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};


/**
 * Gets the document scroll element.
 * @return {Element} Scrolling element.
 */
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};


/**
 * Gets the document scroll distance as a coordinate object.
 * @return {!goog.math.Coordinate} Object with properties 'x' and 'y'.
 */
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};


/**
 * Appends a child to a node.
 * @param {Node} parent Parent.
 * @param {Node} child Child.
 */
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;


/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;


/**
 * Inserts a new node before an existing reference node (i.e., as the previous
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert before.
 */
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;


/**
 * Inserts a new node after an existing reference node (i.e., as the next
 * sibling). If the reference node has no parent, then does nothing.
 * @param {Node} newNode Node to insert.
 * @param {Node} refNode Reference node to insert after.
 */
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;


/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;


/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;


/**
 * Flattens an element. That is, removes it and replace it with its children.
 * @param {Element} element The element to flatten.
 * @return {Element|undefined} The original element, detached from the document
 *     tree, sans children, or undefined if the element was already not in the
 *     document.
 */
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;


/**
 * Returns the first child node that is an element.
 * @param {Node} node The node to get the first child element of.
 * @return {Element} The first child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getFirstElementChild =
    goog.dom.getFirstElementChild;


/**
 * Returns the last child node that is an element.
 * @param {Node} node The node to get the last child element of.
 * @return {Element} The last child node of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;


/**
 * Returns the first next sibling that is an element.
 * @param {Node} node The node to get the next sibling element of.
 * @return {Element} The next sibling of {@code node} that is an element.
 */
goog.dom.DomHelper.prototype.getNextElementSibling =
    goog.dom.getNextElementSibling;


/**
 * Returns the first previous sibling that is an element.
 * @param {Node} node The node to get the previous sibling element of.
 * @return {Element} The first previous sibling of {@code node} that is
 *     an element.
 */
goog.dom.DomHelper.prototype.getPreviousElementSibling =
    goog.dom.getPreviousElementSibling;


/**
 * Returns the next node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The next node in the DOM tree, or null if this was the last
 *     node.
 */
goog.dom.DomHelper.prototype.getNextNode =
    goog.dom.getNextNode;


/**
 * Returns the previous node in source order from the given node.
 * @param {Node} node The node.
 * @return {Node} The previous node in the DOM tree, or null if this was the
 *     first node.
 */
goog.dom.DomHelper.prototype.getPreviousNode =
    goog.dom.getPreviousNode;


/**
 * Whether the object looks like a DOM node.
 * @param {*} obj The object being tested for node likeness.
 * @return {boolean} Whether the object looks like a DOM node.
 */
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;


/**
 * Whether a node contains another node.
 * @param {Node} parent The node that should contain the other node.
 * @param {Node} descendant The node to test presence of.
 * @return {boolean} Whether the parent node contains the descendent node.
 */
goog.dom.DomHelper.prototype.contains = goog.dom.contains;


/**
 * Returns the owner document for a node.
 * @param {Node} node The node to get the document for.
 * @return {!Document} The document owning the node.
 */
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;


/**
 * Cross browser function for getting the document element of an iframe.
 * @param {HTMLIFrameElement|HTMLFrameElement} iframe Iframe element.
 * @return {!HTMLDocument} The frame content document.
 */
goog.dom.DomHelper.prototype.getFrameContentDocument =
    goog.dom.getFrameContentDocument;


/**
 * Cross browser function for getting the window of a frame or iframe.
 * @param {HTMLIFrameElement|HTMLFrameElement} frame Frame element.
 * @return {Window} The window associated with the given frame.
 */
goog.dom.DomHelper.prototype.getFrameContentWindow =
    goog.dom.getFrameContentWindow;


/**
 * Cross browser function for setting the text content of an element.
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content with.
 */
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;


/**
 * Finds the first descendant node that matches the filter function. This does
 * a depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {(Node, undefined)} The found node or undefined if none is found.
 */
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;


/**
 * Finds all the descendant nodes that matches the filter function. This does a
 * depth first search.
 * @param {Node} root The root of the tree to search.
 * @param {function(Node) : boolean} p The filter function.
 * @return {Array.<Node>} The found nodes or an empty array if none are found.
 */
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;


/**
 * Returns the text contents of the current node, without markup. New lines are
 * stripped and whitespace is collapsed, such that each character would be
 * visible.
 *
 * In browsers that support it, innerText is used.  Other browsers attempt to
 * simulate it via node traversal.  Line breaks are canonicalized in IE.
 *
 * @param {Node} node The node from which we are getting content.
 * @return {string} The text content.
 */
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;


/**
 * Returns the text length of the text contained in a node, without markup. This
 * is equivalent to the selection length if the node was selected, or the number
 * of cursor movements to traverse the node. Images & BRs take one space.  New
 * lines are ignored.
 *
 * @param {Node} node The node whose text content length is being calculated.
 * @return {number} The length of {@code node}'s text content.
 */
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;


/**
 * Returns the text offset of a node relative to one of its ancestors. The text
 * length is the same as the length calculated by
 * {@code goog.dom.getNodeTextLength}.
 *
 * @param {Node} node The node whose offset is being calculated.
 * @param {Node=} opt_offsetParent Defaults to the node's owner document's body.
 * @return {number} The text offset.
 */
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;


/**
 * Walks up the DOM hierarchy returning the first ancestor that has the passed
 * tag name and/or class name. If the passed element matches the specified
 * criteria, the element itself is returned.
 * @param {Node} element The DOM node to start with.
 * @param {?string=} opt_tag The tag name to match (or null/undefined to match
 *     any node regardless of tag name). Must be uppercase (goog.dom.TagName).
 * @param {?string=} opt_class The class name to match (or null/undefined to
 *     match any node regardless of class name).
 * @return {Node} The first ancestor that matches the passed criteria, or
 *     null if none match.
 */
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass =
    goog.dom.getAncestorByTagNameAndClass;


/**
 * Walks up the DOM hierarchy returning the first ancestor that passes the
 * matcher function.
 * @param {Node} element The DOM node to start with.
 * @param {function(Node) : boolean} matcher A function that returns true if the
 *     passed node matches the desired criteria.
 * @param {boolean=} opt_includeNode If true, the node itself is included in
 *     the search (the first call to the matcher will pass startElement as
 *     the node to test).
 * @param {number=} opt_maxSearchSteps Maximum number of levels to search up the
 *     dom.
 * @return {Node} DOM node that matched the matcher, or null if there was
 *     no match.
 */
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;

// Input 22
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing a numeric box.
*
 */


goog.provide('goog.math.Box');

goog.require('goog.math.Coordinate');



/**
 * Class for representing a box. A box is specified as a top, right, bottom,
 * and left. A box is useful for representing margins and padding.
 *
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 * @constructor
 */
goog.math.Box = function(top, right, bottom, left) {
  /**
   * Top
   * @type {number}
   */
  this.top = top;

  /**
   * Right
   * @type {number}
   */
  this.right = right;

  /**
   * Bottom
   * @type {number}
   */
  this.bottom = bottom;

  /**
   * Left
   * @type {number}
   */
  this.left = left;
};


/**
 * Creates a Box by bounding a collection of goog.math.Coordinate objects
 * @param {...goog.math.Coordinate} var_args Coordinates to be included inside
 *     the box.
 * @return {goog.math.Box} A Box containing all the specified Coordinates.
 */
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x,
                              arguments[0].y, arguments[0].x);
  for (var i = 1; i < arguments.length; i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x);
  }
  return box;
};


/**
 * Creates a copy of the box with the same dimensions.
 * @return {goog.math.Box} A clone of this Box.
 */
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing the box.
   * @return {string} In the form (50t, 73r, 24b, 13l).
   */
  goog.math.Box.prototype.toString = function() {
    return '(' + this.top + 't, ' + this.right + 'r, ' + this.bottom + 'b, ' +
           this.left + 'l)';
  };
}


/**
 * Returns whether the box contains a coordinate or another box.
 *
 * @param {goog.math.Coordinate|goog.math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other);
};


/**
 * Expands box with the given margins.
 *
 * @param {number|goog.math.Box} top Top margin or box with all margins.
 * @param {number=} opt_right Right margin.
 * @param {number=} opt_bottom Bottom margin.
 * @param {number=} opt_left Left margin.
 * @return {goog.math.Box} A reference to this Box.
 */
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom,
    opt_left) {
  if (goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left;
  } else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left;
  }

  return this;
};


/**
 * Expand this box to include another box.
 * NOTE(user): This is used in code that needs to be very fast, please don't
 * add functionality to this function at the expense of speed (variable
 * arguments, accepting multiple argument types, etc).
 * @param {goog.math.Box} box The box to include in this one.
 */
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom);
};


/**
 * Compares boxes for equality.
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A Box.
 * @return {boolean} True iff the boxes are equal, or if both are null.
 */
goog.math.Box.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.top == b.top && a.right == b.right &&
         a.bottom == b.bottom && a.left == b.left;
};


/**
 * Returns whether a box contains a coordinate or another box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate|goog.math.Box} other A Coordinate or a Box.
 * @return {boolean} Whether the box contains the coordinate or other box.
 */
goog.math.Box.contains = function(box, other) {
  if (!box || !other) {
    return false;
  }

  if (other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right &&
      other.top >= box.top && other.bottom <= box.bottom;
  }

  // other is a Coordinate.
  return other.x >= box.left && other.x <= box.right &&
         other.y >= box.top && other.y <= box.bottom;
};


/**
 * Returns the distance between a coordinate and the nearest corner/side of a
 * box. Returns zero if the coordinate is inside the box.
 *
 * @param {goog.math.Box} box A Box.
 * @param {goog.math.Coordinate} coord A Coordinate.
 * @return {number} The distance between {@code coord} and the nearest
 *     corner/side of {@code box}, or zero if {@code coord} is inside
 *     {@code box}.
 */
goog.math.Box.distance = function(box, coord) {
  if (coord.x >= box.left && coord.x <= box.right) {
    if (coord.y >= box.top && coord.y <= box.bottom) {
      return 0;
    }
    return coord.y < box.top ? box.top - coord.y : coord.y - box.bottom;
  }

  if (coord.y >= box.top && coord.y <= box.bottom) {
    return coord.x < box.left ? box.left - coord.x : coord.x - box.right;
  }

  return goog.math.Coordinate.distance(coord,
      new goog.math.Coordinate(coord.x < box.left ? box.left : box.right,
                               coord.y < box.top ? box.top : box.bottom));
};


/**
 * Returns whether two boxes intersect.
 *
 * @param {goog.math.Box} a A Box.
 * @param {goog.math.Box} b A second Box.
 * @return {boolean} Whether the boxes intersect.
 */
goog.math.Box.intersects = function(a, b) {
  return (a.left <= b.right && b.left <= a.right &&
          a.top <= b.bottom && b.top <= a.bottom);
};

// Input 23
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A utility class for representing rectangles.
*
 */


goog.provide('goog.math.Rect');

goog.require('goog.math.Box');
goog.require('goog.math.Size');

/**
 * Class for representing rectangular regions.
 * @param {number} x Left.
 * @param {number} y Top.
 * @param {number} w Width.
 * @param {number} h Height.
 * @constructor
 */
goog.math.Rect = function(x, y, w, h) {
  /**
   * Left
   * @type {number}
   */
  this.left = x;

  /**
   * Top
   * @type {number}
   */
  this.top = y;

  /**
   * Width
   * @type {number}
   */
  this.width = w;

  /**
   * Height
   * @type {number}
   */
  this.height = h;
};


/**
 * Returns a new copy of the rectangle.
 * @return {!goog.math.Rect} A clone of this Rectangle.
 */
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height);
};


/**
 * Returns a new Box object with the same position and dimensions as this
 * rectangle.
 * @return {!goog.math.Box} A new Box representation of this Rectangle.
 */
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top,
                           right,
                           bottom,
                           this.left);
};


/**
 * Creates a new Rect object with the same position and dimensions as a given
 * Box.  Note that this is only the inverse of toBox if left/top are defined.
 * @param {goog.math.Box} box A box.
 * @return {!goog.math.Rect} A new Rect initialized with the box's position
 *     and size.
 */
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top,
      box.right - box.left, box.bottom - box.top);
};


if (goog.DEBUG) {
  /**
   * Returns a nice string representing size and dimensions of rectangle.
   * @return {string} In the form (50, 73 - 75w x 25h).
   */
  goog.math.Rect.prototype.toString = function() {
    return '(' + this.left + ', ' + this.top + ' - ' + this.width + 'w x ' +
           this.height + 'h)';
  };
}


/**
 * Compares rectangles for equality.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} True iff the rectangles have the same left, top, width,
 *     and height, or if both are null.
 */
goog.math.Rect.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.left == b.left && a.width == b.width &&
         a.top == b.top && a.height == b.height;
};


/**
 * Computes the intersection of this rectangle and the rectangle parameter.  If
 * there is no intersection, returns false and leaves this rectangle as is.
 * @param {goog.math.Rect} rect A Rectangle.
 * @return {boolean} True iff this rectangle intersects with the parameter.
 */
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);

  if (x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);

    if (y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;

      return true;
    }
  }
  return false;
};


/**
 * Returns the intersection of two rectangles. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {goog.math.Rect} A new intersection rect (even if width and height
 *     are 0), or null if there is no intersection.
 */
goog.math.Rect.intersection = function(a, b) {
  // There is no nice way to do intersection via a clone, because any such
  // clone might be unnecessary if this function returns null.  So, we duplicate
  // code from above.

  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);

  if (x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);

    if (y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
};


/**
 * Returns whether two rectangles intersect. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} Whether a and b intersect.
 */
goog.math.Rect.intersects = function(a, b) {
  return (a.left <= b.left + b.width && b.left <= a.left + a.width &&
      a.top <= b.top + b.height && b.top <= a.top + a.height);
};


/**
 * Returns whether a rectangle intersects this rectangle.
 * @param {goog.math.Rect} rect A rectangle.
 * @return {boolean} Whether rect intersects this rectangle.
 */
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect);
};


/**
 * Computes the difference regions between two rectangles. The return value is
 * an array of 0 to 4 rectangles defining the remaining regions of the first
 * rectangle after the second has been subtracted.
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {!Array.<!goog.math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if (!intersection || !intersection.height || !intersection.width) {
    return [a.clone()];
  }

  var result = [];

  var top = a.top;
  var height = a.height;

  var ar = a.left + a.width;
  var ab = a.top + a.height;

  var br = b.left + b.width;
  var bb = b.top + b.height;

  // Subtract off any area on top where A extends past B
  if (b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    // If we're moving the top down, we also need to subtract the height diff.
    height -= b.top - a.top;
  }
  // Subtract off any area on bottom where A extends past B
  if (bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top;
  }
  // Subtract any area on left where A extends past B
  if (b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height));
  }
  // Subtract any area on right where A extends past B
  if (br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height));
  }

  return result;
};


/**
 * Computes the difference regions between this rectangle and {@code rect}. The
 * return value is an array of 0 to 4 rectangles defining the remaining regions
 * of this rectangle after the other has been subtracted.
 * @param {goog.math.Rect} rect A Rectangle.
 * @return {!Array.<!goog.math.Rect>} An array with 0 to 4 rectangles which
 *     together define the difference area of rectangle a minus rectangle b.
 */
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect);
};


/**
 * Expand this rectangle to also include the area of the given rectangle.
 * @param {goog.math.Rect} rect The other rectangle.
 */
goog.math.Rect.prototype.boundingRect = function(rect) {
  // We compute right and bottom before we change left and top below.
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);

  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);

  this.width = right - this.left;
  this.height = bottom - this.top;
};


/**
 * Returns a new rectangle which completely contains both input rectangles.
 * @param {goog.math.Rect} a A rectangle.
 * @param {goog.math.Rect} b A rectangle.
 * @return {goog.math.Rect} A new bounding rect, or null if either rect is
 *     null.
 */
goog.math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }

  var clone = a.clone();
  clone.boundingRect(b);

  return clone;
};

/**
 * Tests whether this rectangle entirely contains another rectangle or
 * coordinate.
 *
 * @param {goog.math.Rect|goog.math.Coordinate} another The rectangle or
 *     coordinate to test for containment.
 * @return {boolean} Whether this rectangle contains given rectangle or
 *     coordinate.
 */
goog.math.Rect.prototype.contains = function(another) {
  if (another instanceof goog.math.Rect) {
    return this.left <= another.left &&
           this.left + this.width >= another.left + another.width &&
           this.top <= another.top &&
           this.top + this.height >= another.top + another.height;
  } else { // (another instanceof goog.math.Coordinate)
    return another.x >= this.left &&
           another.x <= this.left + this.width &&
           another.y >= this.top &&
           another.y <= this.top + this.height;
  }
};


/**
 * Returns the size of this rectangle.
 * @return {!goog.math.Size} The size of this rectangle.
 */
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height);
};

// Input 24
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for element styles.
 *
*
*
*
*
 * @see ../demos/inline_block_quirks.html
 * @see ../demos/inline_block_standards.html
 * @see ../demos/style_viewport.html
 */

goog.provide('goog.style');


goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Rect');
goog.require('goog.math.Size');
goog.require('goog.object');
goog.require('goog.userAgent');


/**
 * Sets a style value on an element.
 *
 * This function is not indended to patch issues in the browser's style
 * handling, but to allow easy programmatic access to setting dash-separated
 * style properties.  An example is setting a batch of properties from a data
 * object without overwriting old styles.  When possible, use native APIs:
 * elem.style.propertyKey = 'value' or (if obliterating old styles is fine)
 * elem.style.cssText = 'property1: value1; property2: value2'.
 *
 * @param {Element} element The element to change.
 * @param {string|Object} style If a string, a style name. If an object, a hash
 *     of style names to style values.
 * @param {string|number|boolean=} opt_value If style was a string, then this
 *     should be the value.
 */
goog.style.setStyle = function(element, style, opt_value) {
  if (goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style);
  } else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element));
  }
};


/**
 * Sets a style value on an element, with parameters swapped to work with
 * {@code goog.object.forEach()}.
 * @param {Element} element The element to change.
 * @param {string|number|boolean|undefined} value Style value.
 * @param {string|number|boolean} style Style name.
 * @private
 */
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.style.toCamelCase(style)] = value;
};


/**
 * Retrieves an explicitly-set style value of a node. This returns '' if there
 * isn't a style attribute on the element or if this style property has not been
 * explicitly set in script.
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get, css-style (if you have a camel-case
 * property, use element.style[style]).
 * @return {string} Style value.
 */
goog.style.getStyle = function(element, style) {
  return element.style[goog.style.toCamelCase(style)];
};


/**
 * Retrieves a computed style value of a node, or null if the value cannot be
 * computed (which will be the case in Internet Explorer).
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (camel-case).
 * @return {?string} Style value.
 */
goog.style.getComputedStyle = function(element, style) {
  var doc = goog.dom.getOwnerDocument(element);
  if (doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, '');
    if (styles) {
      return styles[style];
    }
  }

  return null;
};


/**
 * Gets the cascaded style value of a node, or null if the value cannot be
 * computed (only Internet Explorer can do this).
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (camel-case).
 * @return {string} Style value.
 */
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null;
};


/**
 * Cross-browser pseudo get computed style. It returns the computed style where
 * available. If not available it tries the cascaded style value (IE
 * currentStyle) and in worst case the inline style value.  It shouldn't be
 * called directly, see http://wiki/Main/ComputedStyleVsCascadedStyle for
 * discussion.
 *
 * @param {Element} element Element to get style of.
 * @param {string} style Property to get (must be camelCase, not css-style.).
 * @return {string} Style value.
 * @private
 */
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) ||
         goog.style.getCascadedStyle(element, style) ||
         element.style[style];
};


/**
 * Retrieves the computed value of the position CSS attribute.
 * @param {Element} element The element to get the position of.
 * @return {string} Position value.
 */
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, 'position');
};


/**
 * Retrieves the computed background color string for a given element. The
 * string returned is suitable for assigning to another element's
 * background-color, but is not guaranteed to be in any particular string
 * format. Accessing the color in a numeric form may not be possible in all
 * browsers or with all input.
 *
 * If the background color for the element is defined as a hexadecimal value,
 * the resulting string can be parsed by goog.color.parse in all supported
 * browsers.
 *
 * Whether named colors like "red" or "lightblue" get translated into a
 * format which can be parsed is browser dependent. Calling this function on
 * transparent elements will return "transparent" in most browsers or
 * "rgba(0, 0, 0, 0)" in WebKit.
 * @param {Element} element The element to get the background color of.
 * @return {string} The computed string value of the background color.
 */
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, 'backgroundColor');
};


/**
 * Retrieves the computed value of the overflow-x CSS attribute.
 * @param {Element} element The element to get the overflow-x of.
 * @return {string} The computed string value of the overflow-x attribute.
 */
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, 'overflowX');
};


/**
 * Retrieves the computed value of the overflow-y CSS attribute.
 * @param {Element} element The element to get the overflow-y of.
 * @return {string} The computed string value of the overflow-y attribute.
 */
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, 'overflowY');
};


/**
 * Retrieves the computed value of the z-index CSS attribute.
 * @param {Element} element The element to get the z-index of.
 * @return {string|number} The computed value of the z-index attribute.
 */
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, 'zIndex');
};


/**
 * Retrieves the computed value of the text-align CSS attribute.
 * @param {Element} element The element to get the text-align of.
 * @return {string} The computed string value of the text-align attribute.
 */
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, 'textAlign');
};


/**
 * Retrieves the computed value of the cursor CSS attribute.
 * @param {Element} element The element to get the cursor of.
 * @return {string} The computed string value of the cursor attribute.
 */
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, 'cursor');
};


/**
 * Sets the top/left values of an element.  If no unit is specified in the
 * argument then it will add px.
 * @param {Element} el Element to move.
 * @param {string|number|goog.math.Coordinate} arg1 Left position or coordinate.
 * @param {string|number=} opt_arg2 Top position.
 */
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO &&
      (goog.userAgent.MAC || goog.userAgent.X11) &&
      goog.userAgent.isVersion('1.9');

  if (arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y;
  } else {
    x = arg1;
    y = opt_arg2;
  }

  // Round to the nearest pixel for buggy sub-pixel support.
  goog.style.setPixelStyleProperty_('left', buggyGeckoSubPixelPos, el,
                                    /** @type {number|string} */ (x));
  goog.style.setPixelStyleProperty_('top', buggyGeckoSubPixelPos, el,
                                    /** @type {number|string} */ (y));
};


/**
 * Gets the offsetLeft and offsetTop properties of an element and returns them
 * in a Coordinate object
 * @param {Element} element Element.
 * @return {!goog.math.Coordinate} The position.
 */
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop);
};


/**
 * Returns the viewport element for a particular document
 * @param {Node=} opt_node DOM node (Document is OK) to get the viewport element
 *     of.
 * @return {Element} document.documentElement or document.body.
 */
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if (opt_node) {
    if (opt_node.nodeType == goog.dom.NodeType.DOCUMENT) {
      doc = opt_node;
    } else {
      doc = goog.dom.getOwnerDocument(opt_node);
    }
  } else {
    doc = goog.dom.getDocument();
  }

  // In old IE versions the document.body represented the viewport
  if (goog.userAgent.IE && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body;
  }
  return doc.documentElement;
};


/**
 * Gets the client rectangle of the DOM element.
 *
 * getBoundingClientRect is part of a new CSS object model draft (with a
 * long-time presence in IE), replacing the error-prone parent offset
 * computation and the now-deprecated Gecko getBoxObjectFor.
 *
 * This utility patches common browser bugs in getClientBoundingRect. It
 * will fail if getClientBoundingRect is unsupported.
 *
 * If the element is not in the DOM, the result is undefined, and an error may
 * be thrown depending on user agent.
 *
 * @param {Element} el The element whose bounding rectangle is being queried.
 * @return {Object} A native bounding rectangle with numerical left, top,
 *     right, and bottom.  Reported by Firefox to be of object type ClientRect.
 * @private
 */
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  // Patch the result in IE only, so that this function can be inlined if
  // compiled for non-IE.
  if (goog.userAgent.IE) {

    // In IE, most of the time, 2 extra pixels are added to the top and left
    // due to the implicit 2-pixel inset border.  In IE6/7 quirks mode and
    // IE6 standards mode, this border can be overridden by setting the
    // document element's border to zero -- thus, we cannot rely on the
    // offset always being 2 pixels.

    // In quirks mode, the offset can be determined by querying the body's
    // clientLeft/clientTop, but in standards mode, it is found by querying
    // the document element's clientLeft/clientTop.  Since we already called
    // getClientBoundingRect we have already forced a reflow, so it is not
    // too expensive just to query them all.

    // See: http://msdn.microsoft.com/en-us/library/ms536433(VS.85).aspx
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop;
  }
  return /** @type {Object} */ (rect);
};


/**
 * Returns the first parent that could affect the position of a given element.
 * @param {Element} element The element to get the offset parent for.
 * @return {Element} The first offset parent or null if one cannot be found.
 */
goog.style.getOffsetParent = function(element) {
  // element.offsetParent does the right thing in IE, in other browser it
  // only includes elements with position absolute, relative or fixed, not
  // elements with overflow set to auto or scroll.
  if (goog.userAgent.IE) {
    return element.offsetParent;
  }

  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, 'position');
  var skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';
  for (var parent = element.parentNode; parent && parent != doc;
       parent = parent.parentNode) {
    positionStyle =
        goog.style.getStyle_(/** @type {!Element} */ (parent), 'position');
    skipStatic = skipStatic && positionStyle == 'static' &&
                 parent != doc.documentElement && parent != doc.body;
    if (!skipStatic && (parent.scrollWidth > parent.clientWidth ||
                        parent.scrollHeight > parent.clientHeight ||
                        positionStyle == 'fixed' ||
                        positionStyle == 'absolute')) {
      return /** @type {!Element} */ (parent);
    }
  }
  return null;
};


/**
 * Calculates and returns the visible rectangle for a given element. Returns a
 * box describing the visible portion of the nearest scrollable ancestor.
 * Coordinates are given relative to the document.
 *
 * @param {Element} element Element to get the visible rect for.
 * @return {goog.math.Box} Bounding elementBox describing the visible rect or
 *     null if scrollable ancestor isn't inside the visible viewport.
 */
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var scrollEl = dom.getDocumentScrollElement();
  var inContainer;

  // Determine the size of the visible rect by climbing the dom accounting for
  // all scrollable containers.
  for (var el = element; el = goog.style.getOffsetParent(el); ) {
    // clientWidth is zero for inline block elements in IE.
    // on WEBKIT, body element can have clientHeight = 0 and scrollHeight > 0
    if ((!goog.userAgent.IE || el.clientWidth != 0) &&
        (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) &&
        (el.scrollWidth != el.clientWidth ||
         el.scrollHeight != el.clientHeight) &&
        goog.style.getStyle_(el, 'overflow') != 'visible') {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;

      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right,
                                   pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom,
                                    pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
      inContainer = inContainer || el != scrollEl;
    }
  }

  // Compensate for document scroll in non webkit browsers.
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  if (goog.userAgent.WEBKIT) {
    visibleRect.left += scrollX;
    visibleRect.top += scrollY;
  } else {
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY);
  }
  if (!inContainer || goog.userAgent.WEBKIT) {
    visibleRect.right += scrollX;
    visibleRect.bottom += scrollY;
  }

  // Clip by the window's viewport.
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);

  return visibleRect.top >= 0 && visibleRect.left >= 0 &&
         visibleRect.bottom > visibleRect.top &&
         visibleRect.right > visibleRect.left ?
         visibleRect : null;
};


/**
 * Changes the scroll position of {@code container} with the minimum amount so
 * that the content and the borders of the given {@code element} become visible.
 * If the element is bigger than the container, its top left corner will be
 * aligned to the container's top left corner.
 *
 * @param {Element} element The element to make visible.
 * @param {Element} container The container to scroll.
 * @param {boolean=} opt_center Whether to center the element in the container.
 *     Defaults to false.
 */
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  // Absolute position of the element's border's top left corner.
  var elementPos = goog.style.getPageOffset(element);
  // Absolute position of the container's border's top left corner.
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  // Relative pos. of the element's border box to the container's content box.
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  // How much the element can move in the container, i.e. the difference between
  // the element's bottom-right-most and top-left-most position where it's
  // fully visible.
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;

  if (opt_center) {
    // All browsers round non-integer scroll positions down.
    container.scrollLeft += relX - spaceX / 2;
    container.scrollTop += relY - spaceY / 2;
  } else {
    // This formula was designed to give the correct scroll values in the
    // following cases:
    // - element is higher than container (spaceY < 0) => scroll down by relY
    // - element is not higher that container (spaceY >= 0):
    //   - it is above container (relY < 0) => scroll up by abs(relY)
    //   - it is below container (relY > spaceY) => scroll down by relY - spaceY
    //   - it is in the container => don't scroll
    container.scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    container.scrollTop += Math.min(relY, Math.max(relY - spaceY, 0));
  }
};


/**
 * Returns clientLeft (width of the left border and, if the directionality is
 * right to left, the vertical scrollbar) and clientTop as a coordinate object.
 *
 * @param {Element} el Element to get clientLeft for.
 * @return {!goog.math.Coordinate} Client left and top.
 */
goog.style.getClientLeftTop = function(el) {
  // NOTE(user): Gecko prior to 1.9 doesn't support clientTop/Left, see
  // https://bugzilla.mozilla.org/show_bug.cgi?id=111207
  if (goog.userAgent.GECKO && !goog.userAgent.isVersion('1.9')) {
    var left = parseFloat(goog.style.getComputedStyle(el, 'borderLeftWidth'));
    if (goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left -
          parseFloat(goog.style.getComputedStyle(el, 'borderRightWidth'));
      left += scrollbarWidth;
    }
    return new goog.math.Coordinate(left,
        parseFloat(goog.style.getComputedStyle(el, 'borderTopWidth')));
  }

  return new goog.math.Coordinate(el.clientLeft, el.clientTop);
};


/**
 * Returns a Coordinate object relative to the top-left of the HTML document.
 * Implemented as a single function to save having to do two recursive loops in
 * opera and safari just to get both coordinates.  If you just want one value do
 * use goog.style.getPageOffsetLeft() and goog.style.getPageOffsetTop(), but
 * note if you call both those methods the tree will be analysed twice.
 *
 * @param {Element} el Element to get the page offset for.
 * @return {!goog.math.Coordinate} The page offset.
 */
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, 'position');

  // NOTE(user): Gecko pre 1.9 normally use getBoxObjectFor to calculate the
  // position. When invoked for an element with position absolute and a negative
  // position though it can be off by one. Therefor the recursive implementation
  // is used in those (relatively rare) cases.
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor &&
      !el.getBoundingClientRect && positionStyle == 'absolute' &&
      (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);

  // NOTE(user): If element is hidden (display none or disconnected or any the
  // ancestors are hidden) we get (0,0) by default but we still do the
  // accumulation of scroll position.

  // TODO(user): Should we check if the node is disconnected and in that case
  //            return (0,0)?

  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if (el == viewportElement) {
    // viewport is always at 0,0 as that defined the coordinate system for this
    // function - this avoids special case checks in the code below
    return pos;
  }

  // IE and Gecko 1.9+.
  if (el.getBoundingClientRect) {
    box = goog.style.getBoundingClientRect_(el);
    // Must add the scroll coordinates in to get the absolute page offset
    // of element since getBoundingClientRect returns relative coordinates to
    // the viewport.
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y;

  // Gecko prior to 1.9.
  } else if (doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
    // Gecko ignores the scroll values for ancestors, up to 1.9.  See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=328881 and
    // https://bugzilla.mozilla.org/show_bug.cgi?id=330619

    box = doc.getBoxObjectFor(el);
    // TODO(user): Fix the off-by-one error when window is scrolled down
    // or right more than 1 pixel. The viewport offset does not move in lock
    // step with the window scroll; it moves in increments of 2px and at
    // somewhat random intervals.
    var vpBox = doc.getBoxObjectFor(viewportElement);
    pos.x = box.screenX - vpBox.screenX;
    pos.y = box.screenY - vpBox.screenY;

  // Safari, Opera and Camino up to 1.0.4.
  } else {
    var parent = el;
    do {
      pos.x += parent.offsetLeft;
      pos.y += parent.offsetTop;
      // For safari/chrome, we need to add parent's clientLeft/Top as well.
      if (parent != el) {
        pos.x += parent.clientLeft || 0;
        pos.y += parent.clientTop || 0;
      }
      // In Safari when hit a position fixed element the rest of the offsets
      // are not correct.
      if (goog.userAgent.WEBKIT &&
          goog.style.getComputedPosition(parent) == 'fixed') {
        pos.x += doc.body.scrollLeft;
        pos.y += doc.body.scrollTop;
        break;
      }
      parent = parent.offsetParent;
    } while (parent && parent != el)

    // Opera & (safari absolute) incorrectly account for body offsetTop.
    if (goog.userAgent.OPERA || (goog.userAgent.WEBKIT &&
        positionStyle == 'absolute')) {
      pos.y -= doc.body.offsetTop;
    }

    for (parent = el; (parent = goog.style.getOffsetParent(parent)) &&
        parent != doc.body && parent != viewportElement; ) {
      pos.x -= parent.scrollLeft;
      // Workaround for a bug in Opera 9.2 (and earlier) where table rows may
      // report an invalid scroll top value. The bug was fixed in Opera 9.5
      // however as that version supports getBoundingClientRect it won't
      // trigger this code path. https://bugs.opera.com/show_bug.cgi?id=249965
      if (!goog.userAgent.OPERA || parent.tagName != 'TR') {
        pos.y -= parent.scrollTop;
      }
    }
  }

  return pos;
};


/**
 * Returns the left coordinate of an element relative to the HTML document
 * @param {Element} el Elements.
 * @return {number} The left coordinate.
 */
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x;
};


/**
 * Returns the top coordinate of an element relative to the HTML document
 * @param {Element} el Elements.
 * @return {number} The top coordinate.
 */
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y;
};


/**
 * Returns a Coordinate object relative to the top-left of an HTML document
 * in an ancestor frame of this element. Used for measuring the position of
 * an element inside a frame relative to a containing frame.
 *
 * @param {Element} el Element to get the page offset for.
 * @param {Window} relativeWin The window to measure relative to. If relativeWin
 *     is not in the ancestor frame chain of the element, we measure relative to
 *     the top-most window.
 * @return {!goog.math.Coordinate} The page offset.
 */
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);

  // Iterate up the ancestor frame chain, keeping track of the current window
  // and the current element in that window.
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    // if we're at the top window, we want to get the page offset.
    // if we're at an inner frame, we only want to get the window position
    // so that we can determine the actual page offset in the context of
    // the outer window.
    var offset = currentWin == relativeWin ?
        goog.style.getPageOffset(currentEl) :
        goog.style.getClientPosition(currentEl);

    position.x += offset.x;
    position.y += offset.y;
  } while (currentWin && currentWin != relativeWin &&
      (currentEl = currentWin.frameElement) &&
      (currentWin = currentWin.parent));

  return position;
};


/**
 * Translates the specified rect relative to origBase page, for newBase page.
 * If origBase and newBase are the same, this function does nothing.
 *
 * @param {goog.math.Rect} rect The source rectangle relative to origBase page,
 *     and it will have the translated result.
 * @param {goog.dom.DomHelper} origBase The DomHelper for the input rectangle.
 * @param {goog.dom.DomHelper} newBase The DomHelper for the resultant
 *     coordinate.  This must be a DOM for an ancestor frame of origBase
 *     or the same as origBase.
 */
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if (origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());

    // Adjust Body's margin.
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));

    if (goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll());
    }

    rect.left += pos.x;
    rect.top += pos.y;
  }
};


/**
 * Returns the position of an element relative to another element in the
 * document.  A relative to B
 * @param {Element|Event|goog.events.Event} a Element or mouse event whose
 *     position we're calculating.
 * @param {Element|Event|goog.events.Event} b Element or mouse event position
 *     is relative to.
 * @return {!goog.math.Coordinate} The relative position.
 */
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y);
};


/**
 * Returns the position relative to the client viewport.
 * @param {Element|Event|goog.events.Event} el Element or a mouse event object.
 * @return {!goog.math.Coordinate} The position.
 */
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if (el.nodeType == goog.dom.NodeType.ELEMENT) {
    if (el.getBoundingClientRect) {  // IE and Gecko 1.9+
      var box = goog.style.getBoundingClientRect_(/** @type {Element} */ (el));
      pos.x = box.left;
      pos.y = box.top;
    } else {
      var scrollCoord = goog.dom.getDomHelper(/** @type {Element} */ (el))
          .getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(/** @type {Element} */ (el));
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y;
    }
  } else {
    pos.x = el.clientX;
    pos.y = el.clientY;
  }

  return pos;
};


/**
 * Sets the top and left of an element such that it will have a
 *
 * @param {Element} el The element to set page offset for.
 * @param {number|goog.math.Coordinate} x Left position or coordinate obj.
 * @param {number=} opt_y Top position.
 */
goog.style.setPageOffset = function(el, x, opt_y) {
  // Get current pageoffset
  var cur = goog.style.getPageOffset(el);

  if (x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x;
  }

  // NOTE(user): We cannot allow strings for x and y. We could but that would
  // require us to manually transform between different units

  // Work out deltas
  var dx = x - cur.x;
  var dy = opt_y - cur.y;

  // Set position to current left/top + delta
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy);
};


/**
 * Sets the width/height values of an element.  If an argument is numeric,
 * or a goog.math.Size is passed, it is assumed to be pixels and will add
 * 'px' after converting it to an integer in string form. (This just sets the
 * CSS width and height properties so it might set content-box or border-box
 * size depending on the box model the browser is using.)
 *
 * @param {Element} element Element to set the size of.
 * @param {string|number|goog.math.Size} w Width of the element, or a
 *     size object.
 * @param {string|number=} opt_h Height of the element. Required if w is not a
 *     size object.
 */
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if (w instanceof goog.math.Size) {
    h = w.height;
    w = w.width;
  } else {
    if (opt_h == undefined) {
      throw Error('missing height argument');
    }
    h = opt_h;
  }

  goog.style.setWidth(element, /** @type {string|number} */ (w));
  goog.style.setHeight(element, /** @type {string|number} */ (h));
};


/**
 * Helper function to sets a dimension or position style property of an element.
 * Parameter order is to allow the first two parameters to be bound.
 *
 * @param {string} property Property name of style to modify ('width', 'height',
 *     'left', 'top', etc).
 * @param {boolean} round Whether to round the nearest integer (if property
 *     is a number).
 * @param {Element} element Element to set the size of.
 * @param {string|number} value The value to set.  If a number, 'px' will be
 *     appended, otherwise the value will be applied directly.
 * @private
 */
goog.style.setPixelStyleProperty_ = function(property, round, element, value) {
  if (typeof value == 'number') {
    value = (round ? Math.round(value) : value) + 'px';
  }

  element.style[property] = /** @type {string} */(value);
};


/**
 * Set the height of an element.  Sets the element's style property.
 * @param {Element} element Element to set the height of.
 * @param {string|number} height The height value to set.  If a number, 'px'
 *     will be appended, otherwise the value will be applied directly.
 */
goog.style.setHeight = goog.partial(
    goog.style.setPixelStyleProperty_, 'height', true);


/**
 * Set the width of an element.  Sets the element's style property.
 * @param {Element} element Element to set the height of.
 * @param {string|number} height The height value to set.  If a number, 'px'
 *     will be appended, otherwise the value will be applied directly.
 */
goog.style.setWidth = goog.partial(
    goog.style.setPixelStyleProperty_, 'width', true);


/**
 * Gets the height and width of an element, even if its display is none.
 * Specifically, this returns the height and width of the border box,
 * irrespective of the box model in effect.
 * @param {Element} element Element to get width of.
 * @return {!goog.math.Size} Object with width/height properties.
 */
goog.style.getSize = function(element) {
  var hasOperaBug = goog.userAgent.OPERA && !goog.userAgent.isVersion('10');
  if (goog.style.getStyle_(element, 'display') != 'none') {
    if (hasOperaBug) {
      return new goog.math.Size(element.offsetWidth || element.clientWidth,
                                element.offsetHeight || element.clientHeight);
    } else {
      return new goog.math.Size(element.offsetWidth, element.offsetHeight);
    }
  }

  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;

  style.visibility = 'hidden';
  style.position = 'absolute';
  style.display = 'inline';

  var originalWidth, originalHeight;
  if (hasOperaBug) {
    originalWidth = element.offsetWidth || element.clientWidth;
    originalHeight = element.offsetHeight || element.clientHeight;
  } else {
    originalWidth = element.offsetWidth;
    originalHeight = element.offsetHeight;
  }

  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;

  return new goog.math.Size(originalWidth, originalHeight);
};


/**
 * Returns a bounding rectangle for a given element in page space.
 * @param {Element} element Element to get bounds of.
 * @return {!goog.math.Rect} Bounding rectangle for the element.
 */
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height);
};


/**
 * A memoized cache for goog.style.toCamelCase.
 * @type {Object}
 * @private
 */
goog.style.toCamelCaseCache_ = {};


/**
 * Converts a CSS selector in the form style-property to styleProperty
 * @param {*} selector CSS Selector.
 * @return {string} Camel case selector.
 */
goog.style.toCamelCase = function(selector) {
  return goog.style.toCamelCaseCache_[selector] ||
    (goog.style.toCamelCaseCache_[selector] =
        String(selector).replace(/\-([a-z])/g, function(all, match) {
          return match.toUpperCase();
        }));
};


/**
 * A memoized cache for goog.style.toSelectorCase.
 * @type {Object.<string>}
 * @private
 */
goog.style.toSelectorCaseCache_ = {};


/**
 * Converts a CSS selector in the form styleProperty to style-property.
 * @param {string} selector Camel case selector.
 * @return {string} Selector cased.
 */
goog.style.toSelectorCase = function(selector) {
  return goog.style.toSelectorCaseCache_[selector] ||
      (goog.style.toSelectorCaseCache_[selector] =
          selector.replace(/([A-Z])/g, '-$1').toLowerCase());
};


/**
 * Gets the opacity of a node (x-browser). This gets the inline style opacity
 * of the node, and does not take into account the cascaded or the computed
 * style for this node.
 * @param {Element} el Element whose opacity has to be found.
 * @return {number|string} Opacity between 0 and 1 or an empty string {@code ''}
 *     if the opacity is not set.
 */
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = '';
  if ('opacity' in style) {
    result = style.opacity;
  } else if ('MozOpacity' in style) {
    result = style.MozOpacity;
  } else if ('filter' in style) {
    var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
    if (match) {
      result = String(match[1] / 100);
    }
  }
  return result == '' ? result : Number(result);
};


/**
 * Sets the opacity of a node (x-browser).
 * @param {Element} el Elements whose opacity has to be set.
 * @param {number|string} alpha Opacity between 0 and 1 or an empty string
 *     {@code ''} to clear the opacity.
 */
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if ('opacity' in style) {
    style.opacity = alpha;
  } else if ('MozOpacity' in style) {
    style.MozOpacity = alpha;
  } else if ('filter' in style) {
    // TODO(user): Overwriting the filter might have undesired side effects.
    if (alpha === '') {
      style.filter = '';
    } else {
      style.filter = 'alpha(opacity=' + alpha * 100 + ')';
    }
  }
};


/**
 * Sets the background of an element to a transparent image in a browser-
 * independent manner.
 *
 * This function does not support repeating backgrounds or alternate background
 * positions to match the behavior of Internet Explorer. It also does not
 * support sizingMethods other than crop since they cannot be replicated in
 * browsers other than Internet Explorer.
 *
 * @param {Element} el The element to set background on.
 * @param {string} src The image source URL.
 */
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  // It is safe to use the style.filter in IE only. In Safari 'filter' is in
  // style object but access to style.filter causes it to throw an exception.
  // Note: IE8 supports images with an alpha channel.
  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    // See TODO in setOpacity.
    style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(' +
        'src="' + src + '", sizingMethod="crop")';
  } else {
    // Set style properties individually instead of using background shorthand
    // to prevent overwriting a pre-existing background color.
    style.backgroundImage = 'url(' + src + ')';
    style.backgroundPosition = 'top left';
    style.backgroundRepeat = 'no-repeat';
  }
};


/**
 * Clears the background image of an element in a browser independent manner.
 * @param {Element} el The element to clear background image for.
 */
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if ('filter' in style) {
    // See TODO in setOpacity.
    style.filter = '';
  } else {
    // Set style properties individually instead of using background shorthand
    // to prevent overwriting a pre-existing background color.
    style.backgroundImage = 'none';
  }
};


/**
 * Shows or hides an element from the page. Hiding the element is done by
 * setting the display property to "none", removing the element from the
 * rendering hierarchy so it takes up no space. To show the element, the default
 * inherited display property is restored (defined either in stylesheets or by
 * the browser's default style rules.)
 *
 * Caveat 1: if the inherited display property for the element is set to "none"
 * by the stylesheets, that is the property that will be restored by a call to
 * showElement(), effectively toggling the display between "none" and "none".
 *
 * Caveat 2: if the element display style is set inline (by setting either
 * element.style.display or a style attribute in the HTML), a call to
 * showElement will clear that setting and defer to the inherited style in the
 * stylesheet.
 * @param {Element} el Element to show or hide.
 * @param {*} display True to render the element in its default style,
 * false to disable rendering the element.
 */
goog.style.showElement = function(el, display) {
  el.style.display = display ? '' : 'none';
};


/**
 * Test whether the given element has been shown or hidden via a call to
 * {@link #showElement}.
 *
 * Note this is strictly a companion method for a call
 * to {@link #showElement} and the same caveats apply; in particular, this
 * method does not guarantee that the return value will be consistent with
 * whether or not the element is actually visible.
 *
 * @param {Element} el The element to test.
 * @return {boolean} Whether the element has been shown.
 * @see #showElement
 */
goog.style.isElementShown = function(el) {
  return el.style.display != 'none';
};


/**
 * Installs the styles string into the window that contains opt_element.  If
 * opt_element is null, the main window is used.
 * @param {string} stylesString The style string to install.
 * @param {Node=} opt_node Node whose parent document should have the
 *     styles installed.
 * @return {Element|StyleSheet} The style element created.
 */
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;

  if (goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString);
  } else {
    var head = dh.getElementsByTagNameAndClass('head')[0];

    // In opera documents are not guaranteed to have a head element, thus we
    // have to make sure one exists before using it.
    if (!head) {
      var body = dh.getElementsByTagNameAndClass('body')[0];
      head = dh.createDom('head');
      body.parentNode.insertBefore(head, body);
    }
    styleSheet = dh.createDom('style');
    // NOTE(user): Setting styles after the style element has been appended
    // to the head results in a nasty Webkit bug in certain scenarios. Please
    // refer to https://bugs.webkit.org/show_bug.cgi?id=26307 for additional
    // details.
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet);
  }
  return styleSheet;
};


/**
 * Removes the styles added by {@link #installStyles}.
 * @param {Element|StyleSheet} styleSheet The value returned by
 *     {@link #installStyles}.
 */
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement ||
      /** @type {Element} */ (styleSheet);
  goog.dom.removeNode(node);
};


/**
 * Sets the content of a style element.  The style element can be any valid
 * style element.  This element will have its content completely replaced by
 * the new stylesString.
 * @param {Element|StyleSheet} element A stylesheet element as returned by
 *     installStyles.
 * @param {string} stylesString The new content of the stylesheet.
 */
goog.style.setStyles = function(element, stylesString) {
  if (goog.userAgent.IE) {
    // Adding the selectors individually caused the browser to hang if the
    // selector was invalid or there were CSS comments.  Setting the cssText of
    // the style node works fine and ignores CSS that IE doesn't understand
    element.cssText = stylesString;
  } else {
    var propToSet = goog.userAgent.WEBKIT ? 'innerText' : 'innerHTML';
    element[propToSet] = stylesString;
  }
};


/**
 * Sets 'white-space: pre-wrap' for a node (x-browser).
 *
 * There are as many ways of specifying pre-wrap as there are browsers.
 *
 * CSS3/IE8: white-space: pre-wrap;
 * Mozilla:  white-space: -moz-pre-wrap;
 * Opera:    white-space: -o-pre-wrap;
 * IE6/7:    white-space: pre; word-wrap: break-word;
 *
 * @param {Element} el Element to enable pre-wrap for.
 */
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    style.whiteSpace = 'pre';
    style.wordWrap = 'break-word';
  } else if (goog.userAgent.GECKO) {
    style.whiteSpace = '-moz-pre-wrap';
  } else if (goog.userAgent.OPERA) {
    style.whiteSpace = '-o-pre-wrap';
  } else {
    style.whiteSpace = 'pre-wrap';
  }
};


/**
 * Sets 'display: inline-block' for an element (cross-browser).
 * @param {Element} el Element to which the inline-block display style is to be
 *    applied.
 * @see ../demos/inline_block_quirks.html
 * @see ../demos/inline_block_standards.html
 */
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  // Without position:relative, weirdness ensues.  Just accept it and move on.
  style.position = 'relative';

  if (goog.userAgent.IE && !goog.userAgent.isVersion('8')) {
    // IE8 supports inline-block so fall through to the else
    // Zoom:1 forces hasLayout, display:inline gives inline behavior.
    style.zoom = '1';
    style.display = 'inline';
  } else if (goog.userAgent.GECKO) {
    // Pre-Firefox 3, Gecko doesn't support inline-block, but -moz-inline-box
    // is close enough.
    style.display = goog.userAgent.isVersion('1.9a') ? 'inline-block' :
        '-moz-inline-box';
  } else {
    // Opera, Webkit, and Safari seem to do OK with the standard inline-block
    // style.
    style.display = 'inline-block';
  }
};


/**
 * Returns true if the element is using right to left (rtl) direction.
 * @param {Element} el  The element to test.
 * @return {boolean} True for right to left, false for left to right.
 */
goog.style.isRightToLeft = function(el) {
  return 'rtl' == goog.style.getStyle_(el, 'direction');
};


/**
 * The CSS style property corresponding to an element being
 * unselectable on the current browser platform (null if none).
 * Opera and IE instead use a DOM attribute 'unselectable'.
 * @type {?string}
 * @private
 */
goog.style.unselectableStyle_ =
    goog.userAgent.GECKO ? 'MozUserSelect' :
    goog.userAgent.WEBKIT ? 'WebkitUserSelect' :
    null;


/**
 * Returns true if the element is set to be unselectable, false otherwise.
 * Note that on some platforms (e.g. Mozilla), even if an element isn't set
 * to be unselectable, it will behave as such if any of its ancestors is
 * unselectable.
 * @param {Element} el  Element to check.
 * @return {boolean}  Whether the element is set to be unselectable.
 */
goog.style.isUnselectable = function(el) {
  if (goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == 'none';
  } else if (goog.userAgent.IE || goog.userAgent.OPERA) {
    return el.getAttribute('unselectable') == 'on';
  }
  return false;
};


/**
 * Makes the element and its descendants selectable or unselectable.  Note
 * that on some platforms (e.g. Mozilla), even if an element isn't set to
 * be unselectable, it will behave as such if any of its ancestors is
 * unselectable.
 * @param {Element} el  The element to alter.
 * @param {boolean} unselectable  Whether the element and its descendants
 *     should be made unselectable.
 * @param {boolean=} opt_noRecurse  Whether to only alter the element's own
 *     selectable state, and leave its descendants alone; defaults to false.
 */
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  // TODO(user): Do we need all of TR_DomUtil.makeUnselectable() in Closure?
  var descendants = !opt_noRecurse ? el.getElementsByTagName('*') : null;
  var name = goog.style.unselectableStyle_;
  if (name) {
    // Add/remove the appropriate CSS style to/from the element and its
    // descendants.
    var value = unselectable ? 'none' : '';
    el.style[name] = value;
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.style[name] = value;
      }
    }
  } else if (goog.userAgent.IE || goog.userAgent.OPERA) {
    // Toggle the 'unselectable' attribute on the element and its descendants.
    var value = unselectable ? 'on' : '';
    el.setAttribute('unselectable', value);
    if (descendants) {
      for (var i = 0, descendant; descendant = descendants[i]; i++) {
        descendant.setAttribute('unselectable', value);
      }
    }
  }
};


/**
 * Gets the border box size for an element.
 * @param {Element} element  The element to get the size for.
 * @return {!goog.math.Size} The border box size.
 */
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight);
};


/**
 * Sets the border box size of an element. This is potentially expensive in IE
 * if the document is CSS1Compat mode
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size.
 */
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();

  if (goog.userAgent.IE &&
      (!isCss1CompatMode || !goog.userAgent.isVersion('8'))) {
    var style = element.style;
    if (isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left -
                         paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top -
                          paddingBox.bottom - borderBox.bottom;
    } else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, 'border-box');
  }
};


/**
 * Gets the content box size for an element.  This is potentially expensive in
 * all browsers.
 * @param {Element} element  The element to get the size for.
 * @return {!goog.math.Size} The content box size.
 */
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if (ieCurrentStyle &&
      goog.dom.getDomHelper(doc).isCss1CompatMode() &&
      ieCurrentStyle.width != 'auto' && ieCurrentStyle.height != 'auto' &&
      !ieCurrentStyle.boxSizing) {
    // If IE in CSS1Compat mode than just use the width and height.
    // If we have a boxSizing then fall back on measuring the borders etc.
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width,
                                            'width', 'pixelWidth');
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height,
                                             'height', 'pixelHeight');
    return new goog.math.Size(width, height);
  } else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width -
                              borderBox.left - paddingBox.left -
                              paddingBox.right - borderBox.right,
                              borderBoxSize.height -
                              borderBox.top - paddingBox.top -
                              paddingBox.bottom - borderBox.bottom);
  }
};


/**
 * Sets the content box size of an element. This is potentially expensive in IE
 * if the document is BackCompat mode.
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size.
 */
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (goog.userAgent.IE &&
      (!isCss1CompatMode || !goog.userAgent.isVersion('8'))) {
    var style = element.style;
    if (isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    } else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left +
                         paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top +
                          paddingBox.bottom + borderBox.bottom;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, 'content-box');
  }
};


/**
 * Helper function that sets the box sizing as well as the width and height
 * @param {Element} element  The element to set the size on.
 * @param {goog.math.Size} size  The new size to set.
 * @param {string} boxSizing  The box-sizing value.
 * @private
 */
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if (goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing;
  } else if (goog.userAgent.WEBKIT) {
    style.WebkitBoxSizing = boxSizing;
  } else if (goog.userAgent.OPERA && !goog.userAgent.isVersion('9.50')) {
    // Opera pre-9.5 does not have CSSStyleDeclaration::boxSizing, but
    // box-sizing can still be set via CSSStyleDeclaration::setProperty.
    if (boxSizing) {
      style.setProperty('box-sizing', boxSizing);
    } else {
      style.removeProperty('box-sizing');
    }
  } else {
    // Includes IE8
    style.boxSizing = boxSizing;
  }
  style.width = size.width + 'px';
  style.height = size.height + 'px';
};


/**
 * IE specific function that converts a non pixel unit to pixels.
 * @param {Element} element  The element to convert the value for.
 * @param {string} value  The current value as a string. The value must not be
 *     ''.
 * @param {string} name  The CSS property name to use for the converstion. This
 *     should be 'left', 'top', 'width' or 'height'.
 * @param {string} pixelName  The CSS pixel property name to use to get the
 *     value in pixels.
 * @return {number} The value in pixels.
 * @private
 */
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  // Try if we already have a pixel value. IE does not do half pixels so we
  // only check if it matches a number followed by 'px'.
  if (/^\d+px?$/.test(value)) {
    return parseInt(value, 10);
  } else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    // set runtime style to prevent changes
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    // restore
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue;
  }
};


/**
 * Helper function for getting the pixel padding or margin for IE.
 * @param {Element} element  The element to get the padding for.
 * @param {string} propName  The property name.
 * @return {number} The pixel padding.
 * @private
 */
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element,
      goog.style.getCascadedStyle(element, propName),
      'left', 'pixelLeft');
};


/**
 * Gets the computed paddings or margins (on all sides) in pixels.
 * @param {Element} element  The element to get the padding for.
 * @param {string} stylePrefix  Pass 'padding' to retrieve the padding box,
 *     or 'margin' to retrieve the margin box.
 * @return {!goog.math.Box} The computed paddings or margins.
 * @private
 */
goog.style.getBox_ = function(element, stylePrefix) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + 'Left');
    var right = goog.style.getIePixelDistance_(element, stylePrefix + 'Right');
    var top = goog.style.getIePixelDistance_(element, stylePrefix + 'Top');
    var bottom = goog.style.getIePixelDistance_(
        element, stylePrefix + 'Bottom');
    return new goog.math.Box(top, right, bottom, left);
  } else {
    // On non-IE browsers, getComputedStyle is always non-null.
    var left = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Left'));
    var right = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Right'));
    var top = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Top'));
    var bottom = /** @type {string} */ (
        goog.style.getComputedStyle(element, stylePrefix + 'Bottom'));

    // NOTE(user): Gecko can return floating point numbers for the computed
    // style values.
    return new goog.math.Box(parseFloat(top),
                             parseFloat(right),
                             parseFloat(bottom),
                             parseFloat(left));
  }
};


/**
 * Gets the computed paddings (on all sides) in pixels.
 * @param {Element} element  The element to get the padding for.
 * @return {!goog.math.Box} The computed paddings.
 */
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, 'padding');
};


/**
 * Gets the computed margins (on all sides) in pixels.
 * @param {Element} element  The element to get the margins for.
 * @return {!goog.math.Box} The computed margins.
 */
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, 'margin');
};


/**
 * A map used to map the border width keywords to a pixel width.
 * @type {Object}
 * @private
 */
goog.style.ieBorderWidthKeywords_ = {
  'thin': 2,
  'medium': 4,
  'thick': 6
};


/**
 * Helper function for IE to get the pixel border.
 * @param {Element} element  The element to get the pixel border for.
 * @param {string} prop  The part of the property name.
 * @return {number} The value in pixels.
 * @private
 */
goog.style.getIePixelBorder_ = function(element, prop) {
  if (goog.style.getCascadedStyle(element, prop + 'Style') == 'none') {
    return 0;
  }
  var width = goog.style.getCascadedStyle(element, prop + 'Width');
  if (width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width];
  }
  return goog.style.getIePixelValue_(element, width, 'left', 'pixelLeft');
};


/**
 * Gets the computed border widths (on all sides) in pixels
 * @param {Element} element  The element to get the border widths for.
 * @return {!goog.math.Box} The computed border widths.
 */
goog.style.getBorderBox = function(element) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, 'borderLeft');
    var right = goog.style.getIePixelBorder_(element, 'borderRight');
    var top = goog.style.getIePixelBorder_(element, 'borderTop');
    var bottom = goog.style.getIePixelBorder_(element, 'borderBottom');
    return new goog.math.Box(top, right, bottom, left);
  } else {
    // On non-IE browsers, getComputedStyle is always non-null.
    var left = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderLeftWidth'));
    var right = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderRightWidth'));
    var top = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderTopWidth'));
    var bottom = /** @type {string} */ (
        goog.style.getComputedStyle(element, 'borderBottomWidth'));

    return new goog.math.Box(parseFloat(top),
                             parseFloat(right),
                             parseFloat(bottom),
                             parseFloat(left));
  }
};


/**
 * Returns the font face applied to a given node. Opera and IE should return
 * the font actually displayed. Firefox returns the author's most-preferred
 * font (whether the browser is capable of displaying it or not.)
 * @param {Element} el  The element whose font family is returned.
 * @return {string} The font family applied to el.
 */
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = '';
  if (doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    font = range.queryCommandValue('FontName');
  }
  if (!font) {
    // Note if for some reason IE can't derive FontName with a TextRange, we
    // fallback to using currentStyle
    font = goog.style.getStyle_(el, 'fontFamily');
    // Opera on Linux provides the font vendor's name in square-brackets.
    if (goog.userAgent.OPERA && goog.userAgent.LINUX) {
      font = font.replace(/ \[[^\]]*\]/, '');
    }
  }

  // Firefox returns the applied font-family string (author's list of
  // preferred fonts.) We want to return the most-preferred font, in lieu of
  // the *actually* applied font.
  var fontsArray = font.split(',');
  if (fontsArray.length > 1) font = fontsArray[0];

  // Sanitize for x-browser consistency:
  // Strip quotes because browsers aren't consistent with how they're
  // applied; Opera always encloses, Firefox sometimes, and IE never.
  return goog.string.stripQuotes(font, '"\'');
};


/**
 * Regular expression used for getLengthUnits.
 * @type {RegExp}
 * @private
 */
goog.style.lengthUnitRegex_ = /[^\d]+$/;


/**
 * Returns the units used for a CSS length measurement.
 * @param {string} value  A CSS length quantity.
 * @return {?string} The units of measurement.
 */
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null;
};


/**
 * Map of absolute CSS length units
 * @type {Object}
 * @private
 */
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {
  'cm' : 1,
  'in' : 1,
  'mm' : 1,
  'pc' : 1,
  'pt' : 1
};


/**
 * Map of relative CSS length units that can be accurately converted to px
 * font-size values using getIePixelValue_. Only units that are defined in
 * relation to a font size are convertible (%, small, etc. are not).
 * @type {Object}
 * @private
 */
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {
  'em' : 1,
  'ex' : 1
};


/**
 * Returns the font size, in pixels, of text in an element.
 * @param {Element} el  The element whose font size is returned.
 * @return {number} The font size (in pixels).
 */
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, 'fontSize');
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if (fontSize && 'px' == sizeUnits) {
    // NOTE(user): This could be parseFloat instead, but IE doesn't return
    // decimal fractions in getStyle_ and Firefox reports the fractions, but
    // ignores them when rendering. Interestingly enough, when we force the
    // issue and size something to e.g., 50% of 25px, the browsers round in
    // opposite directions with Firefox reporting 12px and IE 13px. I punt.
    return parseInt(fontSize, 10);
  }

  // In IE, we can convert absolute length units to a px value using
  // goog.style.getIePixelValue_. Units defined in relation to a font size
  // (em, ex) are applied relative to the element's parentNode and can also
  // be converted.
  if (goog.userAgent.IE) {
    if (sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el,
                                         fontSize,
                                         'left',
                                         'pixelLeft');
    } else if (el.parentNode &&
               el.parentNode.nodeType == goog.dom.NodeType.ELEMENT &&
               sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
      // Check the parent size - if it is the same it means the relative size
      // value is inherited and we therefore don't want to count it twice.  If
      // it is different, this element either has explicit style or has a CSS
      // rule applying to it.
      var parentElement = /** @type {Element} */ (el.parentNode);
      var parentSize = goog.style.getStyle_(parentElement, 'fontSize');
      return goog.style.getIePixelValue_(parentElement,
                                         fontSize == parentSize ?
                                             '1em' : fontSize,
                                         'left',
                                         'pixelLeft');
    }
  }

  // Sometimes we can't cleanly find the font size (some units relative to a
  // node's parent's font size are difficult: %, smaller et al), so we create
  // an invisible, absolutely-positioned span sized to be the height of an 'M'
  // rendered in its parent's (i.e., our target element's) font size. This is
  // the definition of CSS's font size attribute.
  var sizeElement = goog.dom.createDom(
      'span',
      {'style': 'visibility:hidden;position:absolute;' +
                'line-height:0;padding:0;margin:0;border:0;height:1em;'});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);

  return fontSize;
};


/**
 * Parses a style attribute value.  Converts CSS property names to camel case.
 * @param {string} value The style attribute value.
 * @return {!Object} Map of CSS properties to string values.
 */
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if (keyValue.length == 2) {
      result[goog.style.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1];
    }
  });
  return result;
};


/**
 * Reverse of parseStyleAttribute; that is, takes a style object and returns the
 * corresponding attribute value.  Converts camel case property names to proper
 * CSS selector names.
 * @param {Object} obj Map of CSS properties to values.
 * @return {string} The style attribute value.
 */
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.style.toSelectorCase(key), ':', value, ';');
  });
  return buffer.join('');
};


/**
 * Sets CSS float property on an element.
 * @param {Element} el The element to set float property on.
 * @param {string} value The value of float CSS property to set on this element.
 */
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? 'styleFloat' : 'cssFloat'] = value;
};


/**
 * Gets value of explicitly-set float CSS property on an element.
 * @param {Element} el The element to get float property of.
 * @return {string} The value of explicitly-set float CSS property on this
 *     element.
 */
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? 'styleFloat' : 'cssFloat'] || '';
};


/**
 * Returns the scroll bar width (represents the width of both horizontal
 * and vertical scroll).
 *
 * @return {number} The scroll bar width in px.
 */
goog.style.getScrollbarWidth = function() {
  // Add a div outside of the viewport.
  var mockElement = goog.dom.createElement('div');
  mockElement.style.cssText = 'visibility:hidden;overflow:scroll;' +
      'position:absolute;top:0;width:100px;height:100px';
  goog.dom.appendChild(goog.dom.getDocument().body, mockElement);
  var width = mockElement.offsetWidth - mockElement.clientWidth;
  goog.dom.removeNode(mockElement);
  return width;
};

// Input 25
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Simple logger that logs a Div Element.
 *
*
 */

goog.provide('goog.debug.DivConsole');

goog.require('goog.debug.HtmlFormatter');
goog.require('goog.debug.LogManager');
goog.require('goog.style');


/**
 * A class for visualising logger calls in a div element.
 * @param {Element} element The element to append to.
 * @constructor
 */
goog.debug.DivConsole = function(element) {
  this.publishHandler_ = goog.bind(this.addLogRecord, this);
  this.formatter_ = new goog.debug.HtmlFormatter();
  this.formatter_.showAbsoluteTime = false;
  this.isCapturing_ = false;
  this.element_ = element;
  this.elementOwnerDocument_ =
      this.element_.ownerDocument || this.element_.document;

  this.installStyles();
};


/**
 * Installs styles for the log messages and its div
 */
goog.debug.DivConsole.prototype.installStyles = function() {
  goog.style.installStyles(
      '.dbg-sev{color:#F00}' +
      '.dbg-w{color:#C40}' +
      '.dbg-sh{font-weight:bold;color:#000}' +
      '.dbg-i{color:#444}' +
      '.dbg-f{color:#999}' +
      '.dbg-ev{color:#0A0}' +
      '.dbg-m{color:#990}' +
      '.logmsg{border-bottom:1px solid #CCC;padding:2px}' +
      '.logsep{background-color: #8C8;}' +
      '.logdiv{border:1px solid #CCC;background-color:#FCFCFC;' +
      'font:medium monospace}',
      this.element_);
  this.element_.className += ' logdiv';
};


/**
 * Sets whether we are currently capturing logger output.
 * @param {boolean} capturing Whether to capture logger output.
 */
goog.debug.DivConsole.prototype.setCapturing = function(capturing) {
  if (capturing == this.isCapturing_) {
    return;
  }

  // attach or detach handler from the root logger
  var rootLogger = goog.debug.LogManager.getRoot();
  if (capturing) {
    rootLogger.addHandler(this.publishHandler_);
  } else {
    rootLogger.removeHandler(this.publishHandler_);
    this.logBuffer = '';
  }
  this.isCapturing_ = capturing;
};


/**
 * Adds a log record.
 * @param {goog.debug.LogRecord} logRecord The log entry.
 */
goog.debug.DivConsole.prototype.addLogRecord = function(logRecord) {
  var scroll = this.element_.scrollHeight - this.element_.scrollTop -
      this.element_.clientHeight <= 100;

  var div = this.elementOwnerDocument_.createElement('div');
  div.className = 'logmsg';
  div.innerHTML = this.formatter_.formatRecord(logRecord);
  this.element_.appendChild(div);

  if (scroll) {
    this.element_.scrollTop = this.element_.scrollHeight;
  }
};


/**
 * Gets the formatter for outputting to the console. The default formatter
 * is an instance of goog.debug.HtmlFormatter
 * @return {goog.debug.Formatter} The formatter in use.
 */
goog.debug.DivConsole.prototype.getFormatter = function() {
  return this.formatter_;
};


/**
 * Sets the formatter for outputting to the console.
 * @param {goog.debug.Formatter} formatter The formatter to use.
 */
goog.debug.DivConsole.prototype.setFormatter = function(formatter) {
  this.formatter_ = formatter;
};


/**
 * Adds a separator to the debug window.
 */
goog.debug.DivConsole.prototype.addSeparator = function() {
  var div = this.elementOwnerDocument_.createElement('div');
  div.className = 'logmsg logsep';
  this.element_.appendChild(div);
};


/**
 * Clears the console.
 */
goog.debug.DivConsole.prototype.clear = function() {
  this.element_.innerHTML = '';
};

// Input 26
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview File which defines dummy object to work around undefined
 * properties compiler warning for weak dependencies on
 * {@link goog.debug.ErrorHandler#protectEntryPoint}.
 *
*
 */

goog.provide('goog.debug.errorHandlerWeakDep');

/**
 * Dummy object to work around undefined properties compiler warning.
 * @type {Object}
 */
goog.debug.errorHandlerWeakDep = {
  /**
   * @param {Function} fn An entry point function to be protected.
   * @param {boolean=} opt_tracers Whether to install tracers around the
   *     fn.
   * @return {Function} A protected wrapper function that calls the
   *     entry point function.
   */
  protectEntryPoint: function(fn, opt_tracers) { return fn; }
};

// Input 27
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implements the disposable interface. The dispose method is used
 * to clean up references and resources.
*
 */


goog.provide('goog.Disposable');
goog.provide('goog.dispose');


/**
 * Class that provides the basic implementation for disposable objects. If your
 * class holds one or more references to COM objects, DOM nodes, or other
 * disposable objects, it should extend this class or implement the disposable
 * interface.
 * @constructor
 */
goog.Disposable = function() {};


/**
 * Whether the object has been disposed of.
 * @type {boolean}
 * @private
 */
goog.Disposable.prototype.disposed_ = false;


/**
 * @return {boolean} Whether the object has been disposed of.
 */
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_;
};


/**
 * @return {boolean} Whether the object has been disposed of.
 * @deprecated Use {@link #isDisposed} instead.
 */
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;


/**
 * Disposes of the object. If the object hasn't already been disposed of, calls
 * {@link #disposeInternal}. Classes that extend {@code goog.Disposable} should
 * override {@link #disposeInternal} in order to delete references to COM
 * objects, DOM nodes, and other disposable objects.
 */
goog.Disposable.prototype.dispose = function() {
  if (!this.disposed_) {
    // Set disposed_ to true first, in case during the chain of disposal this
    // gets disposed recursively.
    this.disposed_ = true;
    this.disposeInternal();
  }
};


/**
 * Deletes or nulls out any references to COM objects, DOM nodes, or other
 * disposable objects. Classes that extend {@code goog.Disposable} should
 * override this method.  For example:
 * <pre>
 *   mypackage.MyClass = function() {
 *     goog.Disposable.call(this);
 *     // Constructor logic specific to MyClass.
 *     ...
 *   };
 *   goog.inherits(mypackage.MyClass, goog.Disposable);
 *
 *   mypackage.MyClass.prototype.disposeInternal = function() {
 *     mypackage.MyClass.superClass_.disposeInternal.call(this);
 *     // Dispose logic specific to MyClass.
 *     ...
 *   };
 * </pre>
 * @protected
 */
goog.Disposable.prototype.disposeInternal = function() {
  // No-op in the base class.
};


/**
 * Calls {@code dispose} on the argument if it supports it. If obj is not an
 *     object with a dispose() method, this is a no-op.
 * @param {*} obj The object to dispose of.
 */
goog.dispose = function(obj) {
  if (obj && typeof obj.dispose == 'function') {
    obj.dispose();
  }
};

// Input 28
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A base class for event objects.
 *
*
 */


goog.provide('goog.events.Event');

goog.require('goog.Disposable');


/**
 * A base class for event objects, so that they can support preventDefault and
 * stopPropagation.
 *
 * @param {string} type Event Type.
 * @param {Object=} opt_target Reference to the object that is the target of
 *     this event.
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);

  /**
   * Event type.
   * @type {string}
   */
  this.type = type;

  /**
   * Target of the event.
   * @type {Object|undefined}
   */
  this.target = opt_target;

  /**
   * Object that had the listener attached.
   * @type {Object|undefined}
   */
  this.currentTarget = this.target;
};
goog.inherits(goog.events.Event, goog.Disposable);


/** @inheritDoc */
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget;
};


/**
 * Whether to cancel the event in internal capture/bubble processing for IE.
 * @type {boolean}
 * @private
 */
goog.events.Event.prototype.propagationStopped_ = false;


/**
 * Return value for in internal capture/bubble processing for IE.
 * @type {boolean}
 * @private
 */
goog.events.Event.prototype.returnValue_ = true;


/**
 * Stops event propagation.
 */
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
};


/**
 * Prevents the default action, for example a link redirecting to a url.
 */
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false;
};


/**
 * Stops the propagation of the event. It is equivalent to
 * {@code e.stopPropagation()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation();
};


/**
 * Prevents the default action. It is equivalent to
 * {@code e.preventDefault()}, but can be used as the callback argument of
 * {@link goog.events.listen} without declaring another function.
 * @param {!goog.events.Event} e An event.
 */
goog.events.Event.preventDefault = function(e) {
  e.preventDefault();
};

// Input 29
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A patched, standardized event object for browser events.
 *
 * <pre>
 * The patched event object contains the following members:
 * - type           {string}    Event type, e.g. 'click'
 * - timestamp      {Date}      A date object for when the event was fired
 * - target         {Object}    The element that actually triggered the event
 * - currentTarget  {Object}    The element the listener is attached to
 * - relatedTarget  {Object}    For mouseover and mouseout, the previous object
 * - offsetX        {number}    X-coordinate relative to target
 * - offsetY        {number}    Y-coordinate relative to target
 * - clientX        {number}    X-coordinate relative to viewport
 * - clientY        {number}    Y-coordinate relative to viewport
 * - screenX        {number}    X-coordinate relative to the edge of the screen
 * - screenY        {number}    Y-coordinate relative to the edge of the screen
 * - button         {number}    Mouse button. Use isButton() to test.
 * - keyCode        {number}    Key-code
 * - ctrlKey        {boolean}   Was ctrl key depressed
 * - altKey         {boolean}   Was alt key depressed
 * - shiftKey       {boolean}   Was shift key depressed
 * - metaKey        {boolean}   Was meta key depressed
 *
 * NOTE: The keyCode member contains the raw browser keyCode. For normalized
 * key and character code use {@link goog.events.KeyHandler}.
 * </pre>
 *
*
*
 */

goog.provide('goog.events.BrowserEvent');
goog.provide('goog.events.BrowserEvent.MouseButton');

goog.require('goog.events.Event');
goog.require('goog.userAgent');



/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * The content of this object will not be initialized if no event object is
 * provided. If this is the case, init() needs to be invoked separately.
 * @param {Event=} opt_e Browser event object.
 * @param {Node=} opt_currentTarget Current target for event.
 * @constructor
 * @extends {goog.events.Event}
 */
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
 if (opt_e) {
   this.init(opt_e, opt_currentTarget);
 }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);


/**
 * Normalized button constants for the mouse.
 * @enum {number}
 */
goog.events.BrowserEvent.MouseButton = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};


/**
 * Static data for mapping mouse buttons.
 * @type {Array.<number>}
 * @private
 */
goog.events.BrowserEvent.IEButtonMap_ = [
  1, // LEFT
  4, // MIDDLE
  2  // RIGHT
];


/**
 * Target that fired the event.
 * @override
 * @type {Node}
 */
goog.events.BrowserEvent.prototype.target = null;


/**
 * Node that had the listener attached.
 * @override
 * @type {Node|undefined}
 */
goog.events.BrowserEvent.prototype.currentTarget;


/**
 * For mouseover and mouseout events, the related object for the event.
 * @type {Node}
 */
goog.events.BrowserEvent.prototype.relatedTarget = null;


/**
 * X-coordinate relative to target.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.offsetX = 0;


/**
 * Y-coordinate relative to target.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.offsetY = 0;


/**
 * X-coordinate relative to the window.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.clientX = 0;


/**
 * Y-coordinate relative to the window.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.clientY = 0;


/**
 * X-coordinate relative to the monitor.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.screenX = 0;


/**
 * Y-coordinate relative to the monitor.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.screenY = 0;


/**
 * Which mouse button was pressed.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.button = 0;


/**
 * Keycode of key press.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.keyCode = 0;


/**
 * Keycode of key press.
 * @type {number}
 */
goog.events.BrowserEvent.prototype.charCode = 0;


/**
 * Whether control was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.ctrlKey = false;


/**
 * Whether alt was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.altKey = false;


/**
 * Whether shift was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.shiftKey = false;


/**
 * Whether the meta key was pressed at time of event.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.metaKey = false;


/**
 * Whether the deafault platform modifier key was pressed at time of event.
 * (This is control for all platformes except Mac, where it's Meta.
 * @type {boolean}
 */
goog.events.BrowserEvent.prototype.platformModifierKey = false;


/**
 * The browser event object.
 * @type {Event}
 * @private
 */
goog.events.BrowserEvent.prototype.event_ = null;


/**
 * Accepts a browser event object and creates a patched, cross browser event
 * object.
 * @param {Event} e Browser event object.
 * @param {Node=} opt_currentTarget Current target for event.
 */
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;

  var relatedTarget = /** @type {Node} */ (e.relatedTarget);
  if (relatedTarget) {
    // There's a bug in FireFox where sometimes, relatedTarget will be a
    // chrome element, and accessing any property of it will get a permission
    // denied exception. See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=497780
    if (goog.userAgent.GECKO) {
      /** @preserveTry */
      try {
        relatedTarget = relatedTarget.nodeName && relatedTarget;
      } catch (err) {
        relatedTarget = null;
      }
    }
    // TODO(user): Use goog.events.EventType when it has been refactored into its
    // own file.
  } else if (type == 'mouseover') {
    relatedTarget = e.fromElement;
  } else if (type == 'mouseout') {
    relatedTarget = e.toElement;
  }

  this.relatedTarget = relatedTarget;

  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;

  this.button = e.button;

  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == 'keypress' ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_;
};

/**
 * Tests to see which button was pressed during the event. This is really only
 * useful in IE and Gecko browsers. And in IE, it's only useful for
 * mousedown/mouseup events, because click only fires for the left mouse button.
 *
 * Safari 2 only reports the left button being clicked, and uses the value '1'
 * instead of 0. Opera only reports a mousedown event for the middle button, and
 * no mouse events for the right button. Opera has default behavior for left and
 * middle click that can only be overridden via a configuration setting.
 *
 * There's a nice table of this mess at http://www.unixpapa.com/js/mouse.html.
 *
 * @param {goog.events.BrowserEvent.MouseButton} button The button
 *     to test for.
 * @return {boolean} True if button was pressed.
 */
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if (goog.userAgent.IE) {
    if (this.type == 'click') {
      return button == goog.events.BrowserEvent.MouseButton.LEFT;
    } else {
      return !!(this.event_.button &
          goog.events.BrowserEvent.IEButtonMap_[button]);
    }
  } else {
    return this.event_.button == button;
  }
};


/**
 * @inheritDoc
 */
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  this.propagationStopped_ = true;
  if (this.event_.stopPropagation) {
    this.event_.stopPropagation();
  } else {
    this.event_.cancelBubble = true;
  }
};


/**
 * To prevent default in IE7 for certain keydown events we need set the keyCode
 * to -1.
 * @type {boolean}
 * @private
 */
goog.events.BrowserEvent.IE7_SET_KEY_CODE_TO_PREVENT_DEFAULT_ =
    goog.userAgent.IE && !goog.userAgent.isVersion('8')


/**
 * @inheritDoc
 */
goog.events.BrowserEvent.prototype.preventDefault = function() {
  this.returnValue_ = false;
  var be = this.event_;
  if (!be.preventDefault) {
    be.returnValue = false;
    if (goog.events.BrowserEvent.IE7_SET_KEY_CODE_TO_PREVENT_DEFAULT_) {
      /** @preserveTry */
      try {
        // Most keys can be prevented using returnValue, just like in IE8 but
        // some special keys require setting the keyCode to -1 as well:
        //
        // F3, F5, F10, F11, Ctrl+P, Crtl+O, Ctrl+F (these are taken from IE6)
        //
        // We therefore do this for all function keys as well as when Ctrl key
        // is pressed.
        var VK_F1 = 112;
        var VK_F12 = 123;
        if (be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1;
        }
      } catch (ex) {
        // IE throws an 'access denied' exception when trying to change
        // keyCode in some situations (e.g. srcElement is input[type=file],
        // or srcElement is an anchor tag rewritten by parent's innerHTML).
        // Do nothing in this case.
      }
    }
  } else {
    be.preventDefault();
  }
};


/**
 * @return {Event} The underlying browser event object.
 */
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_;
};


/**
 * @inheritDoc
 */
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null;
};

// Input 30
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Definition of the goog.events.EventWrapper interface.
 *
*
 */

goog.provide('goog.events.EventWrapper');


/**
 * Interface for event wrappers.
 * @interface
 */
goog.events.EventWrapper = function() {
};


/**
 * Adds an event listener using the wrapper on a DOM Node or an object that has
 * implemented {@link goog.events.EventTarget}. A listener can only be added
 * once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_scope Element in whose scope to call the listener.
 * @param {goog.events.EventHandler=} opt_eventHandler Event handler to add
 *     listener to.
 */
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt,
    opt_scope, opt_eventHandler) {
};


/**
 * Removes an event listener added using goog.events.EventWrapper.listen.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to remove listener
 *    from.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_scope Element in whose scope to call the listener.
 * @param {goog.events.EventHandler=} opt_eventHandler Event handler to remove
 *     listener from.
 */
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt,
    opt_scope, opt_eventHandler) {
};

// Input 31
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Listener object.
*
 * @see ../demos/events.html
 */

/**
 * Namespace for events
 */
goog.provide('goog.events.Listener');

/**
 * Simple class that stores information about a listener
 * @constructor
 */
goog.events.Listener = function() {
};


/**
 * Counter used to create a unique key
 * @type {number}
 * @private
 */
goog.events.Listener.counter_ = 0;


/**
 * Whether the listener is a function or an object that implements handleEvent.
 * @type {boolean}
 * @private
 */
goog.events.Listener.prototype.isFunctionListener_;


/**
 * Call back function or an object with a handleEvent function.
 * @type {Function|Object|null}
 */
goog.events.Listener.prototype.listener;


/**
 * Proxy for callback that passes through {@link goog.events#HandleEvent_}
 * @type {Function}
 */
goog.events.Listener.prototype.proxy;


/**
 * Object or node that callback is listening to
 * @type {Object|goog.events.EventTarget}
 */
goog.events.Listener.prototype.src;


/**
 * Type of event
 * @type {string}
 */
goog.events.Listener.prototype.type;


/**
 * Whether the listener is being called in the capture or bubble phase
 * @type {boolean}
 */
goog.events.Listener.prototype.capture;


/**
 * Optional object whose context to execute the listener in
 * @type {Object|undefined}
 */
goog.events.Listener.prototype.handler;


/**
 * The key of the listener.
 * @type {number}
 */
goog.events.Listener.prototype.key = 0;


/**
 * Whether the listener has been removed.
 * @type {boolean}
 */
goog.events.Listener.prototype.removed = false;


/**
 * Whether to remove the listener after it has been called.
 * @type {boolean}
 */
goog.events.Listener.prototype.callOnce = false;


/**
 * Initializes the listener.
 * @param {Function|Object} listener Callback function, or an object with a
 *     handleEvent function.
 * @param {Function} proxy Wrapper for the listener that patches the event.
 * @param {Object} src Source object for the event.
 * @param {string} type Event type.
 * @param {boolean} capture Whether in capture or bubble phase.
 * @param {Object=} opt_handler Object in whose context to execute the callback.
 */
goog.events.Listener.prototype.init = function(listener, proxy, src, type,
                                               capture, opt_handler) {
  // we do the test of the listener here so that we do  not need to
  // continiously do this inside handleEvent
  if (goog.isFunction(listener)) {
    this.isFunctionListener_ = true;
  } else if (listener && listener.handleEvent &&
      goog.isFunction(listener.handleEvent)) {
    this.isFunctionListener_ = false;
  } else {
    throw Error('Invalid listener argument');
  }

  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false;
};


/**
 * Calls the internal listener
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} The result of the internal listener call.
 */
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if (this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject);
  }
  return this.listener.handleEvent.call(this.listener, eventObject);
};

// Input 32
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Datastructure: Pool.
 *
*
*
 *
 * A generic class for handling pools of objects that is more efficient than
 * goog.structs.Pool because it doesn't maintain a list of objects that are in
 * use. See constructor comment.
 */


goog.provide('goog.structs.SimplePool');

goog.require('goog.Disposable');


/**
 * A generic pool class. Simpler and more efficient than goog.structs.Pool
 * because it doesn't maintain a list of objects that are in use. This class
 * has constant overhead and doesn't create any additional objects as part of
 * the pool management after construction time.
 *
 * IMPORTANT: If the objects being pooled are arrays or maps that can have
 * unlimited number of properties, they need to be cleaned before being
 * returned to the pool.
 *
 * Also note that {@see goog.object.clean} actually allocates an array to clean
 * the object passed to it, so simply using this function would defy the
 * purpose of using the pool.
 *
 * @param {number} initialCount Initial number of objects to populate the
 *     free pool at construction time.
 * @param {number} maxCount Maximum number of objects to keep in the free pool.
 * @constructor
 * @extends {goog.Disposable}
 */
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);

  /**
   * Maximum number of objects allowed
   * @type {number}
   * @private
   */
  this.maxCount_ = maxCount;

  /**
   * Queue used to store objects that are currently in the pool and available
   * to be used.
   * @type {Array}
   * @private
   */
  this.freeQueue_ = [];

  this.createInitial_(initialCount);
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);


/**
 * Function for overriding createObject. The avoids a common case requiring
 * subclassing this class.
 * @type {Function}
 * @private
 */
goog.structs.SimplePool.prototype.createObjectFn_ = null;


/**
 * Function for overriding disposeObject. The avoids a common case requiring
 * subclassing this class.
 * @type {Function}
 * @private
 */
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;


/**
 * Sets the {@code createObject} function which is used for creating a new
 * object in the pool.
 * @param {Function} createObjectFn Create object function which returns the
 *     newly createrd object.
 */
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn;
};


/**
 * Sets the {@code disposeObject} function which is used for disposing of an
 * object in the pool.
 * @param {Function} disposeObjectFn Dispose object function which takes the
 *     object to dispose as a parameter.
 */
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(
    disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn;
};


/**
 * Gets a new object from the the pool, if there is one available, otherwise
 * returns null.
 * @return {Object} An object from the pool or a new one if necessary.
 */
goog.structs.SimplePool.prototype.getObject = function() {
  if (this.freeQueue_.length) {
    return this.freeQueue_.pop();
  }
  return this.createObject();
};


/**
 * Releases the space in the pool held by a given object -- i.e., remove it from
 * the pool and frees up its space.
 * @param {Object} obj The object to release.
 */
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if (this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj);
  } else {
    this.disposeObject(obj);
  }
};


/**
 * Populates the pool with initialCount objects.
 * @param {number} initialCount The number of objects to add to the pool.
 * @private
 */
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if (initialCount > this.maxCount_) {
    throw Error('[goog.structs.SimplePool] Initial cannot be greater than max');
  }
  for (var i = 0; i < initialCount; i++) {
    this.freeQueue_.push(this.createObject());
  }
};


/**
 * Should be overriden by sub-classes to return an instance of the object type
 * that is expected in the pool.
 * @return {Object} The created object.
 */
goog.structs.SimplePool.prototype.createObject = function() {
  if (this.createObjectFn_) {
    return this.createObjectFn_();
  } else {
    return {};
  }
};


/**
 * Should be overriden to dispose of an object. Default implementation is to
 * remove all of the object's members, which should render it useless. Calls the
 *  object's dispose method, if available.
 * @param {Object} obj The object to dispose.
 */
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if (this.disposeObjectFn_) {
    this.disposeObjectFn_(obj);
  } else {
    if (goog.isFunction(obj.dispose)) {
      obj.dispose();
    } else {
      for (var i in obj) {
        delete obj[i];
      }
    }
  }
};


/**
 * Disposes of the pool and all objects currently held in the pool.
 */
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  // Call disposeObject on each object held by the pool.
  var freeQueue = this.freeQueue_;
  while (freeQueue.length) {
    this.disposeObject(freeQueue.pop());
  }
  delete this.freeQueue_;
};

// Input 33
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Detection of JScript version.
 *
*
 */


goog.provide('goog.userAgent.jscript');

goog.require('goog.string');


/**
 * @define {boolean} True if it is known at compile time that the runtime
 *     environment will not be using JScript.
 */
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;


/**
 * Initializer for goog.userAgent.jscript.  Detects if the user agent is using
 * Microsoft JScript and which version of it.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = 'ScriptEngine' in goog.global;

  /**
   * @type {boolean}
   * @private
   */
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ =
      hasScriptEngine && goog.global['ScriptEngine']() == 'JScript';

  /**
   * @type {string}
   * @private
   */
  goog.userAgent.jscript.DETECTED_VERSION_ =
      goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ?
      (goog.global['ScriptEngineMajorVersion']() + '.' +
       goog.global['ScriptEngineMinorVersion']() + '.' +
       goog.global['ScriptEngineBuildVersion']()) :
      '0';
};

if (!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_();
}

/**
 * Whether we detect that the user agent is using Microsoft JScript.
 * @type {boolean}
 */
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ?
    false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;


/**
 * The installed version of JScript.
 * @type {string}
 */
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ?
    '0' : goog.userAgent.jscript.DETECTED_VERSION_;


/**
 * Whether the installed version of JScript is as new or newer than a given
 * version.
 * @param {string} version The version to check.
 * @return {boolean} Whether the installed version of JScript is as new or
 *     newer than the given version.
 */
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION,
                                     version) >= 0;
};

// Input 34
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Helper object to manage the event system pools. This should not
 * be used by itself and there should be no reason for you to depend on this
 * library.
 *
 * JScript 5.6 has some serious issues with GC so we use object pools to reduce
 * the number of object allocations.
 *
*
*
 */

goog.provide('goog.events.pools');


goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Listener');
goog.require('goog.structs.SimplePool');
goog.require('goog.userAgent.jscript');


/**
 * Helper function for returning an object that is used for the lookup trees.
 * This might use an object pool depending on the script engine.
 * @return { {count_: number, remaining_: number} } A new or reused object.
 */
goog.events.pools.getObject;


/**
 * Helper function for releasing an object that was returned by
 * {@code goog.events.pools.getObject}. In case an object pool was used the
 * object is returned to the pool.
 * @param { {count_: number, remaining_: number} } obj The object to release.
 */
goog.events.pools.releaseObject;


/**
 * Helper function for returning an array.
 * This might use an object pool depending on the script engine.
 * @return {Array} A new or reused array.
 */
goog.events.pools.getArray;


/**
 * Helper function for releasing an array that was returned by
 * {@code goog.events.pools.getArray}. In case an object pool was used the
 * array is returned to the pool.
 * @param {Array} arr The array to release.
 */
goog.events.pools.releaseArray;


/**
 * Helper function for returning a proxy function as needed by
 * {@code goog.events}. This might use an object pool depending on the script
 * engine.
 * @return {Function} A new or reused function object.
 */
goog.events.pools.getProxy;


/**
 * Sets the callback function to use in the proxy.
 * @param {Function} cb The callback function to use.
 */
goog.events.pools.setProxyCallbackFunction;


/**
 * Helper function for releasing a function that was returned by
 * {@code goog.events.pools.getProxy}. In case an object pool was used the
 * function is returned to the pool.
 * @param {Function} f The function to release.
 */
goog.events.pools.releaseProxy;


/**
 * Helper function for returning a listener object as needed by
 * {@code goog.events}. This might use an object pool depending on the script
 * engine.
 * @return {goog.events.Listener} A new or reused listener object.
 */
goog.events.pools.getListener;


/**
 * Helper function for releasing a listener object that was returned by
 * {@code goog.events.pools.getListener}. In case an object pool was used the
 * listener object is returned to the pool.
 * @param {goog.events.Listener} listener The listener object to release.
 */
goog.events.pools.releaseListener;


/**
 * Helper function for returning a {@code goog.events.BrowserEvent} object as
 * needed by {@code goog.events}. This might use an object pool depending on the
 * script engine.
 * @return {!goog.events.BrowserEvent} A new or reused event object.
 */
goog.events.pools.getEvent;


/**
 * Helper function for releasing a browser event object that was returned by
 * {@code goog.events.pools.getEvent}. In case an object pool was used the
 * browser event object is returned to the pool.
 * @param {goog.events.BrowserEvent} event The event object to release.
 */
goog.events.pools.releaseEvent;


(function() {
  var BAD_GC = goog.userAgent.jscript.HAS_JSCRIPT &&
      !goog.userAgent.jscript.isVersion('5.7');

  // These functions are shared between the pools' createObject functions and
  // the non pooled versions.

  function getObject() {
    return {count_: 0, remaining_: 0};
  }

  function getArray() {
    return [];
  }

  /**
   * This gets set to {@code goog.events.handleBrowserEvent_} by events.js.
   * @type {function(string, (Event|undefined))}
   */
  var proxyCallbackFunction;

  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb;
  };

  function getProxy() {
    // Use a local var f to prevent one allocation.
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject);
    };
    return f;
  }

  function getListener() {
    return new goog.events.Listener();
  }

  function getEvent() {
    return new goog.events.BrowserEvent();
  }

  if (!BAD_GC) {

    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;

    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;

    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;

    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;

    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction;

  } else {

    goog.events.pools.getObject = function() {
      return objectPool.getObject();
    };

    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj);
    };

    goog.events.pools.getArray = function() {
      return /** @type {Array} */ (arrayPool.getObject());
    };

    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj);
    };

    goog.events.pools.getProxy = function() {
      return /** @type {Function} */ (proxyPool.getObject());
    };

    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy());
    };

    goog.events.pools.getListener = function() {
      return /** @type {goog.events.Listener} */ (
          listenerPool.getObject());
    };

    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj);
    };

    goog.events.pools.getEvent = function() {
      return /** @type {goog.events.BrowserEvent} */ (eventPool.getObject());
    };

    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj);
    };

    /**
     * Initial count for the objectPool
     */
    var OBJECT_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the objectPool_
     */
    var OBJECT_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the lookup objects. This was implemented to make IE6
     * performance better and removed an object allocation in goog.events.listen
     * when in steady state.
     */
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT,
                                                 OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);


    /**
     * Initial count for the arrayPool
     */
    var ARRAY_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the arrayPool
     */
    var ARRAY_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the type arrays. This was implemented to make IE6
     * performance better and removed an object allocation in goog.events.listen
     * when in steady state.
     * @type {goog.structs.SimplePool}
     */
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT,
                                                ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);


    /**
     * Initial count for the proxyPool
     */
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the proxyPool
     */
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the handle event proxy. This was implemented to make
     * IE6 performance better and removed an object allocation in
     * goog.events.listen when in steady state.
     */
    var proxyPool = new goog.structs.SimplePool(
        HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT,
        HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);


    /**
     * Initial count for the listenerPool
     */
    var LISTENER_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the listenerPool
     */
    var LISTENER_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the listener objects. This was implemented to make
     * IE6 performance better and removed an object allocation in
     * goog.events.listen when in steady state.
     */
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT,
                                                   LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);


    /**
     * Initial count for the eventPool
     */
    var EVENT_POOL_INITIAL_COUNT = 0;


    /**
     * Max count for the eventPool
     */
    var EVENT_POOL_MAX_COUNT = 600;


    /**
     * SimplePool to cache the event objects. This was implemented to make IE6
     * performance better and removed an object allocation in
     * goog.events.handleBrowserEvent_ when in steady state.
     * This pool is only used for IE events.
     */
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT,
                                                EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent);
  }
})();

// Input 35
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Event Manager.
 *
 * Provides an abstracted interface to the browsers' event
 * systems. This uses an indirect lookup of listener functions to avoid circular
 * references between DOM (in IE) or XPCOM (in Mozilla) objects which leak
 * memory. This makes it easier to write OO Javascript/DOM code.
 *
 * It simulates capture & bubble in Internet Explorer.
 *
 * The listeners will also automagically have their event objects patched, so
 * your handlers don't need to worry about the browser.
 *
 * Example usage:
 * <pre>
 * goog.events.listen(myNode, 'click', function(e) { alert('woo') });
 * goog.events.listen(myNode, 'mouseover', mouseHandler, true);
 * goog.events.unlisten(myNode, 'mouseover', mouseHandler, true);
 * goog.events.removeAll(myNode);
 * goog.events.removeAll();
 * </pre>
 *
*
*
 *                                            in IE and event object patching]
*
 *
 * @supported IE6+, FF1.5+, WebKit, Opera.
 * @see ../demos/events.html
 * @see ../demos/event-propagation.html
 * @see ../demos/stopevent.html
 */


// This uses 3 lookup tables/trees.
// listenerTree_ is a tree of type -> capture -> src uid -> [Listener]
// listeners_ is a map of key -> [Listener]
//
// The key is a field of the Listener. The Listener class also has the type,
// capture and the src so one can always trace back in the tree
//
// sources_: src uid -> [Listener]


goog.provide('goog.events');
goog.provide('goog.events.EventType');

goog.require('goog.array');
goog.require('goog.debug.errorHandlerWeakDep');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventWrapper');
goog.require('goog.events.pools');
goog.require('goog.object');
goog.require('goog.userAgent');



/**
 * Container for storing event listeners and their proxies
 * @private
 * @type {Object.<goog.events.Listener>}
 */
goog.events.listeners_ = {};


/**
 * The root of the listener tree
 * @private
 * @type {Object}
 */
goog.events.listenerTree_ = {};


/**
 * Lookup for mapping source UIDs to listeners.
 * @private
 * @type {Object}
 */
goog.events.sources_ = {};


/**
 * String used to prepend to IE event types.  Not a constant so that it is not
 * inlined.
 * @type {string}
 * @private
 */
goog.events.onString_ = 'on';


/**
 * Map of computed on strings for IE event types. Caching this removes an extra
 * object allocation in goog.events.listen which improves IE6 performance.
 * @type {Object}
 * @private
 */
goog.events.onStringMap_ = {};


/**
 * Separator used to split up the various parts of an event key, to help avoid
 * the possibilities of collisions.
 * @type {string}
 * @private
 */
goog.events.keySeparator_ = '_';


/**
 * Whether the browser natively supports full W3C event propagation.
 * @type {boolean}
 * @private
 */
goog.events.requiresSyntheticEventPropagation_;


/**
 * Adds an event listener for a specific event on a DOM Node or an object that
 * has implemented {@link goog.events.EventTarget}. A listener can only be
 * added once to an object and if it is added again the key for the listener
 * is returned.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if (!type) {
    throw Error('Invalid event type');
  } else if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listen(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  } else {
    var capture = !!opt_capt;
    var map = goog.events.listenerTree_;

    if (!(type in map)) {
      map[type] = goog.events.pools.getObject();
    }
    map = map[type];

    if (!(capture in map)) {
      map[capture] = goog.events.pools.getObject();
      map.count_++;
    }
    map = map[capture];

    var srcUid = goog.getUid(src);
    var listenerArray, listenerObj;

    // The remaining_ property is used to be able to short circuit the iteration
    // of the event listeners.
    //
    // Increment the remaining event listeners to call even if this event might
    // already have been fired. At this point we do not know if the event has
    // been fired and it is too expensive to find out. By incrementing it we are
    // guaranteed that we will not skip any event listeners.
    map.remaining_++;

    // Do not use srcUid in map here since that will cast the number to a
    // string which will allocate one string object.
    if (!map[srcUid]) {
      listenerArray = map[srcUid] = goog.events.pools.getArray();
      map.count_++;
    } else {
      listenerArray = map[srcUid];
      // Ensure that the listeners do not already contain the current listener
      for (var i = 0; i < listenerArray.length; i++) {
        listenerObj = listenerArray[i];
        if (listenerObj.listener == listener &&
            listenerObj.handler == opt_handler) {

          // If this listener has been removed we should not return its key. It
          // is OK that we create new listenerObj below since the removed one
          // will be cleaned up later.
          if (listenerObj.removed) {
            break;
          }

          // We already have this listener. Return its key.
          return listenerArray[i].key;
        }
      }
    }

    var proxy = goog.events.pools.getProxy();
    proxy.src = src;
    listenerObj = goog.events.pools.getListener();
    listenerObj.init(listener, proxy, src, type, capture, opt_handler);
    var key = listenerObj.key;
    proxy.key = key;

    listenerArray.push(listenerObj);
    goog.events.listeners_[key] = listenerObj;

    if (!goog.events.sources_[srcUid]) {
      goog.events.sources_[srcUid] = goog.events.pools.getArray();
    }
    goog.events.sources_[srcUid].push(listenerObj);


    // Attach the proxy through the browser's API
    if (src.addEventListener) {
      if (src == goog.global || !src.customEvent_) {
        src.addEventListener(type, proxy, capture);
      }
    } else {
      // The else above used to be else if (src.attachEvent) and then there was
      // another else statement that threw an exception warning the developer
      // they made a mistake. This resulted in an extra object allocation in IE6
      // due to a wrapper object that had to be implemented around the element
      // and so was removed.
      src.attachEvent(goog.events.getOnString_(type), proxy);
    }

    return key;
  }
};


/**
 * Adds an event listener for a specific event on a DomNode or an object that
 * has implemented {@link goog.events.EventTarget}. After the event has fired
 * the event listener is removed from the target.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {string|Array.<string>} type Event type or array of event types.
 * @param {Function|Object} listener Callback method.
 * @param {boolean=} opt_capt Fire in capture phase?.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?number} Unique key for the listener.
 */
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key;
};


/**
 * Adds an event listener with a specific event wrapper on a DOM Node or an
 * object that has implemented {@link goog.events.EventTarget}. A listener can
 * only be added once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler);
};


/**
 * Removes an event listener which was added with listen().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {string|Array.<string>} type The name of the event without the 'on'
 *     prefix.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {?boolean} indicating whether the listener was there to remove.
 */
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler);
    }
    return null;
  }

  var capture = !!opt_capt;

  var listenerArray = goog.events.getListeners_(src, type, capture);
  if (!listenerArray) {
    return false;
  }

  for (var i = 0; i < listenerArray.length; i++) {
    if (listenerArray[i].listener == listener &&
        listenerArray[i].capture == capture &&
        listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key);
    }
  }

  return false;
};


/**
 * Removes an event listener which was added with listen() by the key
 * returned by listen().
 *
 * @param {?number} key The key returned by listen() for this event listener.
 * @return {boolean} indicating whether the listener was there to remove.
 */
goog.events.unlistenByKey = function(key) {
  // Do not use key in listeners here since that will cast the number to a
  // string which will allocate one string object.
  if (!goog.events.listeners_[key]) {
    return false;
  }
  var listener = goog.events.listeners_[key];

  if (listener.removed) {
    return false;
  }

  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;

  if (src.removeEventListener) {
    // EventTarget calls unlisten so we need to ensure that the source is not
    // an event target to prevent re-entry.
    // TODO(user): What is this goog.global for? Why would anyone listen to
    // events on the [[Global]] object? Is it supposed to be window? Why would
    // we not want to allow removing event listeners on the window?
    if (src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture);
    }
  } else if (src.detachEvent) {
    src.detachEvent(goog.events.getOnString_(type), proxy);
  }

  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];

  // In a perfect implementation we would decrement the remaining_ field here
  // but then we would need to know if the listener has already been fired or
  // not. We therefore skip doing this and in this uncommon case the entire
  // ancestor chain will need to be traversed as before.

  // Remove from sources_
  if (goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if (sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid];
    }
  }

  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);

  delete goog.events.listeners_[key];

  return true;
};


/**
 * Removes an event listener which was added with listenWithWrapper().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 */
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt,
    opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler);
};


/**
 * Cleans up the listener array as well as the listener tree
 * @param {string} type  The type of the event.
 * @param {boolean} capture Whether to clean up capture phase listeners instead
 *     bubble phase listeners.
 * @param {number} srcUid  The unique ID of the source.
 * @param {Array.<goog.events.Listener>} listenerArray The array being cleaned.
 * @private
 */
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  // The listener array gets locked during the dispatch phase so that removals
  // of listeners during this phase does not screw up the indeces. This method
  // is called after we have removed a listener as well as after the dispatch
  // phase in case any listeners were removed.
  if (!listenerArray.locked_) { // catches both 0 and not set
    if (listenerArray.needsCleanup_) {
      // Loop over the listener array and remove listeners that have removed set
      // to true. This could have been done with filter or something similar but
      // we want to change the array in place and we want to minimize
      // allocations. Adding a listener during this phase adds to the end of the
      // array so that works fine as long as the length is rechecked every in
      // iteration.
      for (var oldIndex = 0, newIndex = 0;
           oldIndex < listenerArray.length;
           oldIndex++) {
        if (listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue;
        }
        if (oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex];
        }
        newIndex++;
      }
      listenerArray.length = newIndex;

      listenerArray.needsCleanup_ = false;

      // In case the length is now zero we release the object.
      if (newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;

        if (goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(
              goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--;
        }

        if (goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type];
        }
      }

    }
  }
};


/**
 * Removes all listeners from an object, if no object is specified it will
 * remove all listeners that have been registered.  You can also optionally
 * remove listeners of a particular type or capture phase.
 *
 * @param {Object=} opt_obj Object to remove listeners from.
 * @param {string=} opt_type Type of event to, default is all types.
 * @param {boolean=} opt_capt Whether to remove the listeners from the capture
 *     or bubble phase.  If unspecified, will remove both.
 * @return {number} Number of listeners removed.
 */
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;

  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;

  if (!noObj) {
    var srcUid = goog.getUid(/** @type {Object} */ (opt_obj));
    if (goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for (var i = sourcesArray.length - 1; i >= 0; i--) {
        var listener = sourcesArray[i];
        if ((noType || opt_type == listener.type) &&
            (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++;
        }
      }
    }
  } else {
    // Loop over the sources_ map instead of over the listeners_ since it is
    // smaller which results in fewer allocations.
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for (var i = listeners.length - 1; i >= 0; i--) {
        var listener = listeners[i];
        if ((noType || opt_type == listener.type) &&
            (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++;
        }
      }
    });
  }

  return count;
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {string} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>} Array of listener objects.
 */
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || [];
};


/**
 * Gets the listeners for a given object, type and capture phase.
 *
 * @param {Object} obj Object to get listeners for.
 * @param {?string} type Event type.
 * @param {boolean} capture Capture phase?.
 * @return {Array.<goog.events.Listener>?} Array of listener objects.
 *     Returns null if object has no lsiteners of that type.
 * @private
 */
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if (type in map) {
    map = map[type];
    if (capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if (map[objUid]) {
        return map[objUid];
      }
    }
  }

  return null;
};


/**
 * Gets the goog.events.Listener for the event or null if no such listener is
 * in use.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to stop
 *     listening to events on.
 * @param {?string} type The name of the event without the 'on' prefix.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *                            whether the listener is fired during the
 *                            capture or bubble phase of the event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.Listener?} the found listener or null if not found.
 */
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if (listenerArray) {
    for (var i = 0; i < listenerArray.length; i++) {
      if (listenerArray[i].listener == listener &&
          listenerArray[i].capture == capture &&
          listenerArray[i].handler == opt_handler) {
        // We already have this listener. Return its key.
        return listenerArray[i];
      }
    }
  }
  return null;
};


/**
 * Returns whether an event target has any active listeners matching the
 * specified signature. If either the type or capture parameters are
 * unspecified, the function will match on the remaining criteria.
 *
 * @param {EventTarget|goog.events.EventTarget} obj Target to get listeners for.
 * @param {string=} opt_type Event type.
 * @param {boolean=} opt_capture Whether to check for capture or bubble-phase
 *     listeners.
 * @return {boolean} Whether an event target has one or more listeners matching
 *     the requested type and/or capture phase.
 */
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj)
  var listeners = goog.events.sources_[objUid];

  if (listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);

    if (hasType && hasCapture) {
      // Lookup in the listener tree whether the specified listener exists.
      var map = goog.events.listenerTree_[opt_type]
      return !!map && !!map[opt_capture] && objUid in map[opt_capture];

    } else if (!(hasType || hasCapture)) {
      // Simple check for whether the event target has any listeners at all.
      return true;

    } else {
      // Iterate through the listeners for the event target to find a match.
      return goog.array.some(listeners, function(listener) {
          return (hasType && listener.type == opt_type) ||
            (hasCapture && listener.capture == opt_capture);
      });
    }
  }

  return false;
};


/**
 * Provides a nice string showing the normalized event objects public members
 * @param {Object} e Event Object.
 * @return {string} String of the public members of the normalized event object.
 */
goog.events.expose = function(e) {
  var str = [];
  for (var key in e) {
    if (e[key] && e[key].id) {
      str.push(key + ' = ' + e[key] + ' (' + e[key].id + ')');
    } else {
      str.push(key + ' = ' + e[key]);
    }
  }
  return str.join('\n');
};


/**
 * Constants for event names.
 * @enum {string}
 */
// TODO(user): Move to its own file.
goog.events.EventType = {
  // Mouse events
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  MOUSEDOWN: 'mousedown',
  MOUSEUP: 'mouseup',
  MOUSEOVER: 'mouseover',
  MOUSEOUT: 'mouseout',
  MOUSEMOVE: 'mousemove',
  SELECTSTART: 'selectstart', // IE, Safari, Chrome

  // Key events
  KEYPRESS: 'keypress',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',

  // Focus
  BLUR: 'blur',
  FOCUS: 'focus',
  DEACTIVATE: 'deactivate', // IE only
  // TODO(user): Test these. I experienced problems with DOMFocusIn, the event
  // just wasn't firing.
  FOCUSIN: goog.userAgent.IE ? 'focusin' : 'DOMFocusIn',
  FOCUSOUT: goog.userAgent.IE ? 'focusout' : 'DOMFocusOut',

  // Forms
  CHANGE: 'change',
  SELECT: 'select',
  SUBMIT: 'submit',

  // Drag and drop
  DRAGSTART: 'dragstart',
  DRAGENTER: 'dragenter',
  DRAGOVER: 'dragover',
  DRAGLEAVE: 'dragleave',
  DROP: 'drop',

  // Misc
  CONTEXTMENU: 'contextmenu',
  ERROR: 'error',
  HASHCHANGE: 'hashchange',
  HELP: 'help',
  LOAD: 'load',
  LOSECAPTURE: 'losecapture',
  READYSTATECHANGE: 'readystatechange',
  RESIZE: 'resize',
  SCROLL: 'scroll',
  UNLOAD: 'unload'
};


/**
 * Returns a string wth on prepended to the specified type. This is used for IE
 * which expects "on" to be prepended. This function caches the string in order
 * to avoid extra allocations in steady state.
 * @param {string} type Event type strng.
 * @return {string} The type string with 'on' prepended.
 * @private
 */
goog.events.getOnString_ = function(type) {
  if (type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type];
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type;
};


/**
 * Fires an object's listeners of a particular type and phase
 *
 * @param {Object} obj Object whose listeners to call.
 * @param {string} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 */
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if (type in map) {
    map = map[type];
    if (capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type,
                                        capture, eventObject);
    }
  }
  return true;
};


/**
 * Fires an object's listeners of a particular type and phase.
 *
 * @param {Object} map Object with listeners in it.
 * @param {Object} obj Object whose listeners to call.
 * @param {string} type Event type.
 * @param {boolean} capture Which event phase.
 * @param {Object} eventObject Event object to be passed to listener.
 * @return {boolean} True if all listeners returned true else false.
 * @private
 */
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;

  var objUid = goog.getUid(obj);
  if (map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];

    // If locked_ is not set (and if already 0) initialize it to 1.
    if (!listenerArray.locked_) {
      listenerArray.locked_ = 1;
    } else {
      listenerArray.locked_++;
    }

    try {
      // Events added in the dispatch phase should not be dispatched in
      // the current dispatch phase. They will be included in the next
      // dispatch phase though.
      var length = listenerArray.length;
      for (var i = 0; i < length; i++) {
        var listener = listenerArray[i];
        // We might not have a listener if the listener was removed.
        if (listener && !listener.removed) {
          retval &=
              goog.events.fireListener(listener, eventObject) !== false;
        }
      }
    } finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray);
    }
  }

  return Boolean(retval);
};


/**
 * Fires a listener with a set of arguments
 *
 * @param {goog.events.Listener} listener The listener object to call.
 * @param {Object} eventObject The event object to pass to the listener.
 * @return {boolean} Result of listener.
 */
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if (listener.callOnce) {
    goog.events.unlistenByKey(listener.key);
  }
  return rv;
};


/**
 * Gets the total number of listeners currently in the system.
 * @return {number} Number of listeners.
 */
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_);
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {goog.events.EventTarget} src  The event target.
 * @param {string|Object|goog.events.Event} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false) this will also return false.
 *     If there are no handlers, or if all handlers return true, this returns
 *     true.
 */
goog.events.dispatchEvent = function(src, e) {
  // If accepting a string or object, create a custom event object so that
  // preventDefault and stopPropagation work with the event.
  if (goog.isString(e)) {
    e = new goog.events.Event(e, src);
  } else if (!(e instanceof goog.events.Event)) {
    var oldEvent = e;
    e = new goog.events.Event(e.type, src);
    goog.object.extend(e, oldEvent);
  } else {
    e.target = e.target || src;
  }

  var rv = 1, ancestors;

  var type = e.type;
  var map = goog.events.listenerTree_;

  if (!(type in map)) {
    return true;
  }

  map = map[type];
  var hasCapture = true in map;
  var targetsMap;

  if (hasCapture) {
    // Build ancestors now
    ancestors = [];
    for (var parent = src; parent; parent = parent.getParentEventTarget()) {
      ancestors.push(parent);
    }

    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;

    // Call capture listeners
    for (var i = ancestors.length - 1;
         !e.propagationStopped_ && i >= 0 && targetsMap.remaining_;
         i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type,
                                       true, e) &&
            e.returnValue_ != false;
    }
  }

  var hasBubble = false in map;
  if (hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;

    if (hasCapture) { // We have the ancestors.

      // Call bubble listeners
      for (var i = 0; !e.propagationStopped_ && i < ancestors.length &&
           targetsMap.remaining_;
           i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type,
                                         false, e) &&
              e.returnValue_ != false;
      }
    } else {
      // In case we don't have capture we don't have to build up the
      // ancestors array.

      for (var current = src;
           !e.propagationStopped_ && current && targetsMap.remaining_;
           current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type,
                                         false, e) &&
              e.returnValue_ != false;
      }
    }
  }

  return Boolean(rv);
};


/**
 * Installs exception protection for the browser event entry point using the
 * given error handler.
 *
 * @param {goog.debug.ErrorHandler} errorHandler Error handler with which to
 *     protect the entry point.
 * @param {boolean=} opt_tracers Whether to install tracers around the browser
 *     event entry point.
 */
goog.events.protectBrowserEventEntryPoint = function(
    errorHandler, opt_tracers) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(
      goog.events.handleBrowserEvent_, opt_tracers);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
};


/**
 * Handles an event and dispatches it to the correct listeners. This
 * function is a proxy for the real listener the user specified.
 *
 * @param {string} key Unique key for the listener.
 * @param {Event=} opt_evt Optional event object that gets passed in via the
 *     native event handlers.
 * @return {boolean} Result of the event handler.
 * @this {goog.events.EventTarget|Object} The object or Element that
 *     fired the event.
 * @private
 */
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  // If the listener isn't there it was probably removed when processing
  // another listener on the same event (e.g. the later listener is
  // not managed by closure so that they are both fired under IE)
  if (!goog.events.listeners_[key]) {
    return true;
  }

  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;

  if (!(type in map)) {
    return true;
  }
  map = map[type];
  var retval, targetsMap;
  if (goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt ||
        /** @type {Event} */ (goog.getObjectByName('window.event'));

    // Check if we have any capturing event listeners for this type.
    var hasCapture = true in map;
    var hasBubble = false in map;

    if (hasCapture) {
      if (goog.events.isMarkedIeEvent_(ieEvent)) {
        return true;
      }

      goog.events.markIeEvent_(ieEvent);
    }

    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);

    retval = true;
    try {
      if (hasCapture) {
        var ancestors = goog.events.pools.getArray();

        for (var parent = evt.currentTarget;
             parent;
             parent = parent.parentNode) {
          ancestors.push(parent);
        }

        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;

        // Call capture listeners
        for (var i = ancestors.length - 1;
             !evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;
             i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type,
                                               true, evt);
        }

        if (hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;

          // Call bubble listeners
          for (var i = 0;
               !evt.propagationStopped_ && i < ancestors.length &&
               targetsMap.remaining_;
               i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type,
                                                 false, evt);
          }
        }

      } else {
        // Bubbling, let IE handle the propagation.
        retval = goog.events.fireListener(listener, evt);
      }

    } finally {
      if (ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors);
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt);
    }
    return retval;
  } // IE

  // Caught a non-IE DOM event. 1 additional argument which is the event object
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be);
  } finally {
    be.dispose();
  }
  return retval;
};


// Set the callback for the proxy pool. This is done here to prevent circular
// dependencies.
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);


/**
 * This is used to mark the IE event object so we do not do the Closure pass
 * twice for a bubbling event.
 * @param {Event} e The IE browser event.
 * @private
 */
goog.events.markIeEvent_ = function(e) {
  // Only the keyCode and the returnValue can be changed. We use keyCode for
  // non keyboard events.
  // event.returnValue is a bit more tricky. It is undefined by default. A
  // boolean false prevents the default action. In a window.onbeforeunload and
  // the returnValue is non undefined it will be alerted. However, we will only
  // modify the returnValue for keyboard events. We can get a problem if non
  // closure events sets the keyCode or the returnValue

  var useReturnValue = false;

  if (e.keyCode == 0) {
    // We cannot change the keyCode in case that srcElement is input[type=file].
    // We could test that that is the case but that would allocate 3 objects.
    // If we use try/catch we will only allocate extra objects in the case of a
    // failure.
    /** @preserveTry */
    try {
      e.keyCode = -1;
      return;
    } catch (ex) {
      useReturnValue = true;
    }
  }

  if (useReturnValue ||
      /** @type {boolean|undefined} */ (e.returnValue) == undefined) {
    e.returnValue = true;
  }
};


/**
 * This is used to check if an IE event has already been handled by the Closure
 * system so we do not do the Closure pass twice for a bubbling event.
 * @param {Event} e  The IE browser event.
 * @return {boolean} True if the event object has been marked.
 * @private
 * @notypecheck TODO(nicksantos): Fix this.
 */
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined;
};


/**
 * Counter to create unique event ids.
 * @type {number}
 * @private
 */
goog.events.uniqueIdCounter_ = 0;


/**
 * Creates a unique event id.
 *
 * @param {string} identifier The identifier.
 * @return {string} A unique identifier.
 */
goog.events.getUniqueId = function(identifier) {
  return identifier + '_' + goog.events.uniqueIdCounter_++;
};


/**
 * Returns whether we should synthesize the W3C event propagation.  Versions of
 * IE, up to IE9, don't support addEventListener or the capture phase.
 * @return {boolean} Whether to use IE's proprietary event model.
 * @private
 */
goog.events.synthesizeEventPropagation_ = function() {
  if (goog.events.requiresSyntheticEventPropagation_ === undefined) {
    // TODO(user): goog.events is used in a non DOM context, even though it
    // couldn't be used with DOM events.  We therefore assume that if we
    // got here that goog.global===window to keep the compiler happy.  We can't
    // use navigator.userAgent yet because the IE9 platform preview still
    // reports as MSIE 8.0.
    goog.events.requiresSyntheticEventPropagation_ =
        goog.userAgent.IE && !goog.global['addEventListener'];
  }
  return goog.events.requiresSyntheticEventPropagation_;
};

// Input 36
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Constant declarations for common key codes.
 *
*
 * @see ../demos/keyhandler.html
 */

goog.provide('goog.events.KeyCodes');

goog.require('goog.userAgent');


/**
 * Key codes for common characters.
 *
 * This list is not localized and therefor some of the key codes are not correct
 * for non US keyboard layouts. See comments below.
 *
 * @enum {number}
 */
goog.events.KeyCodes = {
  MAC_ENTER: 3,
  BACKSPACE: 8,
  TAB: 9,
  NUM_CENTER: 12,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPS_LOCK: 20,
  ESC: 27,
  SPACE: 32,
  PAGE_UP: 33,     // also NUM_NORTH_EAST
  PAGE_DOWN: 34,   // also NUM_SOUTH_EAST
  END: 35,         // also NUM_SOUTH_WEST
  HOME: 36,        // also NUM_NORTH_WEST
  LEFT: 37,        // also NUM_WEST
  UP: 38,          // also NUM_NORTH
  RIGHT: 39,       // also NUM_EAST
  DOWN: 40,        // also NUM_SOUTH
  PRINT_SCREEN: 44,
  INSERT: 45,      // also NUM_INSERT
  DELETE: 46,      // also NUM_DELETE
  ZERO: 48,
  ONE: 49,
  TWO: 50,
  THREE: 51,
  FOUR: 52,
  FIVE: 53,
  SIX: 54,
  SEVEN: 55,
  EIGHT: 56,
  NINE: 57,
  QUESTION_MARK: 63, // needs localization
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  META: 91,
  CONTEXT_MENU: 93,
  NUM_ZERO: 96,
  NUM_ONE: 97,
  NUM_TWO: 98,
  NUM_THREE: 99,
  NUM_FOUR: 100,
  NUM_FIVE: 101,
  NUM_SIX: 102,
  NUM_SEVEN: 103,
  NUM_EIGHT: 104,
  NUM_NINE: 105,
  NUM_MULTIPLY: 106,
  NUM_PLUS: 107,
  NUM_MINUS: 109,
  NUM_PERIOD: 110,
  NUM_DIVISION: 111,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUMLOCK: 144,
  SEMICOLON: 186,            // needs localization
  DASH: 189,                 // needs localization
  EQUALS: 187,               // needs localization
  COMMA: 188,                // needs localization
  PERIOD: 190,               // needs localization
  SLASH: 191,                // needs localization
  APOSTROPHE: 192,           // needs localization
  SINGLE_QUOTE: 222,         // needs localization
  OPEN_SQUARE_BRACKET: 219,  // needs localization
  BACKSLASH: 220,            // needs localization
  CLOSE_SQUARE_BRACKET: 221, // needs localization
  WIN_KEY: 224,
  MAC_FF_META: 224, // Firefox (Gecko) fires this for the meta key instead of 91
  WIN_IME: 229
};


/**
 * Returns true if the event contains a text modifying key
 * @param {goog.events.BrowserEvent} e A key event.
 * @return {boolean} Whether it's a text modifying key.
 */
goog.events.KeyCodes.isTextModifyingKeyEvent = function(e) {
  if (e.altKey && !e.ctrlKey ||
      e.metaKey ||
      // Function keys don't generate text
      e.keyCode >= goog.events.KeyCodes.F1 &&
      e.keyCode <= goog.events.KeyCodes.F12) {
    return false;
  }

  // The following keys are quite harmless, even in combination with
  // CTRL, ALT or SHIFT.
  switch (e.keyCode) {
    case goog.events.KeyCodes.ALT:
    case goog.events.KeyCodes.SHIFT:
    case goog.events.KeyCodes.CTRL:
    case goog.events.KeyCodes.PAUSE:
    case goog.events.KeyCodes.CAPS_LOCK:
    case goog.events.KeyCodes.ESC:
    case goog.events.KeyCodes.PAGE_UP:
    case goog.events.KeyCodes.PAGE_DOWN:
    case goog.events.KeyCodes.HOME:
    case goog.events.KeyCodes.END:
    case goog.events.KeyCodes.LEFT:
    case goog.events.KeyCodes.RIGHT:
    case goog.events.KeyCodes.UP:
    case goog.events.KeyCodes.DOWN:
    case goog.events.KeyCodes.INSERT:
    case goog.events.KeyCodes.NUMLOCK:
    case goog.events.KeyCodes.CONTEXT_MENU:
    case goog.events.KeyCodes.PRINT_SCREEN:
      return false;
    default:
      return true;
  }
};


/**
 * Returns true if the key fires a keypress event in the current browser.
 *
 * Accoridng to MSDN [1] IE only fires keypress events for the following keys:
 * - Letters: A - Z (uppercase and lowercase)
 * - Numerals: 0 - 9
 * - Symbols: ! @ # $ % ^ & * ( ) _ - + = < [ ] { } , . / ? \ | ' ` " ~
 * - System: ESC, SPACEBAR, ENTER
 *
 * That's not entirely correct though, for instance there's no distinction
 * between upper and lower case letters.
 *
 * [1] http://msdn2.microsoft.com/en-us/library/ms536939(VS.85).aspx)
 *
 * Safari is similar to IE, but does not fire keypress for ESC.
 *
 * Additionally, IE6 does not fire keydown or keypress events for letters when
 * the control or alt keys are held down and the shift key is not. IE7 does
 * fire keydown in these cases, though, but not keypress.
 *
 * @param {number} keyCode A key code.
 * @param {number=} opt_heldKeyCode Key code of a currently-held key.
 * @param {boolean=} opt_shiftKey Whether the shift key is held down.
 * @param {boolean=} opt_ctrlKey Whether the control key is held down.
 * @param {boolean=} opt_altKey Whether the alt key is held down.
 * @return {boolean} Whether it's a key that fires a keypress event.
 */
goog.events.KeyCodes.firesKeyPressEvent = function(keyCode, opt_heldKeyCode,
    opt_shiftKey, opt_ctrlKey, opt_altKey) {
  if (!goog.userAgent.IE &&
      !(goog.userAgent.WEBKIT && goog.userAgent.isVersion('525'))) {
    return true;
  }

  if (goog.userAgent.MAC && opt_altKey) {
    return goog.events.KeyCodes.isCharacterKey(keyCode);
  }

  // Alt but not AltGr which is represented as Alt+Ctrl.
  if (opt_altKey && !opt_ctrlKey) {
    return false;
  }

  // Saves Ctrl or Alt + key for IE7, which won't fire keypress.
  if (goog.userAgent.IE &&
      !opt_shiftKey &&
      (opt_heldKeyCode == goog.events.KeyCodes.CTRL ||
       opt_heldKeyCode == goog.events.KeyCodes.ALT)) {
    return false;
  }

  // When Ctrl+<somekey> is held in IE, it only fires a keypress once, but it
  // continues to fire keydown events as the event repeats.
  if (goog.userAgent.IE && opt_ctrlKey && opt_heldKeyCode == keyCode) {
    return false;
  }

  switch (keyCode) {
    case goog.events.KeyCodes.ENTER:
      return true;
    case goog.events.KeyCodes.ESC:
      return !goog.userAgent.WEBKIT;
  }

  return goog.events.KeyCodes.isCharacterKey(keyCode);
};


/**
 * Returns true if the key produces a character.
 *
 * @param {number} keyCode A key code.
 * @return {boolean} Whether it's a character key.
 */
goog.events.KeyCodes.isCharacterKey = function(keyCode) {
  if (keyCode >= goog.events.KeyCodes.ZERO &&
      keyCode <= goog.events.KeyCodes.NINE) {
    return true;
  }

  if (keyCode >= goog.events.KeyCodes.NUM_ZERO &&
      keyCode <= goog.events.KeyCodes.NUM_MULTIPLY) {
    return true;
  }

  if (keyCode >= goog.events.KeyCodes.A &&
      keyCode <= goog.events.KeyCodes.Z) {
    return true;
  }

  switch (keyCode) {
    case goog.events.KeyCodes.SPACE:
    case goog.events.KeyCodes.QUESTION_MARK:
    case goog.events.KeyCodes.NUM_PLUS:
    case goog.events.KeyCodes.NUM_MINUS:
    case goog.events.KeyCodes.NUM_PERIOD:
    case goog.events.KeyCodes.NUM_DIVISION:
    case goog.events.KeyCodes.SEMICOLON:
    case goog.events.KeyCodes.DASH:
    case goog.events.KeyCodes.EQUALS:
    case goog.events.KeyCodes.COMMA:
    case goog.events.KeyCodes.PERIOD:
    case goog.events.KeyCodes.SLASH:
    case goog.events.KeyCodes.APOSTROPHE:
    case goog.events.KeyCodes.SINGLE_QUOTE:
    case goog.events.KeyCodes.OPEN_SQUARE_BRACKET:
    case goog.events.KeyCodes.BACKSLASH:
    case goog.events.KeyCodes.CLOSE_SQUARE_BRACKET:
      return true;
    default:
      return false;
  }
};

// Input 37
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for adding, removing and setting ARIA roles
 * as defined by W3C ARIA Working Draft:
 *     http://www.w3.org/TR/2008/WD-wai-aria-20080806/
 * At this time Firefox 3.0 is the only browser that has good support for ARIA;
 * IE8 (beta) has partial support, while Opera and WebKit implementations
 * are forthcoming. An application could call
 * <code>goog.dom.a11y.setNoBrowserCheck</code> with true to turn on ARIA
 * support for all browsers.
 *
*
 */
goog.provide('goog.dom.a11y');
goog.provide('goog.dom.a11y.Role');
goog.provide('goog.dom.a11y.State');

goog.require('goog.dom');
goog.require('goog.userAgent');


/**
 * Enumeration of ARIA states.
 * More will be added later.
 * @enum {string}
 */
goog.dom.a11y.State = {
  // ARIA state for setting the currently active descendant of an element.
  ACTIVEDESCENDANT: 'activedescendant',
  // ARIA state to specify how input completion is provided.
  AUTOCOMPLETE: 'autocomplete',
  // ARIA state for a checked item.
  CHECKED: 'checked',
  // ARIA state for a disabled item.
  DISABLED: 'disabled',
  // ARIA state for setting whether the element like a tree node is expanded.
  EXPANDED: 'expanded',
  // ARIA state for whether the element has a popup
  HASPOPUP: 'haspopup',
  // ARIA state for setting the element which labels another element.
  LABELLEDBY: 'labelledby',
  // ARIA state for setting the level of an element in the hierarchy
  LEVEL: 'level',
  // ARIA state for a pressed item.
  PRESSED: 'pressed',
  // ARIA state for setting the currently selected item in the list.
  SELECTED: 'selected',
  // ARIA state for slider maximum value.
  VALUEMAX: 'valuemax',
  // ARIA state for slider minimum value.
  VALUEMIN: 'valuemin',
  // ARIA state for slider active value.
  VALUENOW: 'valuenow',
  // ARIA state for slider active value represented as text.
  VALUETEXT: 'valuetext'
};


/**
 * Enumeration of ARIA roles.
 * @enum {string}
 */
goog.dom.a11y.Role = {
  // ARIA role for a button element.
  BUTTON: 'button',
  // ARIA role for a checkbox button element.
  CHECKBOX: 'checkbox',
  // ARIA role for a combobox element.
  COMBOBOX: 'combobox',
  // ARIA role for a dialog element.
  DIALOG: 'dialog',
  // ARIA role for link.
  LINK: 'link',
  // ARIA role for listbox.
  LISTBOX: 'listbox',
  // ARIA role for popup menu, submenu elements etc.
  MAIN: 'main',
  // ARIA role for main content in a document.
  MENU: 'menu',
  // ARIA role for a menubar element containing menu elements.
  MENUBAR: 'menubar',
  // ARIA role for menu item elements.
  MENU_ITEM: 'menuitem',
  // ARIA role for a checkbox box element inside a menu.
  MENU_ITEM_CHECKBOX: 'menuitemcheckbox',
  // ARIA role for a radio button element inside a menu.
  MENU_ITEM_RADIO: 'menuitemradio',
  // ARIA role for option items, generally used with a parent of listbox.
  NAVIGATION: 'navigation',
  // ARIA role for a collection of links suitable for use when navigating
  // the document or related documents.
  OPTION: 'option',
  // ARIA role for a group of elements like a group of radio buttons,
  // a form, etc.
  GROUP: 'group',
  // ARIA role for a slider.
  SLIDER: 'slider',
  // ARIA role for a tab button.
  TAB: 'tab',
  // ARIA role for a tab bar (i.e. a list of tab buttons).
  TAB_LIST: 'tablist',
  // ARIA role for a tab page (i.e. the element holding tab contents).
  TAB_PANEL: 'tabpanel',
  // ARIA role for a toolbar element.
  TOOLBAR: 'toolbar'
};


/**
 * Flag for skipping browser check while adding ARIA roles and states.
 * @private
 * @type {boolean}
 */
goog.dom.a11y.noBrowserCheck_;


/**
 * Sets the role of an element.
 * @param {Element} element DOM node to set role of.
 * @param {string} roleName role name(s).
 */
goog.dom.a11y.setRole = function(element, roleName) {
  if (goog.userAgent.GECKO || goog.dom.a11y.noBrowserCheck_) {
    element.setAttribute('role', roleName);
    element.roleName = roleName;
  }
};


/**
 * Gets role of an element.
 * @param {Element} element DOM node to get role of.
 * @return {string} rolename.
 */
goog.dom.a11y.getRole = function(element) {
  return element.roleName || '';
};


/**
 * Sets the state of an element.
 * @param {Element} element DOM node where we set state.
 * @param {string} state State attribute being set. Automatically adds prefix
 *     'aria-' to the state name.
 * @param {string|boolean|number} value Value for the state attribute.
 */
goog.dom.a11y.setState = function(element, state, value) {
  if (goog.userAgent.GECKO || goog.dom.a11y.noBrowserCheck_) {
    element.setAttribute('aria-' + state, value);
  }
};


/**
 * Gets value of specified state property.
 * @param {Element} element DOM node to get state from.
 * @param {string} stateName State name.
 * @return {string} Value of the state attribute.
 */
goog.dom.a11y.getState = function(element, stateName) {
  return element.getAttribute('aria-' + stateName) || '';
};


/**
 * Getter for noBrowserCheck_ flag.
 * @return {boolean} Value of the noBrowserCheck_ flag.
 */
goog.dom.a11y.getNoBrowserCheck = function() {
  return !!goog.dom.a11y.noBrowserCheck_;
};


/**
 * Sets a flag to skip browser check while adding ARIA roles and states.
 * @param {boolean} noBrowserCheck True if no browser check should be performed.
 */
goog.dom.a11y.setNoBrowserCheck = function(noBrowserCheck) {
  goog.dom.a11y.noBrowserCheck_ = noBrowserCheck;
};


/**
 * Gets the activedescendant of the given element.
 * @param {Element} element DOM node to get activedescendant from.
 * @return {Element} DOM node of the activedescendant.
 */
goog.dom.a11y.getActiveDescendant = function(element) {
  var id = goog.dom.a11y.getState(
      element, goog.dom.a11y.State.ACTIVEDESCENDANT);
  return goog.dom.getOwnerDocument(element).getElementById(id);
};


/**
 * Sets the activedescendant value for an element.
 * @param {Element} element DOM node to set activedescendant to.
 * @param {Element} activeElement DOM node being set as activedescendant.
 */
goog.dom.a11y.setActiveDescendant = function(element, activeElement) {
  goog.dom.a11y.setState(element, goog.dom.a11y.State.ACTIVEDESCENDANT,
      activeElement ? activeElement.id : '');
};

// Input 38
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Class to create objects which want to handle multiple events
 * and have their listeners easily cleaned up via a dispose method.
 *
 * Example:
 * <pre>
 * function Something() {
 *   goog.events.EventHandler.call(this);
 *
 *   ... set up object ...
 *
 *   // Add event listeners
 *   this.listen(this.starEl, 'click', this.handleStar);
 *   this.listen(this.headerEl, 'click', this.expand);
 *   this.listen(this.collapseEl, 'click', this.collapse);
 *   this.listen(this.infoEl, 'mouseover', this.showHover);
 *   this.listen(this.infoEl, 'mouseout', this.hideHover);
 * }
 * goog.inherits(Something, goog.events.EventHandler);
 *
 * Something.prototype.disposeInternal = function() {
 *   Something.superClass_.disposeInternal.call(this);
 *   goog.dom.removeNode(this.container);
 * };
 *
 *
 * // Then elsewhere:
 *
 * var activeSomething = null;
 * function openSomething() {
 *   activeSomething = new Something();
 * }
 *
 * function closeSomething() {
 *   if (activeSomething) {
 *     activeSomething.dispose();  // Remove event listeners
 *     activeSomething = null;
 *   }
 * }
 * </pre>
 *
*
 */

goog.provide('goog.events.EventHandler');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.events.EventWrapper');
goog.require('goog.object');
goog.require('goog.structs.SimplePool');


/**
 * Super class for objects that want to easily manage a number of event
 * listeners.  It allows a short cut to listen and also provides a quick way
 * to remove all events listeners belonging to this object. It is optimized to
 * use less objects if only one event is being listened to, but if that's the
 * case, it may not be worth using the EventHandler anyway.
 * @param {Object=} opt_handler Object in whose scope to call the listeners.
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.EventHandler = function(opt_handler) {
  this.handler_ = opt_handler;
};
goog.inherits(goog.events.EventHandler, goog.Disposable);


/**
 * Initial count for the keyPool_
 * @type {number}
 */
goog.events.EventHandler.KEY_POOL_INITIAL_COUNT = 0;


/**
 * Max count for the keyPool_
 * @type {number}
 */
goog.events.EventHandler.KEY_POOL_MAX_COUNT = 100;


/**
 * SimplePool to cache the key object. This was implemented to make IE6
 * performance better and removed an object allocation in the listen method
 * when in steady state.
 * @type {goog.structs.SimplePool}
 * @private
 */
goog.events.EventHandler.keyPool_ = new goog.structs.SimplePool(
    goog.events.EventHandler.KEY_POOL_INITIAL_COUNT,
    goog.events.EventHandler.KEY_POOL_MAX_COUNT);


/**
 * Keys for events that are being listened to. This is used once there are more
 * than one event to listen to. If there is only one event to listen to, key_
 * is used.
 * @type {Object}
 * @private
 */
goog.events.EventHandler.keys_ = null;


/**
 * Keys for event that is being listened to if only one event is being listened
 * to. This is a performance optimization to avoid creating an extra object
 * if not necessary.
 * @type {?string}
 * @private
 */
goog.events.EventHandler.key_ = null;


/**
 * Listen to an event on a DOM node or EventTarget.  If the function is omitted
 * then the EventHandler's handleEvent method will be used.
 * @param {goog.events.EventTarget|EventTarget} src Event source.
 * @param {string|Array.<string>} type Event type to listen for or array of
 *     event types.
 * @param {Function|Object=} opt_fn Optional callback function to be used as the
 *    listener or an object with handleEvent function.
 * @param {boolean=} opt_capture Optional whether to use capture phase.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.listen = function(src, type, opt_fn,
                                                     opt_capture,
                                                     opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      this.listen(src, type[i], opt_fn, opt_capture, opt_handler);
    }
  } else {
    var key = (/** @type {number} */
        goog.events.listen(src, type, opt_fn || this,
                           opt_capture || false,
                           opt_handler || this.handler_ || this));
    this.recordListenerKey_(key);
  }

  return this;
};


/**
 * Listen to an event on a DOM node or EventTarget.  If the function is omitted
 * then the EventHandler's handleEvent method will be used. After the event has
 * fired the event listener is removed from the target. If an array of event
 * types is provided, each event type will be listened to once.
 * @param {goog.events.EventTarget|EventTarget} src Event source.
 * @param {string|Array.<string>} type Event type to listen for or array of
 *     event types.
 * @param {Function|Object=} opt_fn Optional callback function to be used as the
 *    listener or an object with handleEvent function.
 * @param {boolean=} opt_capture Optional whether to use capture phase.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.listenOnce = function(src, type, opt_fn,
                                                         opt_capture,
                                                         opt_handler) {
  if (goog.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      this.listenOnce(src, type[i], opt_fn, opt_capture, opt_handler);
    }
  } else {
    var key = (/** @type {number} */
        goog.events.listenOnce(src, type, opt_fn || this,
                               opt_capture || false,
                               opt_handler || this.handler_ || this));
    this.recordListenerKey_(key);
  }

  return this;
};


/**
 * Adds an event listener with a specific event wrapper on a DOM Node or an
 * object that has implemented {@link goog.events.EventTarget}. A listener can
 * only be added once to an object.
 *
 * @param {EventTarget|goog.events.EventTarget} src The node to listen to
 *     events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener Callback method, or an object with a
 *     handleEvent function.
 * @param {boolean=} opt_capt Whether to fire in capture phase (defaults to
 *     false).
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.listenWithWrapper = function(src, wrapper,
    listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this;
};


/**
 * Record the key returned for the listener so that it can be user later
 * to remove the listener.
 * @param {number} key Unique key for the listener.
 * @private
 */
goog.events.EventHandler.prototype.recordListenerKey_ = function(key) {
  if (this.keys_) {
    // already have multiple keys
    this.keys_[key] = true;
  } else if (this.key_) {
    // going from one key to multiple - must now use object as map
    this.keys_ = goog.events.EventHandler.keyPool_.getObject();
    this.keys_[this.key_] = true;
    this.key_ = null;
    this.keys_[key] = true;
  } else {
    // first key - can use single key
    this.key_ = key;
  }
};


/**
 * Unlistens on an event.
 * @param {goog.events.EventTarget|EventTarget} src Event source.
 * @param {string|Array.<string>} type Event type to listen for.
 * @param {Function|Object=} opt_fn Optional callback function to be used as the
 *    listener or an object with handleEvent function.
 * @param {boolean=} opt_capture Optional whether to use capture phase.
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.unlisten = function(src, type, opt_fn,
                                                       opt_capture,
                                                       opt_handler) {
  if (this.key_ || this.keys_) {
    if (goog.isArray(type)) {
      for (var i = 0; i < type.length; i++) {
        this.unlisten(src, type[i], opt_fn, opt_capture, opt_handler);
      }
    } else {
      var listener = goog.events.getListener(src, type, opt_fn || this,
          opt_capture || false, opt_handler || this.handler_ || this);

      if (listener) {
        var key = listener.key;
        goog.events.unlistenByKey(key);

        if (this.keys_) {
          goog.object.remove(this.keys_, key);
        } else if (this.key_ == key) {
          this.key_ = null;
        }
      }
    }
  }

  return this;
};


/**
 * Removes an event listener which was added with listenWithWrapper().
 *
 * @param {EventTarget|goog.events.EventTarget} src The target to stop
 *     listening to events on.
 * @param {goog.events.EventWrapper} wrapper Event wrapper to use.
 * @param {Function|Object} listener The listener function to remove.
 * @param {boolean=} opt_capt In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase of the
 *     event.
 * @param {Object=} opt_handler Element in whose scope to call the listener.
 * @return {goog.events.EventHandler} This object, allowing for chaining of
 *     calls.
 */
goog.events.EventHandler.prototype.unlistenWithWrapper = function(src, wrapper,
    listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler || this.handler_, this);
  return this;
};


/**
 * Unlistens to all events.
 */
goog.events.EventHandler.prototype.removeAll = function() {
  if (this.keys_) {
    for (var key in this.keys_) {
      goog.events.unlistenByKey((/** @type {number} */ key));
      // Clean the keys before returning object to the pool.
      delete this.keys_[key];
    }
    goog.events.EventHandler.keyPool_.releaseObject(this.keys_);
    this.keys_ = null;

  } else if (this.key_) {
    goog.events.unlistenByKey(this.key_);
  }
};


/**
 * Disposes of this EventHandler and remove all listeners that it registered.
 */
goog.events.EventHandler.prototype.disposeInternal = function() {
  goog.events.EventHandler.superClass_.disposeInternal.call(this);
  this.removeAll();
};


/**
 * Default event handler
 * @param {goog.events.Event} e Event object.
 */
goog.events.EventHandler.prototype.handleEvent = function(e) {
  throw Error('EventHandler.handleEvent not implemented');
};

// Input 39
// Copyright 2005 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Implementation of EventTarget as defined by W3C DOM 2/3.
 *
*
*
 * @see ../demos/eventtarget.html
 */

/**
 * Namespace for events
 */
goog.provide('goog.events.EventTarget');

goog.require('goog.Disposable');
goog.require('goog.events');


/**
 * This implements the EventTarget interface as defined by W3C DOM 2/3. The
 * main difference from the spec is that the this does not know about event
 * propagation and therefore the flag whether to use bubbling or capturing is
 * not used.
 *
 * Another difference is that event objects do not really have to implement
 * the Event interface. An object is treated as an event object if it has a
 * type property.
 *
 * It also allows you to pass a string instead of an event object and in that
 * case an event like object is created with the type set to the string value.
 *
 * Unless propagation is stopped, events dispatched by an EventTarget bubble
 * to its parent event target, returned by <code>getParentEventTarget</code>.
 * To set the parent event target, call <code>setParentEventTarget</code> or
 * override <code>getParentEventTarget</code> in a subclass.  Subclasses that
 * don't support changing the parent event target should override the setter
 * to throw an error.
 *
 * Example usage:
 * <pre>
 *   var et = new goog.events.EventTarget;
 *   function f(e) {
 *      alert("Type: " + e.type + "\nTarget: " + e.target);
 *   }
 *   et.addEventListener("foo", f);
 *   ...
 *   et.dispatchEvent({type: "foo"}); // will call f
 *   // or et.dispatchEvent("foo");
 *   ...
 *   et.removeEventListener("foo", f);
 *
 *  // You can also use the EventHandler interface:
 *  var eh = {
 *    handleEvent: function(e) {
 *      ...
 *    }
 *  };
 *  et.addEventListener("bar", eh);
 * </pre>
 *
 * @constructor
 * @extends {goog.Disposable}
 */
goog.events.EventTarget = function() {
  goog.Disposable.call(this);
};
goog.inherits(goog.events.EventTarget, goog.Disposable);


/**
 * Used to tell if an event is a real event in goog.events.listen() so we don't
 * get listen() calling addEventListener() and vice-versa.
 * @type {boolean}
 * @private
 */
goog.events.EventTarget.prototype.customEvent_ = true;


/**
 * Parent event target, used during event bubbling.
 * @type {goog.events.EventTarget?}
 * @private
 */
goog.events.EventTarget.prototype.parentEventTarget_ = null;


/**
 * Returns the parent of this event target to use for bubbling.
 *
 * @return {goog.events.EventTarget} The parent EventTarget or null if there
 * is no parent.
 */
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_;
};


/**
 * Sets the parent of this event target to use for bubbling.
 *
 * @param {goog.events.EventTarget?} parent Parent EventTarget (null if none).
 */
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent;
};


/**
 * Adds an event listener to the event target. The same handler can only be
 * added once per the type. Even if you add the same handler multiple times
 * using the same type then it will only be called once when the event is
 * dispatched.
 *
 * Supported for legacy but use goog.events.listen(src, type, handler) instead.
 *
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} handler The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @param {Object=} opt_handlerScope Object in whose scope to call the listener.
 */
goog.events.EventTarget.prototype.addEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope);
};


/**
 * Removes an event listener from the event target. The handler must be the
 * same object as the one added. If the handler has not been added then
 * nothing is done.
 * @param {string} type The type of the event to listen for.
 * @param {Function|Object} handler The function to handle the event. The
 *     handler can also be an object that implements the handleEvent method
 *     which takes the event object as argument.
 * @param {boolean=} opt_capture In DOM-compliant browsers, this determines
 *     whether the listener is fired during the capture or bubble phase
 *     of the event.
 * @param {Object=} opt_handlerScope Object in whose scope to call the listener.
 */
goog.events.EventTarget.prototype.removeEventListener = function(
    type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope);
};


/**
 * Dispatches an event (or event like object) and calls all listeners
 * listening for events of this type. The type of the event is decided by the
 * type property on the event object.
 *
 * If any of the listeners returns false OR calls preventDefault then this
 * function will return false.  If one of the capture listeners calls
 * stopPropagation, then the bubble listeners won't fire.
 *
 * @param {string|Object|goog.events.Event} e Event object.
 * @return {boolean} If anyone called preventDefault on the event object (or
 *     if any of the handlers returns false this will also return false.
 */
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e);
};


/**
 * Unattach listeners from this object.  Classes that extend EventTarget may
 * need to override this method in order to remove references to DOM Elements
 * and additional listeners, it should be something like this:
 * <pre>
 * MyClass.prototype.disposeInternal = function() {
 *   MyClass.superClass_.disposeInternal.call(this);
 *   // Dispose logic for MyClass
 * };
 * </pre>
 * @protected
 */
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null;
};

// Input 40
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Generator for unique element IDs.
 *
*
 */

goog.provide('goog.ui.IdGenerator');


/**
 * Creates a new id generator.
 * @constructor
 */
goog.ui.IdGenerator = function() {
};
goog.addSingletonGetter(goog.ui.IdGenerator);

/**
 * Next unique ID to use
 * @type {number}
 * @private
 */
goog.ui.IdGenerator.prototype.nextId_ = 0;


/**
 * Gets the next unique ID.
 * @return {string} The next unique identifier.
 */
goog.ui.IdGenerator.prototype.getNextUniqueId = function() {
  return ':' + (this.nextId_++).toString(36);
};

/**
 * Default instance for id generation. Done as an instance instead of statics
 * so it's possible to inject a mock for unit testing purposes.
 * @type {goog.ui.IdGenerator}
 * @deprecated Use goog.ui.IdGenerator.getInstance() instead and do not refer
 * to goog.ui.IdGenerator.instance anymore.
 */
goog.ui.IdGenerator.instance = goog.ui.IdGenerator.getInstance();

// Input 41
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Abstract class for all UI components. This defines the standard
 * design pattern that all UI components should follow.
 *
*
*
*
*
 * @see ../demos/samplecomponent.html
 */

goog.provide('goog.ui.Component');
goog.provide('goog.ui.Component.Error');
goog.provide('goog.ui.Component.EventType');
goog.provide('goog.ui.Component.State');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.DomHelper');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.IdGenerator');


/**
 * Default implementation of UI component.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.ui.Component = function(opt_domHelper) {
  goog.events.EventTarget.call(this);
  this.dom_ = opt_domHelper || goog.dom.getDomHelper();

  // Set the defalt right to left value.
  this.rightToLeft_ = goog.ui.Component.defaultRightToLeft_;
};
goog.inherits(goog.ui.Component, goog.events.EventTarget);


/**
 * Generator for unique IDs.
 * @type {goog.ui.IdGenerator}
 * @private
 */
goog.ui.Component.prototype.idGenerator_ = goog.ui.IdGenerator.getInstance();


/**
 * The default right to left value.
 * @type {?boolean}
 * @private
 */
goog.ui.Component.defaultRightToLeft_ = null;


/**
 * Common events fired by components so that event propagation is useful.  Not
 * all components are expected to dispatch or listen for all event types.
 * Events dispatched before a state transition should be cancelable to prevent
 * the corresponding state change.
 * @enum {string}
 */
goog.ui.Component.EventType = {
  /** Dispatched before the component becomes visible. */
  BEFORE_SHOW: 'beforeshow',

  /**
   * Dispatched after the component becomes visible.
   * NOTE(user): For goog.ui.Container, this actually fires before containers
   * are shown.  Use goog.ui.Container.EventType.AFTER_SHOW if you want an event
   * that fires after a goog.ui.Container is shown.
   */
  SHOW: 'show',

  /** Dispatched before the component becomes hidden. */
  HIDE: 'hide',

  /** Dispatched before the component becomes disabled. */
  DISABLE: 'disable',

  /** Dispatched before the component becomes enabled. */
  ENABLE: 'enable',

  /** Dispatched before the component becomes highlighted. */
  HIGHLIGHT: 'highlight',

  /** Dispatched before the component becomes un-highlighted. */
  UNHIGHLIGHT: 'unhighlight',

  /** Dispatched before the component becomes activated. */
  ACTIVATE: 'activate',

  /** Dispatched before the component becomes deactivated. */
  DEACTIVATE: 'deactivate',

  /** Dispatched before the component becomes selected. */
  SELECT: 'select',

  /** Dispatched before the component becomes un-selected. */
  UNSELECT: 'unselect',

  /** Dispatched before a component becomes checked. */
  CHECK: 'check',

  /** Dispatched before a component becomes un-checked. */
  UNCHECK: 'uncheck',

  /** Dispatched before a component becomes focused. */
  FOCUS: 'focus',

  /** Dispatched before a component becomes blurred. */
  BLUR: 'blur',

  /** Dispatched before a component is opened (expanded). */
  OPEN: 'open',

  /** Dispatched before a component is closed (collapsed). */
  CLOSE: 'close',

  /** Dispatched after a component is moused over. */
  ENTER: 'enter',

  /** Dispatched after a component is moused out of. */
  LEAVE: 'leave',

  /** Dispatched after the user activates the component. */
  ACTION: 'action',

  /** Dispatched after the external-facing state of a component is changed. */
  CHANGE: 'change'
};


/**
 * Errors thrown by the component.
 * @enum {string}
 */
goog.ui.Component.Error = {
  /**
   * Error when a method is not supported.
   */
  NOT_SUPPORTED: 'Method not supported',

  /**
   * Error when the given element can not be decorated.
   */
  DECORATE_INVALID: 'Invalid element to decorate',

  /**
   * Error when the component is already rendered and another render attempt is
   * made.
   */
  ALREADY_RENDERED: 'Component already rendered',

  /**
   * Error when an attempt is made to set the parent of a component in a way
   * that would result in an inconsistent object graph.
   */
  PARENT_UNABLE_TO_BE_SET: 'Unable to set parent component',

  /**
   * Error when an attempt is made to add a child component at an out-of-bounds
   * index.  We don't support sparse child arrays.
   */
  CHILD_INDEX_OUT_OF_BOUNDS: 'Child component index out of bounds',

  /**
   * Error when an attempt is made to remove a child component from a component
   * other than its parent.
   */
  NOT_OUR_CHILD: 'Child is not in parent component',

  /**
   * Error when an operation requiring DOM interaction is made when the
   * component is not in the document
   */
  NOT_IN_DOCUMENT: 'Operation not supported while component is not in document',

  /**
   * Error when an invalid component state is encountered.
   */
  STATE_INVALID: 'Invalid component state'
};


/**
 * Common component states.  Components may have distinct appearance depending
 * on what state(s) apply to them.  Not all components are expected to support
 * all states.
 * @enum {number}
 */
goog.ui.Component.State = {
  /**
   * Union of all supported component states.
   */
  ALL: 0xFF,

  /**
   * Component is disabled.
   * @see goog.ui.Component.EventType.DISABLE
   * @see goog.ui.Component.EventType.ENABLE
   */
  DISABLED: 0x01,

  /**
   * Component is highlighted.
   * @see goog.ui.Component.EventType.HIGHLIGHT
   * @see goog.ui.Component.EventType.UNHIGHLIGHT
   */
  HOVER: 0x02,

  /**
   * Component is active (or "pressed").
   * @see goog.ui.Component.EventType.ACTIVATE
   * @see goog.ui.Component.EventType.DEACTIVATE
   */
  ACTIVE: 0x04,

  /**
   * Component is selected.
   * @see goog.ui.Component.EventType.SELECT
   * @see goog.ui.Component.EventType.UNSELECT
   */
  SELECTED: 0x08,

  /**
   * Component is checked.
   * @see goog.ui.Component.EventType.CHECK
   * @see goog.ui.Component.EventType.UNCHECK
   */
  CHECKED: 0x10,

  /**
   * Component has focus.
   * @see goog.ui.Component.EventType.FOCUS
   * @see goog.ui.Component.EventType.BLUR
   */
  FOCUSED: 0x20,

  /**
   * Component is opened (expanded).  Applies to tree nodes, menu buttons,
   * submenus, zippys (zippies?), etc.
   * @see goog.ui.Component.EventType.OPEN
   * @see goog.ui.Component.EventType.CLOSE
   */
  OPENED: 0x40
};


/**
 * Static helper method; returns the type of event components are expected to
 * dispatch when transitioning to or from the given state.
 * @param {goog.ui.Component.State} state State to/from which the component
 *     is transitioning.
 * @param {boolean} isEntering Whether the component is entering or leaving the
 *     state.
 * @return {goog.ui.Component.EventType} Event type to dispatch.
 */
goog.ui.Component.getStateTransitionEvent = function(state, isEntering) {
  switch (state) {
    case goog.ui.Component.State.DISABLED:
      return isEntering ? goog.ui.Component.EventType.DISABLE :
          goog.ui.Component.EventType.ENABLE;
    case goog.ui.Component.State.HOVER:
      return isEntering ? goog.ui.Component.EventType.HIGHLIGHT :
          goog.ui.Component.EventType.UNHIGHLIGHT;
    case goog.ui.Component.State.ACTIVE:
      return isEntering ? goog.ui.Component.EventType.ACTIVATE :
          goog.ui.Component.EventType.DEACTIVATE;
    case goog.ui.Component.State.SELECTED:
      return isEntering ? goog.ui.Component.EventType.SELECT :
          goog.ui.Component.EventType.UNSELECT;
    case goog.ui.Component.State.CHECKED:
      return isEntering ? goog.ui.Component.EventType.CHECK :
          goog.ui.Component.EventType.UNCHECK;
    case goog.ui.Component.State.FOCUSED:
      return isEntering ? goog.ui.Component.EventType.FOCUS :
          goog.ui.Component.EventType.BLUR;
    case goog.ui.Component.State.OPENED:
      return isEntering ? goog.ui.Component.EventType.OPEN :
          goog.ui.Component.EventType.CLOSE;
    default:
      // Fall through.
  }

  // Invalid state.
  throw Error(goog.ui.Component.Error.STATE_INVALID);
};


/**
 * Set the default right-to-left value. This causes all component's created from
 * this point foward to have the given value. This is useful for cases where
 * a given page is always in one directionality, avoiding unnecessary
 * right to left determinations.
 * @param {?boolean} rightToLeft Whether the components should be rendered
 *     right-to-left. Null iff components should determine their directionality.
 */
goog.ui.Component.setDefaultRightToLeft = function(rightToLeft) {
  goog.ui.Component.defaultRightToLeft_ = rightToLeft;
};


/**
 * Unique ID of the component, lazily initialized in {@link
 * goog.ui.Component#getId} if needed.  This property is strictly private and
 * must not be accessed directly outside of this class!
 * @type {?string}
 * @private
 */
goog.ui.Component.prototype.id_ = null;


/**
 * DomHelper used to interact with the document, allowing components to be
 * created in a different window.
 * @type {goog.dom.DomHelper?}
 * @protected
 * @suppress {underscore}
 */
goog.ui.Component.prototype.dom_ = null;


/**
 * Whether the component is in the document.
 * @type {boolean}
 * @private
 */
goog.ui.Component.prototype.inDocument_ = false;


// TODO(user): Stop referring to this private field in subclasses.
/**
 * The DOM element for the component.
 * @type {Element}
 * @private
 */
goog.ui.Component.prototype.element_ = null;


/**
 * Event handler.
 * TODO(user): rename it to handler_ after all component subclasses in
 * inside Google have been cleaned up.
 * Code search: http://go/component_code_search
 * @type {goog.events.EventHandler}
 * @private
 */
goog.ui.Component.prototype.googUiComponentHandler_;


/**
 * Whether the component is rendered right-to-left.  Right-to-left is set
 * lazily when {@link #isRightToLeft} is called the first time, unless it has
 * been set by calling {@link #setRightToLeft} explicitly.
 * @type {?boolean}
 * @private
 */
goog.ui.Component.prototype.rightToLeft_ = null;


/**
 * Arbitrary data object associated with the component.  Such as meta-data.
 * @type {*}
 * @private
 */
goog.ui.Component.prototype.model_ = null;


/**
 * Parent component to which events will be propagated.  This property is
 * strictly private and must not be accessed directly outside of this class!
 * @type {goog.ui.Component?}
 * @private
 */
goog.ui.Component.prototype.parent_ = null;


/**
 * Array of child components.  Lazily initialized on first use.  Must be kept in
 * sync with {@code childIndex_}.  This property is strictly private and must
 * not be accessed directly outside of this class!
 * @type {Array.<goog.ui.Component>?}
 * @private
 */
goog.ui.Component.prototype.children_ = null;


/**
 * Map of child component IDs to child components.  Used for constant-time
 * random access to child components by ID.  Lazily initialized on first use.
 * Must be kept in sync with {@code children_}.  This property is strictly
 * private and must not be accessed directly outside of this class!
 *
 * We use a plain Object, not a {@link goog.structs.Map}, for simplicity.
 * This means components can't have children with IDs such as 'constructor' or
 * 'valueOf', but this shouldn't really be an issue in practice, and if it is,
 * we can always fix it later without changing the API.
 *
 * @type {Object}
 * @private
 */
goog.ui.Component.prototype.childIndex_ = null;


/**
 * Flag used to keep track of whether a component decorated an already existing
 * element or whether it created the DOM itself.  If an element was decorated
 * dispose will remove the node from the document, it is left up to the app.
 * @type {boolean}
 * @private
 */
goog.ui.Component.prototype.wasDecorated_ = false;


/**
 * Gets the unique ID for the instance of this component.  If the instance
 * doesn't already have an ID, generates one on the fly.
 * @return {string} Unique component ID.
 */
goog.ui.Component.prototype.getId = function() {
  return this.id_ || (this.id_ = this.idGenerator_.getNextUniqueId());
};


/**
 * Assigns an ID to this component instance.  It is the caller's responsibility
 * to guarantee that the ID is unique.  If the component is a child of a parent
 * component, then the parent component's child index is updated to reflect the
 * new ID; this may throw an error if the parent already has a child with an ID
 * that conflicts with the new ID.
 * @param {string} id Unique component ID.
 */
goog.ui.Component.prototype.setId = function(id) {
  if (this.parent_ && this.parent_.childIndex_) {
    // Update the parent's child index.
    goog.object.remove(this.parent_.childIndex_, this.id_);
    goog.object.add(this.parent_.childIndex_, id, this);
  }

  // Update the component ID.
  this.id_ = id;
};


/**
 * Gets the component's element.
 * @return {Element} The element for the component.
 */
goog.ui.Component.prototype.getElement = function() {
  return this.element_;
};


/**
 * Sets the component's root element to the given element.  Considered
 * protected and final.
 * @param {Element} element Root element for the component.
 * @protected
 */
goog.ui.Component.prototype.setElementInternal = function(element) {
  this.element_ = element;
};


/**
 * Returns the event handler for this component, lazily created the first time
 * this method is called.
 * @return {!goog.events.EventHandler} Event handler for this component.
 * @protected
 */
goog.ui.Component.prototype.getHandler = function() {
  return this.googUiComponentHandler_ ||
         (this.googUiComponentHandler_ = new goog.events.EventHandler(this));
};


/**
 * Sets the parent of this component to use for event bubbling.  Throws an error
 * if the component already has a parent or if an attempt is made to add a
 * component to itself as a child.  Callers must use {@code removeChild}
 * or {@code removeChildAt} to remove components from their containers before
 * calling this method.
 * @see goog.ui.Component#removeChild
 * @see goog.ui.Component#removeChildAt
 * @param {goog.ui.Component} parent The parent component.
 */
goog.ui.Component.prototype.setParent = function(parent) {
  if (this == parent) {
    // Attempting to add a child to itself is an error.
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }

  if (parent && this.parent_ && this.id_ && this.parent_.getChild(this.id_) &&
      this.parent_ != parent) {
    // This component is already the child of some parent, so it should be
    // removed using removeChild/removeChildAt first.
    throw Error(goog.ui.Component.Error.PARENT_UNABLE_TO_BE_SET);
  }

  this.parent_ = parent;
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent);
};


/**
 * Returns the component's parent, if any.
 * @return {goog.ui.Component?} The parent component.
 */
goog.ui.Component.prototype.getParent = function() {
  return this.parent_;
};


/**
 * Overrides {@link goog.events.EventTarget#setParentEventTarget} to throw an
 * error if the parent component is set, and the argument is not the parent.
 *
 * @param {goog.events.EventTarget} parent Parent EventTarget (null if none).
 */
goog.ui.Component.prototype.setParentEventTarget = function(parent) {
  if (this.parent_ && this.parent_ != parent) {
    throw Error(goog.ui.Component.Error.NOT_SUPPORTED);
  }
  goog.ui.Component.superClass_.setParentEventTarget.call(this, parent);
};


/**
 * Returns the dom helper that is being used on this component.
 * @return {goog.dom.DomHelper} The dom helper used on this component.
 */
goog.ui.Component.prototype.getDomHelper = function() {
  return this.dom_;
};


/**
 * Determines whether the component has been added to the document.
 * @return {boolean} TRUE if rendered. Otherwise, FALSE.
 */
goog.ui.Component.prototype.isInDocument = function() {
  return this.inDocument_;
};


/**
 * Creates the initial DOM representation for the component.  The default
 * implementation is to set this.element_ = div.
 */
goog.ui.Component.prototype.createDom = function() {
  this.element_ = this.dom_.createElement('div');
};


/**
 * Renders the component.  If a parent element is supplied, it should already be
 * in the document and then the component's element will be appended to it.  If
 * there is no optional parent element and the element doesn't have a parentNode
 * then it will be appended to the document body.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Element=} opt_parentElement Optional parent element to render the
 *    component into.
 */
goog.ui.Component.prototype.render = function(opt_parentElement) {
  this.render_(opt_parentElement);
};


/**
 * Renders the component before another element. The other element should be in
 * the document already.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Element} siblingElement  Element to render the component before.
 */
goog.ui.Component.prototype.renderBefore = function(siblingElement) {
  this.render_(/** @type {Element} */(siblingElement.parentNode),
               siblingElement);
};


/**
 * Renders the component.  If a parent element is supplied, it should already be
 * in the document and then the component's element will be appended to it.  If
 * there is no optional parent element and the element doesn't have a parentNode
 * then it will be appended to the document body.
 *
 * Throws an Error if the component is already rendered.
 *
 * @param {Element=} opt_parentElement Optional parent element to render the
 *    component into.
 * @param {Element=} opt_beforeElement Element before which the component is to
 *    be rendered.  If left out the node is appended to the parent element.
 * @private
 */
goog.ui.Component.prototype.render_ = function(opt_parentElement,
                                               opt_beforeElement) {
  if (this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  if (!this.element_) {
    this.createDom();
  }

  if (opt_parentElement) {
    opt_parentElement.insertBefore(this.element_, opt_beforeElement || null);
  } else {
    this.dom_.getDocument().body.appendChild(this.element_);
  }

  // If this component has a parent component that isn't in the document yet,
  // we don't call enterDocument() here.  Instead, when the parent component
  // enters the document, the enterDocument() call will propagate to its
  // children, including this one.  If the component doesn't have a parent
  // or if the parent is already in the document, we call enterDocument().
  if (!this.parent_ || this.parent_.isInDocument()) {
    this.enterDocument();
  }
};


/**
 * Decorates the element for the UI component.
 * @param {Element} element Element to decorate.
 */
goog.ui.Component.prototype.decorate = function(element) {
  if (this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  } else if (element && this.canDecorate(element)) {
    this.wasDecorated_ = true;

    // Set the DOM helper of the component to match the decorated element.
    if (!this.dom_ ||
        this.dom_.getDocument() != goog.dom.getOwnerDocument(element)) {
      this.dom_ = goog.dom.getDomHelper(element);
    }

    // Call specific component decorate logic.
    this.decorateInternal(element);
    this.enterDocument();
  } else {
    throw Error(goog.ui.Component.Error.DECORATE_INVALID);
  }
};


/**
 * Determines if a given element can be decorated by this type of component.
 * This method should be overridden by inheriting objects.
 * @param {Element} element Element to decorate.
 * @return {boolean} True if the element can be decorated, false otherwise.
 */
goog.ui.Component.prototype.canDecorate = function(element) {
  return true;
};


/**
 * @return {boolean} Whether the component was decorated.
 */
goog.ui.Component.prototype.wasDecorated = function() {
  return this.wasDecorated_;
};


/**
 * Actually decorates the element. Should be overridden by inheriting objects.
 * This method can assume there are checks to ensure the component has not
 * already been rendered have occurred and that enter document will be called
 * afterwards. This method is considered protected.
 * @param {Element} element Element to decorate.
 * @protected
 */
goog.ui.Component.prototype.decorateInternal = function(element) {
  this.element_ = element;
};


/**
 * Called when the component's element is known to be in the document. Anything
 * using document.getElementById etc. should be done at this stage.
 *
 * If the component contains child components, this call is propagated to its
 * children.
 */
goog.ui.Component.prototype.enterDocument = function() {
  this.inDocument_ = true;

  // Propagate enterDocument to child components that have a DOM, if any.
  this.forEachChild(function(child) {
    if (!child.isInDocument() && child.getElement()) {
      child.enterDocument();
    }
  });
};


/**
 * Called by dispose to clean up the elements and listeners created by a
 * component, or by a parent component/application who has removed the
 * component from the document but wants to reuse it later.
 *
 * If the component contains child components, this call is propagated to its
 * children.
 *
 * It should be possible for the component to be rendered again once this method
 * has been called.
 */
goog.ui.Component.prototype.exitDocument = function() {
  // Propagate exitDocument to child components that have been rendered, if any.
  this.forEachChild(function(child) {
    if (child.isInDocument()) {
      child.exitDocument();
    }
  });

  if (this.googUiComponentHandler_) {
    this.googUiComponentHandler_.removeAll();
  }

  this.inDocument_ = false;
};


/**
 * Disposes of the component.  Calls {@code exitDocument}, which is expected to
 * remove event handlers and clean up the component.  Propagates the call to
 * the component's children, if any. Removes the component's DOM from the
 * document unless it was decorated.
 * @override
 */
goog.ui.Component.prototype.disposeInternal = function() {
  goog.ui.Component.superClass_.disposeInternal.call(this);

  if (this.inDocument_) {
    this.exitDocument();
  }

  if (this.googUiComponentHandler_) {
    this.googUiComponentHandler_.dispose();
    delete this.googUiComponentHandler_;
  }

  // Disposes of the component's children, if any.
  this.forEachChild(function(child) {
    child.dispose();
  });

  // Detach the component's element from the DOM, unless it was decorated.
  if (!this.wasDecorated_ && this.element_) {
    goog.dom.removeNode(this.element_);
  }

  this.children_ = null;
  this.childIndex_ = null;
  this.element_ = null;
  this.model_ = null;
  this.parent_ = null;
};


/**
 * Helper function for subclasses that gets a unique id for a given fragment,
 * this can be used by components to
 * generate unique string ids for DOM elements
 * @param {string} idFragment A partial id.
 * @return {string} Unique element id.
 */
goog.ui.Component.prototype.makeId = function(idFragment) {
  return this.getId() + '.' + idFragment;
};


/**
 * Returns the model associated with the UI component.
 * @return {*} The model.
 */
goog.ui.Component.prototype.getModel = function() {
  return this.model_;
};


/**
 * Sets the model associated with the UI component.
 * @param {*} obj The model.
 */
goog.ui.Component.prototype.setModel = function(obj) {
  this.model_ = obj;
};


/**
 * Helper function for returning the fragment portion of an id generated using
 * makeId().
 * @param {string} id Id generated with makeId().
 * @return {string} Fragment.
 */
goog.ui.Component.prototype.getFragmentFromId = function(id) {
  return id.substring(this.getId().length + 1);
};


/**
 * Helper function for returning an element in the document with a unique id
 * generated using makeId().
 * @param {string} idFragment The partial id.
 * @return {Element} The element with the unique id, or null if it cannot be
 *     found.
 */
goog.ui.Component.prototype.getElementByFragment = function(idFragment) {
  if (!this.inDocument_) {
    throw Error(goog.ui.Component.Error.NOT_IN_DOCUMENT);
  }
  return this.dom_.getElement(this.makeId(idFragment));
};


/**
 * Adds the specified component as the last child of this component.  See
 * {@link goog.ui.Component#addChildAt} for detailed semantics.
 *
 * @see goog.ui.Component#addChildAt
 * @param {goog.ui.Component} child The new child component.
 * @param {boolean=} opt_render If true, the child component will be rendered
 *    into the parent.
 */
goog.ui.Component.prototype.addChild = function(child, opt_render) {
  this.addChildAt(child, this.getChildCount(), opt_render);
};


/**
 * Adds the specified component as a child of this component at the given
 * 0-based index.
 *
 * Both {@code addChild} and {@code addChildAt} assume the following contract
 * between parent and child components:
 *  <ul>
 *    <li>the child component's element must be a descendant of the parent
 *        component's element, and
 *    <li>the DOM state of the child component must be consistent with the DOM
 *        state of the parent component (see {@code isInDocument}).
 *  </ul>
 *
 * In particular, {@code parent.addChild(child)} will throw an error if the
 * child component is already in the document, but the parent isn't.
 *
 * Clients of this API may call {@code addChild} and {@code addChildAt} with
 * {@code opt_render} set to true.  If {@code opt_render} is true, calling these
 * methods will automatically render the child component's element into the
 * parent component's element.  However, {@code parent.addChild(child, true)}
 * will throw an error if:
 *  <ul>
 *    <li>the parent component has no DOM (i.e. {@code parent.getElement()} is
 *        null), or
 *    <li>the child component is already in the document, regardless of the
 *        parent's DOM state.
 *  </ul>
 *
 * Finally, this method also throws an error if the new child already has a
 * different parent, or the given index is out of bounds.
 *
 * @see goog.ui.Component#addChild
 * @param {goog.ui.Component} child The new child component.
 * @param {number} index 0-based index at which the new child component is to be
 *    added; must be between 0 and the current child count (inclusive).
 * @param {boolean=} opt_render If true, the child component will be rendered
 *    into the parent.
 * @return {void}
 */
goog.ui.Component.prototype.addChildAt = function(child, index, opt_render) {
  if (child.inDocument_ && (opt_render || !this.inDocument_)) {
    // Adding a child that's already in the document is an error, except if the
    // parent is also in the document and opt_render is false (e.g. decorate()).
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  if (index < 0 || index > this.getChildCount()) {
    // Allowing sparse child arrays would lead to strange behavior, so we don't.
    throw Error(goog.ui.Component.Error.CHILD_INDEX_OUT_OF_BOUNDS);
  }

  // Create the index and the child array on first use.
  if (!this.childIndex_ || !this.children_) {
    this.childIndex_ = {};
    this.children_ = [];
  }

  // Moving child within component, remove old reference.
  if (child.getParent() == this) {
    goog.object.set(this.childIndex_, child.getId(), child);
    goog.array.remove(this.children_, child);

  // Add the child to this component.  goog.object.add() throws an error if
  // a child with the same ID already exists.
  } else {
    goog.object.add(this.childIndex_, child.getId(), child);
  }

  // Set the parent of the child to this component.  This throws an error if
  // the child is already contained by another component.
  child.setParent(this);
  goog.array.insertAt(this.children_, child, index);

  if (child.inDocument_ && this.inDocument_ && child.getParent() == this) {
    // Changing the position of an existing child, move the DOM node.
    var contentElement = this.getContentElement();
    contentElement.insertBefore(child.getElement(),
        (contentElement.childNodes[index] || null));

  } else if (opt_render) {
    // If this (parent) component doesn't have a DOM yet, call createDom now
    // to make sure we render the child component's element into the correct
    // parent element (otherwise render_ with a null first argument would
    // render the child into the document body, which is almost certainly not
    // what we want).
    if (!this.element_) {
      this.createDom();
    }
    // Render the child into the parent at the appropriate location.  Note that
    // getChildAt(index + 1) returns undefined if inserting at the end.
    // TODO(user): We should have a renderer with a renderChildAt API.
    var sibling = this.getChildAt(index + 1);
    // render_() calls enterDocument() if the parent is already in the document.
    child.render_(this.getContentElement(), sibling ? sibling.element_ : null);
  } else {
    // We don't touch the DOM, but if the parent is in the document, the child
    // isn't, and the child has a DOM, then we call enterDocument on the child.
    if (this.inDocument_ && !child.inDocument_ && child.element_) {
      child.enterDocument();
    }
  }
};


/**
 * Returns the DOM element into which child components are to be rendered,
 * or null if the component itself hasn't been rendered yet.  This default
 * implementation returns the component's root element.  Subclasses with
 * complex DOM structures must override this method.
 * @return {Element} Element to contain child elements (null if none).
 */
goog.ui.Component.prototype.getContentElement = function() {
  return this.element_;
};


/**
 * Returns true if the component is rendered right-to-left, false otherwise.
 * The first time this function is invoked, the right-to-left rendering property
 * is set if it has not been already.
 * @return {boolean} Whether the control is rendered right-to-left.
 */
goog.ui.Component.prototype.isRightToLeft = function() {
  if (this.rightToLeft_ == null) {
    this.rightToLeft_ = goog.style.isRightToLeft(this.inDocument_ ?
        this.element_ : this.dom_.getDocument().body);
  }
  return /** @type {boolean} */(this.rightToLeft_);
};


/**
 * Set is right-to-left. This function should be used if the component needs
 * to know the rendering direction during dom creation (i.e. before
 * {@link #enterDocument} is called and is right-to-left is set).
 * @param {boolean} rightToLeft Whether the component is rendered
 *     right-to-left.
 */
goog.ui.Component.prototype.setRightToLeft = function(rightToLeft) {
  if (this.inDocument_) {
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }
  this.rightToLeft_ = rightToLeft;
};


/**
 * Returns true if the component has children.
 * @return {boolean} True if the component has children.
 */
goog.ui.Component.prototype.hasChildren = function() {
  return !!this.children_ && this.children_.length != 0;
};


/**
 * Returns the number of children of this component.
 * @return {number} The number of children.
 */
goog.ui.Component.prototype.getChildCount = function() {
  return this.children_ ? this.children_.length : 0;
};


/**
 * Returns an array containing the IDs of the children of this component, or an
 * empty array if the component has no children.
 * @return {Array.<string>} Child component IDs.
 */
goog.ui.Component.prototype.getChildIds = function() {
  var ids = [];

  // We don't use goog.object.getKeys(this.childIndex_) because we want to
  // return the IDs in the correct order as determined by this.children_.
  this.forEachChild(function(child) {
    // addChild()/addChildAt() guarantee that the child array isn't sparse.
    ids.push(child.getId());
  });

  return ids;
};


/**
 * Returns the child with the given ID, or null if no such child exists.
 * @param {string} id Child component ID.
 * @return {goog.ui.Component?} The child with the given ID; null if none.
 */
goog.ui.Component.prototype.getChild = function(id) {
  // Use childIndex_ for O(1) access by ID.
  return (this.childIndex_ && id) ? (/** @type {goog.ui.Component} */
      goog.object.get(this.childIndex_, id)) || null : null;
};


/**
 * Returns the child at the given index, or null if the index is out of bounds.
 * @param {number} index 0-based index.
 * @return {goog.ui.Component?} The child at the given index; null if none.
 */
goog.ui.Component.prototype.getChildAt = function(index) {
  // Use children_ for access by index.
  return this.children_ ? this.children_[index] || null : null;
};


/**
 * Calls the given function on each of this component's children in order.  If
 * {@code opt_obj} is provided, it will be used as the 'this' object in the
 * function when called.  The function should take two arguments:  the child
 * component and its 0-based index.  The return value is ignored.
 * @param {Function} f The function to call for every child component; should
 *    take 2 arguments (the child and its index).
 * @param {Object=} opt_obj Used as the 'this' object in f when called.
 */
goog.ui.Component.prototype.forEachChild = function(f, opt_obj) {
  if (this.children_) {
    goog.array.forEach(this.children_, f, opt_obj);
  }
};


/**
 * Returns the 0-based index of the given child component, or -1 if no such
 * child is found.
 * @param {goog.ui.Component?} child The child component.
 * @return {number} 0-based index of the child component; -1 if not found.
 */
goog.ui.Component.prototype.indexOfChild = function(child) {
  return (this.children_ && child) ? goog.array.indexOf(this.children_, child) :
      -1;
};


/**
 * Removes the given child from this component, and returns it.  Throws an error
 * if the argument is invalid or if the specified child isn't found in the
 * parent component.  The argument can either be a string (interpreted as the
 * ID of the child component to remove) or the child component itself.
 *
 * If {@code opt_unrender} is true, calls {@link goog.ui.component#exitDocument}
 * on the removed child, and subsequently detaches the child's DOM from the
 * document.  Otherwise it is the caller's responsibility to clean up the child
 * component's DOM.
 *
 * @see goog.ui.Component#removeChildAt
 * @param {string|goog.ui.Component|null} child The ID of the child to remove,
 *    or the child component itself.
 * @param {boolean=} opt_unrender If true, calls {@code exitDocument} on the
 *    removed child component, and detaches its DOM from the document.
 * @return {goog.ui.Component} The removed component, if any.
 */
goog.ui.Component.prototype.removeChild = function(child, opt_unrender) {
  if (child) {
    // Normalize child to be the object and id to be the ID string.  This also
    // ensures that the child is really ours.
    var id = goog.isString(child) ? child : child.getId();
    child = this.getChild(id);

    if (id && child) {
      goog.object.remove(this.childIndex_, id);
      goog.array.remove(this.children_, child);

      if (opt_unrender) {
        // Remove the child component's DOM from the document.  We have to call
        // exitDocument first (see documentation).
        child.exitDocument();
        if (child.element_) {
          goog.dom.removeNode(child.element_);
        }
      }

      // Child's parent must be set to null after exitDocument is called
      // so that the child can unlisten to its parent if required.
      child.setParent(null);
    }
  }

  if (!child) {
    throw Error(goog.ui.Component.Error.NOT_OUR_CHILD);
  }

  return /** @type {goog.ui.Component} */(child);
};


/**
 * Removes the child at the given index from this component, and returns it.
 * Throws an error if the argument is out of bounds, or if the specified child
 * isn't found in the parent.  See {@link goog.ui.Component#removeChild} for
 * detailed semantics.
 *
 * @see goog.ui.Component#removeChild
 * @param {number} index 0-based index of the child to remove.
 * @param {boolean=} opt_unrender If true, calls {@code exitDocument} on the
 *    removed child component, and detaches its DOM from the document.
 * @return {goog.ui.Component} The removed component, if any.
 */
goog.ui.Component.prototype.removeChildAt = function(index, opt_unrender) {
  // removeChild(null) will throw error.
  return this.removeChild(this.getChildAt(index), opt_unrender);
};


/**
 * Removes every child component attached to this one.
 *
 * @see goog.ui.Component#removeChild
 * @param {boolean=} opt_unrender If true, calls {@link #exitDocument} on the
 *    removed child components, and detaches their DOM from the document.
 */
goog.ui.Component.prototype.removeChildren = function(opt_unrender) {
  while (this.hasChildren()) {
    this.removeChildAt(0, opt_unrender);
  }
};

// Input 42
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Type declaration for control content.
 *
 * @author nicksantos@google.com (Nick Santos)
 */
goog.provide('goog.ui.ControlContent');



/**
 * Type declaration for text caption or DOM structure to be used as the content
 * of {@link goog.ui.Control}s.
 * @type {string|Node|Array.<Node>|NodeList}
 */
goog.ui.ControlContent = goog.typedef;

// Input 43
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for control renderers.
 * TODO(user):  If the renderer framework works well, pull it into Component.
 *
*
 */

goog.provide('goog.ui.ControlRenderer');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.a11y');
goog.require('goog.dom.a11y.State');
goog.require('goog.dom.classes');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlContent');
goog.require('goog.userAgent');


/**
 * Default renderer for {@link goog.ui.Control}s.  Can be used as-is, but
 * subclasses of Control will probably want to use renderers specifically
 * tailored for them by extending this class.  Controls that use renderers
 * delegate one or more of the following API methods to the renderer:
 * <ul>
 *    <li>{@code createDom} - renders the DOM for the component
 *    <li>{@code canDecorate} - determines whether an element can be decorated
 *        by the component
 *    <li>{@code decorate} - decorates an existing element with the component
 *    <li>{@code setState} - updates the appearance of the component based on
 *        its state
 *    <li>{@code getContent} - returns the component's content
 *    <li>{@code setContent} - sets the component's content
 * </ul>
 * Controls are stateful; renderers, on the other hand, should be stateless and
 * reusable.
 * @constructor
 */
goog.ui.ControlRenderer = function() {
};
goog.addSingletonGetter(goog.ui.ControlRenderer);


/**
 * Constructs a new renderer and sets the CSS class that the renderer will use
 * as the base CSS class to apply to all elements rendered by that renderer.
 * An example to use this function using a color palette:
 *
 * <pre>
 * var myCustomRenderer = goog.ui.ControlRenderer.getCustomRenderer(
 *     goog.ui.PaletteRenderer, 'my-special-palette');
 * var newColorPalette = new goog.ui.ColorPalette(
 *     colors, myCustomRenderer, opt_domHelper);
 * </pre>
 *
 * Your CSS can look like this now:
 * <pre>
 * .my-special-palette { }
 * .my-special-palette-table { }
 * .my-special-palette-cell { }
 * etc.
 * </pre>
 *
 * <em>instead</em> of
 * <pre>
 * .CSS_MY_SPECIAL_PALETTE .goog-palette { }
 * .CSS_MY_SPECIAL_PALETTE .goog-palette-table { }
 * .CSS_MY_SPECIAL_PALETTE .goog-palette-cell { }
 * etc.
 * </pre>
 *
 * You would want to use this functionality when you want an instance of a
 * component to have specific styles different than the other components of the
 * same type in your application.  This avoids using descendant selectors to
 * apply the specific styles to this component.
 *
 * @param {Function} ctor The constructor of the renderer you are trying to
 *     create.
 * @param {string} cssClassName The name of the CSS class for this renderer.
 * @return {goog.ui.ControlRenderer} An instance of the desired renderer with
 *     its getCssClass() method overridden to return the supplied custom CSS
 *     class name.
 */
goog.ui.ControlRenderer.getCustomRenderer = function(ctor, cssClassName) {
  var renderer = new ctor();

  /**
   * Returns the CSS class to be applied to the root element of components
   * rendered using this renderer.
   * @return {string} Renderer-specific CSS class.
   */
  renderer.getCssClass = function() {
    return cssClassName;
  };

  return renderer;
};


/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ControlRenderer.CSS_CLASS = goog.getCssName('goog-control');


/**
 * Array of arrays of CSS classes that we want composite classes added and
 * removed for in IE6 and lower as a workaround for lack of multi-class CSS
 * selector support.
 *
 * Subclasses that have accompanying CSS requiring this workaround should define
 * their own static IE6_CLASS_COMBINATIONS constant and override
 * getIe6ClassCombinations to return it.
 *
 * For example, if your stylesheet uses the selector .button.collapse-left
 * (and is compiled to .button_collapse-left for the IE6 version of the
 * stylesheet,) you should include ['button', 'collapse-left'] in this array
 * and the class button_collapse-left will be applied to the root element
 * whenever both button and collapse-left are applied individually.
 *
 * Members of each class name combination will be joined with underscores in the
 * order that they're defined in the array. You should alphabetize them (for
 * compatibility with the CSS compiler) unless you are doing something special.
 * @type {Array.<Array.<string>>}
 */
goog.ui.ControlRenderer.IE6_CLASS_COMBINATIONS = [];


/**
 * Map of component states to corresponding ARIA states.  Since the mapping of
 * component states to ARIA states is neither component- nor renderer-specific,
 * this is a static property of the renderer class, and is initialized on first
 * use.
 * @type {Object}
 * @private
 */
goog.ui.ControlRenderer.ARIA_STATE_MAP_;


/**
 * Returns the ARIA role to be applied to the control.
 * See http://wiki/Main/ARIA for more info.
 * @return {goog.dom.a11y.Role|undefined} ARIA role.
 */
goog.ui.ControlRenderer.prototype.getAriaRole = function() {
  // By default, the ARIA role is unspecified.
  return undefined;
};


/**
 * Returns the control's contents wrapped in a DIV, with the renderer's own
 * CSS class and additional state-specific classes applied to it.
 * @param {goog.ui.Control} control Control to render.
 * @return {Element} Root element for the control.
 */
goog.ui.ControlRenderer.prototype.createDom = function(control) {
  // Create and return DIV wrapping contents.
  return control.getDomHelper().createDom(
      'div', this.getClassNames(control).join(' '), control.getContent());
};


/**
 * Takes the control's root element and returns the parent element of the
 * control's contents.  Since by default controls are rendered as a single
 * DIV, the default implementation returns the element itself.  Subclasses
 * with more complex DOM structures must override this method as needed.
 * @param {Element} element Root element of the control whose content element
 *     is to be returned.
 * @return {Element} The control's content element.
 */
goog.ui.ControlRenderer.prototype.getContentElement = function(element) {
  return element;
};


/**
 * Updates the control's DOM by adding or removing the specified class name
 * to/from its root element. May add additional combined classes as needed in
 * IE6 and lower. Because of this, subclasses should use this method when
 * modifying class names on the control's root element.
 * @param {goog.ui.Control|Element} control Control instance (or root element)
 *     to be updated.
 * @param {string} className CSS class name to add or remove.
 * @param {boolean} enable Whether to add or remove the class name.
 */
goog.ui.ControlRenderer.prototype.enableClassName = function(control,
    className, enable) {
  var element = (/** @type {Element} */
      control.getElement ? control.getElement() : control);
  if (element) {
    // For IE6, we need to enable any combined classes involving this class
    // as well.
    if (goog.userAgent.IE && !goog.userAgent.isVersion('7')) {
      var combinedClasses = this.getAppliedCombinedClassNames_(
          goog.dom.classes.get(element), className);
      combinedClasses.push(className);
      var f = enable ? goog.dom.classes.add : goog.dom.classes.remove;
      goog.partial(f, element).apply(null, combinedClasses);
    } else {
      goog.dom.classes.enable(element, className, enable);
    }
  }
};


/**
 * Updates the control's DOM by adding or removing the specified extra class
 * name to/from its element.
 * @param {goog.ui.Control} control Control to be updated.
 * @param {string} className CSS class name to add or remove.
 * @param {boolean} enable Whether to add or remove the class name.
 */
goog.ui.ControlRenderer.prototype.enableExtraClassName = function(control,
    className, enable) {
  // The base class implementation is trivial; subclasses should override as
  // needed.
  this.enableClassName(control, className, enable);
};


/**
 * Returns true if this renderer can decorate the element, false otherwise.
 * The default implementation always returns true.
 * @param {Element} element Element to decorate.
 * @return {boolean} Whether the renderer can decorate the element.
 */
goog.ui.ControlRenderer.prototype.canDecorate = function(element) {
  return true;
};


/**
 * Default implementation of {@code decorate} for {@link goog.ui.Control}s.
 * Initializes the control's ID, content, and state based on the ID of the
 * element, its child nodes, and its CSS classes, respectively.  Returns the
 * element.
 * @param {goog.ui.Control} control Control instance to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 */
goog.ui.ControlRenderer.prototype.decorate = function(control, element) {
  // Set the control's ID to the decorated element's DOM ID, if any.
  if (element.id) {
    control.setId(element.id);
  }

  // Set the control's content to the decorated element's content.
  var contentElem = this.getContentElement(element);
  if (contentElem && contentElem.firstChild) {
    control.setContentInternal(contentElem.firstChild.nextSibling ?
        goog.array.clone(contentElem.childNodes) : contentElem.firstChild);
  } else {
    control.setContentInternal(null);
  }

  // Initialize the control's state based on the decorated element's CSS class.
  // This implementation is optimized to minimize object allocations, string
  // comparisons, and DOM access.
  var state = 0x00;
  var rendererClassName = this.getCssClass();
  var structuralClassName = this.getStructuralCssClass();
  var hasRendererClassName = false;
  var hasStructuralClassName = false;
  var hasCombinedClassName = false;
  var classNames = goog.dom.classes.get(element);
  goog.array.forEach(classNames, function(className) {
    if (!hasRendererClassName && className == rendererClassName) {
      hasRendererClassName = true;
      if (structuralClassName == rendererClassName) {
        hasStructuralClassName = true;
      }
    } else if (!hasStructuralClassName && className == structuralClassName) {
      hasStructuralClassName = true;
    } else {
      state |= this.getStateFromClass(className);
    }
  }, this);
  control.setStateInternal(state);

  // Make sure the element has the renderer's CSS classes applied, as well as
  // any extra class names set on the control.
  if (!hasRendererClassName) {
    classNames.push(rendererClassName);
    if (structuralClassName == rendererClassName) {
      hasStructuralClassName = true;
    }
  }
  if (!hasStructuralClassName) {
    classNames.push(structuralClassName);
  }
  var extraClassNames = control.getExtraClassNames();
  if (extraClassNames) {
    classNames.push.apply(classNames, extraClassNames);
  }

  // For IE6, rewrite all classes on the decorated element if any combined
  // classes apply.
  if (goog.userAgent.IE && !goog.userAgent.isVersion('7')) {
    var combinedClasses = this.getAppliedCombinedClassNames_(
        classNames);
    if (combinedClasses.length > 0) {
      classNames.push.apply(classNames, combinedClasses);
      hasCombinedClassName = true;
    }
  }

  // Only write to the DOM if new class names had to be added to the element.
  if (!hasRendererClassName || !hasStructuralClassName ||
      extraClassNames || hasCombinedClassName) {
    goog.dom.classes.set(element, classNames.join(' '));
  }

  return element;
};


/**
 * Initializes the control's DOM by configuring properties that can only be set
 * after the DOM has entered the document.  This implementation sets up BiDi
 * and keyboard focus.  Called from {@link goog.ui.Control#enterDocument}.
 * @param {goog.ui.Control} control Control whose DOM is to be initialized
 *     as it enters the document.
 */
goog.ui.ControlRenderer.prototype.initializeDom = function(control) {
  // Initialize render direction (BiDi).  We optimize the left-to-right render
  // direction by assuming that elements are left-to-right by default, and only
  // updating their styling if they are explicitly set to right-to-left.
  if (control.isRightToLeft()) {
    this.setRightToLeft(control.getElement(), true);
  }

  // Initialize keyboard focusability (tab index).  We assume that components
  // aren't focusable by default (i.e have no tab index), and only touch the
  // DOM if the component is focusable, enabled, and visible, and therfore
  // needs a tab index.
  if (control.isEnabled()) {
    this.setFocusable(control, control.isVisible());
  }
};


/**
 * Sets the element's ARIA role on browsers that support it.
 * @param {Element} element Element to update.
 */
goog.ui.ControlRenderer.prototype.setAriaRole = function(element) {
  // setAriaRole is a no-op everywhere except Gecko.
  if (goog.userAgent.GECKO) {
    var ariaRole = this.getAriaRole();
    if (ariaRole) {
      goog.dom.a11y.setRole(element, ariaRole);
    }
  }
};


/**
 * Allows or disallows text selection within the control's DOM.
 * @param {Element} element The control's root element.
 * @param {boolean} allow Whether the element should allow text selection.
 */
goog.ui.ControlRenderer.prototype.setAllowTextSelection = function(element,
    allow) {
  // On all browsers other than IE and Opera, it isn't necessary to recursively
  // apply unselectable styling to the element's children.
  goog.style.setUnselectable(element, !allow,
      !goog.userAgent.IE && !goog.userAgent.OPERA);
};


/**
 * Applies special styling to/from the control's element if it is rendered
 * right-to-left, and removes it if it is rendered left-to-right.
 * @param {Element} element The control's root element.
 * @param {boolean} rightToLeft Whether the component is rendered
 *     right-to-left.
 */
goog.ui.ControlRenderer.prototype.setRightToLeft = function(element,
    rightToLeft) {
  this.enableClassName(element,
      goog.getCssName(this.getStructuralCssClass(), 'rtl'), rightToLeft);
};


/**
 * Returns true if the control's key event target supports keyboard focus
 * (based on its {@code tabIndex} attribute), false otherwise.
 * @param {goog.ui.Control} control Control whose key event target is to be
 *     checked.
 * @return {boolean} Whether the control's key event target is focusable.
 */
goog.ui.ControlRenderer.prototype.isFocusable = function(control) {
  var keyTarget;
  if (control.isSupportedState(goog.ui.Component.State.FOCUSED) &&
      (keyTarget = control.getKeyEventTarget())) {
    return goog.dom.isFocusableTabIndex(keyTarget);
  }
  return false;
};


/**
 * Updates the control's key event target to make it focusable or non-focusable
 * via its {@code tabIndex} attribute.  Does nothing if the control doesn't
 * support the {@code FOCUSED} state, or if it has no key event target.
 * @param {goog.ui.Control} control Control whose key event target is to be
 *     updated.
 * @param {boolean} focusable Whether to enable keyboard focus support on the
 *     control's key event target.
 */
goog.ui.ControlRenderer.prototype.setFocusable = function(control, focusable) {
  var keyTarget;
  if (control.isSupportedState(goog.ui.Component.State.FOCUSED) &&
      (keyTarget = control.getKeyEventTarget())) {
    if (!focusable && control.isFocused()) {
      // Blur before hiding.  Note that IE calls onblur handlers asynchronously.
      try {
        keyTarget.blur();
      } catch (e) {
        // TODO(user|user):  Find out why this fails on IE.
      }
      // The blur event dispatched by the key event target element when blur()
      // was called on it should have been handled by the control's handleBlur()
      // method, so at this point the control should no longer be focused.
      // However, blur events are unreliable on IE and FF3, so if at this point
      // the control is still focused, we trigger its handleBlur() method
      // programmatically.
      if (control.isFocused()) {
        control.handleBlur(null);
      }
    }
    // Don't overwrite existing tab index values unless needed.
    if (goog.dom.isFocusableTabIndex(keyTarget) != focusable) {
      goog.dom.setFocusableTabIndex(keyTarget, focusable);
    }
  }
};


/**
 * Shows or hides the element.
 * @param {Element} element Element to update.
 * @param {boolean} visible Whether to show the element.
 */
goog.ui.ControlRenderer.prototype.setVisible = function(element, visible) {
  // The base class implementation is trivial; subclasses should override as
  // needed.  It should be possible to do animated reveals, for example.
  goog.style.showElement(element, visible);
};


/**
 * Updates the appearance of the control in response to a state change.
 * @param {goog.ui.Control} control Control instance to update.
 * @param {goog.ui.Component.State} state State to enable or disable.
 * @param {boolean} enable Whether the control is entering or exiting the state.
 */
goog.ui.ControlRenderer.prototype.setState = function(control, state, enable) {
  var element = control.getElement();
  if (element) {
    var className = this.getClassForState(state);
    if (className) {
      this.enableClassName(control, className, enable);
    }
    this.updateAriaState(element, state, enable);
  }
};


/**
 * Updates the element's ARIA (accessibility) state on Gecko.
 * @param {Element} element Element whose ARIA state is to be updated.
 * @param {goog.ui.Component.State} state Component state being enabled or
 *     disabled.
 * @param {boolean} enable Whether the state is being enabled or disabled.
 * @protected
 */
goog.ui.ControlRenderer.prototype.updateAriaState = function(element, state,
    enable) {
  // updateAriaState is a no-op everywhere except Gecko.
  if (goog.userAgent.GECKO) {
    // Ensure the ARIA state map exists.
    if (!goog.ui.ControlRenderer.ARIA_STATE_MAP_) {
      goog.ui.ControlRenderer.ARIA_STATE_MAP_ = goog.object.create(
          goog.ui.Component.State.DISABLED, goog.dom.a11y.State.DISABLED,
          goog.ui.Component.State.ACTIVE, goog.dom.a11y.State.PRESSED,
          goog.ui.Component.State.SELECTED, goog.dom.a11y.State.SELECTED,
          goog.ui.Component.State.CHECKED, goog.dom.a11y.State.CHECKED,
          goog.ui.Component.State.OPENED, goog.dom.a11y.State.EXPANDED);
    }
    var ariaState = goog.ui.ControlRenderer.ARIA_STATE_MAP_[state];
    if (ariaState) {
      goog.dom.a11y.setState(element, ariaState, enable);
    }
  }
};


/**
 * Takes a control's root element, and sets its content to the given text
 * caption or DOM structure.  The default implementation replaces the children
 * of the given element.  Renderers that create more complex DOM structures
 * must override this method accordingly.
 * @param {Element} element The control's root element.
 * @param {goog.ui.ControlContent} content Text caption or DOM structure to be
 *     set as the control's content. The DOM nodes will not be cloned, they
 *     will only moved under the content element of the control.
 */
goog.ui.ControlRenderer.prototype.setContent = function(element, content) {
  var contentElem = this.getContentElement(element);
  if (contentElem) {
    goog.dom.removeChildren(contentElem);
    if (content) {
      if (goog.isString(content)) {
        goog.dom.setTextContent(contentElem, content);
      } else {
        var childHandler = function(child) {
          if (child) {
            var doc = goog.dom.getOwnerDocument(contentElem);
            contentElem.appendChild(goog.isString(child) ?
                doc.createTextNode(child) : child);
          }
        };
        if (goog.isArray(content)) {
          // Array of nodes.
          goog.array.forEach(content, childHandler);
        } else if (goog.isArrayLike(content) && !('nodeType' in content)) {
          // NodeList. The second condition filters out TextNode which also has
          // length attribute but is not array like. The nodes have to be cloned
          // because childHandler removes them from the list during iteration.
          goog.array.forEach(goog.array.clone(/** @type {NodeList} */(content)),
              childHandler);
        } else {
          // Node or string.
          childHandler(content);
        }
      }
    }
  }
};


/**
 * Returns the element within the component's DOM that should receive keyboard
 * focus (null if none).  The default implementation returns the control's root
 * element.
 * @param {goog.ui.Control} control Control whose key event target is to be
 *     returned.
 * @return {Element} The key event target.
 */
goog.ui.ControlRenderer.prototype.getKeyEventTarget = function(control) {
  return control.getElement();
};


// CSS class name management.


/**
 * Returns the CSS class name to be applied to the root element of all
 * components rendered or decorated using this renderer.  The class name
 * is expected to uniquely identify the renderer class, i.e. no two
 * renderer classes are expected to share the same CSS class name.
 * @return {string} Renderer-specific CSS class name.
 */
goog.ui.ControlRenderer.prototype.getCssClass = function() {
  return goog.ui.ControlRenderer.CSS_CLASS;
};


/**
 * Returns an array of combinations of classes to apply combined class names for
 * in IE6 and below. See {@link IE6_CLASS_COMBINATIONS} for more detail. This
 * method doesn't reference {@link IE6_CLASS_COMBINATIONS} so that it can be
 * compiled out, but subclasses should return their IE6_CLASS_COMBINATIONS
 * static contasnt instead.
 * @return {Array.<Array.<string>>} Array of class name combinations.
 */
goog.ui.ControlRenderer.prototype.getIe6ClassCombinations = function() {
  return [];
};


/**
 * Returns the name of a DOM structure-specific CSS class to be applied to the
 * root element of all components rendered or decorated using this renderer.
 * Unlike the class name returned by {@link #getCssClass}, the structural class
 * name may be shared among different renderers that generate similar DOM
 * structures.  The structural class name also serves as the basis of derived
 * class names used to identify and style structural elements of the control's
 * DOM, as well as the basis for state-specific class names.  The default
 * implementation returns the same class name as {@link #getCssClass}, but
 * subclasses are expected to override this method as needed.
 * @return {string} DOM structure-specific CSS class name (same as the renderer-
 *     specific CSS class name by default).
 */
goog.ui.ControlRenderer.prototype.getStructuralCssClass = function() {
  return this.getCssClass();
};


/**
 * Returns all CSS class names applicable to the given control, based on its
 * state.  The return value is an array of strings containing
 * <ol>
 *   <li>the renderer-specific CSS class returned by {@link #getCssClass},
 *       followed by
 *   <li>the structural CSS class returned by {@link getStructuralCssClass} (if
 *       different from the renderer-specific CSS class), followed by
 *   <li>any state-specific classes returned by {@link #getClassNamesForState},
 *       followed by
 *   <li>any extra classes returned by the control's {@code getExtraClassNames}
 *       method and
 *   <li>for IE6 and lower, additional combined classes from
 *       {@link getAppliedCombinedClassNames_}.
 * </ol>
 * Since all controls have at least one renderer-specific CSS class name, this
 * method is guaranteed to return an array of at least one element.
 * @param {goog.ui.Control} control Control whose CSS classes are to be
 *     returned.
 * @return {Array.<string>} Array of CSS class names applicable to the control.
 * @protected
 */
goog.ui.ControlRenderer.prototype.getClassNames = function(control) {
  var cssClass = this.getCssClass();

  // Start with the renderer-specific class name.
  var classNames = [cssClass];

  // Add structural class name, if different.
  var structuralCssClass = this.getStructuralCssClass();
  if (structuralCssClass != cssClass) {
    classNames.push(structuralCssClass);
  }

  // Add state-specific class names, if any.
  var classNamesForState = this.getClassNamesForState(control.getState());
  classNames.push.apply(classNames, classNamesForState);

  // Add extra class names, if any.
  var extraClassNames = control.getExtraClassNames();
  if (extraClassNames) {
    classNames.push.apply(classNames, extraClassNames);
  }

  // Add composite classes for IE6 support
  if (goog.userAgent.IE && !goog.userAgent.isVersion('7')) {
    classNames.push.apply(classNames,
        this.getAppliedCombinedClassNames_(classNames));
  }

  return classNames;
};


/**
 * Returns an array of all the combined class names that should be applied based
 * on the given list of classes. Checks the result of
 * {@link getIe6ClassCombinations} for any combinations that have all
 * members contained in classes. If a combination matches, the members are
 * joined with an underscore (in order), and added to the return array.
 *
 * If opt_includedClass is provided, return only the combined classes that have
 * all members contained in classes AND include opt_includedClass as well.
 * opt_includedClass is added to classes as well.
 * @param {Array.<string>} classes Array of classes to return matching combined
 *     classes for.
 * @param {?string=} opt_includedClass If provided, get only the combined
 *     classes that include this one.
 * @return {Array.<string>} Array of combined class names that should be
 *     applied.
 * @private
 */
goog.ui.ControlRenderer.prototype.getAppliedCombinedClassNames_ = function(
    classes, opt_includedClass) {
  var toAdd = [];
  if (opt_includedClass) {
    classes = classes.concat([opt_includedClass]);
  }
  goog.array.forEach(this.getIe6ClassCombinations(), function(combo) {
    if (goog.array.every(combo, goog.partial(goog.array.contains, classes)) &&
        (!opt_includedClass || goog.array.contains(combo, opt_includedClass))) {
      toAdd.push(combo.join('_'));
    }
  });
  return toAdd;
};


/**
 * Takes a bit mask of {@link goog.ui.Component.State}s, and returns an array
 * of the appropriate class names representing the given state, suitable to be
 * applied to the root element of a component rendered using this renderer, or
 * null if no state-specific classes need to be applied.  This default
 * implementation uses the renderer's {@link getClassForState} method to
 * generate each state-specific class.
 * @param {number} state Bit mask of component states.
 * @return {!Array.<string>} Array of CSS class names representing the given
 *     state.
 * @protected
 */
goog.ui.ControlRenderer.prototype.getClassNamesForState = function(state) {
  var classNames = [];
  while (state) {
    // For each enabled state, push the corresponding CSS class name onto
    // the classNames array.
    var mask = state & -state;  // Least significant bit
    classNames.push(this.getClassForState(
        /** @type {goog.ui.Component.State} */ (mask)));
    state &= ~mask;
  }
  return classNames;
};


/**
 * Takes a single {@link goog.ui.Component.State}, and returns the
 * corresponding CSS class name (null if none).
 * @param {goog.ui.Component.State} state Component state.
 * @return {string|undefined} CSS class representing the given state (undefined
 *     if none).
 * @protected
 */
  goog.ui.ControlRenderer.prototype.getClassForState = function(state) {
    if (!this.classByState_) {
      this.createClassByStateMap_();
    }
    return this.classByState_[state];
  };


/**
 * Takes a single CSS class name which may represent a component state, and
 * returns the corresponding component state (0x00 if none).
 * @param {string} className CSS class name, possibly representing a component
 *     state.
 * @return {goog.ui.Component.State} state Component state corresponding
 *     to the given CSS class (0x00 if none).
 * @protected
 */
goog.ui.ControlRenderer.prototype.getStateFromClass = function(className) {
  if (!this.stateByClass_) {
    this.createStateByClassMap_();
  }
  var state = parseInt(this.stateByClass_[className], 10);
  return /** @type {goog.ui.Component.State} */ (isNaN(state) ? 0x00 : state);
};


/**
 * Creates the lookup table of states to classes, used during state changes.
 * @private
 */
goog.ui.ControlRenderer.prototype.createClassByStateMap_ = function() {
  var baseClass = this.getStructuralCssClass();

  /**
   * Map of component states to state-specific structural class names,
   * used when changing the DOM in response to a state change.  Precomputed
   * and cached on first use to minimize object allocations and string
   * concatenation.
   * @type {Object}
   * @private
   */
  this.classByState_ = goog.object.create(
      goog.ui.Component.State.DISABLED, goog.getCssName(baseClass, 'disabled'),
      goog.ui.Component.State.HOVER, goog.getCssName(baseClass, 'hover'),
      goog.ui.Component.State.ACTIVE, goog.getCssName(baseClass, 'active'),
      goog.ui.Component.State.SELECTED, goog.getCssName(baseClass, 'selected'),
      goog.ui.Component.State.CHECKED, goog.getCssName(baseClass, 'checked'),
      goog.ui.Component.State.FOCUSED, goog.getCssName(baseClass, 'focused'),
      goog.ui.Component.State.OPENED, goog.getCssName(baseClass, 'open'));
};


/**
 * Creates the lookup table of classes to states, used during decoration.
 * @private
 */
goog.ui.ControlRenderer.prototype.createStateByClassMap_ = function() {
  // We need the classByState_ map so we can transpose it.
  if (!this.classByState_) {
    this.createClassByStateMap_();
  }

  /**
   * Map of state-specific structural class names to component states,
   * used during element decoration.  Precomputed and cached on first use
   * to minimize object allocations and string concatenation.
   * @type {Object}
   * @private
   */
  this.stateByClass_ = goog.object.transpose(this.classByState_);
};

// Input 44
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Default renderer for {@link goog.ui.Button}s.
 *
*
 */

goog.provide('goog.ui.ButtonRenderer');

goog.require('goog.dom.a11y');
goog.require('goog.dom.a11y.Role');
goog.require('goog.dom.a11y.State');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlRenderer');



/**
 * Default renderer for {@link goog.ui.Button}s.  Extends the superclass with
 * the following button-specific API methods:
 * <ul>
 *   <li>{@code getValue} - returns the button element's value
 *   <li>{@code setValue} - updates the button element to reflect its new value
 *   <li>{@code getTooltip} - returns the button element's tooltip text
 *   <li>{@code setTooltip} - updates the button element's tooltip text
 *   <li>{@code setCollapsed} - removes one or both of the button element's
 *       borders
 * </ul>
 * For alternate renderers, see {@link goog.ui.NativeButtonRenderer},
 * {@link goog.ui.CustomButtonRenderer}, and {@link goog.ui.FlatButtonRenderer}.
 * @constructor
 * @extends {goog.ui.ControlRenderer}
 */
goog.ui.ButtonRenderer = function() {
  goog.ui.ControlRenderer.call(this);
};
goog.inherits(goog.ui.ButtonRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(goog.ui.ButtonRenderer);


/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ButtonRenderer.CSS_CLASS = goog.getCssName('goog-button');


/**
 * Returns the ARIA role to be applied to buttons.
 * @return {goog.dom.a11y.Role|undefined} ARIA role.
 * @override
 */
goog.ui.ButtonRenderer.prototype.getAriaRole = function() {
  return goog.dom.a11y.Role.BUTTON;
};


/**
 * Updates the button's ARIA (accessibility) state on Gecko if the button
 * is being treated as a checkbox.
 * @param {Element} element Element whose ARIA state is to be updated.
 * @param {goog.ui.Component.State} state Component state being enabled or
 *     disabled.
 * @param {boolean} enable Whether the state is being enabled or disabled.
 * @protected
 * @override
 */
goog.ui.ButtonRenderer.prototype.updateAriaState = function(element, state,
    enable) {
  if (goog.userAgent.GECKO) {
    // If button has CHECKED state, assign ARIA atrribute aria-pressed
    if (state == goog.ui.Component.State.CHECKED) {
      goog.dom.a11y.setState(element, goog.dom.a11y.State.PRESSED, enable);
    } else {
      goog.ui.ButtonRenderer.superClass_.updateAriaState.call(this, element,
          state, enable);
    }
  }
};


/** @inheritDoc */
goog.ui.ButtonRenderer.prototype.createDom = function(button) {
  var element = goog.ui.ButtonRenderer.superClass_.createDom.call(this, button);

  var tooltip = button.getTooltip();
  if (tooltip) {
    this.setTooltip(element, tooltip);
  }

  var value = button.getValue();
  if (value) {
    this.setValue(element, value);
  }

  // Set aria-pressed to false initially.
  if (button.isSupportedState(goog.ui.Component.State.CHECKED)) {
    this.updateAriaState(element, goog.ui.Component.State.CHECKED, false);
  }

  return element;
};


/** @inheritDoc */
goog.ui.ButtonRenderer.prototype.decorate = function(button, element) {
  // The superclass implementation takes care of common attributes; we only
  // need to set the value and the tooltip.
  element = goog.ui.ButtonRenderer.superClass_.decorate.call(this, button,
      element);

  button.setValueInternal(this.getValue(element));
  button.setTooltipInternal(this.getTooltip(element));

  // Set aria-pressed to false initially.
  if (button.isSupportedState(goog.ui.Component.State.CHECKED)) {
    this.updateAriaState(element, goog.ui.Component.State.CHECKED, false);
  }

  return element;
};


/**
 * Takes a button's root element, and returns the value associated with it.
 * No-op in the base class.
 * @param {Element} element The button's root element.
 * @return {string|undefined} The button's value (undefined if none).
 */
goog.ui.ButtonRenderer.prototype.getValue = goog.nullFunction;


/**
 * Takes a button's root element and a value, and updates the element to reflect
 * the new value.  No-op in the base class.
 * @param {Element} element The button's root element.
 * @param {string} value New value.
 * @protected
 */
goog.ui.ButtonRenderer.prototype.setValue = goog.nullFunction;


/**
 * Takes a button's root element, and returns its tooltip text.
 * @param {Element} element The button's root element.
 * @return {string|undefined} The tooltip text.
 */
goog.ui.ButtonRenderer.prototype.getTooltip = function(element) {
  return element.title;
};


/**
 * Takes a button's root element and a tooltip string, and updates the element
 * with the new tooltip.
 * @param {Element} element The button's root element.
 * @param {string} tooltip New tooltip text.
 * @protected
 */
goog.ui.ButtonRenderer.prototype.setTooltip = function(element, tooltip) {
  if (element) {
    element.title = tooltip || '';
  }
};


/**
 * Collapses the border on one or both sides of the button, allowing it to be
 * combined with the adjacent button(s), forming a single UI componenet with
 * multiple targets.
 * @param {goog.ui.Button} button Button to update.
 * @param {number} sides Bitmap of one or more {@link goog.ui.Button.Side}s for
 *     which borders should be collapsed.
 * @protected
 */
goog.ui.ButtonRenderer.prototype.setCollapsed = function(button, sides) {
  var isRtl = button.isRightToLeft();
  var collapseLeftClassName =
      goog.getCssName(this.getStructuralCssClass(), 'collapse-left');
  var collapseRightClassName =
      goog.getCssName(this.getStructuralCssClass(), 'collapse-right');

  button.enableClassName(isRtl ? collapseRightClassName : collapseLeftClassName,
      !!(sides & goog.ui.Button.Side.START));
  button.enableClassName(isRtl ? collapseLeftClassName : collapseRightClassName,
      !!(sides & goog.ui.Button.Side.END));
};


/** @inheritDoc */
goog.ui.ButtonRenderer.prototype.getCssClass = function() {
  return goog.ui.ButtonRenderer.CSS_CLASS;
};

// Input 45
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview This file contains a class for working with keyboard events
 * that repeat consistently across browsers and platforms. It also unifies the
 * key code so that it is the same in all browsers and platforms.
 *
 * Different web browsers have very different keyboard event handling. Most
 * importantly is that only certain browsers repeat keydown events:
 * IE, Opera, FF/Win32, and Safari 3 repeat keydown events.
 * FF/Mac and Safari 2 do not.
 *
 * For the purposes of this code, "Safari 3" means WebKit 525+, when WebKit
 * decided that they should try to match IE's key handling behavior.
 * Safari 3.0.4, which shipped with Leopard (WebKit 523), has the
 * Safari 2 behavior.
 *
 * Firefox, Safari, Opera prevent on keypress
 *
 * IE prevents on keydown
 *
 * Firefox does not fire keypress for shift, ctrl, alt
 * Firefox does fire keydown for shift, ctrl, alt, meta
 * Firefox does not repeat keydown for shift, ctrl, alt, meta
 *
 * Firefox does not fire keypress for up and down in an input
 *
 * Opera fires keypress for shift, ctrl, alt, meta
 * Opera does not repeat keypress for shift, ctrl, alt, meta
 *
 * Safari 2 and 3 do not fire keypress for shift, ctrl, alt
 * Safari 2 does not fire keydown for shift, ctrl, alt
 * Safari 3 *does* fire keydown for shift, ctrl, alt
 *
 * IE provides the keycode for keyup/down events and the charcode (in the
 * keycode field) for keypress.
 *
 * Mozilla provides the keycode for keyup/down and the charcode for keypress
 * unless it's a non text modifying key in which case the keycode is provided.
 *
 * Safari 3 provides the keycode and charcode for all events.
 *
 * Opera provides the keycode for keyup/down event and either the charcode or
 * the keycode (in the keycode field) for keypress events.
 *
 * Firefox x11 doesn't fire keydown events if a another key is already held down
 * until the first key is released. This can cause a key event to be fired with
 * a keyCode for the first key and a charCode for the second key.
 *
 * Safari in keypress
 *
 *        charCode keyCode which
 * ENTER:       13      13    13
 * F1:       63236   63236 63236
 * F8:       63243   63243 63243
 * ...
 * p:          112     112   112
 * P:           80      80    80
 *
 * Firefox, keypress:
 *
 *        charCode keyCode which
 * ENTER:        0      13    13
 * F1:           0     112     0
 * F8:           0     119     0
 * ...
 * p:          112       0   112
 * P:           80       0    80
 *
 * Opera, Mac+Win32, keypress:
 *
 *         charCode keyCode which
 * ENTER: undefined      13    13
 * F1:    undefined     112     0
 * F8:    undefined     119     0
 * ...
 * p:     undefined     112   112
 * P:     undefined      80    80
 *
 * IE7, keydown
 *
 *         charCode keyCode     which
 * ENTER: undefined      13 undefined
 * F1:    undefined     112 undefined
 * F8:    undefined     119 undefined
 * ...
 * p:     undefined      80 undefined
 * P:     undefined      80 undefined
 *
*
*
 * @see ../demos/keyhandler.html
 */

goog.provide('goog.events.KeyEvent');
goog.provide('goog.events.KeyHandler');
goog.provide('goog.events.KeyHandler.EventType');

goog.require('goog.events');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.userAgent');



/**
 * A wrapper around an element that you want to listen to keyboard events on.
 * @param {Element|Document=} opt_element The element or document to listen on.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.events.KeyHandler = function(opt_element) {
  goog.events.EventTarget.call(this);

  if (opt_element) {
    this.attach(opt_element);
  }
};
goog.inherits(goog.events.KeyHandler, goog.events.EventTarget);


/**
 * This is the element that we will listen to the real keyboard events on.
 * @type {Element|Document|null}
 * @private
 */
goog.events.KeyHandler.prototype.element_ = null;


/**
 * The key for the key press listener.
 * @type {?number}
 * @private
 */
goog.events.KeyHandler.prototype.keyPressKey_ = null;


/**
 * The key for the key down listener.
 * @type {?number}
 * @private
 */
goog.events.KeyHandler.prototype.keyDownKey_ = null;


/**
 * The key for the key up listener.
 * @type {?number}
 * @private
 */
goog.events.KeyHandler.prototype.keyUpKey_ = null;


/**
 * Used to detect keyboard repeat events.
 * @private
 * @type {number}
 */
goog.events.KeyHandler.prototype.lastKey_ = -1;


/**
 * Keycode recorded for key down events. As most browsers don't report the
 * keycode in the key press event we need to record it in the key down phase.
 * @private
 * @type {number}
 */
goog.events.KeyHandler.prototype.keyCode_ = -1;


/**
 * Enum type for the events fired by the key handler
 * @enum {string}
 */
goog.events.KeyHandler.EventType = {
  KEY: 'key'
};


/**
 * An enumeration of key codes that Safari 2 does incorrectly
 * @type {Object}
 * @private
 */
goog.events.KeyHandler.safariKey_ = {
  '3': goog.events.KeyCodes.ENTER, // 13
  '12': goog.events.KeyCodes.NUMLOCK, // 144
  '63232': goog.events.KeyCodes.UP, // 38
  '63233': goog.events.KeyCodes.DOWN, // 40
  '63234': goog.events.KeyCodes.LEFT, // 37
  '63235': goog.events.KeyCodes.RIGHT, // 39
  '63236': goog.events.KeyCodes.F1, // 112
  '63237': goog.events.KeyCodes.F2, // 113
  '63238': goog.events.KeyCodes.F3, // 114
  '63239': goog.events.KeyCodes.F4, // 115
  '63240': goog.events.KeyCodes.F5, // 116
  '63241': goog.events.KeyCodes.F6, // 117
  '63242': goog.events.KeyCodes.F7, // 118
  '63243': goog.events.KeyCodes.F8, // 119
  '63244': goog.events.KeyCodes.F9, // 120
  '63245': goog.events.KeyCodes.F10, // 121
  '63246': goog.events.KeyCodes.F11, // 122
  '63247': goog.events.KeyCodes.F12, // 123
  '63248': goog.events.KeyCodes.PRINT_SCREEN, // 44
  '63272': goog.events.KeyCodes.DELETE, // 46
  '63273': goog.events.KeyCodes.HOME, // 36
  '63275': goog.events.KeyCodes.END, // 35
  '63276': goog.events.KeyCodes.PAGE_UP, // 33
  '63277': goog.events.KeyCodes.PAGE_DOWN, // 34
  '63289': goog.events.KeyCodes.NUMLOCK, // 144
  '63302': goog.events.KeyCodes.INSERT // 45
};


/**
 * An enumeration of key identifiers currently part of the W3C draft for DOM3
 * and their mappings to keyCodes.
 * http://www.w3.org/TR/DOM-Level-3-Events/keyset.html#KeySet-Set
 * This is currently supported in Safari and should be platform independent.
 * @type {Object}
 * @private
 */
goog.events.KeyHandler.keyIdentifier_ = {
  'Up': goog.events.KeyCodes.UP, // 38
  'Down': goog.events.KeyCodes.DOWN, // 40
  'Left': goog.events.KeyCodes.LEFT, // 37
  'Right': goog.events.KeyCodes.RIGHT, // 39
  'Enter': goog.events.KeyCodes.ENTER, // 13
  'F1': goog.events.KeyCodes.F1, // 112
  'F2': goog.events.KeyCodes.F2, // 113
  'F3': goog.events.KeyCodes.F3, // 114
  'F4': goog.events.KeyCodes.F4, // 115
  'F5': goog.events.KeyCodes.F5, // 116
  'F6': goog.events.KeyCodes.F6, // 117
  'F7': goog.events.KeyCodes.F7, // 118
  'F8': goog.events.KeyCodes.F8, // 119
  'F9': goog.events.KeyCodes.F9, // 120
  'F10': goog.events.KeyCodes.F10, // 121
  'F11': goog.events.KeyCodes.F11, // 122
  'F12': goog.events.KeyCodes.F12, // 123
  'U+007F': goog.events.KeyCodes.DELETE, // 46
  'Home': goog.events.KeyCodes.HOME, // 36
  'End': goog.events.KeyCodes.END, // 35
  'PageUp': goog.events.KeyCodes.PAGE_UP, // 33
  'PageDown': goog.events.KeyCodes.PAGE_DOWN, // 34
  'Insert': goog.events.KeyCodes.INSERT // 45
};


/**
 * Map from Gecko specific key codes to cross browser key codes
 * @type {Object}
 * @private
 */
goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_ = {
  61: 187,  // =, equals
  59: 186   // ;, semicolon
};


/**
 * If true, the KeyEvent fires on keydown. Otherwise, it fires on keypress.
 *
 * @type {boolean}
 * @private
 */
goog.events.KeyHandler.USES_KEYDOWN_ = goog.userAgent.IE ||
    goog.userAgent.WEBKIT && goog.userAgent.isVersion('525');


/**
 * Records the keycode for browsers that only returns the keycode for key up/
 * down events. For browser/key combinations that doesn't trigger a key pressed
 * event it also fires the patched key event.
 * @param {goog.events.BrowserEvent} e The key down event.
 * @private
 */
goog.events.KeyHandler.prototype.handleKeyDown_ = function(e) {
  if (goog.events.KeyHandler.USES_KEYDOWN_ &&
      !goog.events.KeyCodes.firesKeyPressEvent(e.keyCode,
          this.lastKey_, e.shiftKey, e.ctrlKey, e.altKey)) {
    this.handleEvent(e);
  } else {
    if (goog.userAgent.GECKO &&
        e.keyCode in goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_) {
      this.keyCode_ = goog.events.KeyHandler.mozKeyCodeToKeyCodeMap_[e.keyCode];
    } else {
      this.keyCode_ = e.keyCode;
    }
  }
};


/**
 * Clears the stored previous key value, resetting the key repeat status. Uses
 * -1 because the Safari 3 Windows beta reports 0 for certain keys (like Home
 * and End.)
 * @param {goog.events.BrowserEvent} e The keyup event.
 * @private
 */
goog.events.KeyHandler.prototype.handleKeyup_ = function(e) {
  this.lastKey_ = -1;
  this.keyCode_ = -1;
};


/**
 * Handles the events on the element.
 * @param {goog.events.BrowserEvent} e  The keyboard event sent from the
 *     browser.
 */
goog.events.KeyHandler.prototype.handleEvent = function(e) {
  var be = e.getBrowserEvent();
  var keyCode, charCode;

  // IE reports the character code in the keyCode field for keypress events.
  // There are two exceptions however, Enter and Escape.
  if (goog.userAgent.IE && e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = keyCode != goog.events.KeyCodes.ENTER &&
        keyCode != goog.events.KeyCodes.ESC ?
            be.keyCode : 0;

  // Safari reports the character code in the keyCode field for keypress
  // events but also has a charCode field.
  } else if (goog.userAgent.WEBKIT &&
      e.type == goog.events.EventType.KEYPRESS) {
    keyCode = this.keyCode_;
    charCode = be.charCode >= 0 && be.charCode < 63232 &&
        goog.events.KeyCodes.isCharacterKey(keyCode) ?
            be.charCode : 0;

  // Opera reports the keycode or the character code in the keyCode field.
  } else if (goog.userAgent.OPERA) {
    keyCode = this.keyCode_;
    charCode = goog.events.KeyCodes.isCharacterKey(keyCode) ?
        be.keyCode : 0;

  // Mozilla reports the character code in the charCode field.
  } else {
    keyCode = be.keyCode || this.keyCode_;
    charCode = be.charCode || 0;
    // On the Mac, shift-/ triggers a question mark char code and no key code,
    // so we synthesize the latter
    if (goog.userAgent.MAC &&
        charCode == goog.events.KeyCodes.QUESTION_MARK &&
        !keyCode) {
      keyCode = goog.events.KeyCodes.SLASH;
    }
  }

  var key = keyCode;
  var keyIdentifier = be.keyIdentifier;

  // Correct the key value for certain browser-specific quirks.
  if (keyCode) {
    if (keyCode >= 63232 && keyCode in goog.events.KeyHandler.safariKey_) {
      // NOTE(nicksantos): Safari 3 has fixed this problem,
      // this is only needed for Safari 2.
      key = goog.events.KeyHandler.safariKey_[keyCode];
    } else {

      // Safari returns 25 for Shift+Tab instead of 9.
      if (keyCode == 25 && e.shiftKey) {
        key = 9;
      }
    }
  } else if (keyIdentifier &&
             keyIdentifier in goog.events.KeyHandler.keyIdentifier_) {
    // This is needed for Safari Windows because it currently doesn't give a
    // keyCode/which for non printable keys.
    key = goog.events.KeyHandler.keyIdentifier_[keyIdentifier];
  }

  // If we get the same keycode as a keydown/keypress without having seen a
  // keyup event, then this event was caused by key repeat.
  var repeat = key == this.lastKey_;
  this.lastKey_ = key;

  var event = new goog.events.KeyEvent(key, charCode, repeat, be);
  try {
    this.dispatchEvent(event);
  } finally {
    event.dispose();
  }
};


/**
 * Returns the element listened on for the real keyboard events.
 * @return {Element|Document|null} The element listened on for the real
 *     keyboard events.
 */
goog.events.KeyHandler.prototype.getElement = function() {
  return this.element_;
};


/**
 * Adds the proper key event listeners to the element.
 * @param {Element|Document} element The element to listen on.
 */
goog.events.KeyHandler.prototype.attach = function(element) {
  if (this.keyUpKey_) {
    this.detach();
  }

  this.element_ = element;

  this.keyPressKey_ = goog.events.listen(this.element_,
                                         goog.events.EventType.KEYPRESS,
                                         this);

  // Most browsers (Safari 2 being the notable exception) doesn't include the
  // keyCode in keypress events (IE has the char code in the keyCode field and
  // Mozilla only included the keyCode if there's no charCode). Thus we have to
  // listen for keydown to capture the keycode.
  this.keyDownKey_ = goog.events.listen(this.element_,
                                        goog.events.EventType.KEYDOWN,
                                        this.handleKeyDown_,
                                        false,
                                        this);


  this.keyUpKey_ = goog.events.listen(this.element_,
                                      goog.events.EventType.KEYUP,
                                      this.handleKeyup_,
                                      false,
                                      this);
};


/**
 * Removes the listeners that may exist.
 */
goog.events.KeyHandler.prototype.detach = function() {
  if (this.keyPressKey_) {
    goog.events.unlistenByKey(this.keyPressKey_);
    goog.events.unlistenByKey(this.keyDownKey_);
    goog.events.unlistenByKey(this.keyUpKey_);
    this.keyPressKey_ = null;
    this.keyDownKey_ = null;
    this.keyUpKey_ = null;
  }
  this.element_ = null;
  this.lastKey_ = -1;
  this.keyCode_ = -1;
};


/**
 * Disposes of the key handler.
 */
goog.events.KeyHandler.prototype.disposeInternal = function() {
  goog.events.KeyHandler.superClass_.disposeInternal.call(this);
  this.detach();
};



/**
 * This class is used for the goog.events.KeyHandler.EventType.KEY event and
 * it overrides the key code with the fixed key code.
 * @param {number} keyCode The adjusted key code.
 * @param {number} charCode The unicode character code.
 * @param {boolean} repeat Whether this event was generated by keyboard repeat.
 * @param {Event} browserEvent Browser event object.
 * @constructor
 * @extends {goog.events.BrowserEvent}
 */
goog.events.KeyEvent = function(keyCode, charCode, repeat, browserEvent) {
  goog.events.BrowserEvent.call(this, browserEvent);
  this.type = goog.events.KeyHandler.EventType.KEY;

  /**
   * Keycode of key press.
   * @type {number}
   */
  this.keyCode = keyCode;

  /**
   * Unicode character code.
   * @type {number}
   */
  this.charCode = charCode;

  /**
   * True if this event was generated by keyboard auto-repeat (i.e., the user is
   * holding the key down.)
   * @type {boolean}
   */
  this.repeat = repeat;
};
goog.inherits(goog.events.KeyEvent, goog.events.BrowserEvent);

// Input 46
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Global renderer and decorator registry.
*
 */

goog.provide('goog.ui.registry');

goog.require('goog.dom.classes');



/**
 * Given a {@link goog.ui.Component} constructor, returns an instance of its
 * default renderer.  If the default renderer is a singleton, returns the
 * singleton instance; otherwise returns a new instance of the renderer class.
 * @param {Function} componentCtor Component constructor function (for example
 *     {@code goog.ui.Button}).
 * @return {goog.ui.ControlRenderer?} Renderer instance (for example the
 *     singleton instance of {@code goog.ui.ButtonRenderer}), or null if
 *     no default renderer was found.
 */
goog.ui.registry.getDefaultRenderer = function(componentCtor) {
  // Locate the default renderer based on the constructor's unique ID.  If no
  // renderer is registered for this class, walk up the superClass_ chain.
  var key;
  var /** @constructor */ rendererCtor;
  while (componentCtor) {
    key = goog.getUid(componentCtor);
    if ((rendererCtor = goog.ui.registry.defaultRenderers_[key])) {
      break;
    }
    componentCtor = componentCtor.superClass_ ?
        componentCtor.superClass_.constructor : null;
  }

  // If the renderer has a static getInstance method, return the singleton
  // instance; otherwise create and return a new instance.
  if (rendererCtor) {
    return goog.isFunction(rendererCtor.getInstance) ?
        rendererCtor.getInstance() : new rendererCtor();
  }

  return null;
};


/**
 * Sets the default renderer for the given {@link goog.ui.Component}
 * constructor.
 * @param {Function} componentCtor Component constructor function (for example
 *     {@code goog.ui.Button}).
 * @param {Function} rendererCtor Renderer constructor function (for example
 *     {@code goog.ui.ButtonRenderer}).
 * @throws {Error} If the arguments aren't functions.
 */
goog.ui.registry.setDefaultRenderer = function(componentCtor, rendererCtor) {
  // In this case, explicit validation has negligible overhead (since each
  // renderer is only registered once), and helps catch subtle bugs.
  if (!goog.isFunction(componentCtor)) {
    throw Error('Invalid component class ' + componentCtor);
  }
  if (!goog.isFunction(rendererCtor)) {
    throw Error('Invalid renderer class ' + rendererCtor);
  }

  // Map the component constructor's unique ID to the renderer constructor.
  var key = goog.getUid(componentCtor);
  goog.ui.registry.defaultRenderers_[key] = rendererCtor;
};


/**
 * Returns the {@link goog.ui.Component} instance created by the decorator
 * factory function registered for the given CSS class name, or null if no
 * decorator factory function was found.
 * @param {string} className CSS class name.
 * @return {goog.ui.Component?} Component instance.
 */
goog.ui.registry.getDecoratorByClassName = function(className) {
  return className in goog.ui.registry.decoratorFunctions_ ?
      goog.ui.registry.decoratorFunctions_[className]() : null;
};


/**
 * Maps a CSS class name to a function that returns a new instance of
 * {@link goog.ui.Component} or a subclass, suitable to decorate an element
 * that has the specified CSS class.
 * @param {string} className CSS class name.
 * @param {Function} decoratorFn No-argument function that returns a new
 *     instance of a {@link goog.ui.Component} to decorate an element.
 * @throws {Error} If the class name or the decorator function is invalid.
 */
goog.ui.registry.setDecoratorByClassName = function(className, decoratorFn) {
  // In this case, explicit validation has negligible overhead (since each
  // decorator  is only registered once), and helps catch subtle bugs.
  if (!className) {
    throw Error('Invalid class name ' + className);
  }
  if (!goog.isFunction(decoratorFn)) {
    throw Error('Invalid decorator function ' + decoratorFn);
  }

  goog.ui.registry.decoratorFunctions_[className] = decoratorFn;
};


/**
 * Returns an instance of {@link goog.ui.Component} or a subclass suitable to
 * decorate the given element, based on its CSS class.
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Component?} Component to decorate the element (null if
 *     none).
 */
goog.ui.registry.getDecorator = function(element) {
  var decorator;
  var classNames = goog.dom.classes.get(element);
  for (var i = 0, len = classNames.length; i < len; i++) {
    if ((decorator = goog.ui.registry.getDecoratorByClassName(classNames[i]))) {
      return decorator;
    }
  }
  return null;
};


/**
 * Resets the global renderer and decorator registry.
 */
goog.ui.registry.reset = function() {
  goog.ui.registry.defaultRenderers_ = {};
  goog.ui.registry.decoratorFunctions_ = {};
};


/**
 * Map of {@link goog.ui.Component} constructor unique IDs to the constructors
 * of their default {@link goog.ui.Renderer}s.
 * @type {Object}
 * @private
 */
goog.ui.registry.defaultRenderers_ = {};


/**
 * Map of CSS class names to registry factory functions.  The keys are
 * class names.  The values are function objects that return new instances
 * of {@link goog.ui.registry} or one of its subclasses, suitable to
 * decorate elements marked with the corresponding CSS class.  Used by
 * containers while decorating their children.
 * @type {Object}
 * @private
 */
goog.ui.registry.decoratorFunctions_ = {};

// Input 47
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a function that decorates an element based on its CSS
 * class name.
*
 */

goog.provide('goog.ui.decorate');

goog.require('goog.ui.registry');



/**
 * Decorates the element with a suitable {@link goog.ui.Component} instance, if
 * a matching decorator is found.
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Component?} New component instance, decorating the element.
 */
goog.ui.decorate = function(element) {
  var decorator = goog.ui.registry.getDecorator(element);
  if (decorator) {
    decorator.decorate(element);
  }
  return decorator;
};

// Input 48
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for UI controls such as buttons, menus, menu items,
 * toolbar buttons, etc.  The implementation is based on a generalized version
 * of {@link goog.ui.MenuItem}.
 * TODO(user):  If the renderer framework works well, pull it into Component.
 *
*
 * @see ../demos/control.html
 */

goog.provide('goog.ui.Control');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events.BrowserEvent.MouseButton');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.string');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.Error');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.decorate');
goog.require('goog.ui.registry');
goog.require('goog.userAgent');


/**
 * Base class for UI controls.  Extends {@link goog.ui.Component} by adding
 * the following:
 *  <ul>
 *    <li>a {@link goog.events.KeyHandler}, to simplify keyboard handling,
 *    <li>a pluggable <em>renderer</em> framework, to simplify the creation of
 *        simple controls without the need to subclass this class,
 *    <li>the notion of component <em>content</em>, like a text caption or DOM
 *        structure displayed in the component (e.g. a button label),
 *    <li>getter and setter for component content, as well as a getter and
 *        setter specifically for caption text (for convenience),
 *    <li>support for hiding/showing the component,
      <li>fine-grained control over supported states and state transition
          events, and
 *    <li>default mouse and keyboard event handling.
 *  </ul>
 * This class has sufficient built-in functionality for most simple UI controls.
 * All controls dispatch SHOW, HIDE, ENTER, LEAVE, and ACTION events on show,
 * hide, mouseover, mouseout, and user action, respectively.  Additional states
 * are also supported.  See closure/demos/control.html
 * for example usage.
 * @param {goog.ui.ControlContent} content Text caption or DOM structure
 *     to display as the content of the component (if any).
 * @param {goog.ui.ControlRenderer=} opt_renderer Renderer used to render or
 *     decorate the component; defaults to {@link goog.ui.ControlRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Component}
 */
goog.ui.Control = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.renderer_ = opt_renderer ||
      goog.ui.registry.getDefaultRenderer(this.constructor);
  this.setContentInternal(content);
};
goog.inherits(goog.ui.Control, goog.ui.Component);


// Renderer registry.
// TODO(user): Refactor existing usages inside Google in a follow-up CL.


/**
 * Maps a CSS class name to a function that returns a new instance of
 * {@link goog.ui.Control} or a subclass thereof, suitable to decorate
 * an element that has the specified CSS class.  UI components that extend
 * {@link goog.ui.Control} and want {@link goog.ui.Container}s to be able
 * to discover and decorate elements using them should register a factory
 * function via this API.
 * @param {string} className CSS class name.
 * @param {Function} decoratorFunction Function that takes no arguments and
 *     returns a new instance of a control to decorate an element with the
 *     given class.
 * @deprecated Use {@link goog.ui.registry.setDecoratorByClassName} instead.
 */
goog.ui.Control.registerDecorator = goog.ui.registry.setDecoratorByClassName;


/**
 * Takes an element and returns a new instance of {@link goog.ui.Control}
 * or a subclass, suitable to decorate it (based on the element's CSS class).
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Control?} New control instance to decorate the element
 *     (null if none).
 * @deprecated Use {@link goog.ui.registry.getDecorator} instead.
 */
goog.ui.Control.getDecorator =
    /** @type {function(Element): goog.ui.Control} */ (
        goog.ui.registry.getDecorator);


/**
 * Takes an element, and decorates it with a {@link goog.ui.Control} instance
 * if a suitable decorator is found.
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Control?} New control instance that decorates the element
 *     (null if none).
 * @deprecated Use {@link goog.ui.decorate} instead.
 */
goog.ui.Control.decorate = /** @type {function(Element): goog.ui.Control} */ (
    goog.ui.decorate);


/**
 * Renderer associated with the component.
 * @type {goog.ui.ControlRenderer|undefined}
 * @private
 */
goog.ui.Control.prototype.renderer_;


/**
 * Text caption or DOM structure displayed in the component.
 * @type {goog.ui.ControlContent}
 * @private
 */
goog.ui.Control.prototype.content_ = null;


/**
 * Current component state; a bit mask of {@link goog.ui.Component.State}s.
 * @type {number}
 * @private
 */
goog.ui.Control.prototype.state_ = 0x00;


/**
 * A bit mask of {@link goog.ui.Component.State}s this component supports.
 * @type {number}
 * @private
 */
goog.ui.Control.prototype.supportedStates_ =
    goog.ui.Component.State.DISABLED |
    goog.ui.Component.State.HOVER |
    goog.ui.Component.State.ACTIVE |
    goog.ui.Component.State.FOCUSED;


/**
 * A bit mask of {@link goog.ui.Component.State}s for which this component
 * provides default event handling.  For example, a component that handles
 * the HOVER state automatically will highlight itself on mouseover, whereas
 * a component that doesn't handle HOVER automatically will only dispatch
 * ENTER and LEAVE events but not call {@link setHighlighted} on itself.
 * By default, components provide default event handling for all states.
 * Controls hosted in containers (e.g. menu items in a menu, or buttons in a
 * toolbar) will typically want to have their container manage their highlight
 * state.  Selectable controls managed by a selection model will also typically
 * want their selection state to be managed by the model.
 * @type {number}
 * @private
 */
goog.ui.Control.prototype.autoStates_ = goog.ui.Component.State.ALL;


/**
 * A bit mask of {@link goog.ui.Component.State}s for which this component
 * dispatches state transition events.  Because events are expensive, the
 * default behavior is to not dispatch any state transition events at all.
 * Use the {@link #setDispatchTransitionEvents} API to request transition
 * events  as needed.  Subclasses may enable transition events by default.
 * Controls hosted in containers or managed by a selection model will typically
 * want to dispatch transition events.
 * @type {number}
 * @private
 */
goog.ui.Control.prototype.statesWithTransitionEvents_ = 0x00;


/**
 * Component visibility.
 * @type {boolean}
 * @private
 */
goog.ui.Control.prototype.visible_ = true;


/**
 * Keyboard event handler.
 * @type {goog.events.KeyHandler}
 * @private
 */
goog.ui.Control.prototype.keyHandler_;


/**
 * Additional class name(s) to apply to the control's root element, if any.
 * @type {Array.<string>?}
 * @private
 */
goog.ui.Control.prototype.extraClassNames_ = null;


/**
 * Whether the control should listen for and handle mouse events; defaults to
 * true.
 * @type {boolean}
 * @private
 */
goog.ui.Control.prototype.handleMouseEvents_ = true;


/**
 * Whether the control allows text selection within its DOM.  Defaults to false.
 * @type {boolean}
 * @private
 */
goog.ui.Control.prototype.allowTextSelection_ = false;


// Event handler and renderer management.


/**
 * Returns true if the control is configured to handle its own mouse events,
 * false otherwise.  Controls not hosted in {@link goog.ui.Container}s have
 * to handle their own mouse events, but controls hosted in containers may
 * allow their parent to handle mouse events on their behalf.  Considered
 * protected; should only be used within this package and by subclasses.
 * @return {boolean} Whether the control handles its own mouse events.
 */
goog.ui.Control.prototype.isHandleMouseEvents = function() {
  return this.handleMouseEvents_;
};


/**
 * Enables or disables mouse event handling for the control.  Containers may
 * use this method to disable mouse event handling in their child controls.
 * Considered protected; should only be used within this package and by
 * subclasses.
 * @param {boolean} enable Whether to enable or disable mouse event handling.
 */
goog.ui.Control.prototype.setHandleMouseEvents = function(enable) {
  if (this.isInDocument() && enable != this.handleMouseEvents_) {
    // Already in the document; need to update event handler.
    this.enableMouseEventHandling_(enable);
  }
  this.handleMouseEvents_ = enable;
};


/**
 * Returns the DOM element on which the control is listening for keyboard
 * events (null if none).
 * @return {Element} Element on which the control is listening for key
 *     events.
 */
goog.ui.Control.prototype.getKeyEventTarget = function() {
  // Delegate to renderer.
  return this.renderer_.getKeyEventTarget(this);
};


/**
 * Returns the keyboard event handler for this component, lazily created the
 * first time this method is called.  Considered protected; should only be
 * used within this package and by subclasses.
 * @return {goog.events.KeyHandler} Keyboard event handler for this component.
 * @protected
 */
goog.ui.Control.prototype.getKeyHandler = function() {
  return this.keyHandler_ || (this.keyHandler_ = new goog.events.KeyHandler());
};


/**
 * Returns the renderer used by this component to render itself or to decorate
 * an existing element.
 * @return {goog.ui.ControlRenderer|undefined} Renderer used by the component
 *     (undefined if none).
 */
goog.ui.Control.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * Registers the given renderer with the component.  Changing renderers after
 * the component has entered the document is an error.
 * @param {goog.ui.ControlRenderer} renderer Renderer used by the component.
 * @throws {Error} If the control is already in the document.
 */
goog.ui.Control.prototype.setRenderer = function(renderer) {
  if (this.isInDocument()) {
    // Too late.
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  if (this.getElement()) {
    // The component has already been rendered, but isn't yet in the document.
    // Replace the renderer and delete the current DOM, so it can be re-rendered
    // using the new renderer the next time someone calls render().
    this.setElementInternal(null);
  }

  this.renderer_ = renderer;
};


// Support for additional styling.


/**
 * Returns any additional class name(s) to be applied to the component's
 * root element, or null if no extra class names are needed.
 * @return {Array.<string>?} Additional class names to be applied to
 *     the component's root element (null if none).
 */
goog.ui.Control.prototype.getExtraClassNames = function() {
  return this.extraClassNames_;
};


/**
 * Adds the given class name to the list of classes to be applied to the
 * component's root element.
 * @param {string} className Additional class name to be applied to the
 *     component's root element.
 */
goog.ui.Control.prototype.addClassName = function(className) {
  if (className) {
    if (this.extraClassNames_) {
      if (!goog.array.contains(this.extraClassNames_, className)) {
        this.extraClassNames_.push(className);
      }
    } else {
      this.extraClassNames_ = [className];
    }
    this.renderer_.enableExtraClassName(this, className, true);
  }
};


/**
 * Removes the given class name from the list of classes to be applied to
 * the component's root element.
 * @param {string} className Class name to be removed from the component's root
 *     element.
 */
goog.ui.Control.prototype.removeClassName = function(className) {
  if (className && this.extraClassNames_) {
    goog.array.remove(this.extraClassNames_, className);
    if (this.extraClassNames_.length == 0) {
      this.extraClassNames_ = null;
    }
    this.renderer_.enableExtraClassName(this, className, false);
  }
};


/**
 * Adds or removes the given class name to/from the list of classes to be
 * applied to the component's root element.
 * @param {string} className CSS class name to add or remove.
 * @param {boolean} enable Whether to add or remove the class name.
 */
goog.ui.Control.prototype.enableClassName = function(className, enable) {
  if (enable) {
    this.addClassName(className);
  } else {
    this.removeClassName(className);
  }
};


// Standard goog.ui.Component implementation.


/**
 * Creates the control's DOM.  Overrides {@link goog.ui.Component#createDom} by
 * delegating DOM manipulation to the control's renderer.
 * @override
 */
goog.ui.Control.prototype.createDom = function() {
  var element = this.renderer_.createDom(this);
  this.setElementInternal(element);

  // Initialize ARIA role.
  this.renderer_.setAriaRole(element);

  // Initialize text selection.
  if (!this.isAllowTextSelection()) {
    // The renderer is assumed to create selectable elements.  Since making
    // elements unselectable is expensive, only do it if needed (bug 1037090).
    this.renderer_.setAllowTextSelection(element, false);
  }

  // Initialize visibility.
  if (!this.isVisible()) {
    // The renderer is assumed to create visible elements. Since hiding
    // elements can be expensive, only do it if needed (bug 1037105).
    this.renderer_.setVisible(element, false);
  }
};


/**
 * Returns the DOM element into which child components are to be rendered,
 * or null if the control itself hasn't been rendered yet.  Overrides
 * {@link goog.ui.Component#getContentElement} by delegating to the renderer.
 * @return {Element} Element to contain child elements (null if none).
 */
goog.ui.Control.prototype.getContentElement = function() {
  // Delegate to renderer.
  return this.renderer_.getContentElement(this.getElement());
};


/**
 * Returns true if the given element can be decorated by this component.
 * Overrides {@link goog.ui.Component#canDecorate}.
 * @param {Element} element Element to decorate.
 * @return {boolean} Whether the element can be decorated by this component.
 */
goog.ui.Control.prototype.canDecorate = function(element) {
  // Controls support pluggable renderers; delegate to the renderer.
  return this.renderer_.canDecorate(element);
};


/**
 * Decorates the given element with this component. Overrides {@link
 * goog.ui.Component#decorateInternal} by delegating DOM manipulation
 * to the control's renderer.
 * @param {Element} element Element to decorate.
 * @protected
 * @override
 */
goog.ui.Control.prototype.decorateInternal = function(element) {
  element = this.renderer_.decorate(this, element);
  this.setElementInternal(element);

  // Initialize ARIA role.
  this.renderer_.setAriaRole(element);

  // Initialize text selection.
  if (!this.isAllowTextSelection()) {
    // Decorated elements are assumed to be selectable.  Since making elements
    // unselectable is expensive, only do it if needed (bug 1037090).
    this.renderer_.setAllowTextSelection(element, false);
  }

  // Initialize visibility based on the decorated element's styling.
  this.visible_ = element.style.display != 'none';
};


/**
 * Configures the component after its DOM has been rendered, and sets up event
 * handling.  Overrides {@link goog.ui.Component#enterDocument}.
 * @override
 */
goog.ui.Control.prototype.enterDocument = function() {
  goog.ui.Control.superClass_.enterDocument.call(this);

  // Call the renderer's initializeDom method to configure properties of the
  // control's DOM that can only be done once it's in the document.
  this.renderer_.initializeDom(this);

  // Initialize event handling if at least one state other than DISABLED is
  // supported.
  if (this.supportedStates_ & ~goog.ui.Component.State.DISABLED) {
    // Initialize mouse event handling if the control is configured to handle
    // its own mouse events.  (Controls hosted in containers don't need to
    // handle their own mouse events.)
    if (this.isHandleMouseEvents()) {
      this.enableMouseEventHandling_(true);
    }

    // Initialize keyboard event handling if the control is focusable and has
    // a key event target.  (Controls hosted in containers typically aren't
    // focusable, allowing their container to handle keyboard events for them.)
    if (this.isSupportedState(goog.ui.Component.State.FOCUSED)) {
      var keyTarget = this.getKeyEventTarget();
      if (keyTarget) {
        var keyHandler = this.getKeyHandler();
        keyHandler.attach(keyTarget);
        this.getHandler().
            listen(keyHandler, goog.events.KeyHandler.EventType.KEY,
                this.handleKeyEvent).
            listen(keyTarget, goog.events.EventType.FOCUS,
                this.handleFocus).
            listen(keyTarget, goog.events.EventType.BLUR,
                this.handleBlur);
      }
    }
  }
};


/**
 * Enables or disables mouse event handling on the control.
 * @param {boolean} enable Whether to enable mouse event handling.
 * @private
 */
goog.ui.Control.prototype.enableMouseEventHandling_ = function(enable) {
  var handler = this.getHandler();
  var element = this.getElement();
  if (enable) {
    handler.
        listen(element, goog.events.EventType.MOUSEOVER, this.handleMouseOver).
        listen(element, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).
        listen(element, goog.events.EventType.MOUSEUP, this.handleMouseUp).
        listen(element, goog.events.EventType.MOUSEOUT, this.handleMouseOut);
    if (goog.userAgent.IE) {
      handler.listen(element, goog.events.EventType.DBLCLICK,
          this.handleDblClick);
    }
  } else {
    handler.
        unlisten(element, goog.events.EventType.MOUSEOVER,
            this.handleMouseOver).
        unlisten(element, goog.events.EventType.MOUSEDOWN,
            this.handleMouseDown).
        unlisten(element, goog.events.EventType.MOUSEUP, this.handleMouseUp).
        unlisten(element, goog.events.EventType.MOUSEOUT, this.handleMouseOut);
    if (goog.userAgent.IE) {
      handler.unlisten(element, goog.events.EventType.DBLCLICK,
          this.handleDblClick);
    }
  }
};


/**
 * Cleans up the component before its DOM is removed from the document, and
 * removes event handlers.  Overrides {@link goog.ui.Component#exitDocument}
 * by making sure that components that are removed from the document aren't
 * focusable (i.e. have no tab index).
 * @override
 */
goog.ui.Control.prototype.exitDocument = function() {
  goog.ui.Control.superClass_.exitDocument.call(this);
  if (this.keyHandler_) {
    this.keyHandler_.detach();
  }
  if (this.isVisible() && this.isEnabled()) {
    this.renderer_.setFocusable(this, false);
  }
};


/** @inheritDoc */
goog.ui.Control.prototype.disposeInternal = function() {
  goog.ui.Control.superClass_.disposeInternal.call(this);
  if (this.keyHandler_) {
    this.keyHandler_.dispose();
    delete this.keyHandler_;
  }
  delete this.renderer_;
  this.content_ = null;
  this.extraClassNames_ = null;
};


// Component content management.


/**
 * Returns the text caption or DOM structure displayed in the component.
 * @return {goog.ui.ControlContent} Text caption or DOM structure
 *     comprising the component's contents.
 */
goog.ui.Control.prototype.getContent = function() {
  return this.content_;
};


/**
 * Sets the component's content to the given text caption, element, or array of
 * nodes.  (If the argument is an array of nodes, it must be an actual array,
 * not an array-like object.)
 * @param {goog.ui.ControlContent} content Text caption or DOM
 *     structure to set as the component's contents.
 */
goog.ui.Control.prototype.setContent = function(content) {
  // Controls support pluggable renderers; delegate to the renderer.
  this.renderer_.setContent(this.getElement(), content);

  // setContentInternal needs to be after the renderer, since the implementation
  // may depend on the content being in the DOM.
  this.setContentInternal(content);
};


/**
 * Sets the component's content to the given text caption, element, or array
 * of nodes.  Unlike {@link #setContent}, doesn't modify the component's DOM.
 * Called by renderers during element decoration.  Considered protected; should
 * only be used within this package and by subclasses.
 * @param {goog.ui.ControlContent} content Text caption or DOM structure
 *     to set as the component's contents.
 * @protected
 */
goog.ui.Control.prototype.setContentInternal = function(content) {
  this.content_ = content;
};


/**
 * Returns the text caption of the component.
 * @return {?string} Text caption of the component (null if none).
 */
goog.ui.Control.prototype.getCaption = function() {
  var content = this.getContent();
  if (!content || goog.isString(content)) {
    return content;
  }

  var caption = goog.isArray(content) ?
      goog.array.map(content, goog.dom.getTextContent).join('') :
      goog.dom.getTextContent(/** @type {!Node} */ (content));
  return caption && goog.string.trim(caption);
};


/**
 * Sets the text caption of the component.
 * @param {string} caption Text caption of the component (null to clear).
 */
goog.ui.Control.prototype.setCaption = function(caption) {
  this.setContent(caption);
};


// Component state management.


/** @inheritDoc */
goog.ui.Control.prototype.setRightToLeft = function(rightToLeft) {
  // The superclass implementation ensures the control isn't in the document.
  goog.ui.Control.superClass_.setRightToLeft.call(this, rightToLeft);

  var element = this.getElement();
  if (element) {
    this.renderer_.setRightToLeft(element, rightToLeft);
  }
};


/**
 * Returns true if the control allows text selection within its DOM, false
 * otherwise.  Controls that disallow text selection have the appropriate
 * unselectable styling applied to their elements.  Note that controls hosted
 * in containers will report that they allow text selection even if their
 * container disallows text selection.
 * @return {boolean} Whether the control allows text selection.
 */
goog.ui.Control.prototype.isAllowTextSelection = function() {
  return this.allowTextSelection_;
};


/**
 * Allows or disallows text selection within the control's DOM.
 * @param {boolean} allow Whether the control should allow text selection.
 */
goog.ui.Control.prototype.setAllowTextSelection = function(allow) {
  this.allowTextSelection_ = allow;

  var element = this.getElement();
  if (element) {
    this.renderer_.setAllowTextSelection(element, allow);
  }
};


/**
 * Returns true if the component's visibility is set to visible, false if
 * it is set to hidden.  A component that is set to hidden is guaranteed
 * to be hidden from the user, but the reverse isn't necessarily true.
 * A component may be set to visible but can otherwise be obscured by another
 * element, rendered off-screen, or hidden using direct CSS manipulation.
 * @return {boolean} Whether the component is visible.
 */
goog.ui.Control.prototype.isVisible = function() {
  return this.visible_;
};


/**
 * Shows or hides the component.  Does nothing if the component already has
 * the requested visibility.  Otherwise, dispatches a SHOW or HIDE event as
 * appropriate, giving listeners a chance to prevent the visibility change.
 * When showing a component that is both enabled and focusable, ensures that
 * its key target has a tab index.  When hiding a component that is enabled
 * and focusable, blurs its key target and removes its tab index.
 * @param {boolean} visible Whether to show or hide the component.
 * @param {boolean=} opt_force If true, doesn't check whether the component
 *     already has the requested visibility, and doesn't dispatch any events.
 * @return {boolean} Whether the visibility was changed.
 */
goog.ui.Control.prototype.setVisible = function(visible, opt_force) {
  if (opt_force || (this.visible_ != visible && this.dispatchEvent(visible ?
      goog.ui.Component.EventType.SHOW : goog.ui.Component.EventType.HIDE))) {
    var element = this.getElement();
    if (element) {
      this.renderer_.setVisible(element, visible);
    }
    if (this.isEnabled()) {
      this.renderer_.setFocusable(this, visible);
    }
    this.visible_ = visible;
    return true;
  }
  return false;
};


/**
 * Returns true if the component is enabled, false otherwise.
 * @return {boolean} Whether the component is enabled.
 */
goog.ui.Control.prototype.isEnabled = function() {
  return !this.hasState(goog.ui.Component.State.DISABLED);
};


/**
 * Returns true if the control has a parent that is itself disabled, false
 * otherwise.
 * @return {boolean} Whether the component is hosted in a disabled container.
 * @private
 */
goog.ui.Control.prototype.isParentDisabled_ = function() {
  var parent = this.getParent();
  return !!parent && typeof parent.isEnabled == 'function' &&
      !parent.isEnabled();
};


/**
 * Enables or disables the component.  Does nothing if this state transition
 * is disallowed.  If the component is both visible and focusable, updates its
 * focused state and tab index as needed.  If the component is being disabled,
 * ensures that it is also deactivated and un-highlighted first.  Note that the
 * component's enabled/disabled state is "locked" as long as it is hosted in a
 * {@link goog.ui.Container} that is itself disabled; this is to prevent clients
 * from accidentally re-enabling a control that is in a disabled container.
 * @param {boolean} enable Whether to enable or disable the component.
 * @see #isTransitionAllowed
 */
goog.ui.Control.prototype.setEnabled = function(enable) {
  if (!this.isParentDisabled_() &&
      this.isTransitionAllowed(goog.ui.Component.State.DISABLED, !enable)) {
    if (!enable) {
      this.setActive(false);
      this.setHighlighted(false);
    }
    if (this.isVisible()) {
      this.renderer_.setFocusable(this, enable);
    }
    this.setState(goog.ui.Component.State.DISABLED, !enable);
  }
};


/**
 * Returns true if the component is currently highlighted, false otherwise.
 * @return {boolean} Whether the component is highlighted.
 */
goog.ui.Control.prototype.isHighlighted = function() {
  return this.hasState(goog.ui.Component.State.HOVER);
};


/**
 * Highlights or unhighlights the component.  Does nothing if this state
 * transition is disallowed.
 * @param {boolean} highlight Whether to highlight or unhighlight the component.
 * @see #isTransitionAllowed
 */
goog.ui.Control.prototype.setHighlighted = function(highlight) {
  if (this.isTransitionAllowed(goog.ui.Component.State.HOVER, highlight)) {
    this.setState(goog.ui.Component.State.HOVER, highlight);
  }
};


/**
 * Returns true if the component is active (pressed), false otherwise.
 * @return {boolean} Whether the component is active.
 */
goog.ui.Control.prototype.isActive = function() {
  return this.hasState(goog.ui.Component.State.ACTIVE);
};


/**
 * Activates or deactivates the component.  Does nothing if this state
 * transition is disallowed.
 * @param {boolean} active Whether to activate or deactivate the component.
 * @see #isTransitionAllowed
 */
goog.ui.Control.prototype.setActive = function(active) {
  if (this.isTransitionAllowed(goog.ui.Component.State.ACTIVE, active)) {
    this.setState(goog.ui.Component.State.ACTIVE, active);
  }
};


/**
 * Returns true if the component is selected, false otherwise.
 * @return {boolean} Whether the component is selected.
 */
goog.ui.Control.prototype.isSelected = function() {
  return this.hasState(goog.ui.Component.State.SELECTED);
};


/**
 * Selects or unselects the component.  Does nothing if this state transition
 * is disallowed.
 * @param {boolean} select Whether to select or unselect the component.
 * @see #isTransitionAllowed
 */
goog.ui.Control.prototype.setSelected = function(select) {
  if (this.isTransitionAllowed(goog.ui.Component.State.SELECTED, select)) {
    this.setState(goog.ui.Component.State.SELECTED, select);
  }
};


/**
 * Returns true if the component is checked, false otherwise.
 * @return {boolean} Whether the component is checked.
 */
goog.ui.Control.prototype.isChecked = function() {
  return this.hasState(goog.ui.Component.State.CHECKED);
};


/**
 * Checks or unchecks the component.  Does nothing if this state transition
 * is disallowed.
 * @param {boolean} check Whether to check or uncheck the component.
 * @see #isTransitionAllowed
 */
goog.ui.Control.prototype.setChecked = function(check) {
  if (this.isTransitionAllowed(goog.ui.Component.State.CHECKED, check)) {
    this.setState(goog.ui.Component.State.CHECKED, check);
  }
};


/**
 * Returns true if the component is styled to indicate that it has keyboard
 * focus, false otherwise.  Note that {@code isFocused()} returning true
 * doesn't guarantee that the component's key event target has keyborad focus,
 * only that it is styled as such.
 * @return {boolean} Whether the component is styled to indicate as having
 *     keyboard focus.
 */
goog.ui.Control.prototype.isFocused = function() {
  return this.hasState(goog.ui.Component.State.FOCUSED);
};


/**
 * Applies or removes styling indicating that the component has keyboard focus.
 * Note that unlike the other "set" methods, this method is called as a result
 * of the component's element having received or lost keyboard focus, not the
 * other way around, so calling {@code setFocused(true)} doesn't guarantee that
 * the component's key event target has keyboard focus, only that it is styled
 * as such.
 * @param {boolean} focused Whether to apply or remove styling to indicate that
 *     the component's element has keyboard focus.
 */
goog.ui.Control.prototype.setFocused = function(focused) {
  if (this.isTransitionAllowed(goog.ui.Component.State.FOCUSED, focused)) {
    this.setState(goog.ui.Component.State.FOCUSED, focused);
  }
};


/**
 * Returns true if the component is open (expanded), false otherwise.
 * @return {boolean} Whether the component is open.
 */
goog.ui.Control.prototype.isOpen = function() {
  return this.hasState(goog.ui.Component.State.OPENED);
};


/**
 * Opens (expands) or closes (collapses) the component.  Does nothing if this
 * state transition is disallowed.
 * @param {boolean} open Whether to open or close the component.
 * @see #isTransitionAllowed
 */
goog.ui.Control.prototype.setOpen = function(open) {
  if (this.isTransitionAllowed(goog.ui.Component.State.OPENED, open)) {
    this.setState(goog.ui.Component.State.OPENED, open);
  }
};


/**
 * Returns the component's state as a bit mask of {@link
 * goog.ui.Component.State}s.
 * @return {number} Bit mask representing component state.
 */
goog.ui.Control.prototype.getState = function() {
  return this.state_;
};


/**
 * Returns true if the component is in the specified state, false otherwise.
 * @param {goog.ui.Component.State} state State to check.
 * @return {boolean} Whether the component is in the given state.
 */
goog.ui.Control.prototype.hasState = function(state) {
  return !!(this.state_ & state);
};


/**
 * Sets or clears the given state on the component, and updates its styling
 * accordingly.  Does nothing if the component is already in the correct state
 * or if it doesn't support the specified state.  Doesn't dispatch any state
 * transition events; use advisedly.
 * @param {goog.ui.Component.State} state State to set or clear.
 * @param {boolean} enable Whether to set or clear the state (if supported).
 */
goog.ui.Control.prototype.setState = function(state, enable) {
  if (this.isSupportedState(state) && enable != this.hasState(state)) {
    // Delegate actual styling to the renderer, since it is DOM-specific.
    this.renderer_.setState(this, state, enable);
    this.state_ = enable ? this.state_ | state : this.state_ & ~state;
  }
};


/**
 * Sets the component's state to the state represented by a bit mask of
 * {@link goog.ui.Component.State}s.  Unlike {@link #setState}, doesn't
 * update the component's styling, and doesn't reject unsupported states.
 * Called by renderers during element decoration.  Considered protected;
 * should only be used within this package and by subclasses.
 * @param {number} state Bit mask representing component state.
 * @protected
 */
goog.ui.Control.prototype.setStateInternal = function(state) {
  this.state_ = state;
};


/**
 * Returns true if the component supports the specified state, false otherwise.
 * @param {goog.ui.Component.State} state State to check.
 * @return {boolean} Whether the component supports the given state.
 */
goog.ui.Control.prototype.isSupportedState = function(state) {
  return !!(this.supportedStates_ & state);
};


/**
 * Enables or disables support for the given state. Disabling support
 * for a state while the component is in that state is an error.
 * @param {goog.ui.Component.State} state State to support or de-support.
 * @param {boolean} support Whether the component should support the state.
 * @throws {Error} If disabling support for a state the control is currently in.
 */
goog.ui.Control.prototype.setSupportedState = function(state, support) {
  if (this.isInDocument() && this.hasState(state) && !support) {
    // Since we hook up event handlers in enterDocument(), this is an error.
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  if (!support && this.hasState(state)) {
    // We are removing support for a state that the component is currently in.
    this.setState(state, false);
  }

  this.supportedStates_ = support ?
      this.supportedStates_ | state : this.supportedStates_ & ~state;
};


/**
 * Returns true if the component provides default event handling for the state,
 * false otherwise.
 * @param {goog.ui.Component.State} state State to check.
 * @return {boolean} Whether the component provides default event handling for
 *     the state.
 */
goog.ui.Control.prototype.isAutoState = function(state) {
  return !!(this.autoStates_ & state) && this.isSupportedState(state);
};


/**
 * Enables or disables automatic event handling for the given state(s).
 * @param {number} states Bit mask of {@link goog.ui.Component.State}s for which
 *     default event handling is to be enabled or disabled.
 * @param {boolean} enable Whether the component should provide default event
 *     handling for the state(s).
 */
goog.ui.Control.prototype.setAutoStates = function(states, enable) {
  this.autoStates_ = enable ?
      this.autoStates_ | states : this.autoStates_ & ~states;
};


/**
 * Returns true if the component is set to dispatch transition events for the
 * given state, false otherwise.
 * @param {goog.ui.Component.State} state State to check.
 * @return {boolean} Whether the component dispatches transition events for
 *     the state.
 */
goog.ui.Control.prototype.isDispatchTransitionEvents = function(state) {
  return !!(this.statesWithTransitionEvents_ & state) &&
      this.isSupportedState(state);
};


/**
 * Enables or disables transition events for the given state(s).  Controls
 * handle state transitions internally by default, and only dispatch state
 * transition events if explicitly requested to do so by calling this mentod.
 * @param {number} states Bit mask of {@link goog.ui.Component.State}s for
 *     which transition events should be enabled or disabled.
 * @param {boolean} enable Whether transition events should be enabled.
 */
goog.ui.Control.prototype.setDispatchTransitionEvents = function(states,
    enable) {
  this.statesWithTransitionEvents_ = enable ?
      this.statesWithTransitionEvents_ | states :
      this.statesWithTransitionEvents_ & ~states;
};


/**
 * Returns true if the transition into or out of the given state is allowed to
 * proceed, false otherwise.  A state transition is allowed under the following
 * conditions:
 * <ul>
 *   <li>the component supports the state,
 *   <li>the component isn't already in the target state,
 *   <li>either the component is configured not to dispatch events for this
 *       state transition, or a transition event was dispatched and wasn't
 *       canceled by any event listener, and
 *   <li>the component hasn't been disposed of
 * </ul>
 * Considered protected; should only be used within this package and by
 * subclasses.
 * @param {goog.ui.Component.State} state State to/from which the control is
 *     transitioning.
 * @param {boolean} enable Whether the control is entering or leaving the state.
 * @return {boolean} Whether the state transition is allowed to proceed.
 * @protected
 */
goog.ui.Control.prototype.isTransitionAllowed = function(state, enable) {
  return this.isSupportedState(state) &&
      this.hasState(state) != enable &&
      (!(this.statesWithTransitionEvents_ & state) || this.dispatchEvent(
          goog.ui.Component.getStateTransitionEvent(state, enable))) &&
      !this.isDisposed();
};


// Default event handlers, to be overridden in subclasses.


/**
 * Handles mouseover events.  Dispatches an ENTER event; if the event isn't
 * canceled, the component is enabled, and it supports auto-highlighting,
 * highlights the component.  Considered protected; should only be used
 * within this package and by subclasses.
 * @param {goog.events.BrowserEvent} e Mouse event to handle.
 */
goog.ui.Control.prototype.handleMouseOver = function(e) {
  // Ignore mouse moves between descendants.
  if (!goog.ui.Control.isMouseEventWithinElement_(e, this.getElement()) &&
      this.dispatchEvent(goog.ui.Component.EventType.ENTER) &&
      this.isEnabled() &&
      this.isAutoState(goog.ui.Component.State.HOVER)) {
    this.setHighlighted(true);
  }
};


/**
 * Handles mouseout events.  Dispatches a LEAVE event; if the event isn't
 * canceled, and the component supports auto-highlighting, deactivates and
 * un-highlights the component.  Considered protected; should only be used
 * within this package and by subclasses.
 * @param {goog.events.BrowserEvent} e Mouse event to handle.
 */
goog.ui.Control.prototype.handleMouseOut = function(e) {
  if (!goog.ui.Control.isMouseEventWithinElement_(e, this.getElement()) &&
      this.dispatchEvent(goog.ui.Component.EventType.LEAVE)) {
    if (this.isAutoState(goog.ui.Component.State.ACTIVE)) {
      // Deactivate on mouseout; otherwise we lose track of the mouse button.
      this.setActive(false);
    }
    if (this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(false);
    }
  }
};


/**
 * Checks if a mouse event (mouseover or mouseout) occured below an element.
 * @param {goog.events.BrowserEvent} e Mouse event (should be mouseover or
 *     mouseout).
 * @param {Element} elem The ancestor element.
 * @return {boolean} Whether the event has a relatedTarget (the element the
 *     mouse is coming from) and it's a descendent of elem.
 * @private
 */
goog.ui.Control.isMouseEventWithinElement_ = function(e, elem) {
  // If relatedTarget is null, it means there was no previous element (e.g.
  // the mouse moved out of the window).  Assume this means that the mouse
  // event was not within the element.
  return !!e.relatedTarget && goog.dom.contains(elem, e.relatedTarget);
};


/**
 * Handles mousedown events.  If the component is enabled, highlights and
 * activates it.  If the component isn't configured for keyboard access,
 * prevents it from receiving keyboard focus.  Considered protected; should
 * only be used within this package andy by subclasses.
 * @param {goog.events.Event} e Mouse event to handle.
 */
goog.ui.Control.prototype.handleMouseDown = function(e) {
  if (this.isEnabled()) {
    // Highlight enabled control on mousedown, regardless of the mouse button.
    if (this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(true);
    }

    // For the left button only, activate the control, and focus its key event
    // target (if supported).
    if (e.isButton(goog.events.BrowserEvent.MouseButton.LEFT)) {
      if (this.isAutoState(goog.ui.Component.State.ACTIVE)) {
        this.setActive(true);
      }
      if (this.renderer_.isFocusable(this)) {
        this.getKeyEventTarget().focus();
      }
    }
  }

  // Cancel the default action unless the control allows text selection.
  if (!this.isAllowTextSelection() &&
      e.isButton(goog.events.BrowserEvent.MouseButton.LEFT)) {
    e.preventDefault();
  }
};


/**
 * Handles mouseup events.  If the component is enabled, highlights it.  If
 * the component has previously been activated, performs its associated action
 * by calling {@link performActionInternal}, then deactivates it.  Considered
 * protected; should only be used within this package and by subclasses.
 * @param {goog.events.Event} e Mouse event to handle.
 */
goog.ui.Control.prototype.handleMouseUp = function(e) {
  if (this.isEnabled()) {
    if (this.isAutoState(goog.ui.Component.State.HOVER)) {
      this.setHighlighted(true);
    }
    if (this.isActive() &&
        this.performActionInternal(e) &&
        this.isAutoState(goog.ui.Component.State.ACTIVE)) {
      this.setActive(false);
    }
  }
};


/**
 * Handles dblclick events.  Should only be registered if the user agent is
 * IE.  If the component is enabled, performs its associated action by calling
 * {@link performActionInternal}.  This is used to allow more performant
 * buttons in IE.  In IE, no mousedown event is fired when that mousedown will
 * trigger a dblclick event.  Because of this, a user clicking quickly will
 * only cause ACTION events to fire on every other click.  This is a workaround
 * to generate ACTION events for every click.  Unfortunately, this workaround
 * won't ever trigger the ACTIVE state.  This is roughly the same behaviour as
 * if this were a 'button' element with a listener on mouseup.  Considered
 * protected; should only be used within this package and by subclasses.
 * @param {goog.events.Event} e Mouse event to handle.
 */
goog.ui.Control.prototype.handleDblClick = function(e) {
  if (this.isEnabled()) {
    this.performActionInternal(e);
  }
};


/**
 * Performs the appropriate action when the control is activated by the user.
 * The default implementation first updates the checked and selected state of
 * controls that support them, then dispatches an ACTION event.  Considered
 * protected; should only be used within this package and by subclasses.
 * @param {goog.events.Event} e Event that triggered the action.
 * @return {boolean} Whether the action is allowed to proceed.
 * @protected
 */
goog.ui.Control.prototype.performActionInternal = function(e) {
  if (this.isAutoState(goog.ui.Component.State.CHECKED)) {
    this.setChecked(!this.isChecked());
  }
  if (this.isAutoState(goog.ui.Component.State.SELECTED)) {
    this.setSelected(true);
  }
  if (this.isAutoState(goog.ui.Component.State.OPENED)) {
    this.setOpen(!this.isOpen());
  }

  var actionEvent = new goog.events.Event(goog.ui.Component.EventType.ACTION,
      this);
  if (e) {
    var properties = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey',
        'platformModifierKey'];
    for (var property, i = 0; property = properties[i]; i++) {
      actionEvent[property] = e[property];
    }
  }
  return this.dispatchEvent(actionEvent);
};


/**
 * Handles focus events on the component's key event target element.  If the
 * component is focusable, updates its state and styling to indicate that it
 * now has keyboard focus.  Considered protected; should only be used within
 * this package and by subclasses.  <b>Warning:</b> IE dispatches focus and
 * blur events asynchronously!
 * @param {goog.events.Event} e Focus event to handle.
 */
goog.ui.Control.prototype.handleFocus = function(e) {
  if (this.isAutoState(goog.ui.Component.State.FOCUSED)) {
    this.setFocused(true);
  }
};


/**
 * Handles blur events on the component's key event target element.  Always
 * deactivates the component.  In addition, if the component is focusable,
 * updates its state and styling to indicate that it no longer has keyboard
 * focus.  Considered protected; should only be used within this package and
 * by subclasses.  <b>Warning:</b> IE dispatches focus and blur events
 * asynchronously!
 * @param {goog.events.Event} e Blur event to handle.
 */
goog.ui.Control.prototype.handleBlur = function(e) {
  if (this.isAutoState(goog.ui.Component.State.ACTIVE)) {
    this.setActive(false);
  }
  if (this.isAutoState(goog.ui.Component.State.FOCUSED)) {
    this.setFocused(false);
  }
};


/**
 * Attempts to handle a keyboard event, if the component is enabled and visible,
 * by calling {@link handleKeyEventInternal}.  Considered protected; should only
 * be used within this package and by subclasses.
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} Whether the key event was handled.
 */
goog.ui.Control.prototype.handleKeyEvent = function(e) {
  if (this.isVisible() && this.isEnabled() &&
      this.handleKeyEventInternal(e)) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  return false;
};


/**
 * Attempts to handle a keyboard event; returns true if the event was handled,
 * false otherwise.  Considered protected; should only be used within this
 * package and by subclasses.
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} Whether the key event was handled.
 * @protected
 */
goog.ui.Control.prototype.handleKeyEventInternal = function(e) {
  return e.keyCode == goog.events.KeyCodes.ENTER &&
      this.performActionInternal(e);
};


// Register the default renderer for goog.ui.Controls.
goog.ui.registry.setDefaultRenderer(goog.ui.Control, goog.ui.ControlRenderer);


// Register a decorator factory function for goog.ui.Controls.
goog.ui.registry.setDecoratorByClassName(goog.ui.ControlRenderer.CSS_CLASS,
    function() {
      return new goog.ui.Control(null);
    });

// Input 49
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Native browser button renderer for {@link goog.ui.Button}s.
 *
*
 */

goog.provide('goog.ui.NativeButtonRenderer');

goog.require('goog.dom.classes');
goog.require('goog.events.EventType');
goog.require('goog.ui.ButtonRenderer');
goog.require('goog.ui.Component.State');



/**
 * Renderer for {@link goog.ui.Button}s.  Renders and decorates native HTML
 * button elements.  Since native HTML buttons have built-in support for many
 * features, overrides many expensive (and redundant) superclass methods to
 * be no-ops.
 * @constructor
 * @extends {goog.ui.ButtonRenderer}
 */
goog.ui.NativeButtonRenderer = function() {
  goog.ui.ButtonRenderer.call(this);
};
goog.inherits(goog.ui.NativeButtonRenderer, goog.ui.ButtonRenderer);
goog.addSingletonGetter(goog.ui.NativeButtonRenderer);


/** @inheritDoc */
goog.ui.NativeButtonRenderer.prototype.getAriaRole = function() {
  // Native buttons don't need ARIA roles to be recognized by screen readers.
  return undefined;
};


/**
 * Returns the button's contents wrapped in a native HTML button element.  Sets
 * the button's disabled attribute as needed.
 * @param {goog.ui.Control} button Button to render.
 * @return {Element} Root element for the button (a native HTML button element).
 * @override
 */
goog.ui.NativeButtonRenderer.prototype.createDom = function(button) {
  this.setUpNativeButton_(button);
  return button.getDomHelper().createDom('button', {
    'class': this.getClassNames(button).join(' '),
    'disabled': !button.isEnabled(),
    'title': button.getTooltip() || '',
    'value': button.getValue() || ''
  }, button.getCaption() || '');
};


/**
 * Overrides {@link goog.ui.ButtonRenderer#canDecorate} by returning true only
 * if the element is an HTML button.
 * @param {Element} element Element to decorate.
 * @return {boolean} Whether the renderer can decorate the element.
 * @override
 */
goog.ui.NativeButtonRenderer.prototype.canDecorate = function(element) {
  return element.tagName == 'BUTTON' ||
      (element.tagName == 'INPUT' && (element.type == 'button' ||
          element.type == 'submit' || element.type == 'reset'));
};


/** @inheritDoc */
goog.ui.NativeButtonRenderer.prototype.decorate = function(button, element) {
  this.setUpNativeButton_(button);
  if (element.disabled) {
    // Add the marker class for the DISABLED state before letting the superclass
    // implementation decorate the element, so its state will be correct.
    goog.dom.classes.add(element,
        this.getClassForState(goog.ui.Component.State.DISABLED));
  }
  return goog.ui.NativeButtonRenderer.superClass_.decorate.call(this, button,
      element);
};


/**
 * @inheritDoc
 * Native buttons natively support BiDi and keyboard focus.
 */
goog.ui.NativeButtonRenderer.prototype.initializeDom = function(button) {
  // WARNING:  This is a hack, and it is only applicable to native buttons,
  // which are special because they do natively what most goog.ui.Controls
  // do programmatically.  Do not use your renderer's initializeDom method
  // to hook up event handlers!
  button.getHandler().listen(button.getElement(), goog.events.EventType.CLICK,
      button.performActionInternal);
};


/**
 * @inheritDoc
 * Native buttons don't support text selection.
 */
goog.ui.NativeButtonRenderer.prototype.setAllowTextSelection =
    goog.nullFunction;


/**
 * @inheritDoc
 * Native buttons natively support right-to-left rendering.
 */
goog.ui.NativeButtonRenderer.prototype.setRightToLeft = goog.nullFunction;


/**
 * @inheritDoc
 * Native buttons are always focusable as long as they are enabled.
 */
goog.ui.NativeButtonRenderer.prototype.isFocusable = function(button) {
  return button.isEnabled();
};


/**
 * @inheritDoc
 * Native buttons natively support keyboard focus.
 */
goog.ui.NativeButtonRenderer.prototype.setFocusable = goog.nullFunction;


/**
 * @inheritDoc
 * Native buttons also expose the DISABLED state in the HTML button's
 * {@code disabled} attribute.
 */
goog.ui.NativeButtonRenderer.prototype.setState = function(button, state,
    enable) {
  goog.ui.NativeButtonRenderer.superClass_.setState.call(this, button, state,
      enable);
  var element = button.getElement();
  if (element && state == goog.ui.Component.State.DISABLED) {
    element.disabled = enable;
  }
};


/**
 * @inheritDoc
 * Native buttons store their value in the HTML button's {@code value}
 * attribute.
 */
goog.ui.NativeButtonRenderer.prototype.getValue = function(element) {
  // TODO(user): Make this work on IE!  This never worked...
  // See http://www.fourmilab.ch/fourmilog/archives/2007-03/000824.html
  // for a description of the problem.
  return element.value;
};


/**
 * @inheritDoc
 * Native buttons also expose their value in the HTML button's {@code value}
 * attribute.
 */
goog.ui.NativeButtonRenderer.prototype.setValue = function(element, value) {
  if (element) {
    // TODO(user): Make this work on IE!  This never worked...
    // See http://www.fourmilab.ch/fourmilog/archives/2007-03/000824.html
    // for a description of the problem.
    element.value = value;
  }
};


/**
 * @inheritDoc
 * Native buttons don't need ARIA states to support accessibility, so this is
 * a no-op.
 */
goog.ui.NativeButtonRenderer.prototype.updateAriaState = goog.nullFunction;


/**
 * Sets up the button control such that it doesn't waste time adding
 * functionality that is already natively supported by native browser
 * buttons.
 * @param {goog.ui.Control} button Button control to configure.
 * @private
 */
goog.ui.NativeButtonRenderer.prototype.setUpNativeButton_ = function(button) {
  button.setHandleMouseEvents(false);
  button.setAutoStates(goog.ui.Component.State.ALL, false);
  button.setSupportedState(goog.ui.Component.State.FOCUSED, false);
};

// Input 50
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A button control. This implementation extends {@link
 * goog.ui.Control}.
 *
*
 * @see ../demos/button.html
 */

goog.provide('goog.ui.Button');
goog.provide('goog.ui.Button.Side');

goog.require('goog.events.KeyCodes');
goog.require('goog.ui.ButtonRenderer');
goog.require('goog.ui.Control');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.NativeButtonRenderer');



/**
 * A button control, rendered as a native browser button by default.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Renderer used to render or
 *     decorate the button; defaults to {@link goog.ui.NativeButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Control}
 */
goog.ui.Button = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Control.call(this, content, opt_renderer ||
      goog.ui.NativeButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.Button, goog.ui.Control);


/**
 * Constants for button sides, see {@link goog.ui.Button.prototype.setCollapsed}
 * for details.
 * @enum {number}
 */
goog.ui.Button.Side = {
  /** Neither side. */
  NONE: 0,
  /** Left for LTR, right for RTL. */
  START: 1,
  /** Right for LTR, left for RTL. */
  END: 2,
  /** Both sides. */
  BOTH: 3
};


/**
 * Value associated with the button.
 * @type {*}
 * @private
 */
goog.ui.Button.prototype.value_;


/**
 * Tooltip text for the button, displayed on hover.
 * @type {string|undefined}
 * @private
 */
goog.ui.Button.prototype.tooltip_;


// goog.ui.Button API implementation.


/**
 * Returns the value associated with the button.
 * @return {*} Button value (undefined if none).
 */
goog.ui.Button.prototype.getValue = function() {
  return this.value_;
};


/**
 * Sets the value associated with the button, and updates its DOM.
 * @param {*} value New button value.
 */
goog.ui.Button.prototype.setValue = function(value) {
  this.value_ = value;
  this.getRenderer().setValue(this.getElement(), value);
};


/**
 * Sets the value associated with the button.  Unlike {@link #setValue},
 * doesn't update the button's DOM.  Considered protected; to be called only
 * by renderer code during element decoration.
 * @param {*} value New button value.
 * @protected
 */
goog.ui.Button.prototype.setValueInternal = function(value) {
  this.value_ = value;
};


/**
 * Returns the tooltip for the button.
 * @return {string|undefined} Tooltip text (undefined if none).
 */
goog.ui.Button.prototype.getTooltip = function() {
  return this.tooltip_;
};


/**
 * Sets the tooltip for the button, and updates its DOM.
 * @param {string} tooltip New tooltip text.
 */
goog.ui.Button.prototype.setTooltip = function(tooltip) {
  this.tooltip_ = tooltip;
  this.getRenderer().setTooltip(this. getElement(), tooltip);
};


/**
 * Sets the tooltip for the button.  Unlike {@link #setTooltip}, doesn't update
 * the button's DOM.  Considered protected; to be called only by renderer code
 * during element decoration.
 * @param {string} tooltip New tooltip text.
 * @protected
 */
goog.ui.Button.prototype.setTooltipInternal = function(tooltip) {
  this.tooltip_ = tooltip;
};


/**
 * Collapses the border on one or both sides of the button, allowing it to be
 * combined with the adjancent button(s), forming a single UI componenet with
 * multiple targets.
 * @param {number} sides Bitmap of one or more {@link goog.ui.Button.Side}s for
 *     which borders should be collapsed.
 */
goog.ui.Button.prototype.setCollapsed = function(sides) {
  this.getRenderer().setCollapsed(this, sides);
};


// goog.ui.Control & goog.ui.Component API implementation.


/** @inheritDoc */
goog.ui.Button.prototype.disposeInternal = function() {
  goog.ui.Button.superClass_.disposeInternal.call(this);
  delete this.value_;
  delete this.tooltip_;
};


/** @inheritDoc */
goog.ui.Button.prototype.enterDocument = function() {
  goog.ui.Button.superClass_.enterDocument.call(this);
  if (this.isSupportedState(goog.ui.Component.State.FOCUSED)) {
    var keyTarget = this.getKeyEventTarget();
    if (keyTarget) {
      this.getHandler().listen(keyTarget, goog.events.EventType.KEYUP,
          this.handleKeyEventInternal);
    }
  }
};


/**
 * Attempts to handle a keyboard event; returns true if the event was handled,
 * false otherwise.  If the button is enabled and the Enter/Space key was
 * pressed, handles the event by dispatching an {@code ACTION} event,
 * and returns true. Overrides {@link goog.ui.Control#handleKeyEventInternal}.
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} Whether the key event was handled.
 * @protected
 * @override
 */
goog.ui.Button.prototype.handleKeyEventInternal = function(e) {
  if (e.keyCode == goog.events.KeyCodes.ENTER &&
      e.type == goog.events.KeyHandler.EventType.KEY ||
      e.keyCode == goog.events.KeyCodes.SPACE &&
      e.type == goog.events.EventType.KEYUP) {
    return this.performActionInternal(e);
  }
  // Return true for space keypress (even though the event is handled on keyup)
  // as preventDefault needs to be called up keypress to take effect in IE and
  // WebKit.
  return e.keyCode == goog.events.KeyCodes.SPACE;
};


// Register a decorator factory function for goog.ui.Buttons.
goog.ui.registry.setDecoratorByClassName(goog.ui.ButtonRenderer.CSS_CLASS,
    function() {
      return new goog.ui.Button(null);
    });

// Input 51
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for {@link goog.ui.MenuSeparator}s.
 *
*
 */

goog.provide('goog.ui.MenuSeparatorRenderer');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ControlRenderer');


/**
 * Renderer for menu separators.
 * @constructor
 * @extends {goog.ui.ControlRenderer}
 */
goog.ui.MenuSeparatorRenderer = function() {
  goog.ui.ControlRenderer.call(this);
};
goog.inherits(goog.ui.MenuSeparatorRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(goog.ui.MenuSeparatorRenderer);


/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.MenuSeparatorRenderer.CSS_CLASS = goog.getCssName('goog-menuseparator');


/**
 * Returns an empty, styled menu separator DIV.  Overrides {@link
 * goog.ui.ControlRenderer#createDom}.
 * @param {goog.ui.Separator} separator Separator to render.
 * @return {Element} Root element for the separator.
 */
goog.ui.MenuSeparatorRenderer.prototype.createDom = function(separator) {
  return separator.getDomHelper().createDom('div', this.getCssClass());
};


/**
 * Takes an existing element, and decorates it with the separator.  Overrides
 * {@link goog.ui.ControlRenderer#decorate}.
 * @param {goog.ui.Separator} separator Separator to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 */
goog.ui.MenuSeparatorRenderer.prototype.decorate = function(separator,
                                                            element) {
  if (element.tagName == 'HR') {
    // Replace HR with separator.
    var hr = element;
    element = this.createDom(separator);
    goog.dom.insertSiblingBefore(element, hr);
    goog.dom.removeNode(hr);
  } else {
    goog.dom.classes.add(element, this.getCssClass());
  }
  return element;
};


/**
 * Overrides {@link goog.ui.ControlRenderer#setContent} to do nothing, since
 * separators are empty.
 * @param {Element} separator The separator's root element.
 * @param {goog.ui.ControlContent} content Text caption or DOM structure to be
 *    set as the separators's content (ignored).
 */
goog.ui.MenuSeparatorRenderer.prototype.setContent = function(separator,
                                                              content) {
  // Do nothing.  Separators are empty.
};


/**
 * Returns the CSS class to be applied to the root element of components
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.MenuSeparatorRenderer.prototype.getCssClass = function() {
  return goog.ui.MenuSeparatorRenderer.CSS_CLASS;
};

// Input 52
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A class for representing a separator, with renderers for both
 * horizontal (menu) and vertical (toolbar) separators.
 *
*
 */

goog.provide('goog.ui.Separator');

goog.require('goog.dom.a11y');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.Control');
goog.require('goog.ui.MenuSeparatorRenderer');
goog.require('goog.ui.registry');


/**
 * Class representing a separator.  Although it extends {@link goog.ui.Control},
 * the Separator class doesn't allocate any event handlers, nor does it change
 * its appearance on mouseover, etc.
 * @param {goog.ui.MenuSeparatorRenderer=} opt_renderer Renderer to render or
 *    decorate the separator; defaults to {@link goog.ui.MenuSeparatorRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper, used for
 *    document interaction.
 * @constructor
 * @extends {goog.ui.Control}
 */
goog.ui.Separator = function(opt_renderer, opt_domHelper) {
  goog.ui.Control.call(this, null, opt_renderer ||
      goog.ui.MenuSeparatorRenderer.getInstance(), opt_domHelper);

  this.setSupportedState(goog.ui.Component.State.DISABLED, false);
  this.setSupportedState(goog.ui.Component.State.HOVER, false);
  this.setSupportedState(goog.ui.Component.State.ACTIVE, false);
  this.setSupportedState(goog.ui.Component.State.FOCUSED, false);

  // Separators are always considered disabled.
  this.setStateInternal(goog.ui.Component.State.DISABLED);
};
goog.inherits(goog.ui.Separator, goog.ui.Control);


/**
 * Configures the component after its DOM has been rendered.  Overrides
 * {@link goog.ui.Control#enterDocument} by making sure no event handler
 * is allocated.
 */
goog.ui.Separator.prototype.enterDocument = function() {
  goog.ui.Separator.superClass_.enterDocument.call(this);
  goog.dom.a11y.setRole(this.getElement(), 'separator');
};


// Register a decorator factory function for goog.ui.MenuSeparators.
goog.ui.registry.setDecoratorByClassName(
    goog.ui.MenuSeparatorRenderer.CSS_CLASS,
    function() {
      // Separator defaults to using MenuSeparatorRenderer.
      return new goog.ui.Separator();
    });

// Input 53
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for container renderers.
 *
*
 */

goog.provide('goog.ui.ContainerRenderer');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.a11y');
goog.require('goog.dom.classes');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.ui.Separator');
goog.require('goog.ui.registry');
goog.require('goog.userAgent');



/**
 * Default renderer for {@link goog.ui.Container}.  Can be used as-is, but
 * subclasses of Container will probably want to use renderers specifically
 * tailored for them by extending this class.
 * @constructor
 */
goog.ui.ContainerRenderer = function() {
};
goog.addSingletonGetter(goog.ui.ContainerRenderer);


/**
 * Constructs a new renderer and sets the CSS class that the renderer will use
 * as the base CSS class to apply to all elements rendered by that renderer.
 * An example to use this function using a menu is:
 *
 * <pre>
 * var myCustomRenderer = goog.ui.ContainerRenderer.getCustomRenderer(
 *     goog.ui.MenuRenderer, 'my-special-menu');
 * var newMenu = new goog.ui.Menu(opt_domHelper, myCustomRenderer);
 * </pre>
 *
 * Your styles for the menu can now be:
 * <pre>
 * .my-special-menu { }
 * </pre>
 *
 * <em>instead</em> of
 * <pre>
 * .CSS_MY_SPECIAL_MENU .goog-menu { }
 * </pre>
 *
 * You would want to use this functionality when you want an instance of a
 * component to have specific styles different than the other components of the
 * same type in your application.  This avoids using descendant selectors to
 * apply the specific styles to this component.
 *
 * @param {Function} ctor The constructor of the renderer you want to create.
 * @param {string} cssClassName The name of the CSS class for this renderer.
 * @return {goog.ui.ContainerRenderer} An instance of the desired renderer with
 *     its getCssClass() method overridden to return the supplied custom CSS
 *     class name.
 */
goog.ui.ContainerRenderer.getCustomRenderer = function(ctor, cssClassName) {
  var renderer = new ctor();

  /**
   * Returns the CSS class to be applied to the root element of components
   * rendered using this renderer.
   * @return {string} Renderer-specific CSS class.
   */
  renderer.getCssClass = function() {
    return cssClassName;
  };

  return renderer;
};


/**
 * Default CSS class to be applied to the root element of containers rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ContainerRenderer.CSS_CLASS = goog.getCssName('goog-container');


/**
 * Returns the ARIA role to be applied to the container.
 * See http://wiki/Main/ARIA for more info.
 * @return {undefined|string} ARIA role.
 */
goog.ui.ContainerRenderer.prototype.getAriaRole = function() {
  // By default, the ARIA role is unspecified.
  return undefined;
};


/**
 * Returns true if the element has a valid tab index (defined as >= 0), false
 * otherwise.  Only elements with a valid tab index can receive focus.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element has a tab index.
 */
goog.ui.ContainerRenderer.prototype.hasTabIndex = function(element) {
  if (element) {
    // IE returns a value of 0 for an unset tabIndex.  Therefore, we must use
    // getAttributeNode('tabIndex'), which returns an object with a 'specified'
    // property if tabIndex is specified.  For more info, see
    // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
    var attrNode = element.getAttributeNode('tabindex');
    if (attrNode && attrNode.specified) {
      // TabIndex is specified.
      var index = element.tabIndex;
      return goog.isNumber(index) && index >= 0;
    }
  }
  // Either the element is null, or tabIndex is not specified.
  return false;
};


/**
 * Enables or disables the tab index of the element.  Only elements with a
 * valid tab index can receive focus.
 * @param {Element} element Element whose tab index is to be changed.
 * @param {boolean} enable Whether to add or remove the element's tab index.
 */
goog.ui.ContainerRenderer.prototype.enableTabIndex = function(element, enable) {
  if (element) {
    element.tabIndex = enable ? 0 : -1;
  }
};


/**
 * Creates and returns the container's root element.  The default
 * simply creates a DIV and applies the renderer's own CSS class name to it.
 * To be overridden in subclasses.
 * @param {goog.ui.Container} container Container to render.
 * @return {Element} Root element for the container.
 */
goog.ui.ContainerRenderer.prototype.createDom = function(container) {
  return container.getDomHelper().createDom('div',
      this.getClassNames(container).join(' '));
};


/**
 * Returns the DOM element into which child components are to be rendered,
 * or null if the container hasn't been rendered yet.
 * @param {Element} element Root element of the container whose content element
 *     is to be returned.
 * @return {Element} Element to contain child elements (null if none).
 */
goog.ui.ContainerRenderer.prototype.getContentElement = function(element) {
  return element;
};


/**
 * Default implementation of {@code canDecorate}; returns true if the element
 * is a DIV, false otherwise.
 * @param {Element} element Element to decorate.
 * @return {boolean} Whether the renderer can decorate the element.
 */
goog.ui.ContainerRenderer.prototype.canDecorate = function(element) {
  return element.tagName == 'DIV';
};


/**
 * Default implementation of {@code decorate} for {@link goog.ui.Container}s.
 * Decorates the element with the container, and attempts to decorate its child
 * elements.  Returns the decorated element.
 * @param {goog.ui.Container} container Container to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 */
goog.ui.ContainerRenderer.prototype.decorate = function(container, element) {
  // Set the container's ID to the decorated element's DOM ID, if any.
  if (element.id) {
    container.setId(element.id);
  }

  // Configure the container's state based on the CSS class names it has.
  var baseClass = this.getCssClass();
  var hasBaseClass = false;
  var classNames = goog.dom.classes.get(element);
  if (classNames) {
    goog.array.forEach(classNames, function(className) {
      if (className == baseClass) {
        hasBaseClass = true;
      } else if (className) {
        this.setStateFromClassName(container, className, baseClass);
      }
    }, this);
  }

  if (!hasBaseClass) {
    // Make sure the container's root element has the renderer's own CSS class.
    goog.dom.classes.add(element, baseClass);
  }

  // Decorate the element's children, if applicable.  This should happen after
  // the container's own state has been initialized, since how children are
  // decorated may depend on the state of the container.
  this.decorateChildren(container, element);

  return element;
};


/**
 * Sets the container's state based on the given CSS class name, encountered
 * during decoration.  CSS class names that don't represent container states
 * are ignored.  Considered protected; subclasses should override this method
 * to support more states and CSS class names.
 * @param {goog.ui.Container} container Container to update.
 * @param {string} className CSS class name.
 * @param {string} baseClass Base class name used as the root of state-specific
 *     class names (typically the renderer's own class name).
 * @protected
 */
goog.ui.ContainerRenderer.prototype.setStateFromClassName = function(container,
    className, baseClass) {
  if (className == goog.getCssName(baseClass, 'disabled')) {
    container.setEnabled(false);
  } else if (className == goog.getCssName(baseClass, 'horizontal')) {
    container.setOrientation(goog.ui.Container.Orientation.HORIZONTAL);
  } else if (className == goog.getCssName(baseClass, 'vertical')) {
    container.setOrientation(goog.ui.Container.Orientation.VERTICAL);
  }
};


/**
 * Takes a container and an element that may contain child elements, decorates
 * the child elements, and adds the corresponding components to the container
 * as child components.  Any non-element child nodes (e.g. empty text nodes
 * introduced by line breaks in the HTML source) are removed from the element.
 * @param {goog.ui.Container} container Container whose children are to be
 *     discovered.
 * @param {Element} element Element whose children are to be decorated.
 */
goog.ui.ContainerRenderer.prototype.decorateChildren = function(container,
    element) {
  if (element) {
    var node = element.firstChild, next;
    // Tag soup HTML may result in a DOM where siblings have different parents.
    while (node && node.parentNode == element) {
      // Get the next sibling here, since the node may be replaced or removed.
      next = node.nextSibling;
      if (node.nodeType == goog.dom.NodeType.ELEMENT) {
        // Decorate element node.
        var child = this.getDecoratorForChild(/** @type {Element} */(node));
        if (child) {
          // addChild() may need to look at the element.
          child.setElementInternal(/** @type {Element} */(node));
          // If the container is disabled, mark the child disabled too.  See
          // bug 1263729.  Note that this must precede the call to addChild().
          if (!container.isEnabled()) {
            child.setEnabled(false);
          }
          container.addChild(child);
          child.decorate(/** @type {Element} */(node));
        }
      } else if (!node.nodeValue || goog.string.trim(node.nodeValue) == '') {
        // Remove empty text node, otherwise madness ensues (e.g. controls that
        // use goog-inline-block will flicker and shift on hover on Gecko).
        element.removeChild(node);
      }
      node = next;
    }
  }
};


/**
 * Inspects the element, and creates an instance of {@link goog.ui.Control} or
 * an appropriate subclass best suited to decorate it.  Returns the control (or
 * null if no suitable class was found).  This default implementation uses the
 * element's CSS class to find the appropriate control class to instantiate.
 * May be overridden in subclasses.
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Control?} A new control suitable to decorate the element
 *     (null if none).
 */
goog.ui.ContainerRenderer.prototype.getDecoratorForChild = function(element) {
  return (/** @type {goog.ui.Control} */
      goog.ui.registry.getDecorator(element));
};


/**
 * Initializes the container's DOM when the container enters the document.
 * Called from {@link goog.ui.Container#enterDocument}.
 * @param {goog.ui.Container} container Container whose DOM is to be initialized
 *     as it enters the document.
 */
goog.ui.ContainerRenderer.prototype.initializeDom = function(container) {
  var elem = container.getElement();

  // Make sure the container's element isn't selectable.  On Gecko, recursively
  // marking each child element unselectable is expensive and unnecessary, so
  // only mark the root element unselectable.
  goog.style.setUnselectable(elem, true, goog.userAgent.GECKO);

  // IE doesn't support outline:none, so we have to use the hideFocus property.
  if (goog.userAgent.IE) {
    elem.hideFocus = true;
  }

  // Set the ARIA role.
  var ariaRole = this.getAriaRole();
  if (ariaRole) {
    goog.dom.a11y.setRole(elem, ariaRole);
  }
};


/**
 * Returns the element within the container's DOM that should receive keyboard
 * focus (null if none).  The default implementation returns the container's
 * root element.
 * @param {goog.ui.Container} container Container whose key event target is
 *     to be returned.
 * @return {Element} Key event target (null if none).
 */
goog.ui.ContainerRenderer.prototype.getKeyEventTarget = function(container) {
  return container.getElement();
};


/**
 * Returns the CSS class to be applied to the root element of containers
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.ContainerRenderer.prototype.getCssClass = function() {
  return goog.ui.ContainerRenderer.CSS_CLASS;
};


/**
 * Returns all CSS class names applicable to the given container, based on its
 * state.  The array of class names returned includes the renderer's own CSS
 * class, followed by a CSS class indicating the container's orientation,
 * followed by any state-specific CSS classes.
 * @param {goog.ui.Container} container Container whose CSS classes are to be
 *     returned.
 * @return {Array.<string>} Array of CSS class names applicable to the
 *     container.
 */
goog.ui.ContainerRenderer.prototype.getClassNames = function(container) {
  var baseClass = this.getCssClass();
  var isHorizontal =
      container.getOrientation() == goog.ui.Container.Orientation.HORIZONTAL;
  var classNames = [
      baseClass,
      (isHorizontal ?
          goog.getCssName(baseClass, 'horizontal') :
          goog.getCssName(baseClass, 'vertical'))
  ];
  if (!container.isEnabled()) {
    classNames.push(goog.getCssName(baseClass, 'disabled'));
  }
  return classNames;
};


/**
 * Returns the default orientation of containers rendered or decorated by this
 * renderer.  The base class implementation returns {@code VERTICAL}.
 * @return {goog.ui.Container.Orientation} Default orientation for containers
 *     created or decorated by this renderer.
 */
goog.ui.ContainerRenderer.prototype.getDefaultOrientation = function() {
  return goog.ui.Container.Orientation.VERTICAL;
};

// Input 54
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for containers that host {@link goog.ui.Control}s,
 * such as menus and toolbars.  Provides default keyboard and mouse event
 * handling and child management, based on a generalized version of
 * {@link goog.ui.Menu}.
 *
*
 * @see ../demos/container.html
 */
// TODO(user):  Fix code/logic duplication between this and goog.ui.Control.
// TODO(user):  Maybe pull common stuff all the way up into Component...?

goog.provide('goog.ui.Container');
goog.provide('goog.ui.Container.Orientation');

goog.require('goog.dom');
goog.require('goog.dom.a11y');
goog.require('goog.dom.a11y.State');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.style');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.Error');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ContainerRenderer');

/**
 * Base class for containers.  Extends {@link goog.ui.Component} by adding
 * the following:
 *  <ul>
 *    <li>a {@link goog.events.KeyHandler}, to simplify keyboard handling,
 *    <li>a pluggable <em>renderer</em> framework, to simplify the creation of
 *        containers without the need to subclass this class,
 *    <li>methods to manage child controls hosted in the container,
 *    <li>default mouse and keyboard event handling methods.
 *  </ul>
 * @param {?goog.ui.Container.Orientation=} opt_orientation Container
 *     orientation; defaults to {@code VERTICAL}.
 * @param {?goog.ui.ContainerRenderer=} opt_renderer Renderer used to render or
 *     decorate the container; defaults to {@link goog.ui.ContainerRenderer}.
 * @param {?goog.dom.DomHelper=} opt_domHelper DOM helper, used for document
 *     interaction.
 * @extends {goog.ui.Component}
 * @constructor
 */
goog.ui.Container = function(opt_orientation, opt_renderer, opt_domHelper) {
  goog.ui.Component.call(this, opt_domHelper);
  this.renderer_ = opt_renderer || goog.ui.ContainerRenderer.getInstance();
  this.orientation_ = opt_orientation || this.renderer_.getDefaultOrientation();
};
goog.inherits(goog.ui.Container, goog.ui.Component);


/**
 * Container-specific events.
 * @enum {string}
 */
goog.ui.Container.EventType = {
  /**
   * Dispatched after a goog.ui.Container becomes visible. Non-cancellable.
   * NOTE(user): This event really shouldn't exist, because the
   * goog.ui.Component.EventType.SHOW event should behave like this one. But the
   * SHOW event for containers has been behaving as other components'
   * BEFORE_SHOW event for a long time, and too much code relies on that old
   * behavior to fix it now.
   */
  AFTER_SHOW: 'aftershow'
};


/**
 * Container orientation constants.
 * @enum {string}
 */
goog.ui.Container.Orientation = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};


/**
 * Allows an alternative element to be set to recieve key events, otherwise
 * defers to the renderer's element choice.
 * @type {Element|undefined}
 * @private
 */
goog.ui.Container.prototype.keyEventTarget_ = null;


/**
 * Keyboard event handler.
 * @type {goog.events.KeyHandler?}
 * @private
 */
goog.ui.Container.prototype.keyHandler_ = null;


/**
 * Renderer for the container.  Defaults to {@link goog.ui.ContainerRenderer}.
 * @type {goog.ui.ContainerRenderer?}
 * @private
 */
goog.ui.Container.prototype.renderer_ = null;


/**
 * Container orientation; determines layout and default keyboard navigation.
 * @type {?goog.ui.Container.Orientation}
 * @private
 */
goog.ui.Container.prototype.orientation_ = null;


/**
 * Whether the container is set to be visible.  Defaults to true.
 * @type {boolean}
 * @private
 */
goog.ui.Container.prototype.visible_ = true;


/**
 * Whether the container is enabled and reacting to keyboard and mouse events.
 * Defaults to true.
 * @type {boolean}
 * @private
 */
goog.ui.Container.prototype.enabled_ = true;


/**
 * Whether the container supports keyboard focus.  Defaults to true.  Focusable
 * containers have a {@code tabIndex} and can be navigated to via the keyboard.
 * @type {boolean}
 * @private
 */
goog.ui.Container.prototype.focusable_ = true;


/**
 * The 0-based index of the currently highlighted control in the container
 * (-1 if none).
 * @type {number}
 * @private
 */
goog.ui.Container.prototype.highlightedIndex_ = -1;


/**
 * The currently open (expanded) control in the container (null if none).
 * @type {goog.ui.Control?}
 * @private
 */
goog.ui.Container.prototype.openItem_ = null;


/**
 * Whether the mouse button is held down.  Defaults to false.  This flag is set
 * when the user mouses down over the container, and remains set until they
 * release the mouse button.
 * @type {boolean}
 * @private
 */
goog.ui.Container.prototype.mouseButtonPressed_ = false;


/**
 * Whether focus of child componenets should be allowed.  Only effective if
 * focusable_ is set to false.
 * @type {boolean}
 * @private
 */
goog.ui.Container.prototype.allowFocusableChildren_ = false;


/**
 * Map of DOM IDs to child controls.  Each key is the DOM ID of a child
 * control's root element; each value is a reference to the child control
 * itself.  Used for looking up the child control corresponding to a DOM
 * node in O(1) time.
 * @type {Object}
 * @private
 */
goog.ui.Container.prototype.childElementIdMap_ = null;


// Event handler and renderer management.


/**
 * Returns the DOM element on which the container is listening for keyboard
 * events (null if none).
 * @return {Element} Element on which the container is listening for key
 *     events.
 */
goog.ui.Container.prototype.getKeyEventTarget = function() {
  // Delegate to renderer, unless we've set an explicit target.
  return this.keyEventTarget_ || this.renderer_.getKeyEventTarget(this);
};


/**
 * Attaches an element on which to listen for key events.
 * @param {Element|undefined} element The element to attach, or null/undefined
 *     to attach to the default element.
 */
goog.ui.Container.prototype.setKeyEventTarget = function(element) {
  if (this.focusable_) {
    var oldTarget = this.getKeyEventTarget();
    var inDocument = this.isInDocument();

    this.keyEventTarget_ = element;
    var newTarget = this.getKeyEventTarget();

    if (inDocument) {
      // Unlisten for events on the old key target.  Requires us to reset
      // key target state temporarily.
      this.keyEventTarget_ = oldTarget;
      this.enableFocusHandling_(false);
      this.keyEventTarget_ = element;

      // Listen for events on the new key target.
      this.getKeyHandler().attach(newTarget);
      this.enableFocusHandling_(true);
    }
  } else {
   throw Error('Can\'t set key event target for container ' +
       'that doesn\'t support keyboard focus!');
 }
};


/**
 * Returns the keyboard event handler for this container, lazily created the
 * first time this method is called.  The keyboard event handler listens for
 * keyboard events on the container's key event target, as determined by its
 * renderer.
 * @return {goog.events.KeyHandler} Keyboard event handler for this container.
 */
goog.ui.Container.prototype.getKeyHandler = function() {
  return this.keyHandler_ ||
      (this.keyHandler_ = new goog.events.KeyHandler(this.getKeyEventTarget()));
};


/**
 * Returns the renderer used by this container to render itself or to decorate
 * an existing element.
 * @return {goog.ui.ContainerRenderer} Renderer used by the container.
 */
goog.ui.Container.prototype.getRenderer = function() {
  return this.renderer_;
};


/**
 * Registers the given renderer with the container.  Changing renderers after
 * the container has already been rendered or decorated is an error.
 * @param {goog.ui.ContainerRenderer} renderer Renderer used by the container.
 */
goog.ui.Container.prototype.setRenderer = function(renderer) {
  if (this.getElement()) {
    // Too late.
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  this.renderer_ = renderer;
};


// Standard goog.ui.Component implementation.


/**
 * Creates the container's DOM.  Overrides {@link goog.ui.Component#createDom}.
 */
goog.ui.Container.prototype.createDom = function() {
  // Delegate to renderer.
  this.setElementInternal(this.renderer_.createDom(this));
};


/**
 * Returns the DOM element into which child components are to be rendered,
 * or null if the container itself hasn't been rendered yet.  Overrides
 * {@link goog.ui.Component#getContentElement} by delegating to the renderer.
 * @return {Element} Element to contain child elements (null if none).
 */
goog.ui.Container.prototype.getContentElement = function() {
  // Delegate to renderer.
  return this.renderer_.getContentElement(this.getElement());
};


/**
 * Returns true if the given element can be decorated by this container.
 * Overrides {@link goog.ui.Component#canDecorate}.
 * @param {Element} element Element to decorate.
 * @return {boolean} True iff the element can be decorated.
 */
goog.ui.Container.prototype.canDecorate = function(element) {
  // Delegate to renderer.
  return this.renderer_.canDecorate(element);
};


/**
 * Decorates the given element with this container. Overrides {@link
 * goog.ui.Component#decorateInternal}.  Considered protected.
 * @param {Element} element Element to decorate.
 */
goog.ui.Container.prototype.decorateInternal = function(element) {
  // Delegate to renderer.
  this.setElementInternal(this.renderer_.decorate(this, element));
  // Check whether the decorated element is explicitly styled to be invisible.
  if (element.style.display == 'none') {
    this.visible_ = false;
  }
};


/**
 * Configures the container after its DOM has been rendered, and sets up event
 * handling.  Overrides {@link goog.ui.Component#enterDocument}.
 */
goog.ui.Container.prototype.enterDocument = function() {
  goog.ui.Container.superClass_.enterDocument.call(this);

  this.forEachChild(function(child) {
    if (child.isInDocument()) {
      this.registerChildId_(child);
    }
  }, this);

  // Detect right-to-left direction.
  var elem = this.getElement();

  // Call the renderer's initializeDom method to initialize the container's DOM.
  this.renderer_.initializeDom(this);

  // Initialize visibility (opt_force = true, so we don't dispatch events).
  this.setVisible(this.visible_, true);

  // Handle events dispatched by child controls.
  this.getHandler().
      listen(this, goog.ui.Component.EventType.ENTER,
          this.handleEnterItem).
      listen(this, goog.ui.Component.EventType.HIGHLIGHT,
          this.handleHighlightItem).
      listen(this, goog.ui.Component.EventType.UNHIGHLIGHT,
          this.handleUnHighlightItem).
      listen(this, goog.ui.Component.EventType.OPEN, this.handleOpenItem).
      listen(this, goog.ui.Component.EventType.CLOSE, this.handleCloseItem).

      // Handle mouse events.
      listen(elem, goog.events.EventType.MOUSEDOWN, this.handleMouseDown).
      listen(goog.dom.getOwnerDocument(elem), goog.events.EventType.MOUSEUP,
          this.handleDocumentMouseUp).

      // Handle mouse events on behalf of cpresently2ontrols in the container.
      listen(elem, [
        goog.events.EventType.MOUSEDOWN,
        goog.events.EventType.MOUSEUP,
        goog.events.EventType.MOUSEOVER,
        goog.events.EventType.MOUSEOUT
      ], this.handleChildMouseEvents);

  // If the container is focusable, set up keyboard event handling.
  if (this.isFocusable()) {
    this.enableFocusHandling_(true);
  }
};


/**
 * Sets up listening for events applicable to focusable containers.
 * @param {boolean} enable Whether to enable or disable focus handling.
 * @private
 */
goog.ui.Container.prototype.enableFocusHandling_ = function(enable) {
  var handler = this.getHandler();
  var keyTarget = this.getKeyEventTarget();
  if (enable) {
    handler.
        listen(keyTarget, goog.events.EventType.FOCUS, this.handleFocus).
        listen(keyTarget, goog.events.EventType.BLUR, this.handleBlur).
        listen(this.getKeyHandler(), goog.events.KeyHandler.EventType.KEY,
            this.handleKeyEvent);
  } else {
    handler.
        unlisten(keyTarget, goog.events.EventType.FOCUS, this.handleFocus).
        unlisten(keyTarget, goog.events.EventType.BLUR, this.handleBlur).
        unlisten(this.getKeyHandler(), goog.events.KeyHandler.EventType.KEY,
            this.handleKeyEvent);
  }
};


/**
 * Cleans up the container before its DOM is removed from the document, and
 * removes event handlers.  Overrides {@link goog.ui.Component#exitDocument}.
 */
goog.ui.Container.prototype.exitDocument = function() {
  // {@link #setHighlightedIndex} has to be called before
  // {@link goog.ui.Component#exitDocument}, otherwise it has no effect.
  this.setHighlightedIndex(-1);

  if (this.openItem_) {
    this.openItem_.setOpen(false);
  }

  this.mouseButtonPressed_ = false;

  goog.ui.Container.superClass_.exitDocument.call(this);
};


/** @inheritDoc */
goog.ui.Container.prototype.disposeInternal = function() {
  goog.ui.Container.superClass_.disposeInternal.call(this);

  if (this.keyHandler_) {
    this.keyHandler_.dispose();
    this.keyHandler_ = null;
  }

  this.childElementIdMap_ = null;
  this.openItem_ = null;
  this.renderer_ = null;
};


// Default event handlers.


/**
 * Handles ENTER events raised by child controls when they are navigated to.
 * @param {goog.events.Event} e ENTER event to handle.
 * @return {boolean} Whether to prevent handleMouseOver from handling
 *    the event.
 */
goog.ui.Container.prototype.handleEnterItem = function(e) {
  // Allow the Control to highlight itself.
  return true;
};


/**
 * Handles HIGHLIGHT events dispatched by items in the container when
 * they are highlighted.
 * @param {goog.events.Event} e Highlight event to handle.
 */
goog.ui.Container.prototype.handleHighlightItem = function(e) {
  var index = this.indexOfChild(/** @type {goog.ui.Control} */ (e.target));
  if (index > -1 && index != this.highlightedIndex_) {
    var item = this.getHighlighted();
    if (item) {
      // Un-highlight previously highlighted item.
      item.setHighlighted(false);
    }

    this.highlightedIndex_ = index;
    item = this.getHighlighted();

    if (this.isMouseButtonPressed()) {
      // Activate item when mouse button is pressed, to allow MacOS-style
      // dragging to choose menu items.  Although this should only truly
      // happen if the highlight is due to mouse movements, there is little
      // harm in doing it for keyboard or programmatic highlights.
      item.setActive(true);
    }

    // Open follows highlight.
    if (this.openItem_ && item != this.openItem_) {
      if (item.isSupportedState(goog.ui.Component.State.OPENED)) {
        item.setOpen(true);
      } else {
        this.openItem_.setOpen(false);
      }
    }
  }
  goog.dom.a11y.setState(this.getElement(),
      goog.dom.a11y.State.ACTIVEDESCENDANT, e.target.getElement().id);
};


/**
 * Handles UNHIGHLIGHT events dispatched by items in the container when
 * they are unhighlighted.
 * @param {goog.events.Event} e Unhighlight event to handle.
 */
goog.ui.Container.prototype.handleUnHighlightItem = function(e) {
  if (e.target == this.getHighlighted()) {
    this.highlightedIndex_ = -1;
  }
  goog.dom.a11y.setState(this.getElement(),
       goog.dom.a11y.State.ACTIVEDESCENDANT, '');
};


/**
 * Handles OPEN events dispatched by items in the container when they are
 * opened.
 * @param {goog.events.Event} e Open event to handle.
 */
goog.ui.Container.prototype.handleOpenItem = function(e) {
  var item = /** @type {goog.ui.Control} */ (e.target);
  if (item && item != this.openItem_ && item.getParent() == this) {
    if (this.openItem_) {
      this.openItem_.setOpen(false);
    }
    this.openItem_ = item;
  }
};


/**
 * Handles CLOSE events dispatched by items in the container when they are
 * closed.
 * @param {goog.events.Event} e Close event to handle.
 */
goog.ui.Container.prototype.handleCloseItem = function(e) {
  if (e.target == this.openItem_) {
    this.openItem_ = null;
  }
};


/**
 * Handles mousedown events over the container.  The default implementation
 * sets the "mouse button pressed" flag and, if the container is focusable,
 * grabs keyboard focus.
 * @param {goog.events.BrowserEvent} e Mousedown event to handle.
 */
goog.ui.Container.prototype.handleMouseDown = function(e) {
  if (this.enabled_) {
    this.setMouseButtonPressed(true);
  }

  var keyTarget = this.getKeyEventTarget();
  if (this.renderer_.hasTabIndex(keyTarget)) {
    // The container is configured to receive keyboard focus.
    keyTarget.focus();
  } else {
    // The control isn't configured to receive keyboard focus; prevent it
    // from stealing focus or destroying the selection.
    e.preventDefault();
  }
};


/**
 * Handles mouseup events over the document.  The default implementation
 * clears the "mouse button pressed" flag.
 * @param {goog.events.BrowserEvent} e Mouseup event to handle.
 */
goog.ui.Container.prototype.handleDocumentMouseUp = function(e) {
  this.setMouseButtonPressed(false);
};


/**
 * Handles mouse events originating from nodes belonging to the controls hosted
 * in the container.  Locates the child control based on the DOM node that
 * dispatched the event, and forwards the event to the control for handling.
 * @param {goog.events.BrowserEvent} e Mouse event to handle.
 */
goog.ui.Container.prototype.handleChildMouseEvents = function(e) {
  var control = this.getOwnerControl(/** @type {Node} */ (e.target));
  if (control) {
    // Child control identified; forward the event.
    switch (e.type) {
      case goog.events.EventType.MOUSEDOWN:
        control.handleMouseDown(e);
        break;
      case goog.events.EventType.MOUSEUP:
        control.handleMouseUp(e);
        break;
      case goog.events.EventType.MOUSEOVER:
        control.handleMouseOver(e);
        break;
      case goog.events.EventType.MOUSEOUT:
        control.handleMouseOut(e);
        break;
    }
  }
};


/**
 * Returns the child control that owns the given DOM node, or null if no such
 * control is found.
 * @param {Node} node DOM node whose owner is to be returned.
 * @return {goog.ui.Control?} Control hosted in the container to which the node
 *     belongs (if found).
 * @protected
 */
goog.ui.Container.prototype.getOwnerControl = function(node) {
  // Ensure that this container actually has child controls before
  // looking up the owner.
  if (this.childElementIdMap_) {
    var elem = this.getElement();
    while (node && node.parentNode && node != elem) {
      var id = node.id;
      if (id in this.childElementIdMap_) {
        return this.childElementIdMap_[id];
      }
      node = node.parentNode;
    }
  }
  return null;
};


/**
 * Handles focus events raised when the container's key event target receives
 * keyboard focus.
 * @param {goog.events.BrowserEvent} e Focus event to handle.
 */
goog.ui.Container.prototype.handleFocus = function(e) {
  // No-op in the base class.
};


/**
 * Handles blur events raised when the container's key event target loses
 * keyboard focus.  The default implementation clears the highlight index.
 * @param {goog.events.BrowserEvent} e Blur event to handle.
 */
goog.ui.Container.prototype.handleBlur = function(e) {
  this.setHighlightedIndex(-1);
  this.setMouseButtonPressed(false);
  // If the container loses focus, and one of its children is open, close it.
  if (this.openItem_) {
    this.openItem_.setOpen(false);
  }
};


/**
 * Attempts to handle a keyboard event, if the control is enabled, by calling
 * {@link handleKeyEventInternal}.  Considered protected; should only be used
 * within this package and by subclasses.
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} Whether the key event was handled.
 */
goog.ui.Container.prototype.handleKeyEvent = function(e) {
  if (this.isEnabled() && this.isVisible() &&
      (this.getChildCount() != 0 || this.keyEventTarget_) &&
      this.handleKeyEventInternal(e)) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }
  return false;
};


/**
 * Attempts to handle a keyboard event; returns true if the event was handled,
 * false otherwise.  If the container is enabled, and a child is highlighted,
 * calls the child control's {@code handleKeyEvent} method to give the control
 * a chance to handle the event first.
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} Whether the event was handled by the container (or one of
 *     its children).
 */
goog.ui.Container.prototype.handleKeyEventInternal = function(e) {
  // Give the highlighted control the chance to handle the key event.
  var highlighted = this.getHighlighted();
  if (highlighted && typeof highlighted.handleKeyEvent == 'function' &&
      highlighted.handleKeyEvent(e)) {
    return true;
  }

  // Give the open control the chance to handle the key event.
  if (this.openItem_ && this.openItem_ != highlighted &&
      typeof this.openItem_.handleKeyEvent == 'function' &&
      this.openItem_.handleKeyEvent(e)) {
    return true;
  }

  // Either nothing is highlighted, or the highlighted control didn't handle
  // the key event, so attempt to handle it here.
  switch (e.keyCode) {
    case goog.events.KeyCodes.ESC:
      if (this.isFocusable()) {
        this.getKeyEventTarget().blur();
      } else {
        return false;
      }
      break;

    case goog.events.KeyCodes.HOME:
      this.highlightFirst();
      break;

    case goog.events.KeyCodes.END:
      this.highlightLast();
      break;

    case goog.events.KeyCodes.UP:
      if (this.orientation_ == goog.ui.Container.Orientation.VERTICAL) {
        this.highlightPrevious();
      } else {
        return false;
      }
      break;

    case goog.events.KeyCodes.LEFT:
      if (this.orientation_ == goog.ui.Container.Orientation.HORIZONTAL) {
        if (this.isRightToLeft()) {
          this.highlightNext();
        } else {
          this.highlightPrevious();
        }
      } else {
        return false;
      }
      break;

    case goog.events.KeyCodes.DOWN:
      if (this.orientation_ == goog.ui.Container.Orientation.VERTICAL) {
        this.highlightNext();
      } else {
        return false;
      }
      break;

    case goog.events.KeyCodes.RIGHT:
      if (this.orientation_ == goog.ui.Container.Orientation.HORIZONTAL) {
        if (this.isRightToLeft()) {
          this.highlightPrevious();
        } else {
          this.highlightNext();
        }
      } else {
        return false;
      }
      break;

    default:
      return false;
  }

  return true;
};


// Child component management.


/**
 * Creates a DOM ID for the child control and registers it to an internal
 * hash table to be able to find it fast by id.
 * @param {goog.ui.Control} child The child control. Its root element has
 *     to be created yet.
 * @private
 */
goog.ui.Container.prototype.registerChildId_ = function(child) {
  // Map the DOM ID of the control's root element to the control itself.
  var childElem = child.getElement();

  // If the control's root element doesn't have a DOM ID assign one.
  var id = childElem.id || (childElem.id = child.getId());

  // Lazily create the child element ID map on first use.
  if (!this.childElementIdMap_) {
    this.childElementIdMap_ = {};
  }
  this.childElementIdMap_[id] = child;
};


/**
 * Adds the specified control as the last child of this container.  See
 * {@link goog.ui.Container#addChildAt} for detailed semantics.
 * @param {goog.ui.Control} child The new child control.
 * @param {boolean=} opt_render Whether the new child should be rendered
 *     immediately after being added (defaults to false).
 */
goog.ui.Container.prototype.addChild = function(child, opt_render) {
  goog.ui.Container.superClass_.addChild.call(this, child, opt_render);
};


/**
 * Overrides {@link goog.ui.Container#getChild} to make it clear that it
 * only returns {@link goog.ui.Control}s.
 * @param {string} id Child component ID.
 * @return {goog.ui.Control} The child with the given ID; null if none.
 * @override
 */
goog.ui.Container.prototype.getChild;


/**
 * Overrides {@link goog.ui.Container#getChildAt} to make it clear that it
 * only returns {@link goog.ui.Control}s.
 * @param {number} index 0-based index.
 * @return {goog.ui.Control} The child with the given ID; null if none.
 * @override
 */
goog.ui.Container.prototype.getChildAt;


/**
 * Adds the control as a child of this container at the given 0-based index.
 * Overrides {@link goog.ui.Component#addChildAt} by also updating the
 * container's highlight index.  Since {@link goog.ui.Component#addChild} uses
 * {@link #addChildAt} internally, we only need to override this method.
 * @param {goog.ui.Control} control New child.
 * @param {number} index Index at which the new child is to be added.
 * @param {boolean=} opt_render Whether the new child should be rendered
 *     immediately after being added (defaults to false).
 */
goog.ui.Container.prototype.addChildAt = function(control, index, opt_render) {
  // Make sure the child control dispatches HIGHLIGHT, UNHIGHLIGHT, OPEN, and
  // CLOSE events, and that it doesn't steal keyboard focus.
  control.setDispatchTransitionEvents(goog.ui.Component.State.HOVER, true);
  control.setDispatchTransitionEvents(goog.ui.Component.State.OPENED, true);
  if (this.isFocusable() || !this.isFocusableChildrenAllowed()) {
    control.setSupportedState(goog.ui.Component.State.FOCUSED, false);
  }

  // Disable mouse event handling by child controls.
  control.setHandleMouseEvents(false);

  // Let the superclass implementation do the work.
  goog.ui.Container.superClass_.addChildAt.call(this, control, index,
      opt_render);

  if (opt_render && this.isInDocument()) {
    this.registerChildId_(control);
  }

  // Update the highlight index, if needed.
  if (index <= this.highlightedIndex_) {
    this.highlightedIndex_++;
  }
};


/**
 * Removes a child control.  Overrides {@link goog.ui.Component#removeChild} by
 * updating the highlight index.  Since {@link goog.ui.Component#removeChildAt}
 * uses {@link #removeChild} internally, we only need to override this method.
 * @param {string|goog.ui.Control} control The ID of the child to remove, or
 *     the control itself.
 * @param {boolean=} opt_unrender Whether to call {@code exitDocument} on the
 *     removed control, and detach its DOM from the document (defaults to
 *     false).
 * @return {goog.ui.Control} The removed control, if any.
 */
goog.ui.Container.prototype.removeChild = function(control, opt_unrender) {
  // TODO(user): Fix implementation so that it works if control is a string.

  var index = this.indexOfChild(/** @type {goog.ui.Control} */ (control));
  if (index != -1) {
    if (index == this.highlightedIndex_) {
      control.setHighlighted(false);
    } else if (index < this.highlightedIndex_) {
      this.highlightedIndex_--;
    }
  }

  // Remove the mapping from the child element ID map.
  var childElem = control.getElement();
  if (childElem && childElem.id) {
    goog.object.remove(this.childElementIdMap_, childElem.id);
  }

  control = /** @type {goog.ui.Control} */ (
      goog.ui.Container.superClass_.removeChild.call(this, control,
          opt_unrender));

  // Re-enable mouse event handling (in case the control is reused elsewhere).
  control.setHandleMouseEvents(true);

  return control;
};


// Container state management.


/**
 * Returns the container's orientation.
 * @return {?goog.ui.Container.Orientation} Container orientation.
 */
goog.ui.Container.prototype.getOrientation = function() {
  return this.orientation_;
};


/**
 * Sets the container's orientation.
 * @param {goog.ui.Container.Orientation} orientation Container orientation.
 */
// TODO(user): Do we need to support containers with dynamic orientation?
goog.ui.Container.prototype.setOrientation = function(orientation) {
  if (this.getElement()) {
    // Too late.
    throw Error(goog.ui.Component.Error.ALREADY_RENDERED);
  }

  this.orientation_ = orientation;
};


/**
 * Returns true if the container's visibility is set to visible, false if
 * it is set to hidden.  A container that is set to hidden is guaranteed
 * to be hidden from the user, but the reverse isn't necessarily true.
 * A container may be set to visible but can otherwise be obscured by another
 * element, rendered off-screen, or hidden using direct CSS manipulation.
 * @return {boolean} Whether the container is set to be visible.
 */
goog.ui.Container.prototype.isVisible = function() {
  return this.visible_;
};


/**
 * Shows or hides the container.  Does nothing if the container already has
 * the requested visibility.  Otherwise, dispatches a SHOW or HIDE event as
 * appropriate, giving listeners a chance to prevent the visibility change.
 * @param {boolean} visible Whether to show or hide the container.
 * @param {boolean=} opt_force If true, doesn't check whether the container
 *     already has the requested visibility, and doesn't dispatch any events.
 * @return {boolean} Whether the visibility was changed.
 */
goog.ui.Container.prototype.setVisible = function(visible, opt_force) {
  if (opt_force || (this.visible_ != visible && this.dispatchEvent(visible ?
      goog.ui.Component.EventType.SHOW : goog.ui.Component.EventType.HIDE))) {
    this.visible_ = visible;

    var elem = this.getElement();
    if (elem) {
      goog.style.showElement(elem, visible);
      if (this.isFocusable()) {
        // Enable keyboard access only for enabled & visible containers.
        this.renderer_.enableTabIndex(this.getKeyEventTarget(),
            this.enabled_ && this.visible_);
      }
      if (this.visible_ && !opt_force) {
        this.dispatchEvent(goog.ui.Container.EventType.AFTER_SHOW);
      }
    }

    return true;
  }

  return false;
};


/**
 * Returns true if the container is enabled, false otherwise.
 * @return {boolean} Whether the container is enabled.
 */
goog.ui.Container.prototype.isEnabled = function() {
  return this.enabled_;
};


/**
 * Enables/disables the container based on the {@code enable} argument.
 * Dispatches an {@code ENABLED} or {@code DISABLED} event prior to changing
 * the container's state, which may be caught and canceled to prevent the
 * container from changing state.  Also enables/disables child controls.
 * @param {boolean} enable Whether to enable or disable the container.
 */
goog.ui.Container.prototype.setEnabled = function(enable) {
  if (this.enabled_ != enable && this.dispatchEvent(enable ?
      goog.ui.Component.EventType.ENABLE :
      goog.ui.Component.EventType.DISABLE)) {
    if (enable) {
      // Flag the container as enabled first, then update children.  This is
      // because controls can't be enabled if their parent is disabled.
      this.enabled_ = true;
      this.forEachChild(function(child) {
        // Enable child control unless it is flagged.
        if (child.wasDisabled) {
          delete child.wasDisabled;
        } else {
          child.setEnabled(true);
        }
      });
    } else {
      // Disable children first, then flag the container as disabled.  This is
      // because controls can't be disabled if their parent is already disabled.
      this.forEachChild(function(child) {
        // Disable child control, or flag it if it's already disabled.
        if (child.isEnabled()) {
          child.setEnabled(false);
        } else {
          child.wasDisabled = true;
        }
      });
      this.enabled_ = false;
      this.setMouseButtonPressed(false);
    }

    if (this.isFocusable()) {
      // Enable keyboard access only for enabled & visible components.
      this.renderer_.enableTabIndex(this.getKeyEventTarget(),
          enable && this.visible_);
    }
  }
};


/**
 * Returns true if the container is focusable, false otherwise.  The default
 * is true.  Focusable containers always have a tab index and allocate a key
 * handler to handle keyboard events while focused.
 * @return {boolean} Whether the component is focusable.
 */
goog.ui.Container.prototype.isFocusable = function() {
  return this.focusable_;
};


/**
 * Sets whether the container is focusable.  The default is true.  Focusable
 * containers always have a tab index and allocate a key handler to handle
 * keyboard events while focused.
 * @param {boolean} focusable Whether the component is to be focusable.
 */
goog.ui.Container.prototype.setFocusable = function(focusable) {
  if (focusable != this.focusable_ && this.isInDocument()) {
    this.enableFocusHandling_(focusable);
  }
  this.focusable_ = focusable;
  if (this.enabled_ && this.visible_) {
    this.renderer_.enableTabIndex(this.getKeyEventTarget(), focusable);
  }
};


/**
 * Returns true if the container allows children to be focusable, false
 * otherwise.  Only effective if the container is not focusable.
 * @return {boolean} Whether children should be focusable.
 */
goog.ui.Container.prototype.isFocusableChildrenAllowed = function() {
  return this.allowFocusableChildren_;
};


/**
 * Sets whether the container allows children to be focusable, false
 * otherwise.  Only effective if the container is not focusable.
 * @param {boolean} focusable Whether the children should be focusable.
 */
goog.ui.Container.prototype.setFocusableChildrenAllowed = function(focusable) {
  this.allowFocusableChildren_ = focusable;
};


// Highlight management.


/**
 * Returns the index of the currently highlighted item (-1 if none).
 * @return {number} Index of the currently highlighted item.
 */
goog.ui.Container.prototype.getHighlightedIndex = function() {
  return this.highlightedIndex_;
};


/**
 * Highlights the item at the given 0-based index (if any).  If another item
 * was previously highlighted, it is un-highlighted.
 * @param {number} index Index of item to highlight (-1 removes the current
 *     highlight).
 */
goog.ui.Container.prototype.setHighlightedIndex = function(index) {
  var child = this.getChildAt(index);
  if (child) {
    child.setHighlighted(true);
  } else if (this.highlightedIndex_ > -1) {
    this.getHighlighted().setHighlighted(false);
  }
};


/**
 * Highlights the given item if it exists and is a child of the container;
 * otherwise un-highlights the currently highlighted item.
 * @param {goog.ui.Control} item Item to highlight.
 */
goog.ui.Container.prototype.setHighlighted = function(item) {
  this.setHighlightedIndex(this.indexOfChild(item));
};


/**
 * Returns the currently highlighted item (if any).
 * @return {goog.ui.Control?} Highlighted item (null if none).
 */
goog.ui.Container.prototype.getHighlighted = function() {
  return this.getChildAt(this.highlightedIndex_);
};


/**
 * Highlights the first highlightable item in the container
 */
goog.ui.Container.prototype.highlightFirst = function() {
  this.highlightHelper(function(index, max) {
    return (index + 1) % max;
  }, this.getChildCount() - 1);
};


/**
 * Highlights the last highlightable item in the container.
 */
goog.ui.Container.prototype.highlightLast = function() {
  this.highlightHelper(function(index, max) {
    index--;
    return index < 0 ? max - 1 : index;
  }, 0);
};


/**
 * Highlights the next highlightable item (or the first if nothing is currently
 * highlighted).
 */
goog.ui.Container.prototype.highlightNext = function() {
  this.highlightHelper(function(index, max) {
    return (index + 1) % max;
  }, this.highlightedIndex_);
};


/**
 * Highlights the previous highlightable item (or the last if nothing is
 * currently highlighted).
 */
goog.ui.Container.prototype.highlightPrevious = function() {
  this.highlightHelper(function(index, max) {
    index--;
    return index < 0 ? max - 1 : index;
  }, this.highlightedIndex_);
};


/**
 * Helper function that manages the details of moving the highlight among
 * child controls in response to keyboard events.
 * @param {function(number, number) : number} fn Function that accepts the
 *     current and maximum indices, and returns the next index to check.
 * @param {number} startIndex Start index.
 * @return {boolean} Whether the highlight has changed.
 * @protected
 */
goog.ui.Container.prototype.highlightHelper = function(fn, startIndex) {
  // If the start index is -1 (meaning there's nothing currently highlighted),
  // try starting from the currently open item, if any.
  var curIndex = startIndex < 0 ?
      this.indexOfChild(this.openItem_) : startIndex;
  var numItems = this.getChildCount();

  curIndex = fn.call(this, curIndex, numItems);
  var visited = 0;
  while (visited <= numItems) {
    var control = this.getChildAt(curIndex);
    if (control && this.canHighlightItem(control)) {
      this.setHighlightedIndexFromKeyEvent(curIndex);
      return true;
    }
    visited++;
    curIndex = fn.call(this, curIndex, numItems);
  }
  return false;
};


/**
 * Returns whether the given item can be highlighted.
 * @param {goog.ui.Control} item The item to check.
 * @return {boolean} Whether the item can be highlighted.
 * @protected
 */
goog.ui.Container.prototype.canHighlightItem = function(item) {
  return item.isVisible() && item.isEnabled() &&
      item.isSupportedState(goog.ui.Component.State.HOVER);
};


/**
 * Helper method that sets the highlighted index to the given index in response
 * to a keyboard event.  The base class implementation simply calls the
 * {@link #setHighlightedIndex} method, but subclasses can override this
 * behavior as needed.
 * @param {number} index Index of item to highlight.
 * @protected
 */
goog.ui.Container.prototype.setHighlightedIndexFromKeyEvent = function(index) {
  this.setHighlightedIndex(index);
};


/**
 * Returns true if the mouse button is pressed, false otherwise.
 * @return {boolean} Whether the mouse button is pressed.
 */
goog.ui.Container.prototype.isMouseButtonPressed = function() {
  return this.mouseButtonPressed_;
};


/**
 * Sets or clears the "mouse button pressed" flag.
 * @param {boolean} pressed Whether the mouse button is presed.
 */
goog.ui.Container.prototype.setMouseButtonPressed = function(pressed) {
  this.mouseButtonPressed_ = pressed;
};

// Input 55
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for {@link goog.ui.MenuItem}s.
 *
*
 */

goog.provide('goog.ui.MenuItemRenderer');

goog.require('goog.dom');
goog.require('goog.dom.a11y');
goog.require('goog.dom.a11y.Role');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ControlRenderer');


/**
 * Default renderer for {@link goog.ui.MenuItem}s.  Each item has the following
 * structure:
 * <pre>
 *   <div class="goog-menuitem">
 *     <div class="goog-menuitem-content">
 *       ...(menu item contents)...
 *     </div>
 *   </div>
 * </pre>
 * @constructor
 * @extends {goog.ui.ControlRenderer}
 */
goog.ui.MenuItemRenderer = function() {
  goog.ui.ControlRenderer.call(this);

  /**
   * Commonly used CSS class names, cached here for convenience (and to avoid
   * unnecessary string concatenation).
   * @type {!Array.<string>}
   * @private
   */
  this.classNameCache_ = [];
};
goog.inherits(goog.ui.MenuItemRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(goog.ui.MenuItemRenderer);


/**
 * CSS class name the renderer applies to menu item elements.
 * @type {string}
 */
goog.ui.MenuItemRenderer.CSS_CLASS = goog.getCssName('goog-menuitem');


/**
 * Constants for referencing composite CSS classes.
 * @enum {number}
 * @private
 */
goog.ui.MenuItemRenderer.CompositeCssClassIndex_ = {
  HOVER: 0,
  CHECKBOX: 1,
  CONTENT: 2
};


/**
 * Returns the composite CSS class by using the cached value or by constructing
 * the value from the base CSS class and the passed index.
 * @param {goog.ui.MenuItemRenderer.CompositeCssClassIndex_} index Index for the
 *     CSS class - could be highlight, checkbox or content in usual cases.
 * @return {string} The composite CSS class.
 * @private
 */
goog.ui.MenuItemRenderer.prototype.getCompositeCssClass_ = function(index) {
  var result = this.classNameCache_[index];
  if (!result) {
    switch (index) {
      case goog.ui.MenuItemRenderer.CompositeCssClassIndex_.HOVER:
        result = goog.getCssName(this.getStructuralCssClass(), 'highlight');
        break;
      case goog.ui.MenuItemRenderer.CompositeCssClassIndex_.CHECKBOX:
        result = goog.getCssName(this.getStructuralCssClass(), 'checkbox');
        break;
      case goog.ui.MenuItemRenderer.CompositeCssClassIndex_.CONTENT:
        result = goog.getCssName(this.getStructuralCssClass(), 'content');
        break;
    }
    this.classNameCache_[index] = result;
  }

  return result;
};


/** @return {goog.dom.a11y.Role} The ARIA role. */
goog.ui.MenuItemRenderer.prototype.getAriaRole = function() {
  return goog.dom.a11y.Role.MENU_ITEM;
};


/**
 * Overrides {@link goog.ui.ControlRenderer#createDom} by adding extra markup
 * and stying to the menu item's element if it is selectable or checkable.
 * @param {goog.ui.Control} item Menu item to render.
 * @return {Element} Root element for the item.
 * @override
 */
goog.ui.MenuItemRenderer.prototype.createDom = function(item) {
  var element = item.getDomHelper().createDom(
      'div', this.getClassNames(item).join(' '),
      this.createContent(item.getContent(), item.getDomHelper()));
  this.setEnableCheckBoxStructure(item, element,
      item.isSupportedState(goog.ui.Component.State.SELECTED) ||
      item.isSupportedState(goog.ui.Component.State.CHECKED));
  return element;
};


/** @inheritDoc */
goog.ui.MenuItemRenderer.prototype.getContentElement = function(element) {
  return /** @type {Element} */ (element && element.firstChild);
};


/**
 * Overrides {@link goog.ui.ControlRenderer#decorate} by initializing the
 * menu item to checkable based on whether the element to be decorated has
 * extra stying indicating that it should be.
 * @param {goog.ui.Control} item Menu item instance to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 * @override
 */
goog.ui.MenuItemRenderer.prototype.decorate = function(item, element) {
  if (!this.hasContentStructure(element)) {
    element.appendChild(
        this.createContent(element.childNodes, item.getDomHelper()));
  }
  if (goog.dom.classes.has(element, goog.getCssName('goog-option'))) {
    item.setCheckable(true);
    this.setCheckable(item, element, true);
  }
  return goog.ui.MenuItemRenderer.superClass_.decorate.call(this, item,
      element);
};

/**
 * Takes a menu item's root element, and sets its content to the given text
 * caption or DOM structure.  Overrides the superclass immplementation by
 * making sure that the checkbox structure (for selectable/checkable menu
 * items) is preserved.
 * @param {Element} element The item's root element.
 * @param {goog.ui.ControlContent} content Text caption or DOM structure to be
 *     set as the item's content.
 * @override
 */
goog.ui.MenuItemRenderer.prototype.setContent = function(element, content) {
  // Save the checkbox element, if present.
  var contentElement = this.getContentElement(element);
  var checkBoxElement = this.hasCheckBoxStructure(element) ?
      contentElement.firstChild : null;
  goog.ui.MenuItemRenderer.superClass_.setContent.call(this, element, content);
  if (checkBoxElement && !this.hasCheckBoxStructure(element)) {
    // The call to setContent() blew away the checkbox element; reattach it.
    contentElement.insertBefore(checkBoxElement,
        contentElement.firstChild || null);
  }
};


/**
 * Returns true if the element appears to have a proper menu item structure by
 * checking whether its first child has the appropriate structural class name.
 * @param {Element} element Element to check.
 * @return {boolean} Whether the element appears to have a proper menu item DOM.
 * @protected
 */
goog.ui.MenuItemRenderer.prototype.hasContentStructure = function(element) {
  var child = goog.dom.getFirstElementChild(element);
  var contentClassName = this.getCompositeCssClass_(
      goog.ui.MenuItemRenderer.CompositeCssClassIndex_.CONTENT);
  return !!child && child.className.indexOf(contentClassName) != -1;
};


/**
 * Wraps the given text caption or existing DOM node(s) in a structural element
 * containing the menu item's contents.
 * @param {goog.ui.ControlContent} content Menu item contents.
 * @param {goog.dom.DomHelper} dom DOM helper for document interaction.
 * @return {Element} Menu item content element.
 * @protected
 */
goog.ui.MenuItemRenderer.prototype.createContent = function(content, dom) {
  var contentClassName = this.getCompositeCssClass_(
      goog.ui.MenuItemRenderer.CompositeCssClassIndex_.CONTENT);
  return dom.createDom('div', contentClassName, content);
};


/**
 * Enables/disables radio button semantics on the menu item.
 * @param {goog.ui.Control} item Menu item to update.
 * @param {Element} element Menu item element to update (may be null if the
 *     item hasn't been rendered yet).
 * @param {boolean} selectable Whether the item should be selectable.
 */
goog.ui.MenuItemRenderer.prototype.setSelectable = function(item, element,
    selectable) {
  if (element) {
    goog.dom.a11y.setRole(element, selectable ?
        goog.dom.a11y.Role.MENU_ITEM_RADIO : this.getAriaRole());
    this.setEnableCheckBoxStructure(item, element, selectable);
  }
};


/**
 * Enables/disables checkbox semantics on the menu item.
 * @param {goog.ui.Control} item Menu item to update.
 * @param {Element} element Menu item element to update (may be null if the
 *     item hasn't been rendered yet).
 * @param {boolean} checkable Whether the item should be checkable.
 */
goog.ui.MenuItemRenderer.prototype.setCheckable = function(item, element,
    checkable) {
  if (element) {
    goog.dom.a11y.setRole(element, checkable ?
        goog.dom.a11y.Role.MENU_ITEM_CHECKBOX : this.getAriaRole());
    this.setEnableCheckBoxStructure(item, element, checkable);
  }
};


/**
 * Determines whether the item contains a checkbox element.
 * @param {Element} element Menu item root element.
 * @return {boolean} Whether the element contains a checkbox element.
 * @protected
 */
goog.ui.MenuItemRenderer.prototype.hasCheckBoxStructure = function(element) {
  var contentElement = this.getContentElement(element);
  if (contentElement) {
    var child = contentElement.firstChild;
    var checkboxClassName = this.getCompositeCssClass_(
        goog.ui.MenuItemRenderer.CompositeCssClassIndex_.CHECKBOX);
    return !!child && !!child.className &&
        child.className.indexOf(checkboxClassName) != -1;
  }
  return false;
};


/**
 * Adds or removes extra markup and CSS styling to the menu item to make it
 * selectable or non-selectable, depending on the value of the
 * {@code selectable} argument.
 * @param {goog.ui.Control} item Menu item to update.
 * @param {Element} element Menu item element to update.
 * @param {boolean} enable Whether to add or remove the checkbox structure.
 * @protected
 */
goog.ui.MenuItemRenderer.prototype.setEnableCheckBoxStructure = function(item,
    element, enable) {
  if (enable != this.hasCheckBoxStructure(element)) {
    goog.dom.classes.enable(element, goog.getCssName('goog-option'), enable);
    var contentElement = this.getContentElement(element);
    if (enable) {
      // Insert checkbox structure.
      var checkboxClassName = this.getCompositeCssClass_(
          goog.ui.MenuItemRenderer.CompositeCssClassIndex_.CHECKBOX);
      contentElement.insertBefore(
          item.getDomHelper().createDom('div', checkboxClassName),
          contentElement.firstChild || null);
    } else {
      // Remove checkbox structure.
      contentElement.removeChild(contentElement.firstChild);
    }
  }
};


/**
 * Takes a single {@link goog.ui.Component.State}, and returns the
 * corresponding CSS class name (null if none).  Overrides the superclass
 * implementation by using 'highlight' as opposed to 'hover' as the CSS
 * class name suffix for the HOVER state, for backwards compatibility.
 * @param {goog.ui.Component.State} state Component state.
 * @return {string|undefined} CSS class representing the given state
 *     (undefined if none).
 * @override
 */
goog.ui.MenuItemRenderer.prototype.getClassForState = function(state) {
  switch (state) {
    case goog.ui.Component.State.HOVER:
      // We use 'highlight' as the suffix, for backwards compatibility.
      return this.getCompositeCssClass_(
          goog.ui.MenuItemRenderer.CompositeCssClassIndex_.HOVER);
    case goog.ui.Component.State.CHECKED:
    case goog.ui.Component.State.SELECTED:
    // We use 'goog-option-selected' as the class, for backwards compatibility.
      return goog.getCssName('goog-option-selected');
    default:
      return goog.ui.MenuItemRenderer.superClass_.getClassForState.call(this,
          state);
  }
};


/**
 * Takes a single CSS class name which may represent a component state, and
 * returns the corresponding component state (0x00 if none).  Overrides the
 * superclass implementation by treating 'goog-option-selected' as special,
 * for backwards compatibility.
 * @param {string} className CSS class name, possibly representing a component
 *     state.
 * @return {goog.ui.Component.State} state Component state corresponding
 *     to the given CSS class (0x00 if none).
 * @override
 */
goog.ui.MenuItemRenderer.prototype.getStateFromClass = function(className) {
  var hoverClassName = this.getCompositeCssClass_(
      goog.ui.MenuItemRenderer.CompositeCssClassIndex_.HOVER);
  switch (className) {
    case goog.getCssName('goog-option-selected'):
      return goog.ui.Component.State.CHECKED;
    case hoverClassName:
      return goog.ui.Component.State.HOVER;
    default:
      return goog.ui.MenuItemRenderer.superClass_.getStateFromClass.call(this,
          className);
  }
};


/** @inheritDoc */
goog.ui.MenuItemRenderer.prototype.getCssClass = function() {
  return goog.ui.MenuItemRenderer.CSS_CLASS;
};

// Input 56
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A class for representing items in menus.
 * @see goog.ui.Menu
 *
*
*
 */

goog.provide('goog.ui.MenuItem');

goog.require('goog.ui.Component.State');
goog.require('goog.ui.Control');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.MenuItemRenderer');
goog.require('goog.ui.registry');


/**
 * Class representing an item in a menu.
 *
 * @param {goog.ui.ControlContent} content Text caption or DOM structure to
 *     display as the content of the item (use to add icons or styling to
 *     menus).
 * @param {*=} opt_model Data/model associated with the menu item.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper used for
 *     document interactions.
 * @param {goog.ui.MenuItemRenderer=} opt_renderer Optional renderer.
 * @constructor
 * @extends {goog.ui.Control}
 */
goog.ui.MenuItem = function(content, opt_model, opt_domHelper, opt_renderer) {
  goog.ui.Control.call(this, content, opt_renderer ||
      goog.ui.MenuItemRenderer.getInstance(), opt_domHelper);
  this.setValue(opt_model);
};
goog.inherits(goog.ui.MenuItem, goog.ui.Control);


// goog.ui.Component and goog.ui.Control implementation.


/**
 * Returns the value associated with the menu item.  The default implementation
 * returns the model object associated with the item (if any), or its caption.
 * @return {*} Value associated with the menu item, if any, or its caption.
 */
goog.ui.MenuItem.prototype.getValue = function() {
  var model = this.getModel();
  return model != null ? model : this.getCaption();
};


/**
 * Sets the value associated with the menu item.  The default implementation
 * stores the value as the model of the menu item.
 * @param {*} value Value to be associated with the menu item.
 */
goog.ui.MenuItem.prototype.setValue = function(value) {
  this.setModel(value);
};


/**
 * Sets the menu item to be selectable or not.  Set to true for menu items
 * that represent selectable options.
 * @param {boolean} selectable Whether the menu item is selectable.
 */
goog.ui.MenuItem.prototype.setSelectable = function(selectable) {
  this.setSupportedState(goog.ui.Component.State.SELECTED, selectable);
  if (this.isChecked() && !selectable) {
    this.setChecked(false);
  }

  var element = this.getElement();
  if (element) {
    this.renderer_.setSelectable(this, element, selectable);
  }
};


/**
 * Sets the menu item to be checkable or not.  Set to true for menu items
 * that represent checkable options.
 * @param {boolean} checkable Whether the menu item is checkable.
 */
goog.ui.MenuItem.prototype.setCheckable = function(checkable) {
  this.setSupportedState(goog.ui.Component.State.CHECKED, checkable);

  var element = this.getElement();
  if (element) {
    this.renderer_.setCheckable(this, element, checkable);
  }
};


// Register a decorator factory function for goog.ui.MenuItems.
goog.ui.registry.setDecoratorByClassName(goog.ui.MenuItemRenderer.CSS_CLASS,
    function() {
      // MenuItem defaults to using MenuItemRenderer.
      return new goog.ui.MenuItem(null);
    });

// Input 57
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for {@link goog.ui.Menu}s.
 *
 * @author robbyw@google.com (Robby Walker)
*
 */

goog.provide('goog.ui.MenuRenderer');

goog.require('goog.dom');
goog.require('goog.dom.a11y');
goog.require('goog.dom.a11y.Role');
goog.require('goog.dom.a11y.State');
goog.require('goog.ui.ContainerRenderer');
goog.require('goog.ui.Separator');


/**
 * Default renderer for {@link goog.ui.Menu}s, based on {@link
 * goog.ui.ContainerRenderer}.
 * @constructor
 * @extends {goog.ui.ContainerRenderer}
 */
goog.ui.MenuRenderer = function() {
  goog.ui.ContainerRenderer.call(this);
};
goog.inherits(goog.ui.MenuRenderer, goog.ui.ContainerRenderer);
goog.addSingletonGetter(goog.ui.MenuRenderer);


/**
 * Default CSS class to be applied to the root element of toolbars rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.MenuRenderer.CSS_CLASS = goog.getCssName('goog-menu');


/**
 * Returns the ARIA role to be applied to menus.
 * @return {string} ARIA role.
 * @override
 */
goog.ui.MenuRenderer.prototype.getAriaRole = function() {
  return goog.dom.a11y.Role.MENU;
};


/**
 * Returns whether the element is a UL or acceptable to our superclass.
 * @param {Element} element Element to decorate.
 * @return {boolean} Whether the renderer can decorate the element.
 */
goog.ui.MenuRenderer.prototype.canDecorate = function(element) {
  return element.tagName == 'UL' ||
      goog.ui.MenuRenderer.superClass_.canDecorate.call(this, element);
};


/**
 * Inspects the element, and creates an instance of {@link goog.ui.Control} or
 * an appropriate subclass best suited to decorate it.  Overrides the superclass
 * implementation by recognizing HR elements as separators.
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Control?} A new control suitable to decorate the element
 *     (null if none).
 */
goog.ui.MenuRenderer.prototype.getDecoratorForChild = function(element) {
  return element.tagName == 'HR' ?
      new goog.ui.Separator() :
      goog.ui.MenuRenderer.superClass_.getDecoratorForChild.call(this,
          element);
};


/**
 * Returns whether the given element is contained in the menu's DOM.
 * @param {goog.ui.Menu} menu The menu to test.
 * @param {Element} element The element to test.
 * @return {boolean} Whether the given element is contained in the menu.
 */
goog.ui.MenuRenderer.prototype.containsElement = function(menu, element) {
  return goog.dom.contains(menu.getElement(), element);
};


/**
 * Returns the CSS class to be applied to the root element of containers
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.MenuRenderer.prototype.getCssClass = function() {
  return goog.ui.MenuRenderer.CSS_CLASS;
};


/** @inheritDoc */
goog.ui.MenuRenderer.prototype.initializeDom = function(container) {
  goog.ui.MenuRenderer.superClass_.initializeDom.call(this, container);

  var element = container.getElement();
  goog.dom.a11y.setState(element, goog.dom.a11y.State.HASPOPUP, 'true');
};

// Input 58
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A class for representing menu separators.
 * @see goog.ui.Menu
 *
*
*
 */

goog.provide('goog.ui.MenuSeparator');

goog.require('goog.ui.MenuSeparatorRenderer');
goog.require('goog.ui.Separator');
goog.require('goog.ui.registry');


/**
 * Class representing a menu separator.  A menu separator extends {@link
 * goog.ui.Separator} by always setting its renderer to {@link
 * goog.ui.MenuSeparatorRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper used for
 *     document interactions.
 * @constructor
 * @extends {goog.ui.Separator}
 */
goog.ui.MenuSeparator = function(opt_domHelper) {
  goog.ui.Separator.call(this, goog.ui.MenuSeparatorRenderer.getInstance(),
      opt_domHelper);
};
goog.inherits(goog.ui.MenuSeparator, goog.ui.Separator);


// Register a decorator factory function for goog.ui.MenuSeparators.
goog.ui.registry.setDecoratorByClassName(
    goog.ui.MenuSeparatorRenderer.CSS_CLASS,
    function() {
      // Separator defaults to using MenuSeparatorRenderer.
      return new goog.ui.Separator();
    });

// Input 59
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A base menu class that supports key and mouse events. The menu
 * can be bound to an existing HTML structure or can generate its own DOM.
 *
 * To decorate, the menu should be bound to an element containing children
 * with the classname 'goog-menuitem'.  HRs will be classed as separators.
 *
 * Decorate Example:
 * <div id="menu" class="goog-menu" tabIndex="0">
 *   <div class="goog-menuitem">Google</div>
 *   <div class="goog-menuitem">Yahoo</div>
 *   <div class="goog-menuitem">MSN</div>
 *   <hr>
 *   <div class="goog-menuitem">New...</div>
 * </div>
 * <script>
 *
 * var menu = new goog.ui.Menu();
 * menu.decorate(goog.dom.getElement('menu'));
 *
 * TESTED=FireFox 2.0, IE6, Opera 9, Chrome.
 * TODO(user): Key handling is flaky in Opera and Chrome
 * TODO(user): Rename all references of "item" to child since menu is
 * essentially very generic and could, in theory, host a date or color picker.
 *
*
 * @see ../demos/menu.html
 * @see ../demos/menus.html
 */

goog.provide('goog.ui.Menu');
goog.provide('goog.ui.Menu.EventType');

goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.Container');
goog.require('goog.ui.Container.Orientation');
// The following dependencies (MenuItem & MenuSeparator) are implicit.
// There are no references in the code, but we need to load these
// classes before goog.ui.Menu.
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuRenderer');
goog.require('goog.ui.MenuSeparator');


// TODO(robbyw): Reverse constructor argument order for consistency.
/**
 * A basic menu class.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @param {goog.ui.MenuRenderer=} opt_renderer Renderer used to render or
 *     decorate the container; defaults to {@link goog.ui.MenuRenderer}.
 * @constructor
 * @extends {goog.ui.Container}
 */
goog.ui.Menu = function(opt_domHelper, opt_renderer) {
  goog.ui.Container.call(this, goog.ui.Container.Orientation.VERTICAL,
      opt_renderer || goog.ui.MenuRenderer.getInstance(), opt_domHelper);

  // Unlike Containers, Menus aren't keyboard-accessible by default.  This line
  // preserves backwards compatibility with code that depends on menus not
  // receiving focus - e.g. {@code goog.ui.MenuButton}.
  this.setFocusable(false);
};
goog.inherits(goog.ui.Menu, goog.ui.Container);


// TODO(robbyw): Remove this and all references to it.
// Please ensure that BEFORE_SHOW behavior is not disrupted as a result.
/**
 * Event types dispatched by the menu.
 * @enum {string}
 * @deprecated Use goog.ui.Component.EventType.
 */
goog.ui.Menu.EventType = {
  /** Dispatched before the menu becomes visible */
  BEFORE_SHOW: goog.ui.Component.EventType.BEFORE_SHOW,

  /** Dispatched when the menu is shown */
  SHOW: goog.ui.Component.EventType.SHOW,

  /** Dispatched before the menu becomes hidden */
  BEFORE_HIDE: goog.ui.Component.EventType.HIDE,

  /** Dispatched when the menu is hidden */
  HIDE: goog.ui.Component.EventType.HIDE
};


// TODO(robbyw): Remove this and all references to it.
/**
 * CSS class for menus.
 * @type {string}
 * @deprecated Use goog.ui.MenuRenderer.CSS_CLASS.
 */
goog.ui.Menu.CSS_CLASS = goog.ui.MenuRenderer.CSS_CLASS;


/**
 * Whether the menu can move the focus to it's key event target when it is
 * shown.  Default = true
 * @type {boolean}
 * @private
 */
goog.ui.Menu.prototype.allowAutoFocus_ = true;


/**
 * Whether the menu should use windows syle behavior and allow disabled menu
 * items to be highlighted (though not selectable).  Defaults to false
 * @type {boolean}
 * @private
 */
goog.ui.Menu.prototype.allowHighlightDisabled_ = false;


/**
 * Returns the CSS class applied to menu elements, also used as the prefix for
 * derived styles, if any.  Subclasses should override this method as needed.
 * Considered protected.
 * @return {string} The CSS class applied to menu elements.
 * @protected
 * @deprecated Use getRenderer().getCssClass().
 */
goog.ui.Menu.prototype.getCssClass = function() {
  return this.getRenderer().getCssClass();
};


/**
 * Returns whether the provided element is to be considered inside the menu for
 * purposes such as dismissing the menu on an event.  This is so submenus can
 * make use of elements outside their own DOM.
 * @param {Element} element The element to test for.
 * @return {boolean} Whether the provided element is to be considered inside
 *     the menu.
 */
goog.ui.Menu.prototype.containsElement = function(element) {
  if (this.getRenderer().containsElement(this, element)) {
    return true;
  }

  for (var i = 0, count = this.getChildCount(); i < count; i++) {
    var child = this.getChildAt(i);
    if (typeof child.containsElement == 'function' &&
        child.containsElement(element)) {
      return true;
    }
  }

  return false;
};


/**
 * Adds a new menu item at the end of the menu.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to
 *     the menu.
 * @deprecated Use {@link #addChild} instead.
 */
goog.ui.Menu.prototype.addItem = function(item) {
  this.addChild(item, true);
};


/**
 * Adds a new menu item at a specific index in the menu.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to the
 *     menu.
 * @param {number} n Index at which to insert the menu item.
 * @deprecated Use {@link #addChildAt} instead.
 */
goog.ui.Menu.prototype.addItemAt = function(item, n) {
  this.addChildAt(item, n, true);
};


/**
 * Removes an item from the menu and disposes of it.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item The menu item to remove.
 * @deprecated Use {@link #removeChild} instead.
 */
goog.ui.Menu.prototype.removeItem = function(item) {
  var removedChild = this.removeChild(item, true);
  if (removedChild) {
    removedChild.dispose();
  }
};


/**
 * Removes a menu item at a given index in the menu and disposes of it.
 * @param {number} n Index of item.
 * @deprecated Use {@link #removeChildAt} instead.
 */
goog.ui.Menu.prototype.removeItemAt = function(n) {
  var removedChild = this.removeChildAt(n, true);
  if (removedChild) {
    removedChild.dispose();
  }
};


/**
 * Returns a reference to the menu item at a given index.
 * @param {number} n Index of menu item.
 * @return {goog.ui.MenuItem|goog.ui.MenuSeparator|null} Reference to the menu
 *     item.
 * @deprecated Use {@link #getChildAt} instead.
 */
goog.ui.Menu.prototype.getItemAt = function(n) {
  return /** @type {goog.ui.MenuItem?} */(this.getChildAt(n));
};


/**
 * Returns the number of items in the menu (including separators).
 * @return {number} The number of items in the menu.
 * @deprecated Use {@link #getChildCount} instead.
 */
goog.ui.Menu.prototype.getItemCount = function() {
  return this.getChildCount();
};


/**
 * Returns the menu items contained in the menu.
 * @return {Array.<goog.ui.MenuItem>} An array of menu items.
 * @deprecated Use getChildAt, forEachChild, and getChildCount.
 */
goog.ui.Menu.prototype.getItems = function() {
  // TODO(user): Remove reference to getItems and instead use getChildAt,
  // forEachChild, and getChildCount
  return this.children_ || [];
};


/**
 * Sets the position of the menu relative to the view port.
 * @param {number|goog.math.Coordinate} x Left position or coordinate obj.
 * @param {number=} opt_y Top position.
 */
goog.ui.Menu.prototype.setPosition = function(x, opt_y) {
  // NOTE(user): It is necessary to temporarily set the display from none, so
  // that the position gets set correctly.
  var visible = this.isVisible();
  if (!visible) {
    goog.style.showElement(this.getElement(), true);
  }
  goog.style.setPageOffset(this.getElement(), x, opt_y);
  if (!visible) {
    goog.style.showElement(this.getElement(), false);
  }
};


/**
 * Gets the page offset of the menu, or null if the menu isn't visible
 * @return {goog.math.Coordinate?} Object holding the x-y coordinates of the
 *     menu or null if the menu is not visible.
 */
goog.ui.Menu.prototype.getPosition = function() {
  return this.isVisible() ? goog.style.getPageOffset(this.getElement()) : null;
};


/**
 * Sets whether the menu can automatically move focus to its key event target
 * when it is set to visible.
 * @param {boolean} allow Whether the menu can automatically move focus to its
 *     key event target when it is set to visible.
 */
goog.ui.Menu.prototype.setAllowAutoFocus = function(allow) {
  this.allowAutoFocus_ = allow;
  if (allow) {
    this.setFocusable(true);
  }
};


/**
 * @return {boolean} Whether the menu can automatically move focus to its key
 *     event target when it is set to visible.
 */
goog.ui.Menu.prototype.getAllowAutoFocus = function() {
  return this.allowAutoFocus_;
};


/**
 * Sets whether the menu will highlight disabled menu items or skip to the next
 * active item.
 * @param {boolean} allow Whether the menu will highlight disabled menu items or
 *     skip to the next active item.
 */
goog.ui.Menu.prototype.setAllowHighlightDisabled = function(allow) {
  this.allowHighlightDisabled_ = allow;
};


/**
 * @return {boolean} Whether the menu will highlight disabled menu items or skip
 *     to the next active item.
 */
goog.ui.Menu.prototype.getAllowHighlightDisabled = function() {
  return this.allowHighlightDisabled_;
};


/** @inheritDoc */
goog.ui.Menu.prototype.setVisible = function(show, opt_force) {
  var visibilityChanged = goog.ui.Menu.superClass_.setVisible.call(this, show,
      opt_force);
  if (visibilityChanged && show && this.isInDocument() &&
      this.allowAutoFocus_) {
    this.getKeyEventTarget().focus();
  }
  return visibilityChanged;
};


/** @inheritDoc */
goog.ui.Menu.prototype.handleEnterItem = function(e) {
  if (this.allowAutoFocus_) {
    this.getKeyEventTarget().focus();
  }

  return goog.ui.Menu.superClass_.handleEnterItem.call(this, e);
};


/**
 * Highlights the next item that begins with the specified string.  If no
 * (other) item begins with the given string, the selection is unchanged.
 * @param {string} charStr The prefix to match.
 * @return {boolean} Whether a matching prefix was found.
 */
goog.ui.Menu.prototype.highlightNextPrefix = function(charStr) {
  var re = new RegExp('^' + goog.string.regExpEscape(charStr), 'i');
  return this.highlightHelper(function(index, max) {
    // Index is >= -1 because it is set to -1 when nothing is selected.
    var start = index < 0 ? 0 : index;
    var wrapped = false;

    // We always start looking from one after the current, because we
    // keep the current selection only as a last resort. This makes the
    // loop a little awkward in the case where there is no current
    // selection, as we need to stop somewhere but can't just stop
    // when index == start, which is why we need the 'wrapped' flag.
    do {
      ++index;
      if (index == max) {
        index = 0;
        wrapped = true;
      }
      var name = this.getChildAt(index).getCaption();
      if (name && name.match(re)) {
        return index;
      }
    } while (!wrapped || index != start);
    return this.getHighlightedIndex();
  }, this.getHighlightedIndex());
};


/** @inheritDoc */
goog.ui.Menu.prototype.canHighlightItem = function(item) {
  return (this.allowHighlightDisabled_ || item.isEnabled()) &&
      item.isVisible() && item.isSupportedState(goog.ui.Component.State.HOVER);
};

// Input 60
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A menu item class that supports selection state.
 *
*
 */

goog.provide('goog.ui.Option');

goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.registry');


/**
 * Class representing a menu option.  This is just a convenience class that
 * extends {@link goog.ui.MenuItem} by making it selectable.
 *
 * @param {goog.ui.ControlContent} content Text caption or DOM structure to
 *     display as the content of the item (use to add icons or styling to
 *     menus).
 * @param {*=} opt_model Data/model associated with the menu item.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper used for
 *     document interactions.
 * @constructor
 * @extends {goog.ui.MenuItem}
 */
goog.ui.Option = function(content, opt_model, opt_domHelper) {
  goog.ui.MenuItem.call(this, content, opt_model, opt_domHelper);
  this.setSelectable(true);
};
goog.inherits(goog.ui.Option, goog.ui.MenuItem);


/**
 * Performs the appropriate action when the option is activated by the user.
 * Overrides the superclass implementation by not changing the selection state
 * of the option and not dispatching any SELECTED events, for backwards
 * compatibility with existing uses of this class.
 * @param {goog.events.Event} e Mouse or key event that triggered the action.
 * @return {boolean} True if the action was allowed to proceed, false otherwise.
 */
goog.ui.Option.prototype.performActionInternal = function(e) {
  return this.dispatchEvent(goog.ui.Component.EventType.ACTION);
};


// Register a decorator factory function for goog.ui.Options.
goog.ui.registry.setDecoratorByClassName(
    goog.getCssName('goog-option'), function() {
  // Option defaults to using MenuItemRenderer.
  return new goog.ui.Option(null);
});

// Input 61
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Single-selection model implemenation.
 *
 * TODO(user): Add keyboard & mouse event hooks?
 * TODO(user): Add multiple selection?
 *
*
 */


goog.provide('goog.ui.SelectionModel');

goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');


/**
 * Single-selection model.  Dispatches a {@link goog.events.EventType.SELECT}
 * event when a selection is made.
 * @param {Array.<Object>=} opt_items Array of items; defaults to empty.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
goog.ui.SelectionModel = function(opt_items) {
  goog.events.EventTarget.call(this);

  /**
   * Array of items controlled by the selection model.  If the items support
   * the {@code setSelected(Boolean)} interface, they will be (de)selected
   * as needed.
   * @type {!Array.<Object>}
   * @private
   */
  this.items_ = [];
  this.addItems(opt_items);
};
goog.inherits(goog.ui.SelectionModel, goog.events.EventTarget);


/**
 * The currently selected item (null if none).
 * @type {Object}
 * @private
 */
goog.ui.SelectionModel.prototype.selectedItem_ = null;


/**
 * Selection handler function.  Called with two arguments (the item to be
 * selected or deselected, and a Boolean indicating whether the item is to
 * be selected or deselected).
 * @type {Function}
 * @private
 */
goog.ui.SelectionModel.prototype.selectionHandler_ = null;


/**
 * Returns the selection handler function used by the selection model to change
 * the internal selection state of items under its control.
 * @return {Function} Selection handler function (null if none).
 */
goog.ui.SelectionModel.prototype.getSelectionHandler = function() {
  return this.selectionHandler_;
};


/**
 * Sets the selection handler function to be used by the selection model to
 * change the internal selection state of items under its control.  The
 * function must take two arguments:  an item and a Boolean to indicate whether
 * the item is to be selected or deselected.  Selection handler functions are
 * only needed if the items in the selection model don't natively support the
 * {@code setSelected(Boolean)} interface.
 * @param {Function} handler Selection handler function.
 */
goog.ui.SelectionModel.prototype.setSelectionHandler = function(handler) {
  this.selectionHandler_ = handler;
};


/**
 * Returns the number of items controlled by the selection model.
 * @return {number} Number of items.
 */
goog.ui.SelectionModel.prototype.getItemCount = function() {
  return this.items_.length;
};


/**
 * Returns the 0-based index of the given item within the selection model, or
 * -1 if no such item is found.
 * @param {Object|undefined} item Item to look for.
 * @return {number} Index of the given item (-1 if none).
 */
goog.ui.SelectionModel.prototype.indexOfItem = function(item) {
  return item ? goog.array.indexOf(this.items_, item) : -1;
};


/**
 * @return {Object|undefined} The first item, or undefined if there are no items
 *     in the model.
 */
goog.ui.SelectionModel.prototype.getFirst = function() {
  return this.items_[0];
};


/**
 * @return {Object|undefined} The last item, or undefined if there are no items
 *     in the model.
 */
goog.ui.SelectionModel.prototype.getLast = function() {
  return this.items_[this.items_.length - 1];
};


/**
 * Returns the item at the given 0-based index.
 * @param {number} index Index of the item to return.
 * @return {Object} Item at the given index (null if none).
 */
goog.ui.SelectionModel.prototype.getItemAt = function(index) {
  return this.items_[index] || null;
};


/**
 * Bulk-adds items to the selection model.  This is more efficient than calling
 * {@link #addItem} for each new item.
 * @param {Array.<Object>|undefined} items New items to add.
 */
goog.ui.SelectionModel.prototype.addItems = function(items) {
  if (items) {
    // New items shouldn't be selected.
    goog.array.forEach(items, function(item) {
      this.selectItem_(item, false);
    }, this);
    goog.array.extend(this.items_, items);
  }
};


/**
 * Adds an item at the end of the list.
 * @param {Object} item Item to add.
 */
goog.ui.SelectionModel.prototype.addItem = function(item) {
  this.addItemAt(item, this.getItemCount());
};


/**
 * Adds an item at the given index.
 * @param {Object} item Item to add.
 * @param {number} index Index at which to add the new item.
 */
goog.ui.SelectionModel.prototype.addItemAt = function(item, index) {
  if (item) {
    // New items must not be selected.
    this.selectItem_(item, false);
    goog.array.insertAt(this.items_, item, index);
  }
};


/**
 * Removes the given item (if it exists).  Dispatches a {@code SELECT} event if
 * the removed item was the currently selected item.
 * @param {Object} item Item to remove.
 */
goog.ui.SelectionModel.prototype.removeItem = function(item) {
  if (item && goog.array.remove(this.items_, item)) {
    if (item == this.selectedItem_) {
      this.selectedItem_ = null;
      this.dispatchEvent(goog.events.EventType.SELECT);
    }
  }
};


/**
 * Removes the item at the given index.
 * @param {number} index Index of the item to remove.
 */
goog.ui.SelectionModel.prototype.removeItemAt = function(index) {
  this.removeItem(this.getItemAt(index));
};


/**
 * @return {Object} The currently selected item, or null if none.
 */
goog.ui.SelectionModel.prototype.getSelectedItem = function() {
  return this.selectedItem_;
};


/**
 * Selects the given item, deselecting any previously selected item, and
 * dispatches a {@code SELECT} event.
 * @param {Object} item Item to select (null to clear the selection).
 */
goog.ui.SelectionModel.prototype.setSelectedItem = function(item) {
  if (item != this.selectedItem_) {
    this.selectItem_(this.selectedItem_, false);
    this.selectedItem_ = item;
    this.selectItem_(item, true);
  }

  // Always dispatch a SELECT event; let listeners decide what to do if the
  // selected item hasn't changed.
  this.dispatchEvent(goog.events.EventType.SELECT);
};


/**
 * @return {number} The 0-based index of the currently selected item, or -1
 *     if none.
 */
goog.ui.SelectionModel.prototype.getSelectedIndex = function() {
  return this.indexOfItem(this.selectedItem_);
};


/**
 * Selects the item at the given index, deselecting any previously selected
 * item, and dispatches a {@code SELECT} event.
 * @param {number} index Index to select (-1 to clear the selection).
 */
goog.ui.SelectionModel.prototype.setSelectedIndex = function(index) {
  this.setSelectedItem(this.getItemAt(index));
};


/**
 * Clears the selection model by removing all items from the selection.
 */
goog.ui.SelectionModel.prototype.clear = function() {
  goog.array.clear(this.items_);
  this.selectedItem_ = null;
};


/** @inheritDoc */
goog.ui.SelectionModel.prototype.disposeInternal = function() {
  goog.ui.SelectionModel.superClass_.disposeInternal.call(this);
  delete this.items_;
  this.selectedItem_ = null;
};


/**
 * Private helper; selects or deselects the given item based on the value of
 * the {@code select} argument.  If a selection handler has been registered
 * (via {@link #setSelectionHandler}, calls it to update the internal selection
 * state of the item.  Otherwise, attempts to call {@code setSelected(Boolean)}
 * on the item itself, provided the object supports that interface.
 * @param {Object} item Item to select or deselect.
 * @param {boolean} select If true, the object will be selected; if false, it
 *     will be deselected.
 * @private
 */
goog.ui.SelectionModel.prototype.selectItem_ = function(item, select) {
  if (item) {
    if (typeof this.selectionHandler_ == 'function') {
      // Use the registered selection handler function.
      this.selectionHandler_(item, select);
    } else if (typeof item.setSelected == 'function') {
      // Call setSelected() on the item, if it supports it.
      item.setSelected(select);
    }
  }
};

// Input 62
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Common CSS class name constants.
 *
*
 */

goog.provide('goog.ui.INLINE_BLOCK_CLASSNAME');


/**
 * CSS class name for applying the "display: inline-block" property in a
 * cross-browser way.
 * @type {string}
 */
goog.ui.INLINE_BLOCK_CLASSNAME = goog.getCssName('goog-inline-block');

// Input 63
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for toolbar separators.
 *
*
 */

goog.provide('goog.ui.ToolbarSeparatorRenderer');

goog.require('goog.dom.classes');
goog.require('goog.ui.INLINE_BLOCK_CLASSNAME');
goog.require('goog.ui.MenuSeparatorRenderer');



/**
 * Renderer for toolbar separators.
 * @constructor
 * @extends {goog.ui.MenuSeparatorRenderer}
 */
goog.ui.ToolbarSeparatorRenderer = function() {
  goog.ui.MenuSeparatorRenderer.call(this);
};
goog.inherits(goog.ui.ToolbarSeparatorRenderer, goog.ui.MenuSeparatorRenderer);
goog.addSingletonGetter(goog.ui.ToolbarSeparatorRenderer);


/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ToolbarSeparatorRenderer.CSS_CLASS =
  goog.getCssName('goog-toolbar-separator');


/**
 * Returns a styled toolbar separator implemented by the following DOM:
 * <div class="goog-toolbar-separator goog-inline-block">&nbsp;</div>
 * Overrides {@link goog.ui.MenuSeparatorRenderer#createDom}.
 * @param {goog.ui.Separator} separator Separator to render.
 * @return {Element} Root element for the separator.
 */
goog.ui.ToolbarSeparatorRenderer.prototype.createDom = function(separator) {
  // 00A0 is &nbsp;
  return separator.getDomHelper().createDom('div',
      this.getCssClass() + ' ' + goog.ui.INLINE_BLOCK_CLASSNAME,
      '\u00A0');
};


/**
 * Takes an existing element, and decorates it with the separator.  Overrides
 * {@link goog.ui.MenuSeparatorRenderer#decorate}.
 * @param {goog.ui.Separator} separator Separator to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 */
goog.ui.ToolbarSeparatorRenderer.prototype.decorate = function(separator,
                                                               element) {
  element = goog.ui.ToolbarSeparatorRenderer.superClass_.decorate.call(this,
      separator, element);
  goog.dom.classes.add(element, goog.ui.INLINE_BLOCK_CLASSNAME);
  return element;
};


/**
 * Returns the CSS class to be applied to the root element of components
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.ToolbarSeparatorRenderer.prototype.getCssClass = function() {
  return goog.ui.ToolbarSeparatorRenderer.CSS_CLASS;
};

// Input 64
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for {@link goog.ui.Toolbar}s.
 *
*
 */

goog.provide('goog.ui.ToolbarRenderer');

goog.require('goog.dom.a11y.Role');
goog.require('goog.ui.Container.Orientation');
goog.require('goog.ui.ContainerRenderer');
goog.require('goog.ui.Separator');
goog.require('goog.ui.ToolbarSeparatorRenderer');


/**
 * Default renderer for {@link goog.ui.Toolbar}s, based on {@link
 * goog.ui.ContainerRenderer}.
 * @constructor
 * @extends {goog.ui.ContainerRenderer}
 */
goog.ui.ToolbarRenderer = function() {
  goog.ui.ContainerRenderer.call(this);
};
goog.inherits(goog.ui.ToolbarRenderer, goog.ui.ContainerRenderer);
goog.addSingletonGetter(goog.ui.ToolbarRenderer);


/**
 * Default CSS class to be applied to the root element of toolbars rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ToolbarRenderer.CSS_CLASS = goog.getCssName('goog-toolbar');


/**
 * Returns the ARIA role to be applied to toolbar/menubar.
 * @return {string} ARIA role.
 * @override
 */
goog.ui.ToolbarRenderer.prototype.getAriaRole = function() {
  return goog.dom.a11y.Role.TOOLBAR;
};


/**
 * Inspects the element, and creates an instance of {@link goog.ui.Control} or
 * an appropriate subclass best suited to decorate it.  Overrides the superclass
 * implementation by recognizing HR elements as separators.
 * @param {Element} element Element to decorate.
 * @return {goog.ui.Control?} A new control suitable to decorate the element
 *     (null if none).
 */
goog.ui.ToolbarRenderer.prototype.getDecoratorForChild = function(element) {
  return element.tagName == 'HR' ?
      new goog.ui.Separator(goog.ui.ToolbarSeparatorRenderer.getInstance()) :
      goog.ui.ToolbarRenderer.superClass_.getDecoratorForChild.call(this,
          element);
};


/**
 * Returns the CSS class to be applied to the root element of containers
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.ToolbarRenderer.prototype.getCssClass = function() {
  return goog.ui.ToolbarRenderer.CSS_CLASS;
};


/**
 * Returns the default orientation of containers rendered or decorated by this
 * renderer.  This implementation returns {@code HORIZONTAL}.
 * @return {goog.ui.Container.Orientation} Default orientation for containers
 *     created or decorated by this renderer.
 */
goog.ui.ToolbarRenderer.prototype.getDefaultOrientation = function() {
  return goog.ui.Container.Orientation.HORIZONTAL;
};

// Input 65
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar class that hosts {@link goog.ui.Control}s such as
 * buttons and menus, along with toolbar-specific renderers of those controls.
 *
*
 * @see ../demos/toolbar.html
 */

goog.provide('goog.ui.Toolbar');

goog.require('goog.ui.Container');
goog.require('goog.ui.ToolbarRenderer');


/**
 * A toolbar class, implemented as a {@link goog.ui.Container} that defaults to
 * having a horizontal orientation and {@link goog.ui.ToolbarRenderer} as its
 * renderer.
 * @param {goog.ui.ToolbarRenderer=} opt_renderer Renderer used to render or
 *     decorate the toolbar; defaults to {@link goog.ui.ToolbarRenderer}.
 * @param {?goog.ui.Container.Orientation=} opt_orientation Toolbar orientation;
 *     defaults to {@code HORIZONTAL}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @constructor
 * @extends {goog.ui.Container}
 */
goog.ui.Toolbar = function(opt_renderer, opt_orientation, opt_domHelper) {
  goog.ui.Container.call(this, opt_orientation, opt_renderer ||
      goog.ui.ToolbarRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.Toolbar, goog.ui.Container);

// Input 66
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A custom button renderer that uses CSS voodoo to render a
 * button-like object with fake rounded corners.
 *
*
 */

goog.provide('goog.ui.CustomButtonRenderer');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.string');
goog.require('goog.ui.ButtonRenderer');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.INLINE_BLOCK_CLASSNAME');



/**
 * Custom renderer for {@link goog.ui.Button}s.  Custom buttons can contain
 * almost arbitrary HTML content, will flow like inline elements, but can be
 * styled like block-level elements.
 *
 * @constructor
 * @extends {goog.ui.ButtonRenderer}
 */
goog.ui.CustomButtonRenderer = function() {
  goog.ui.ButtonRenderer.call(this);
};
goog.inherits(goog.ui.CustomButtonRenderer, goog.ui.ButtonRenderer);
goog.addSingletonGetter(goog.ui.CustomButtonRenderer);


/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.CustomButtonRenderer.CSS_CLASS = goog.getCssName('goog-custom-button');


/**
 * Returns the button's contents wrapped in the following DOM structure:
 *    <div class="goog-inline-block goog-custom-button">
 *      <div class="goog-inline-block goog-custom-button-outer-box">
 *        <div class="goog-inline-block goog-custom-button-inner-box">
 *          Contents...
 *        </div>
 *      </div>
 *    </div>
 * Overrides {@link goog.ui.ButtonRenderer#createDom}.
 * @param {goog.ui.Button} button Button to render.
 * @return {Element} Root element for the button.
 */
goog.ui.CustomButtonRenderer.prototype.createDom = function(button) {
  var classNames = this.getClassNames(button);
  var attributes = {
    'class': goog.ui.INLINE_BLOCK_CLASSNAME + ' ' + classNames.join(' '),
    'title': button.getTooltip() || ''
  };
  return button.getDomHelper().createDom('div', attributes,
      this.createButton(button.getContent(), button.getDomHelper()));
};


/**
 * Takes the button's root element and returns the parent element of the
 * button's contents.  Overrides the superclass implementation by taking
 * the nested DIV structure of custom buttons into account.
 * @param {Element} element Root element of the button whose content
 *     element is to be returned.
 * @return {Element} The button's content element (if any).
 */
goog.ui.CustomButtonRenderer.prototype.getContentElement = function(element) {
  return element && /** @type {Element} */ (element.firstChild.firstChild);
};


/**
 * Takes a text caption or existing DOM structure, and returns the content
 * wrapped in a pseudo-rounded-corner box.  Creates the following DOM structure:
 *  <div class="goog-inline-block goog-custom-button-outer-box">
 *    <div class="goog-inline-block goog-custom-button-inner-box">
 *      Contents...
 *    </div>
 *  </div>
 * Used by both {@link #createDom} and {@link #decorate}.  To be overridden
 * by subclasses.
 * @param {goog.ui.ControlContent} content Text caption or DOM structure to wrap
 *     in a box.
 * @param {goog.dom.DomHelper} dom DOM helper, used for document interaction.
 * @return {Element} Pseudo-rounded-corner box containing the content.
 */
goog.ui.CustomButtonRenderer.prototype.createButton = function(content, dom) {
  return dom.createDom('div',
      goog.ui.INLINE_BLOCK_CLASSNAME + ' ' +
      goog.getCssName(this.getCssClass(), 'outer-box'),
      dom.createDom('div',
          goog.ui.INLINE_BLOCK_CLASSNAME + ' ' +
          goog.getCssName(this.getCssClass(), 'inner-box'), content));
};


/**
 * Returns true if this renderer can decorate the element.  Overrides
 * {@link goog.ui.ButtonRenderer#canDecorate} by returning true if the
 * element is a DIV, false otherwise.
 * @param {Element} element Element to decorate.
 * @return {boolean} Whether the renderer can decorate the element.
 */
goog.ui.CustomButtonRenderer.prototype.canDecorate = function(element) {
  return element.tagName == 'DIV';
};


/**
 * Check if the button's element has a box structure.
 * @param {goog.ui.Button} button Button instance whose structure is being
 *     checked.
 * @param {Element} element Element of the button.
 * @return {boolean} Whether the element has a box structure.
 * @protected
 */
goog.ui.CustomButtonRenderer.prototype.hasBoxStructure = function(
    button, element) {
  var outer = button.getDomHelper().getFirstElementChild(element);
  if (outer && outer.className.indexOf(goog.getCssName(this.getCssClass(),
          'outer-box')) != -1) {
    var inner = button.getDomHelper().getFirstElementChild(outer);
    if (inner && inner.className.indexOf(goog.getCssName(this.getCssClass(),
            'inner-box')) != -1) {
      // We have a proper box structure.
      return true;
    }
  }
  return false;
};


/**
 * Takes an existing element and decorates it with the custom button control.
 * Initializes the control's ID, content, tooltip, value, and state based
 * on the ID of the element, its child nodes, and its CSS classes, respectively.
 * Returns the element.  Overrides {@link goog.ui.ButtonRenderer#decorate}.
 * @param {goog.ui.Button} button Button instance to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 */
goog.ui.CustomButtonRenderer.prototype.decorate = function(button, element) {
  // Trim text nodes in the element's child node list; otherwise madness
  // ensues (i.e. on Gecko, buttons will flicker and shift when moused over).
  goog.ui.CustomButtonRenderer.trimTextNodes_(element, true);
  goog.ui.CustomButtonRenderer.trimTextNodes_(element, false);

  // Create the buttom dom if it has not been created.
  if (!this.hasBoxStructure(button, element)) {
    element.appendChild(
        this.createButton(element.childNodes, button.getDomHelper()));
  }

  goog.dom.classes.add(element,
      goog.ui.INLINE_BLOCK_CLASSNAME, this.getCssClass());
  return goog.ui.CustomButtonRenderer.superClass_.decorate.call(this, button,
      element);
};


/**
 * Returns the CSS class to be applied to the root element of components
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.CustomButtonRenderer.prototype.getCssClass = function() {
  return goog.ui.CustomButtonRenderer.CSS_CLASS;
};


/**
 * Takes an element and removes leading or trailing whitespace from the start
 * or the end of its list of child nodes.  The Boolean argument determines
 * whether to trim from the start or the end of the node list.  Empty text
 * nodes are removed, and the first non-empty text node is trimmed from the
 * left or the right as appropriate.  For example,
 *    <div class="goog-inline-block">
 *      #text ""
 *      #text "\n    Hello "
 *      <span>...</span>
 *      #text " World!    \n"
 *      #text ""
 *    </div>
 * becomes
 *    <div class="goog-inline-block">
 *      #text "Hello "
 *      <span>...</span>
 *      #text " World!"
 *    </div>
 * This is essential for Gecko, where leading/trailing whitespace messes with
 * the layout of elements with -moz-inline-box (used in goog-inline-block), and
 * optional but harmless for non-Gecko.
 *
 * @param {Element} element Element whose child node list is to be trimmed.
 * @param {boolean} fromStart Whether to trim from the start or from the end.
 * @private
 */
goog.ui.CustomButtonRenderer.trimTextNodes_ = function(element, fromStart) {
  if (element) {
    var node = fromStart ? element.firstChild : element.lastChild, next;
    // Tag soup HTML may result in a DOM where siblings have different parents.
    while (node && node.parentNode == element) {
      // Get the next/previous sibling here, since the node may be removed.
      next = fromStart ? node.nextSibling : node.previousSibling;
      if (node.nodeType == goog.dom.NodeType.TEXT) {
        // Found a text node.
        var text = node.nodeValue;
        if (goog.string.trim(text) == '') {
          // Found an empty text node; remove it.
          element.removeChild(node);
        } else {
          // Found a non-empty text node; trim from the start/end, then exit.
          node.nodeValue = fromStart ?
              goog.string.trimLeft(text) : goog.string.trimRight(text);
          break;
        }
      } else {
        // Found a non-text node; done.
        break;
      }
      node = next;
    }
  }
};

// Input 67
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for toolbar buttons.
 *
*
 */

goog.provide('goog.ui.ToolbarButtonRenderer');

goog.require('goog.ui.CustomButtonRenderer');


/**
 * Toolbar-specific renderer for {@link goog.ui.Button}s, based on {@link
 * goog.ui.CustomButtonRenderer}.
 * @constructor
 * @extends {goog.ui.CustomButtonRenderer}
 */
goog.ui.ToolbarButtonRenderer = function() {
  goog.ui.CustomButtonRenderer.call(this);
};
goog.inherits(goog.ui.ToolbarButtonRenderer, goog.ui.CustomButtonRenderer);
goog.addSingletonGetter(goog.ui.ToolbarButtonRenderer);


/**
 * Default CSS class to be applied to the root element of buttons rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ToolbarButtonRenderer.CSS_CLASS =
    goog.getCssName('goog-toolbar-button');


/**
 * Returns the CSS class to be applied to the root element of buttons rendered
 * using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.ToolbarButtonRenderer.prototype.getCssClass = function() {
  return goog.ui.ToolbarButtonRenderer.CSS_CLASS;
};

// Input 68
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar button control.
 *
*
*
 */

goog.provide('goog.ui.ToolbarButton');

goog.require('goog.ui.Button');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ToolbarButtonRenderer');
goog.require('goog.ui.registry');



/**
 * A button control for a toolbar.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Optional renderer used to
 *     render or decorate the button; defaults to
 *     {@link goog.ui.ToolbarButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Button}
 */
goog.ui.ToolbarButton = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Button.call(this, content, opt_renderer ||
      goog.ui.ToolbarButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.ToolbarButton, goog.ui.Button);


// Registers a decorator factory function for toolbar buttons.
goog.ui.registry.setDecoratorByClassName(
    goog.ui.ToolbarButtonRenderer.CSS_CLASS,
    function() {
      return new goog.ui.ToolbarButton(null);
    });

// Input 69
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A timer class to which other classes and objects can
 * listen on.  This is only an abstraction above setInterval.
 *
*
 * @see ../demos/timers.html
 */

goog.provide('goog.Timer');

goog.require('goog.events.EventTarget');



/**
 * Class for handling timing events.
 *
 * @param {number=} opt_interval Number of ms between ticks (Default: 1ms).
 * @param {Object=} opt_timerObject  An object that has setTimeout, setInterval,
 *     clearTimeout and clearInterval (eg Window).
 * @constructor
 * @extends {goog.events.EventTarget}
 */
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);

  /**
   * Number of ms between ticks
   * @type {number}
   * @private
   */
  this.interval_ = opt_interval || 1;

  /**
   * An object that implements setTimout, setInterval, clearTimeout and
   * clearInterval. We default to the window object. Changing this on
   * goog.Timer.prototype changes the object for all timer instances which can
   * be useful if your environment has some other implementation of timers than
   * the window object.
   * @type {Object}
   * @private
   */
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;

  /**
   * Cached tick_ bound to the object for later use in the timer.
   * @type {Function}
   * @private
   */
  this.boundTick_ = goog.bind(this.tick_, this);

 /**
  * Firefox browser often fires the timer event sooner
  * (sometimes MUCH sooner) than the requested timeout. So we
  * compare the time to when the event was last fired, and
  * reschedule if appropriate. See also goog.Timer.intervalScale
  * @type {number}
  * @private
  */
  this.last_ = goog.now();
};
goog.inherits(goog.Timer, goog.events.EventTarget);


/**
 * Maximum timeout value.
 *
 * Timeout values too big to fit into a signed 32-bit integer may cause
 * overflow in FF, Safari, and Chrome, resulting in the timeout being
 * scheduled immediately.  It makes more sense simply not to schedule these
 * timeouts, since 24.8 days is beyond a reasonable expectation for the
 * browser to stay open.
 *
 * @type {number}
 * @private
 */
goog.Timer.MAX_TIMEOUT_ = 2147483647;


/**
 * Whether this timer is enabled
 * @type {boolean}
 */
goog.Timer.prototype.enabled = false;


/**
 * An object that implements setTimout, setInterval, clearTimeout and
 * clearInterval. We default to the window object. Changing this on
 * goog.Timer.prototype changes the object for all timer instances which can be
 * useful if your environment has some other implementation of timers than the
 * window object.
 * @type {Object}
 */
goog.Timer.defaultTimerObject = goog.global['window'];


/**
 * A variable that controls the timer error correction. If the
 * timer is called before the requested interval times
 * intervalScale, which often happens on mozilla, the timer is
 * rescheduled. See also this.last_
 * @type {number}
 */
goog.Timer.intervalScale = 0.8;


/**
 * Variable for storing the result of setInterval
 * @type {?number}
 * @private
 */
goog.Timer.prototype.timer_ = null;


/**
 * Gets the interval of the timer.
 * @return {number} interval Number of ms between ticks.
 */
goog.Timer.prototype.getInterval = function() {
  return this.interval_;
};


/**
 * Sets the interval of the timer.
 * @param {number} interval Number of ms between ticks.
 */
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if (this.timer_ && this.enabled) {
    // Stop and then start the timer to reset the interval.
    this.stop();
    this.start();
  } else if (this.timer_) {
    this.stop();
  }
};


/**
 * Callback for the setInterval used by the timer
 * @private
 */
goog.Timer.prototype.tick_ = function() {
  if (this.enabled) {
    var elapsed = goog.now() - this.last_;
    if (elapsed > 0 &&
        elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_,
          this.interval_ - elapsed);
      return;
    }

    this.dispatchTick();
    // The timer could be stopped in the timer event handler.
    if (this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_,
          this.interval_);
      this.last_ = goog.now();
    }
  }
};


/**
 * Dispatches the TICK event. This is its own method so subclasses can override.
 */
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK);
};


/**
 * Starts the timer.
 */
goog.Timer.prototype.start = function() {
  this.enabled = true;

  // If there is no interval already registered, start it now
  if (!this.timer_) {
    // IMPORTANT!
    // window.setInterval in FireFox has a bug - it fires based on
    // absolute time, rather than on relative time. What this means
    // is that if a computer is sleeping/hibernating for 24 hours
    // and the timer interval was configured to fire every 1000ms,
    // then after the PC wakes up the timer will fire, in rapid
    // succession, 3600*24 times.
    // This bug is described here and is already fixed, but it will
    // take time to propagate, so for now I am switching this over
    // to setTimeout logic.
    //     https://bugzilla.mozilla.org/show_bug.cgi?id=376643
    //
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_,
        this.interval_);
    this.last_ = goog.now();
  }
};


/**
 * Stops the timer.
 */
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if (this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null;
  }
};


/**
 * Disposes of the timer.
 */
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_;
};


/**
 * Constant for the timer's event type
 * @type {string}
 */
goog.Timer.TICK = 'tick';


/**
 * Calls the given function once, after the optional pause
 * @param {Function} listener Function or object that has a handleEvent method.
 * @param {number=} opt_interval Number of ms between ticks (Default: 1ms).
 * @param {Object=} opt_handler Object in whose scope to call the listener.
 * @return {number} A handle to the timer ID.
 */
goog.Timer.callOnce = function(listener, opt_interval, opt_handler) {
  if (goog.isFunction(listener)) {
    if (opt_handler) {
      listener = goog.bind(listener, opt_handler);
    }
  } else if (listener && typeof listener.handleEvent == 'function') {
    // using typeof to prevent strict js warning
    listener = goog.bind(listener.handleEvent, listener);
  } else {
   throw Error('Invalid listener argument');
  }

  if (opt_interval > goog.Timer.MAX_TIMEOUT_) {
    // Timeouts greater than MAX_INT return immediately due to integer
    // overflow in many browsers.  Since MAX_INT is 24.8 days, just don't
    // schedule anything at all.
    return -1;
  } else {
    return goog.Timer.defaultTimerObject.setTimeout(
        listener, opt_interval || 0);
  }
};


/**
 * Clears a timeout initiated by callOnce
 * @param {?number} timerId a timer ID.
 */
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId);
};

// Input 70
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Common positioning code.
 *
*
*
 */

goog.provide('goog.positioning');
goog.provide('goog.positioning.Corner');
goog.provide('goog.positioning.CornerBit');
goog.provide('goog.positioning.Overflow');
goog.provide('goog.positioning.OverflowStatus');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.math.Box');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.style');



/**
 * Enum for representing an element corner for positioning the popup.
 *
 * The START constants map to LEFT if element directionality is left
 * to right and RIGHT if the directionality is right to left.
 * Likewise END maps to RIGHT or LEFT depending on the directionality.
 *
 * @enum {number}
 */
goog.positioning.Corner = {
  TOP_LEFT: 0,
  TOP_RIGHT: 2,
  BOTTOM_LEFT: 1,
  BOTTOM_RIGHT: 3,
  TOP_START: 4,
  TOP_END: 6,
  BOTTOM_START: 5,
  BOTTOM_END: 7
};


/**
 * Enum for bits in the {@see goog.positioning.Corner) bitmap.
 *
 * @enum {number}
 */
goog.positioning.CornerBit = {
  BOTTOM: 1,
  RIGHT: 2,
  FLIP_RTL: 4
};


/**
 * Enum for representing position handling in cases where the element would be
 * positioned outside the viewport.
 *
 * @enum {number}
 */
goog.positioning.Overflow = {
  IGNORE: 0,
  ADJUST_X: 1,
  FAIL_X: 2,
  ADJUST_Y: 4,
  FAIL_Y: 8,
  RESIZE_WIDTH: 16,
  RESIZE_HEIGHT: 32
};


/**
 * Enum for representing the outcome of a positioning call.
 *
 * @enum {number}
 */
goog.positioning.OverflowStatus = {
  NONE: 0,
  ADJUSTED_X: 1,
  ADJUSTED_Y: 2,
  WIDTH_ADJUSTED: 4,
  HEIGHT_ADJUSTED: 8,
  FAILED_LEFT: 16,
  FAILED_RIGHT: 32,
  FAILED_TOP: 64,
  FAILED_BOTTOM: 128,
  FAILED_OUTSIDE_VIEWPORT: 256
};


/**
 * Shorthand to check if a status code contains any fail code.
 * @type {number}
 */
goog.positioning.OverflowStatus.FAILED =
    goog.positioning.OverflowStatus.FAILED_LEFT |
    goog.positioning.OverflowStatus.FAILED_RIGHT |
    goog.positioning.OverflowStatus.FAILED_TOP |
    goog.positioning.OverflowStatus.FAILED_BOTTOM |
    goog.positioning.OverflowStatus.FAILED_OUTSIDE_VIEWPORT;


/**
 * Shorthand to check if horizontal positioning failed.
 * @type {number}
 */
goog.positioning.OverflowStatus.FAILED_HORIZONTAL =
    goog.positioning.OverflowStatus.FAILED_LEFT |
    goog.positioning.OverflowStatus.FAILED_RIGHT;


/**
 * Shorthand to check if vertical positioning failed.
 * @type {number}
 */
goog.positioning.OverflowStatus.FAILED_VERTICAL =
    goog.positioning.OverflowStatus.FAILED_TOP |
    goog.positioning.OverflowStatus.FAILED_BOTTOM;


/**
 * Positions a movable element relative to an anchor element. The caller
 * specifies the corners that should touch. This functions then moves the
 * movable element accordingly.
 *
 * @param {Element} anchorElement The element that is the anchor for where
 *    the movable element should position itself.
 * @param {goog.positioning.Corner} anchorElementCorner The corner of the
 *     anchorElement for positioning the movable element.
 * @param {Element} movableElement The element to move.
 * @param {goog.positioning.Corner} movableElementCorner The corner of the
 *     movableElement that that should be positioned adjacent to the anchor
 *     element.
 * @param {goog.math.Coordinate=} opt_offset An offset specified in pixels.
 *    After the normal positioning algorithm is applied, the offset is then
 *    applied. Positive coordinates move the popup closer to the center of the
 *    anchor element. Negative coordinates move the popup away from the center
 *    of the anchor element.
 * @param {goog.math.Box=} opt_margin A margin specified in pixels.
 *    After the normal positioning algorithm is applied and any offset, the
 *    margin is then applied. Positive coordinates move the popup away from the
 *    spot it was positioned towards its center. Negative coordinates move it
 *    towards the spot it was positioned away from its center.
 * @param {?number=} opt_overflow Overflow handling mode. Defaults to IGNORE if
 *     not specified. Bitmap, {@see goog.positioning.Overflow}.
 * @param {goog.math.Size=} opt_preferredSize The preferred size of the
 *     movableElement.
 * @return {goog.positioning.OverflowStatus} Status bitmap,
 *     {@see goog.positioning.OverflowStatus}.
 */
goog.positioning.positionAtAnchor = function(anchorElement,
                                             anchorElementCorner,
                                             movableElement,
                                             movableElementCorner,
                                             opt_offset,
                                             opt_margin,
                                             opt_overflow,
                                             opt_preferredSize) {
  // Ignore offset for the BODY element unless its position is non-static.
  // For cases where the offset parent is HTML rather than the BODY (such as in
  // IE strict mode) there's no need to get the position of the BODY as it
  // doesn't affect the page offset.
  var moveableParentTopLeft;
  var parent = movableElement.offsetParent;
  if (parent) {
    var isBody = parent.tagName == goog.dom.TagName.HTML ||
        parent.tagName == goog.dom.TagName.BODY;
    if (!isBody ||
        goog.style.getComputedPosition(parent) != 'static') {
      // Get the top-left corner of the parent, in page coordinates.
      moveableParentTopLeft = goog.style.getPageOffset(parent);

      if (!isBody) {
        moveableParentTopLeft = goog.math.Coordinate.difference(
            moveableParentTopLeft,
            new goog.math.Coordinate(parent.scrollLeft, parent.scrollTop));
      }
    }
  }

  // Get the visible part of the anchor element.  anchorRect is
  // relative to anchorElement's page.
  var anchorRect = goog.positioning.getVisiblePart_(anchorElement);

  // Translate anchorRect to be relative to movableElement's page.
  goog.style.translateRectForAnotherFrame(
      anchorRect,
      goog.dom.getDomHelper(anchorElement),
      goog.dom.getDomHelper(movableElement));

  // Offset based on which corner of the element we want to position against.
  var corner = goog.positioning.getEffectiveCorner(anchorElement,
                                                   anchorElementCorner);
  // absolutePos is a candidate position relative to the
  // movableElement's window.
  var absolutePos = new goog.math.Coordinate(
      corner & goog.positioning.CornerBit.RIGHT ?
          anchorRect.left + anchorRect.width : anchorRect.left,
      corner & goog.positioning.CornerBit.BOTTOM ?
          anchorRect.top + anchorRect.height : anchorRect.top);

  // Translate absolutePos to be relative to the offsetParent.
  if (moveableParentTopLeft) {
    absolutePos =
        goog.math.Coordinate.difference(absolutePos, moveableParentTopLeft);
  }

  // Apply offset, if specified
  if (opt_offset) {
    absolutePos.x += (corner & goog.positioning.CornerBit.RIGHT ? -1 : 1) *
        opt_offset.x;
    absolutePos.y += (corner & goog.positioning.CornerBit.BOTTOM ? -1 : 1) *
        opt_offset.y;
  }

  // Determine dimension of viewport.
  var viewport;
  if (opt_overflow) {
    viewport = goog.style.getVisibleRectForElement(movableElement);
    if (viewport && moveableParentTopLeft) {
      viewport.top = Math.max(0, viewport.top - moveableParentTopLeft.y);
      viewport.right -= moveableParentTopLeft.x;
      viewport.bottom -= moveableParentTopLeft.y;
      viewport.left = Math.max(0, viewport.left - moveableParentTopLeft.x);
    }
  }

  return goog.positioning.positionAtCoordinate(absolutePos,
                                               movableElement,
                                               movableElementCorner,
                                               opt_margin,
                                               viewport,
                                               opt_overflow,
                                               opt_preferredSize);
};


/**
 * Returns intersection of the specified element and
 * goog.style.getVisibleRectForElement for it.
 *
 * @param {Element} el The target element.
 * @return {goog.math.Rect} Intersection of getVisibleRectForElement
 *     and the current bounding rectangle of the element.  If the
 *     intersection is empty, returns the bounding rectangle.
 * @private
 */
goog.positioning.getVisiblePart_ = function(el) {
  var rect = goog.style.getBounds(el);
  var visibleBox = goog.style.getVisibleRectForElement(el);
  if (visibleBox) {
    rect.intersection(goog.math.Rect.createFromBox(visibleBox));
  }
  return rect;
};


/**
 * Positions the specified corner of the movable element at the
 * specified coordinate.
 *
 * @param {goog.math.Coordinate} absolutePos The coordinate to position the
 *     element at.
 * @param {Element} movableElement The element to be positioned.
 * @param {goog.positioning.Corner} movableElementCorner The corner of the
 *     movableElement that that should be positioned.
 * @param {goog.math.Box=} opt_margin A margin specified in pixels.
 *    After the normal positioning algorithm is applied and any offset, the
 *    margin is then applied. Positive coordinates move the popup away from the
 *    spot it was positioned towards its center. Negative coordinates move it
 *    towards the spot it was positioned away from its center.
 * @param {goog.math.Box=} opt_viewport Box object describing the dimensions of
 *     the viewport. Required if opt_overflow is specified.
 * @param {?number=} opt_overflow Overflow handling mode. Defaults to IGNORE if
 *     not specified, {@see goog.positioning.Overflow}.
 * @param {goog.math.Size=} opt_preferredSize The preferred size of the
 *     movableElement. Defaults to the current size.
 * @return {goog.positioning.OverflowStatus} Status bitmap.
 */
goog.positioning.positionAtCoordinate = function(absolutePos,
                                                 movableElement,
                                                 movableElementCorner,
                                                 opt_margin,
                                                 opt_viewport,
                                                 opt_overflow,
                                                 opt_preferredSize) {
  absolutePos = absolutePos.clone();
  var status = goog.positioning.OverflowStatus.NONE;

  // Offset based on attached corner and desired margin.
  var corner = goog.positioning.getEffectiveCorner(movableElement,
                                                   movableElementCorner);
  var elementSize = goog.style.getSize(movableElement);
  var size = opt_preferredSize ? opt_preferredSize.clone() :
      elementSize;

  if (opt_margin || corner != goog.positioning.Corner.TOP_LEFT) {
    if (corner & goog.positioning.CornerBit.RIGHT) {
      absolutePos.x -= size.width + (opt_margin ? opt_margin.right : 0);
    } else if (opt_margin) {
      absolutePos.x += opt_margin.left;
    }
    if (corner & goog.positioning.CornerBit.BOTTOM) {
      absolutePos.y -= size.height + (opt_margin ? opt_margin.bottom : 0);
    } else if (opt_margin) {
      absolutePos.y += opt_margin.top;
    }
  }

  // Adjust position to fit inside viewport.
  if (opt_overflow) {
    status = opt_viewport ? goog.positioning.adjustForViewport(absolutePos,
                                                               size,
                                                               opt_viewport,
                                                               opt_overflow) :
        goog.positioning.OverflowStatus.FAILED_OUTSIDE_VIEWPORT;
    if (status & goog.positioning.OverflowStatus.FAILED) {
      return status;
    }
  }

  goog.style.setPosition(movableElement, absolutePos);
  if (!goog.math.Size.equals(elementSize, size)) {
    goog.style.setSize(movableElement, size);
  }

  return status;
};


/**
 * Adjusts the position and/or size of an element, identified by its position
 * and size, to fit inside the viewport. If the position or size of the element
 * is adjusted the pos or size objects, respectively, are modified.
 *
 * @param {goog.math.Coordinate} pos Position of element, updated if the
 *     position is adjusted.
 * @param {goog.math.Size} size Size of element, updated if the size is
 *     adjusted.
 * @param {goog.math.Box} viewport Bounding box describing the viewport.
 * @param {number} overflow Overflow handling mode,
 *     {@see goog.positioning.Overflow}.
 * @return {goog.positioning.OverflowStatus} Status bitmap,
 *     {@see goog.positioning.OverflowStatus}.
 */
goog.positioning.adjustForViewport = function(pos, size, viewport, overflow) {
  var status = goog.positioning.OverflowStatus.NONE;

  // Left edge outside viewport, try to move it.
  if (pos.x < viewport.left && overflow & goog.positioning.Overflow.ADJUST_X) {
    pos.x = viewport.left;
    status |= goog.positioning.OverflowStatus.ADJUSTED_X;
  }

  // Left edge inside and right edge outside viewport, try to resize it.
  if (pos.x < viewport.left &&
      pos.x + size.width > viewport.right &&
      overflow & goog.positioning.Overflow.RESIZE_WIDTH) {
    size.width -= (pos.x + size.width) - viewport.right;
    status |= goog.positioning.OverflowStatus.WIDTH_ADJUSTED;
  }

  // Right edge outside viewport, try to move it.
  if (pos.x + size.width > viewport.right &&
      overflow & goog.positioning.Overflow.ADJUST_X) {
    pos.x = Math.max(viewport.right - size.width, viewport.left);
    status |= goog.positioning.OverflowStatus.ADJUSTED_X;
  }

  // Left or right edge still outside viewport, fail if the FAIL_X option was
  // specified, ignore it otherwise.
  if (overflow & goog.positioning.Overflow.FAIL_X) {
    status |= (pos.x < viewport.left ?
                  goog.positioning.OverflowStatus.FAILED_LEFT : 0) |
              (pos.x + size.width > viewport.right ?
                  goog.positioning.OverflowStatus.FAILED_RIGHT : 0);
  }

  // Top edge outside viewport, try to move it.
  if (pos.y < viewport.top && overflow & goog.positioning.Overflow.ADJUST_Y) {
    pos.y = viewport.top;
    status |= goog.positioning.OverflowStatus.ADJUSTED_Y;
  }

  // Top edge inside and bottom edge outside viewport, try to resize it.
  if (pos.y >= viewport.top &&
      pos.y + size.height > viewport.bottom &&
      overflow & goog.positioning.Overflow.RESIZE_HEIGHT) {
    size.height -= (pos.y + size.height) - viewport.bottom;
    status |= goog.positioning.OverflowStatus.HEIGHT_ADJUSTED;
  }

  // Bottom edge outside viewport, try to move it.
  if (pos.y + size.height > viewport.bottom &&
      overflow & goog.positioning.Overflow.ADJUST_Y) {
    pos.y = Math.max(viewport.bottom - size.height, viewport.top);
    status |= goog.positioning.OverflowStatus.ADJUSTED_Y;
  }

  // Top or bottom edge still outside viewport, fail if the FAIL_Y option was
  // specified, ignore it otherwise.
  if (overflow & goog.positioning.Overflow.FAIL_Y) {
    status |= (pos.y < viewport.top ?
                  goog.positioning.OverflowStatus.FAILED_TOP : 0) |
              (pos.y + size.height > viewport.bottom ?
                  goog.positioning.OverflowStatus.FAILED_BOTTOM : 0);
  }

  return status;
};


/**
 * Returns an absolute corner (top/bottom left/right) given an absolute
 * or relative (top/bottom start/end) corner and the direction of an element.
 * Absolute corners remain unchanged.
 * @param {Element} element DOM element to test for RTL direction.
 * @param {goog.positioning.Corner} corner The popup corner used for
 *     positioning.
 * @return {goog.positioning.Corner} Effective corner.
 */
goog.positioning.getEffectiveCorner = function(element, corner) {
  return /** @type {goog.positioning.Corner} */ (
      (corner & goog.positioning.CornerBit.FLIP_RTL &&
          goog.style.isRightToLeft(element) ?
          corner ^ goog.positioning.CornerBit.RIGHT :
          corner
      ) & ~goog.positioning.CornerBit.FLIP_RTL);
};


/**
 * Returns the corner opposite the given one horizontally.
 * @param {goog.positioning.Corner} corner The popup corner used to flip.
 * @return {goog.positioning.Corner} The opposite corner horizontally.
 */
goog.positioning.flipCornerHorizontal = function(corner) {
  return /** @type {goog.positioning.Corner} */ (corner ^
      goog.positioning.CornerBit.RIGHT);
};


/**
 * Returns the corner opposite the given one vertically.
 * @param {goog.positioning.Corner} corner The popup corner used to flip.
 * @return {goog.positioning.Corner} The opposite corner vertically.
 */
goog.positioning.flipCornerVertical = function(corner) {
  return /** @type {goog.positioning.Corner} */ (corner ^
      goog.positioning.CornerBit.BOTTOM);
};


/**
 * Returns the corner opposite the given one horizontally and vertically.
 * @param {goog.positioning.Corner} corner The popup corner used to flip.
 * @return {goog.positioning.Corner} The opposite corner horizontally and
 *     vertically.
 */
goog.positioning.flipCorner = function(corner) {
  return /** @type {goog.positioning.Corner} */ (corner ^
      goog.positioning.CornerBit.BOTTOM ^
      goog.positioning.CornerBit.RIGHT);
};

// Input 71
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Abstract base class for positioning implementations.
 *
*
 */

goog.provide('goog.positioning.AbstractPosition');

goog.require('goog.math.Box');
goog.require('goog.math.Size');
goog.require('goog.positioning.Corner');



/**
 * Abstract position object. Encapsulates position and overflow handling.
 *
 * @constructor
 */
goog.positioning.AbstractPosition = function() {};


/**
 * Repositions the element. Abstract method, should be overloaded.
 *
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} corner Corner of the movable element that
 *     should be positioned adjacent to the anchored element.
 * @param {goog.math.Box=} opt_margin A margin specified in pixels.
 * @param {goog.math.Size=} opt_preferredSize PreferredSize of the
 *     movableElement.
 */
goog.positioning.AbstractPosition.prototype.reposition =
    function(movableElement, corner, opt_margin, opt_preferredSize) { };

// Input 72
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Client positioning class.
 *
*
*
 */

goog.provide('goog.positioning.AnchoredPosition');

goog.require('goog.math.Box');
goog.require('goog.positioning');
goog.require('goog.positioning.AbstractPosition');


/**
 * Encapsulates a popup position where the popup is anchored at a corner of
 * an element.
 *
 * When using AnchoredPosition, it is recommended that the popup element
 * specified in the Popup constructor or Popup.setElement be absolutely
 * positioned.
 *
 * @param {Element} anchorElement Element the movable element should be
 *     anchored against.
 * @param {goog.positioning.Corner} corner Corner of anchored element the
 *     movable element should be positioned at.
 * @constructor
 * @extends {goog.positioning.AbstractPosition}
 */
goog.positioning.AnchoredPosition = function(anchorElement, corner) {
  /**
   * Element the movable element should be anchored against.
   * @type {Element}
   */
  this.element = anchorElement;

  /**
   * Corner of anchored element the movable element should be positioned at.
   * @type {goog.positioning.Corner}
   */
  this.corner = corner;
};
goog.inherits(goog.positioning.AnchoredPosition,
              goog.positioning.AbstractPosition);


/**
 * Repositions the movable element.
 *
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box=} opt_margin A margin specifin pixels.
 */
goog.positioning.AnchoredPosition.prototype.reposition = function(
    movableElement, movableCorner, opt_margin) {
  goog.positioning.positionAtAnchor(this.element,
                                    this.corner,
                                    movableElement,
                                    movableCorner,
                                    undefined,
                                    opt_margin);
};

// Input 73
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Anchored viewport positioning class.
 *
*
 */

goog.provide('goog.positioning.AnchoredViewportPosition');

goog.require('goog.math.Box');
goog.require('goog.positioning');
goog.require('goog.positioning.AnchoredPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.positioning.Overflow');
goog.require('goog.positioning.OverflowStatus');


/**
 * Encapsulates a popup position where the popup is anchored at a corner of
 * an element. The corners are swapped if dictated by the viewport. For instance
 * if a popup is anchored with it's top left corner to the bottom left corner of
 * the anchor the popup is either displayed below the anchor (as specified) or
 * above it if there's not enough room to display it below.
 *
 * When using this positioning object it's recommended that the movable element
 * be absolutely positioned.
 *
 * @param {Element} anchorElement Element the movable element should be
 *     anchored against.
 * @param {goog.positioning.Corner} corner Corner of anchored element the
 *     movable element should be positioned at.
 * @param {boolean=} opt_adjust Whether the positioning should be adjusted until
 *    the element fits inside the viewport even if that means that the anchored
 *    corners are ignored.
 * @constructor
 * @extends {goog.positioning.AnchoredPosition}
 */
goog.positioning.AnchoredViewportPosition = function(anchorElement,
                                                     corner,
                                                     opt_adjust) {
  goog.positioning.AnchoredPosition.call(this, anchorElement, corner);

  /**
   * Whether the positioning should be adjusted until the element fits inside
   * the viewport even if that means that the anchored corners are ignored.
   * @type {boolean|undefined}
   * @private
   */
  this.adjust_ = opt_adjust;
};
goog.inherits(goog.positioning.AnchoredViewportPosition,
              goog.positioning.AnchoredPosition);


/**
 * Repositions the movable element.
 *
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box=} opt_margin A margin specified in pixels.
 * @param {goog.math.Size=} opt_preferredSize The preferred size of the
 *     movableElement.
 */
goog.positioning.AnchoredViewportPosition.prototype.reposition = function(
    movableElement, movableCorner, opt_margin, opt_preferredSize) {
  var status = goog.positioning.positionAtAnchor(this.element, this.corner,
      movableElement, movableCorner, null, opt_margin,
      goog.positioning.Overflow.FAIL_X | goog.positioning.Overflow.FAIL_Y,
      opt_preferredSize);

  // If the desired position is outside the viewport try mirroring the corners
  // horizontally or vertically.
  if (status & goog.positioning.OverflowStatus.FAILED) {
    var cornerFallback = this.corner;
    var movableCornerFallback = movableCorner;

    if (status & goog.positioning.OverflowStatus.FAILED_HORIZONTAL) {
      cornerFallback = goog.positioning.flipCornerHorizontal(cornerFallback);
      movableCornerFallback = goog.positioning.flipCornerHorizontal(
          movableCornerFallback);
    }

    if (status & goog.positioning.OverflowStatus.FAILED_VERTICAL) {
      cornerFallback = goog.positioning.flipCornerVertical(cornerFallback);
      movableCornerFallback = goog.positioning.flipCornerVertical(
          movableCornerFallback);
    }

    status = goog.positioning.positionAtAnchor(this.element, cornerFallback,
        movableElement, movableCornerFallback, null, opt_margin,
        goog.positioning.Overflow.FAIL_X | goog.positioning.Overflow.FAIL_Y,
        opt_preferredSize);

    if (status & goog.positioning.OverflowStatus.FAILED) {
      // If that also fails adjust the position until it fits.
      if (this.adjust_) {
        goog.positioning.positionAtAnchor(this.element, this.corner,
            movableElement, movableCorner, null, opt_margin,
            goog.positioning.Overflow.ADJUST_X |
            goog.positioning.Overflow.ADJUST_Y, opt_preferredSize);

      // Or display it anyway at the preferred position, if the adjust option
      // was not enabled.
      } else {
        goog.positioning.positionAtAnchor(this.element, this.corner,
            movableElement, movableCorner, null, opt_margin,
            goog.positioning.Overflow.IGNORE, opt_preferredSize);
      }
    }
  }
};


// Input 74
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Anchored viewport positioning class with both adjust and
 *     resize options for the popup.
 *
*
*
 */

goog.provide('goog.positioning.MenuAnchoredPosition');

goog.require('goog.math.Box');
goog.require('goog.math.Size');
goog.require('goog.positioning');
goog.require('goog.positioning.AnchoredViewportPosition');
goog.require('goog.positioning.Corner');
goog.require('goog.positioning.Overflow');


/**
 * Encapsulates a popup position where the popup is anchored at a corner of
 * an element.  The positioning behavior changes based on the values of
 * opt_adjust and opt_resize.
 *
 * When using this positioning object it's recommended that the movable element
 * be absolutely positioned.
 *
 * @param {Element} anchorElement Element the movable element should be
 *     anchored against.
 * @param {goog.positioning.Corner} corner Corner of anchored element the
 *     movable element should be positioned at.
 * @param {boolean=} opt_adjust Whether the positioning should be adjusted until
 *     the element fits inside the viewport even if that means that the anchored
 *     corners are ignored.
 * @param {boolean=} opt_resize Whether the positioning should be adjusted until
 *     the element fits inside the viewport on the X axis and its height is
 *     resized so if fits in the viewport. This take precedence over opt_adjust.
 * @constructor
 * @extends {goog.positioning.AnchoredViewportPosition}
 */
goog.positioning.MenuAnchoredPosition = function(anchorElement,
                                                 corner,
                                                 opt_adjust,
                                                 opt_resize) {
  goog.positioning.AnchoredViewportPosition.call(this, anchorElement, corner,
                                                 opt_adjust);
  /**
   * Whether the positioning should be adjusted until the element fits inside
   * the viewport even if that means that the anchored corners are ignored.
   * @type {boolean|undefined}
   * @private
   */
  this.resize_ = opt_resize;
};
goog.inherits(goog.positioning.MenuAnchoredPosition,
              goog.positioning.AnchoredViewportPosition);


/**
 * Repositions the movable element.
 *
 * @param {Element} movableElement Element to position.
 * @param {goog.positioning.Corner} movableCorner Corner of the movable element
 *     that should be positioned adjacent to the anchored element.
 * @param {goog.math.Box=} opt_margin A margin specifin pixels.
 * @param {goog.math.Size=} opt_preferredSize Preferred size of the
 *     moveableElement.
 */
goog.positioning.MenuAnchoredPosition.prototype.reposition =
    function(movableElement, movableCorner, opt_margin, opt_preferredSize) {

  if (this.resize_) {
    goog.positioning.positionAtAnchor(this.element, this.corner,
        movableElement, movableCorner, null, opt_margin,
        goog.positioning.Overflow.ADJUST_X |
        goog.positioning.Overflow.RESIZE_HEIGHT, opt_preferredSize);
  } else {
    goog.positioning.MenuAnchoredPosition.superClass_.reposition.call(
        this,
        movableElement,
        movableCorner,
        opt_margin,
        opt_preferredSize);
  }
};

// Input 75
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Renderer for {@link goog.ui.MenuButton}s and subclasses.
 *
*
 */

goog.provide('goog.ui.MenuButtonRenderer');

goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.ui.INLINE_BLOCK_CLASSNAME');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuRenderer');
goog.require('goog.userAgent');


/**
 * Renderer for {@link goog.ui.MenuButton}s.  This implementation overrides
 * {@link goog.ui.CustomButtonRenderer#createButton} to create a separate
 * caption and dropdown element.
 * @constructor
 * @extends {goog.ui.CustomButtonRenderer}
 */
goog.ui.MenuButtonRenderer = function() {
  goog.ui.CustomButtonRenderer.call(this);
};
goog.inherits(goog.ui.MenuButtonRenderer, goog.ui.CustomButtonRenderer);
goog.addSingletonGetter(goog.ui.MenuButtonRenderer);


/**
 * Default CSS class to be applied to the root element of components rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.MenuButtonRenderer.CSS_CLASS = goog.getCssName('goog-menu-button');


/**
 * A property to denote content elements that have been wrapped in an extra
 * div to work around FF2/RTL bugs.
 * @type {string}
 * @private
 */
goog.ui.MenuButtonRenderer.WRAPPER_PROP_ = '__goog_wrapper_div';


if (goog.userAgent.GECKO) {
  /**
   * Takes the menubutton's root element, and sets its content to the given
   * text caption or DOM structure. Because the DOM structure of this button is
   * conditional based on whether we need to work around FF2/RTL bugs, we
   * override the default implementation to take this into account.
   * @param {Element} element The control's root element.
   * @param {goog.ui.ControlContent} content Text caption or DOM
   *     structure to be set as the control's content.
   * @override
   */
  goog.ui.MenuButtonRenderer.prototype.setContent = function(element,
      content) {
    var caption =
        goog.ui.MenuButtonRenderer.superClass_.getContentElement.call(this,
            /** @type {Element} */ (element && element.firstChild));
    if (caption) {
      goog.dom.replaceNode(
          this.createCaption(content, goog.dom.getDomHelper(element)),
          caption);
    }
  };
} // end goog.userAgent.GECKO


/**
 * Takes the button's root element and returns the parent element of the
 * button's contents.  Overrides the superclass implementation by taking
 * the nested DIV structure of menu buttons into account.
 * @param {Element} element Root element of the button whose content element
 *     is to be returned.
 * @return {Element} The button's content element.
 */
goog.ui.MenuButtonRenderer.prototype.getContentElement = function(element) {
  var content =
      goog.ui.MenuButtonRenderer.superClass_.getContentElement.call(this,
          /** @type {Element} */ (element && element.firstChild));
  if (goog.userAgent.GECKO && content &&
      content[goog.ui.MenuButtonRenderer.WRAPPER_PROP_]) {
    content = /** @type {Element} */ (content.firstChild);
  }
  return content;
};


/**
 * Takes an element, decorates it with the menu button control, and returns
 * the element.  Overrides {@link goog.ui.CustomButtonRenderer#decorate} by
 * looking for a child element that can be decorated by a menu, and if it
 * finds one, decorates it and attaches it to the menu button.
 * @param {goog.ui.MenuButton} button Menu button to decorate the element.
 * @param {Element} element Element to decorate.
 * @return {Element} Decorated element.
 */
goog.ui.MenuButtonRenderer.prototype.decorate = function(button, element) {
  // TODO(user):  Add more robust support for subclasses of goog.ui.Menu.
  var menuElem = goog.dom.getElementsByTagNameAndClass(
      '*', goog.ui.MenuRenderer.CSS_CLASS, element)[0];
  if (menuElem) {
    // Move the menu element directly under the body (but hide it first to
    // prevent flicker; see bug 1089244).
    goog.style.showElement(menuElem, false);
    goog.dom.appendChild(goog.dom.getOwnerDocument(menuElem).body, menuElem);

    // Decorate the menu and attach it to the button.
    var menu = new goog.ui.Menu();
    menu.decorate(menuElem);
    button.setMenu(menu);
  }

  // Let the superclass do the rest.
  return goog.ui.MenuButtonRenderer.superClass_.decorate.call(this, button,
      element);
};


/**
 * Takes a text caption or existing DOM structure, and returns the content and
 * a dropdown arrow element wrapped in a pseudo-rounded-corner box.  Creates
 * the following DOM structure:
 *    <div class="goog-inline-block goog-menu-button-outer-box">
 *      <div class="goog-inline-block goog-menu-button-inner-box">
 *        <div class="goog-inline-block goog-menu-button-caption">
 *          Contents...
 *        </div>
 *        <div class="goog-inline-block goog-menu-button-dropdown">
 *          &nbsp;
 *        </div>
 *      </div>
 *    </div>
 * @param {goog.ui.ControlContent} content Text caption or DOM structure
 *     to wrap in a box.
 * @param {goog.dom.DomHelper} dom DOM helper, used for document interaction.
 * @return {Element} Pseudo-rounded-corner box containing the content.
 */
goog.ui.MenuButtonRenderer.prototype.createButton = function(content, dom) {
  return goog.ui.MenuButtonRenderer.superClass_.createButton.call(this,
      [this.createCaption(content, dom), this.createDropdown(dom)], dom);
};


/**
 * Takes a text caption or existing DOM structure, and returns it wrapped in
 * an appropriately-styled DIV.  Creates the following DOM structure:
 *    <div class="goog-inline-block goog-menu-button-caption">
 *      Contents...
 *    </div>
 * @param {goog.ui.ControlContent} content Text caption or DOM structure
 *     to wrap in a box.
 * @param {goog.dom.DomHelper} dom DOM helper, used for document interaction.
 * @return {Element} Caption element.
 */
goog.ui.MenuButtonRenderer.prototype.createCaption = function(content, dom) {
  return goog.ui.MenuButtonRenderer.wrapCaption(
      content, this.getCssClass(), dom);
};


/**
 * Takes a text caption or existing DOM structure, and returns it wrapped in
 * an appropriately-styled DIV.  Creates the following DOM structure:
 *    <div class="goog-inline-block goog-menu-button-caption">
 *      Contents...
 *    </div>
 * @param {goog.ui.ControlContent} content Text caption or DOM structure
 *     to wrap in a box.
 * @param {string} cssClass The CSS class for the renderer.
 * @param {goog.dom.DomHelper} dom DOM helper, used for document interaction.
 * @return {Element} Caption element.
 */
goog.ui.MenuButtonRenderer.wrapCaption = function(content, cssClass, dom) {
  return dom.createDom(
      'div',
      goog.ui.INLINE_BLOCK_CLASSNAME + ' ' +
          goog.getCssName(cssClass, 'caption'),
      content);
};


/**
 * Returns an appropriately-styled DIV containing a dropdown arrow element.
 * Creates the following DOM structure:
 *    <div class="goog-inline-block goog-menu-button-dropdown">
 *      &nbsp;
 *    </div>
 * @param {goog.dom.DomHelper} dom DOM helper, used for document interaction.
 * @return {Element} Dropdown element.
 */
goog.ui.MenuButtonRenderer.prototype.createDropdown = function(dom) {
  // 00A0 is &nbsp;
  return dom.createDom('div',
      goog.ui.INLINE_BLOCK_CLASSNAME + ' ' +
      goog.getCssName(this.getCssClass(), 'dropdown'), '\u00A0');
};


/**
 * Returns the CSS class to be applied to the root element of components
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.MenuButtonRenderer.prototype.getCssClass = function() {
  return goog.ui.MenuButtonRenderer.CSS_CLASS;
};

// Input 76
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A menu button control.
 *
*
 * @see ../demos/menubutton.html
 */

goog.provide('goog.ui.MenuButton');

goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('goog.dom.a11y');
goog.require('goog.dom.a11y.State');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.math.Box');
goog.require('goog.math.Rect');
goog.require('goog.positioning.Corner');
goog.require('goog.positioning.MenuAnchoredPosition');
goog.require('goog.style');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButtonRenderer');
goog.require('goog.ui.registry');


/**
 * A menu button control.  Extends {@link goog.ui.Button} by composing a button
 * with a dropdown arrow and a popup menu.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption (if any).
 * @param {goog.ui.Menu=} opt_menu Menu to render under the button when clicked.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Renderer used to render or
 *     decorate the menu button; defaults to {@link goog.ui.MenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Button}
 */
goog.ui.MenuButton = function(content, opt_menu, opt_renderer, opt_domHelper) {
  goog.ui.Button.call(this, content, opt_renderer ||
      goog.ui.MenuButtonRenderer.getInstance(), opt_domHelper);

  // Menu buttons support the OPENED state.
  this.setSupportedState(goog.ui.Component.State.OPENED, true);

  if (opt_menu) {
    this.setMenu(opt_menu);
  }
  this.timer_ = new goog.Timer(500);  // 0.5 sec
};
goog.inherits(goog.ui.MenuButton, goog.ui.Button);


/**
 * The menu.
 * @type {goog.ui.Menu|undefined}
 * @private
 */
goog.ui.MenuButton.prototype.menu_;


/**
 * Whether the popup menu should be aligned to the start or the end of the
 * button; defaults to true (align to start).
 * @type {boolean}
 * @private
 */
goog.ui.MenuButton.prototype.alignToStart_ = true;


/**
 * Whether the popup menu should scroll when it's to big to fit vertically
 * on the screen. Defaults to false, use the adjust logic to reposition the
 * menu on overflow rather then scroll.
 * @type {boolean}
 * @private
 */
goog.ui.MenuButton.prototype.scrollOnOverflow_ = false;


/**
 * Whether the attached popup menu is focusable or not (defaults to false).
 * Popup menus attached to menu buttons usually don't need to be focusable,
 * i.e. the button retains keyboard focus, and forwards key events to the
 * menu for processing.  However, menus like {@link goog.ui.FilteredMenu}
 * need to be focusable.
 * @type {boolean}
 * @private
 */
goog.ui.MenuButton.prototype.isFocusablePopupMenu_ = false;


/**
 * A Timer to correct menu position.
 * @type {goog.Timer}
 * @private
 */
goog.ui.MenuButton.prototype.timer_;


/**
 * The bounding rectangle of the button element.
 * @type {goog.math.Rect}
 * @private
 */
goog.ui.MenuButton.prototype.buttonRect_;


/**
 * The viewport rectangle.
 * @type {goog.math.Box}
 * @private
 */
goog.ui.MenuButton.prototype.viewportBox_;


/**
 * The original size.
 * @type {goog.math.Size|undefined}
 * @private
 */
goog.ui.MenuButton.prototype.originalSize_;


/**
 * Sets up event handlers specific to menu buttons.
 * @override
 */
goog.ui.MenuButton.prototype.enterDocument = function() {
  goog.ui.MenuButton.superClass_.enterDocument.call(this);
  if (this.menu_) {
    this.attachMenuEventListeners_(this.menu_, true);
  }
  goog.dom.a11y.setState(this.getElement(),
      goog.dom.a11y.State.HASPOPUP, 'true');
};


/**
 * Removes event handlers specific to menu buttons, and ensures that the
 * attached menu also exits the document.
 * @override
 */
goog.ui.MenuButton.prototype.exitDocument = function() {
  goog.ui.MenuButton.superClass_.exitDocument.call(this);
  if (this.menu_) {
    this.setOpen(false);
    this.menu_.exitDocument();
    this.attachMenuEventListeners_(this.menu_, false);

    var menuElement = this.menu_.getElement();
    if (menuElement) {
      goog.dom.removeNode(menuElement);
    }
  }
};


/** @inheritDoc */
goog.ui.MenuButton.prototype.disposeInternal = function() {
  goog.ui.MenuButton.superClass_.disposeInternal.call(this);
  if (this.menu_) {
    this.menu_.dispose();
    delete this.menu_;
  }
  this.timer_.dispose();
};


/**
 * Handles mousedown events.  Invokes the superclass implementation to dispatch
 * an ACTIVATE event and activate the button.  Also toggles the visibility of
 * the attached menu.
 * @param {goog.events.Event} e Mouse event to handle.
 * @override
 * @protected
 */
goog.ui.MenuButton.prototype.handleMouseDown = function(e) {
  goog.ui.MenuButton.superClass_.handleMouseDown.call(this, e);
  if (this.isActive()) {
    // The component was allowed to activate; toggle menu visibility.
    this.setOpen(!this.isOpen());
    if (this.menu_) {
      this.menu_.setMouseButtonPressed(this.isOpen());
    }
  }
};


/**
 * Handles mouseup events.  Invokes the superclass implementation to dispatch
 * an ACTION event and deactivate the button.
 * @param {goog.events.Event} e Mouse event to handle.
 * @override
 * @protected
 */
goog.ui.MenuButton.prototype.handleMouseUp = function(e) {
  goog.ui.MenuButton.superClass_.handleMouseUp.call(this, e);
  if (this.menu_ && !this.isActive()) {
    this.menu_.setMouseButtonPressed(false);
  }
};


/**
 * Performs the appropriate action when the menu button is activated by the
 * user.  Overrides the superclass implementation by not dispatching an {@code
 * ACTION} event, because menu buttons exist only to reveal menus, not to
 * perform actions themselves.  Calls {@link #setActive} to deactivate the
 * button.
 * @param {goog.events.Event} e Mouse or key event that triggered the action.
 * @return {boolean} Whether the action was allowed to proceed.
 * @override
 * @protected
 */
goog.ui.MenuButton.prototype.performActionInternal = function(e) {
  this.setActive(false);
  return true;
};


/**
 * Handles mousedown events over the document.  If the mousedown happens over
 * an element unrelated to the component, hides the menu.
 * TODO(user): Reconcile this with goog.ui.Popup (and handle frames/windows).
 * @param {goog.events.BrowserEvent} e Mouse event to handle.
 * @protected
 */
goog.ui.MenuButton.prototype.handleDocumentMouseDown = function(e) {
  if (this.menu_ &&
      this.menu_.isVisible() &&
      !this.containsElement(/** @type {Element} */ (e.target))) {
    // User clicked somewhere else in the document while the menu was visible;
    // dismiss menu.
    this.setOpen(false);
  }
};


/**
 * Returns true if the given element is to be considered part of the component,
 * even if it isn't a DOM descendant of the component's root element.
 * @param {Element} element Element to test (if any).
 * @return {boolean} Whether the element is considered part of the component.
 * @protected
 */
goog.ui.MenuButton.prototype.containsElement = function(element) {
  return element && goog.dom.contains(this.getElement(), element) ||
      this.menu_ && this.menu_.containsElement(element) || false;
};


/** @inheritDoc */
goog.ui.MenuButton.prototype.handleKeyEventInternal = function(e) {
  // Handle SPACE on keyup and all other keys on keypress.
  var eventType = e.keyCode == goog.events.KeyCodes.SPACE ?
      goog.events.EventType.KEYUP : goog.events.KeyHandler.EventType.KEY;
  if (e.type != eventType) {
    return false;
  }

  if (this.menu_ && this.menu_.isVisible()) {
    // Menu is open.
    var handledByMenu = this.menu_.handleKeyEvent(e);
    if (e.keyCode == goog.events.KeyCodes.ESC) {
      // Dismiss the menu.
      this.setOpen(false);
      return true;
    }
    return handledByMenu;
  }

  if (e.keyCode == goog.events.KeyCodes.DOWN ||
      e.keyCode == goog.events.KeyCodes.UP ||
      e.keyCode == goog.events.KeyCodes.SPACE) {
    // Menu is closed, and the user hit the down/up/space key; open menu.
    this.setOpen(true);
    return true;
  }

  // Key event wasn't handled by the component.
  return false;
};


/**
 * Handles {@code ACTION} events dispatched by an activated menu item.
 * @param {goog.events.Event} e Action event to handle.
 * @protected
 */
goog.ui.MenuButton.prototype.handleMenuAction = function(e) {
  // Close the menu on click.
  this.setOpen(false);
};


/**
 * Handles {@code BLUR} events dispatched by the popup menu by closing it.
 * Only registered if the menu is focusable.
 * @param {goog.events.Event} e Blur event dispatched by a focusable menu.
 */
goog.ui.MenuButton.prototype.handleMenuBlur = function(e) {
  // Close the menu when it reports that it lost focus, unless the button is
  // pressed (active).
  if (!this.isActive()) {
    this.setOpen(false);
  }
};


/**
 * Handles blur events dispatched by the button's key event target when it
 * loses keyboard focus by closing the popup menu (unless it is focusable).
 * Only registered if the button is focusable.
 * @param {goog.events.Event} e Blur event dispatched by the menu button.
 * @override
 * @protected
 */
goog.ui.MenuButton.prototype.handleBlur = function(e) {
  if (!this.isFocusablePopupMenu()) {
    this.setOpen(false);
  }
  goog.ui.MenuButton.superClass_.handleBlur.call(this, e);
};


/**
 * Returns the menu attached to the button.  If no menu is attached, creates a
 * new empty menu.
 * @return {goog.ui.Menu} Popup menu attached to the menu button.
 */
goog.ui.MenuButton.prototype.getMenu = function() {
  if (!this.menu_) {
    this.setMenu(new goog.ui.Menu(this.getDomHelper()));
  }
  return this.menu_ || null;
};


/**
 * Replaces the menu attached to the button with the argument, and returns the
 * previous menu (if any).
 * @param {goog.ui.Menu?} menu New menu to be attached to the menu button (null
 *     to remove the menu).
 * @return {goog.ui.Menu|undefined} Previous menu (undefined if none).
 */
goog.ui.MenuButton.prototype.setMenu = function(menu) {
  var oldMenu = this.menu_;

  // Do nothing unless the new menu is different from the current one.
  if (menu != oldMenu) {
    if (oldMenu) {
      this.setOpen(false);
      if (this.isInDocument()) {
        this.attachMenuEventListeners_(oldMenu, false);
      }
      delete this.menu_;
    }
    if (menu) {
      this.menu_ = menu;
      menu.setParent(this);
      menu.setVisible(false);
      menu.setAllowAutoFocus(this.isFocusablePopupMenu());
      if (this.isInDocument()) {
        this.attachMenuEventListeners_(menu, true);
      }
    }
  }

  return oldMenu;
};


/**
 * Adds a new menu item at the end of the menu.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator|goog.ui.Control} item Menu
 *     item to add to the menu.
 */
goog.ui.MenuButton.prototype.addItem = function(item) {
  this.getMenu().addChild(item, true);
};


/**
 * Adds a new menu item at the specific index in the menu.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to the
 *     menu.
 * @param {number} index Index at which to insert the menu item.
 */
goog.ui.MenuButton.prototype.addItemAt = function(item, index) {
  this.getMenu().addChildAt(item, index, true);
};


/**
 * Removes the item from the menu and disposes of it.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item The menu item to remove.
 */
goog.ui.MenuButton.prototype.removeItem = function(item) {
  var child = this.getMenu().removeChild(item, true);
  if (child) {
    child.dispose();
  }
};


/**
 * Removes the menu item at a given index in the menu and disposes of it.
 * @param {number} index Index of item.
 */
goog.ui.MenuButton.prototype.removeItemAt = function(index) {
  var child = this.getMenu().removeChildAt(index, true);
  if (child) {
    child.dispose();
  }
};


/**
 * Returns the menu item at a given index.
 * @param {number} index Index of menu item.
 * @return {goog.ui.MenuItem?} Menu item (null if not found).
 */
goog.ui.MenuButton.prototype.getItemAt = function(index) {
  return this.menu_ ?
      /** @type {goog.ui.MenuItem} */ (this.menu_.getChildAt(index)) : null;
};


/**
 * Returns the number of items in the menu (including separators).
 * @return {number} The number of items in the menu.
 */
goog.ui.MenuButton.prototype.getItemCount = function() {
  return this.menu_ ? this.menu_.getChildCount() : 0;
};


/**
 * Shows/hides the menu button based on the value of the argument.  Also hides
 * the popup menu if the button is being hidden.
 * @param {boolean} visible Whether to show or hide the button.
 * @param {boolean=} opt_force If true, doesn't check whether the component
 *     already has the requested visibility, and doesn't dispatch any events.
 * @return {boolean} Whether the visibility was changed.
 * @override
 */
goog.ui.MenuButton.prototype.setVisible = function(visible, opt_force) {
  var visibilityChanged = goog.ui.MenuButton.superClass_.setVisible.call(this,
      visible, opt_force);
  if (visibilityChanged && !this.isVisible()) {
    this.setOpen(false);
  }
  return visibilityChanged;
};


/**
 * Enables/disables the menu button based on the value of the argument, and
 * updates its CSS styling.  Also hides the popup menu if the button is being
 * disabled.
 * @param {boolean} enable Whether to enable or disable the button.
 * @override
 */
goog.ui.MenuButton.prototype.setEnabled = function(enable) {
  goog.ui.MenuButton.superClass_.setEnabled.call(this, enable);
  if (!this.isEnabled()) {
    this.setOpen(false);
  }
};


/**
 * @return {boolean} Whether the menu is aligned to the start of the button
 *     (left if the render direction is left-to-right, right if the render
 *     direction is right-to-left).
 */
goog.ui.MenuButton.prototype.isAlignMenuToStart = function() {
  return this.alignToStart_;
};


/**
 * Sets whether the menu is aligned to the start or the end of the button.
 * @param {boolean} alignToStart Whether the menu is to be aligned to the start
 *     of the button (left if the render direction is left-to-right, right if
 *     the render direction is right-to-left).
 */
goog.ui.MenuButton.prototype.setAlignMenuToStart = function(alignToStart) {
  this.alignToStart_ = alignToStart;
};


/**
 * Sets whether the menu should scroll when it's too big to fix vertically on
 * the screen.  The css of the menu element should have overflow set to auto.
 * Note: Adding or removing items while the menu is open will not work correctly
 * if scrollOnOverflow is on.
 * @param {boolean} scrollOnOverflow Whether the menu should scroll when too big
 *     to fit on the screen.  If false, adjust logic will be used to try and
 *     reposition the menu to fit.
 */
goog.ui.MenuButton.prototype.setScrollOnOverflow = function(scrollOnOverflow) {
  this.scrollOnOverflow_ = scrollOnOverflow;
};


/**
 * @return {boolean} Wether the menu will scroll when it's to big to fit
 *     vertically on the screen.
 */
goog.ui.MenuButton.prototype.isScrollOnOverflow = function() {
  return this.scrollOnOverflow_;
};


/**
 * @return {boolean} Whether the attached menu is focusable.
 */
goog.ui.MenuButton.prototype.isFocusablePopupMenu = function() {
  return this.isFocusablePopupMenu_;
};


/**
 * Sets whether the attached popup menu is focusable.  If the popup menu is
 * focusable, it may steal keyboard focus from the menu button, so the button
 * will not hide the menu on blur.
 * @param {boolean} focusable Whether the attached menu is focusable.
 */
goog.ui.MenuButton.prototype.setFocusablePopupMenu = function(focusable) {
  // TODO(user):  The menu itself should advertise whether it is focusable.
  this.isFocusablePopupMenu_ = focusable;
};


/**
 * Reveals the menu and hooks up menu-specific event handling.
 * @deprecated Use {@link #setOpen} instead.
 */
goog.ui.MenuButton.prototype.showMenu = function() {
  this.setOpen(true);
};


/**
 * Hides the menu and cleans up menu-specific event handling.
 * @deprecated Use {@link #setOpen} instead.
 */
goog.ui.MenuButton.prototype.hideMenu = function() {
  this.setOpen(false);
};


/**
 * Opens or closes the attached popup menu.
 * @param {boolean} open Whether to open or close the menu.
 * @override
 */
goog.ui.MenuButton.prototype.setOpen = function(open) {
  goog.ui.MenuButton.superClass_.setOpen.call(this, open);
  if (this.menu_ && this.hasState(goog.ui.Component.State.OPENED) == open) {
    if (open) {
      if (!this.menu_.isInDocument()) {
        // Lazily render the menu if needed.
        this.menu_.render();
      }
      this.viewportBox_ =
          goog.style.getVisibleRectForElement(this.getElement());
      this.buttonRect_ = goog.style.getBounds(this.getElement());
      this.positionMenu();
      this.menu_.setHighlightedIndex(-1);
    } else {
      this.setActive(false);
      this.menu_.setMouseButtonPressed(false);

      // Clear any sizes that might have been stored.
      if (goog.isDefAndNotNull(this.originalSize_)) {
        this.originalSize_ = undefined;
        var elem = this.menu_.getElement();
        if (elem) {
          goog.style.setSize(elem, '', '');
        }
      }
    }
    this.menu_.setVisible(open);
    this.attachPopupListeners_(open);
  }
};


/**
 * Positions the menu under the button.  May be called directly in cases when
 * the menu size is known to change.
 */
goog.ui.MenuButton.prototype.positionMenu = function() {
  if (!this.menu_.isInDocument()) {
    return;
  }

  var anchorCorner = this.isAlignMenuToStart() ?
      goog.positioning.Corner.BOTTOM_START : goog.positioning.Corner.BOTTOM_END;
  var position = new goog.positioning.MenuAnchoredPosition(this.getElement(),
      anchorCorner, /* opt_adjust */ !this.scrollOnOverflow_,
      /* opt_resize */ this.scrollOnOverflow_);

  var elem = this.menu_.getElement();
  if (!this.menu_.isVisible()) {
    elem.style.visibility = 'hidden';
    goog.style.showElement(elem, true);
  }

  if (!this.originalSize_ && this.scrollOnOverflow_) {
    this.originalSize_ = goog.style.getSize(elem);
  }
  var popupCorner = this.isAlignMenuToStart() ?
      goog.positioning.Corner.TOP_START : goog.positioning.Corner.TOP_END;
  position.reposition(elem, popupCorner, null, this.originalSize_);

  if (!this.menu_.isVisible()) {
    goog.style.showElement(elem, false);
    elem.style.visibility = 'visible';
  }
};


/**
 * Periodically repositions the menu while it is visible.
 *
 * @param {goog.events.Event} e An event object.
 * @private
 */
goog.ui.MenuButton.prototype.onTick_ = function(e) {
  // Call positionMenu() only if the button position or size was
  // changed, or if the window's viewport was changed.
  var currentButtonRect = goog.style.getBounds(this.getElement());
  var currentViewport = goog.style.getVisibleRectForElement(this.getElement());
  if (!goog.math.Rect.equals(this.buttonRect_, currentButtonRect) ||
      !goog.math.Box.equals(this.viewportBox_, currentViewport)) {
    this.buttonRect_ = currentButtonRect;
    this.viewportBox_ = currentViewport;
    this.positionMenu();
  }
};


/**
 * Attaches or detaches menu event listeners to/from the given menu.
 * Called each time a menu is attached to or detached from the button.
 * @param {goog.ui.Menu} menu Menu on which to listen for events.
 * @param {boolean} attach Whether to attach or detach event listeners.
 * @private
 */
goog.ui.MenuButton.prototype.attachMenuEventListeners_ = function(menu,
    attach) {
  var handler = this.getHandler();
  var method = attach ? handler.listen : handler.unlisten;

  // Handle events dispatched by menu items.
  method.call(handler, menu, goog.ui.Component.EventType.ACTION,
      this.handleMenuAction);
  method.call(handler, menu, goog.ui.Component.EventType.HIGHLIGHT,
      this.handleHighlightItem);
  method.call(handler, menu, goog.ui.Component.EventType.UNHIGHLIGHT,
      this.handleUnHighlightItem);
};


/**
 * Handles {@code HIGHLIGHT} events dispatched by the attached menu.
 * @param {goog.events.Event} e Highlight event to handle.
 */
goog.ui.MenuButton.prototype.handleHighlightItem = function(e) {
  goog.dom.a11y.setState(this.getElement(),
      goog.dom.a11y.State.ACTIVEDESCENDANT, e.target.getElement().id);
};


/**
 * Handles UNHIGHLIGHT events dispatched by the associated menu.
 * @param {goog.events.Event} e Unhighlight event to handle.
 */
goog.ui.MenuButton.prototype.handleUnHighlightItem = function(e) {
  if (!this.menu_.getHighlighted()) {
    goog.dom.a11y.setState(this.getElement(),
        goog.dom.a11y.State.ACTIVEDESCENDANT, '');
  }
};


/**
 * Attaches or detaches event listeners depending on whether the popup menu
 * is being shown or hidden.  Starts listening for document mousedown events
 * and for menu blur events when the menu is shown, and stops listening for
 * these events when it is hidden.  Called from {@link #setOpen}.
 * @param {boolean} attach Whether to attach or detach event listeners.
 * @private
 */
goog.ui.MenuButton.prototype.attachPopupListeners_ = function(attach) {
  var handler = this.getHandler();
  var method = attach ? handler.listen : handler.unlisten;

  // Listen for document mousedown events in the capture phase, because
  // the target may stop propagation of the event in the bubble phase.
  method.call(handler, this.getDomHelper().getDocument(),
      goog.events.EventType.MOUSEDOWN, this.handleDocumentMouseDown, true);

  // Only listen for blur events dispatched by the menu if it is focusable.
  if (this.isFocusablePopupMenu()) {
    method.call(handler, /** @type {goog.events.EventTarget} */ (this.menu_),
        goog.ui.Component.EventType.BLUR, this.handleMenuBlur);
  }

  method.call(handler, this.timer_, goog.Timer.TICK, this.onTick_);
  if (attach) {
    this.timer_.start();
  } else {
    this.timer_.stop();
  }
};


// Register a decorator factory function for goog.ui.MenuButtons.
goog.ui.registry.setDecoratorByClassName(goog.ui.MenuButtonRenderer.CSS_CLASS,
    function() {
      // MenuButton defaults to using MenuButtonRenderer.
      return new goog.ui.MenuButton(null);
    });

// Input 77
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar menu button renderer.
 *
*
 */

goog.provide('goog.ui.ToolbarMenuButtonRenderer');

goog.require('goog.ui.MenuButtonRenderer');


/**
 * Toolbar-specific renderer for {@link goog.ui.MenuButton}s, based on {@link
 * goog.ui.MenuButtonRenderer}.
 * @constructor
 * @extends {goog.ui.MenuButtonRenderer}
 */
goog.ui.ToolbarMenuButtonRenderer = function() {
  goog.ui.MenuButtonRenderer.call(this);
};
goog.inherits(goog.ui.ToolbarMenuButtonRenderer, goog.ui.MenuButtonRenderer);
goog.addSingletonGetter(goog.ui.ToolbarMenuButtonRenderer);


/**
 * Default CSS class to be applied to the root element of menu buttons rendered
 * by this renderer.
 * @type {string}
 */
goog.ui.ToolbarMenuButtonRenderer.CSS_CLASS =
    goog.getCssName('goog-toolbar-menu-button');


/**
 * Returns the CSS class to be applied to the root element of menu buttons
 * rendered using this renderer.
 * @return {string} Renderer-specific CSS class.
 */
goog.ui.ToolbarMenuButtonRenderer.prototype.getCssClass = function() {
  return goog.ui.ToolbarMenuButtonRenderer.CSS_CLASS;
};

// Input 78
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar menu button control.
 *
*
*
 */

goog.provide('goog.ui.ToolbarMenuButton');

goog.require('goog.ui.ControlContent');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.ToolbarMenuButtonRenderer');
goog.require('goog.ui.registry');


/**
 * A menu button control for a toolbar.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.Menu=} opt_menu Menu to render under the button when clicked.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Optional renderer used to
 *     render or decorate the button; defaults to
 *     {@link goog.ui.ToolbarMenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.MenuButton}
 */
goog.ui.ToolbarMenuButton = function(
    content, opt_menu, opt_renderer, opt_domHelper) {
  goog.ui.MenuButton.call(this, content, opt_menu, opt_renderer ||
      goog.ui.ToolbarMenuButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.ToolbarMenuButton, goog.ui.MenuButton);


// Registers a decorator factory function for toolbar menu buttons.
goog.ui.registry.setDecoratorByClassName(
    goog.ui.ToolbarMenuButtonRenderer.CSS_CLASS,
    function() {
      return new goog.ui.ToolbarMenuButton(null);
    });

// Input 79
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A class that supports single selection from a dropdown menu,
 * with semantics similar to the native HTML <code>&lt;select&gt;</code>
 * element.
 *
*
 * @see ../demos/select.html
 */

goog.provide('goog.ui.Select');

goog.require('goog.events.EventType');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.SelectionModel');
goog.require('goog.ui.registry');


/**
 * A selection control.  Extends {@link goog.ui.MenuButton} by composing a
 * menu with a selection model, and automatically updating the button's caption
 * based on the current selection.
 *
 * @param {goog.ui.ControlContent} caption Default caption or existing DOM
 *     structure to display as the button's caption when nothing is selected.
 * @param {goog.ui.Menu=} opt_menu Menu containing selection options.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Renderer used to render or
 *     decorate the control; defaults to {@link goog.ui.MenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.MenuButton}
 */
goog.ui.Select = function(caption, opt_menu, opt_renderer, opt_domHelper) {
  goog.ui.MenuButton.call(this, caption, opt_menu, opt_renderer, opt_domHelper);
  this.setDefaultCaption(caption);
};
goog.inherits(goog.ui.Select, goog.ui.MenuButton);


/**
 * The selection model controlling the items in the menu.
 * @type {goog.ui.SelectionModel}
 * @private
 */
goog.ui.Select.prototype.selectionModel_ = null;


/**
 * Default caption to be shown when no option is selected.
 * @type {goog.ui.ControlContent}
 * @private
 */
goog.ui.Select.prototype.defaultCaption_ = null;


/**
 * Configures the component after its DOM has been rendered, and sets up event
 * handling.  Overrides {@link goog.ui.MenuButton#enterDocument}.
 */
goog.ui.Select.prototype.enterDocument = function() {
  goog.ui.Select.superClass_.enterDocument.call(this);
  this.updateCaption_();
};


/**
 * Decorates the given element with this control.  Overrides the superclass
 * implementation by initializing the default caption on the select button.
 * @param {Element} element Element to decorate.
 */
goog.ui.Select.prototype.decorateInternal = function(element) {
  goog.ui.Select.superClass_.decorateInternal.call(this, element);
  var caption = this.getCaption();
  if (caption) {
    // Initialize the default caption.
    this.setDefaultCaption(caption);
  } else {
    // There is no default caption; select the first option.
    this.setSelectedIndex(0);
  }
};


/** @inheritDoc */
goog.ui.Select.prototype.disposeInternal = function() {
  goog.ui.Select.superClass_.disposeInternal.call(this);

  if (this.selectionModel_) {
    this.selectionModel_.dispose();
    this.selectionModel_ = null;
  }

  this.defaultCaption_ = null;
};


/**
 * Handles {@link goog.ui.Component.EventType.ACTION} events dispatched by
 * the menu item clicked by the user.  Updates the selection model, calls
 * the superclass implementation to hide the menu, stops the propagation of
 * the event, and dispatches an ACTION event on behalf of the select control
 * itself.  Overrides {@link goog.ui.MenuButton#handleMenuAction}.
 * @param {goog.events.Event} e Action event to handle.
 */
goog.ui.Select.prototype.handleMenuAction = function(e) {
  this.setSelectedItem(/** @type {goog.ui.MenuItem} */ (e.target));
  goog.ui.Select.superClass_.handleMenuAction.call(this, e);
  e.stopPropagation();
  this.dispatchEvent(goog.ui.Component.EventType.ACTION);
};


/**
 * Handles {@link goog.events.EventType.SELECT} events raised by the
 * selection model when the selection changes.  Updates the contents of the
 * select button.
 * @param {goog.events.Event} e Selection event to handle.
 */
goog.ui.Select.prototype.handleSelectionChange = function(e) {
  var item = this.getSelectedItem();
  goog.ui.Select.superClass_.setValue.call(this, item && item.getValue());
  this.updateCaption_();
};


/**
 * Replaces the menu currently attached to the control (if any) with the given
 * argument, and updates the selection model.  Does nothing if the new menu is
 * the same as the old one.  Overrides {@link goog.ui.MenuButton#setMenu}.
 * @param {goog.ui.Menu} menu New menu to be attached to the menu button.
 * @return {goog.ui.Menu|undefined} Previous menu (undefined if none).
 */
goog.ui.Select.prototype.setMenu = function(menu) {
  // Call superclass implementation to replace the menu.
  var oldMenu = goog.ui.Select.superClass_.setMenu.call(this, menu);

  // Do nothing unless the new menu is different from the current one.
  if (menu != oldMenu) {
    // Clear the old selection model (if any).
    if (this.selectionModel_) {
      this.selectionModel_.clear();
    }

    // Initialize new selection model (unless the new menu is null).
    if (menu) {
      if (this.selectionModel_) {
        menu.forEachChild(function(child, index) {
          this.selectionModel_.addItem(child);
        }, this);
      } else {
        this.createSelectionModel_(menu);
      }
    }
  }

  return oldMenu;
};


/**
 * Returns the default caption to be shown when no option is selected.
 * @return {goog.ui.ControlContent} Default caption.
 */
goog.ui.Select.prototype.getDefaultCaption = function() {
  return this.defaultCaption_;
};


/**
 * Sets the default caption to the given string or DOM structure.
 * @param {goog.ui.ControlContent} caption Default caption to be shown
 *    when no option is selected.
 */
goog.ui.Select.prototype.setDefaultCaption = function(caption) {
  this.defaultCaption_ = caption;
  this.updateCaption_();
};


/**
 * Adds a new menu item at the end of the menu.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to the
 *     menu.
 */
goog.ui.Select.prototype.addItem = function(item) {
  goog.ui.Select.superClass_.addItem.call(this, item);

  if (this.selectionModel_) {
    this.selectionModel_.addItem(item);
  } else {
    this.createSelectionModel_(this.getMenu());
  }
};


/**
 * Adds a new menu item at a specific index in the menu.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to the
 *     menu.
 * @param {number} index Index at which to insert the menu item.
 */
goog.ui.Select.prototype.addItemAt = function(item, index) {
  goog.ui.Select.superClass_.addItemAt.call(this, item, index);

  if (this.selectionModel_) {
    this.selectionModel_.addItemAt(item, index);
  } else {
    this.createSelectionModel_(this.getMenu());
  }
};


/**
 * Removes an item from the menu and disposes it.
 * @param {goog.ui.MenuItem} item The menu item to remove.
 */
goog.ui.Select.prototype.removeItem = function(item) {
  goog.ui.Select.superClass_.removeItem.call(this, item);
  if (this.selectionModel_) {
    this.selectionModel_.removeItem(item);
  }
};


/**
 * Removes a menu item at a given index in the menu and disposes it.
 * @param {number} index Index of item.
 */
goog.ui.Select.prototype.removeItemAt = function(index) {
  goog.ui.Select.superClass_.removeItemAt.call(this, index);
  if (this.selectionModel_) {
    this.selectionModel_.removeItemAt(index);
  }
};


/**
 * Selects the specified option (assumed to be in the select menu), and
 * deselects the previously selected option, if any.  A null argument clears
 * the selection.
 * @param {goog.ui.MenuItem} item Option to be selected (null to clear
 *     the selection).
 */
goog.ui.Select.prototype.setSelectedItem = function(item) {
  if (this.selectionModel_) {
    this.selectionModel_.setSelectedItem(item);
  }
};


/**
 * Selects the option at the specified index, or clears the selection if the
 * index is out of bounds.
 * @param {number} index Index of the option to be selected.
 */
goog.ui.Select.prototype.setSelectedIndex = function(index) {
  if (this.selectionModel_) {
    this.setSelectedItem(
      /** @type {goog.ui.MenuItem} */ (this.selectionModel_.getItemAt(index)));
  }
};


/**
 * Selects the first option found with an associated value equal to the
 * argument, or clears the selection if no such option is found.  A null
 * argument also clears the selection.  Overrides {@link
 * goog.ui.Button#setValue}.
 * @param {*} value Value of the option to be selected (null to clear
 *     the selection).
 */
goog.ui.Select.prototype.setValue = function(value) {
  if (goog.isDefAndNotNull(value) && this.selectionModel_) {
    for (var i = 0, item; item = this.selectionModel_.getItemAt(i); i++) {
      if (item && typeof item.getValue == 'function' &&
          item.getValue() == value) {
        this.setSelectedItem(/** @type {goog.ui.MenuItem} */ (item));
        return;
      }
    }
  }

  this.setSelectedItem(null);
};


/**
 * Returns the currently selected option.
 * @return {goog.ui.MenuItem} The currently selected option (null if none).
 */
goog.ui.Select.prototype.getSelectedItem = function() {
  return this.selectionModel_ ?
      /** @type {goog.ui.MenuItem} */ (this.selectionModel_.getSelectedItem()) :
      null;
};


/**
 * Returns the index of the currently selected option.
 * @return {number} 0-based index of the currently selected option (-1 if none).
 */
goog.ui.Select.prototype.getSelectedIndex = function() {
  return this.selectionModel_ ? this.selectionModel_.getSelectedIndex() : -1;
};


/**
 * @return {goog.ui.SelectionModel} The selection model.
 * @protected
 */
goog.ui.Select.prototype.getSelectionModel = function() {
  return this.selectionModel_;
};


/**
 * Creates a new selection model and sets up an event listener to handle
 * {@link goog.events.EventType.SELECT} events dispatched by it.
 * @param {goog.ui.Component=} opt_component If provided, will add the
 *     component's children as items to the selection model.
 * @private
 */
goog.ui.Select.prototype.createSelectionModel_ = function(opt_component) {
  this.selectionModel_ = new goog.ui.SelectionModel();
  if (opt_component) {
    opt_component.forEachChild(function(child, index) {
      this.selectionModel_.addItem(child);
    }, this);
  }
  this.getHandler().listen(this.selectionModel_, goog.events.EventType.SELECT,
      this.handleSelectionChange);
};


/**
 * Updates the caption to be shown in the select button.  If no option is
 * selected and a default caption is set, sets the caption to the default
 * caption; otherwise to the empty string.
 * @private
 */
goog.ui.Select.prototype.updateCaption_ = function() {
  var item = this.getSelectedItem();
  this.setContent(item ? item.getCaption() : this.defaultCaption_);
};


/**
 * Opens or closes the menu.  Overrides {@link goog.ui.MenuButton#setOpen} by
 * highlighting the currently selected option on open.
 * @param {boolean} open Whether to open or close the menu.
 */
goog.ui.Select.prototype.setOpen = function(open) {
  goog.ui.Select.superClass_.setOpen.call(this, open);

  if (this.isOpen()) {
    this.getMenu().setHighlightedIndex(this.getSelectedIndex());
  }
};


// Register a decorator factory function for goog.ui.Selects.
goog.ui.registry.setDecoratorByClassName(
    goog.getCssName('goog-select'), function() {
  // Select defaults to using MenuButtonRenderer, since it shares its L&F.
  return new goog.ui.Select(null);
});

// Input 80
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar select control.
 *
*
*
 */

goog.provide('goog.ui.ToolbarSelect');

goog.require('goog.ui.ControlContent');
goog.require('goog.ui.Select');
goog.require('goog.ui.ToolbarMenuButtonRenderer');
goog.require('goog.ui.registry');


/**
 * A select control for a toolbar.
 *
 * @param {goog.ui.ControlContent} caption Default caption or existing DOM
 *     structure to display as the button's caption when nothing is selected.
 * @param {goog.ui.Menu=} opt_menu Menu containing selection options.
 * @param {goog.ui.MenuButtonRenderer=} opt_renderer Renderer used to
 *     render or decorate the control; defaults to
 *     {@link goog.ui.ToolbarMenuButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Select}
 */
goog.ui.ToolbarSelect = function(
    caption, opt_menu, opt_renderer, opt_domHelper) {
  goog.ui.Select.call(this, caption, opt_menu, opt_renderer ||
      goog.ui.ToolbarMenuButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.ToolbarSelect, goog.ui.Select);


// Registers a decorator factory function for select controls used in toolbars.
goog.ui.registry.setDecoratorByClassName('goog-toolbar-select',
    function() {
      return new goog.ui.ToolbarSelect(null);
    });

// Input 81
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar separator control.
 *
*
*
 */

goog.provide('goog.ui.ToolbarSeparator');

goog.require('goog.ui.Separator');
goog.require('goog.ui.ToolbarSeparatorRenderer');
goog.require('goog.ui.registry');


/**
 * A separator control for a toolbar.
 *
 * @param {goog.ui.ToolbarSeparatorRenderer=} opt_renderer Renderer to render or
 *    decorate the separator; defaults to
 *     {@link goog.ui.ToolbarSeparatorRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper, used for
 *    document interaction.
 * @constructor
 * @extends {goog.ui.Separator}
 */
goog.ui.ToolbarSeparator = function(opt_renderer, opt_domHelper) {
  goog.ui.Separator.call(this, opt_renderer ||
      goog.ui.ToolbarSeparatorRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.ToolbarSeparator, goog.ui.Separator);


// Registers a decorator factory function for toolbar separators.
goog.ui.registry.setDecoratorByClassName(
    goog.ui.ToolbarSeparatorRenderer.CSS_CLASS,
    function() {
      return new goog.ui.ToolbarSeparator();
    });

// Input 82
// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toggle button control.  Extends {@link goog.ui.Button} by
 * providing checkbox-like semantics.
 *
*
 */

goog.provide('goog.ui.ToggleButton');

goog.require('goog.ui.Button');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.ControlContent');
goog.require('goog.ui.CustomButtonRenderer');
goog.require('goog.ui.registry');


/**
 * A toggle button, with checkbox-like semantics.  Rendered using
 * {@link goog.ui.CustomButtonRenderer} by default, though any
 * {@link goog.ui.ButtonRenderer} would work.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.ButtonRenderer=} opt_renderer Renderer used to render or
 *     decorate the button; defaults to {@link goog.ui.CustomButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.Button}
 */
goog.ui.ToggleButton = function(content, opt_renderer, opt_domHelper) {
  goog.ui.Button.call(this, content, opt_renderer ||
      goog.ui.CustomButtonRenderer.getInstance(), opt_domHelper);
  this.setSupportedState(goog.ui.Component.State.CHECKED, true);
};
goog.inherits(goog.ui.ToggleButton, goog.ui.Button);


// Register a decorator factory function for goog.ui.ToggleButtons.
goog.ui.registry.setDecoratorByClassName(
  goog.getCssName('goog-toggle-button'), function() {
  // ToggleButton defaults to using CustomButtonRenderer.
  return new goog.ui.ToggleButton(null);
});

// Input 83
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A toolbar toggle button control.
 *
*
*
 */

goog.provide('goog.ui.ToolbarToggleButton');

goog.require('goog.ui.ControlContent');
goog.require('goog.ui.ToggleButton');
goog.require('goog.ui.ToolbarButtonRenderer');
goog.require('goog.ui.registry');



/**
 * A toggle button control for a toolbar.
 *
 * @param {goog.ui.ControlContent} content Text caption or existing DOM
 *     structure to display as the button's caption.
 * @param {goog.ui.ToolbarButtonRenderer=} opt_renderer Optional renderer used
 *     to render or decorate the button; defaults to
 *     {@link goog.ui.ToolbarButtonRenderer}.
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM hepler, used for
 *     document interaction.
 * @constructor
 * @extends {goog.ui.ToggleButton}
 */
goog.ui.ToolbarToggleButton = function(content, opt_renderer, opt_domHelper) {
  goog.ui.ToggleButton.call(this, content, opt_renderer ||
      goog.ui.ToolbarButtonRenderer.getInstance(), opt_domHelper);
};
goog.inherits(goog.ui.ToolbarToggleButton, goog.ui.ToggleButton);


// Registers a decorator factory function for toggle buttons in toolbars.
goog.ui.registry.setDecoratorByClassName(
    goog.getCssName('goog-toolbar-toggle-button'), function() {
      return new goog.ui.ToolbarToggleButton(null);
    });

// Input 84
goog.require('goog.array');
goog.require('goog.debug.DivConsole');
goog.require('goog.debug.Logger');
goog.require('goog.debug.LogManager');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Component.State');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Option');
goog.require('goog.ui.SelectionModel');
goog.require('goog.ui.Separator');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarRenderer');
goog.require('goog.ui.ToolbarButton');
goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.ToolbarSelect');
goog.require('goog.ui.ToolbarSeparator');
goog.require('goog.ui.ToolbarToggleButton');


