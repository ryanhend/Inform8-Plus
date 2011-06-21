/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK Language functions
 */

function getLanguageEntry(entry) {
	if(entry in window.I8.langs[window.I8.user.lang]) {
		return window.I8.langs[window.I8.user.lang][entry];
	}
	return entry;
}