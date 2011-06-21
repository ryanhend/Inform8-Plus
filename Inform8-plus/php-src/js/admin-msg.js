/* Copyright 2011 - 88 Creative Pty Ltd. 
 * Copyright of this program is the property of 88 Creative, 
 * without whose written permission reproduction in
 * whole or in part is prohibited. All rights reserved.
 * http://www.inform8.com
 * http://www.88creative.com.au
 */
/**
 * JACK Message Feedback functions
 */

/**
 * Feedback
 */
function displayTempMessage(message, autoHide) {
  $("#jack-feedback").jackfeedback('clear');
  $("#jack-feedback").displayMessage(message, autoHide, false);
}

/**
 * Displays (for a short time) and indexes the message
 * 
 */
function displayMessage(message) {
  $("#jack-feedback").jackfeedback('clear');
  $("#jack-feedback").displayMessage(message, true, true);
}

/**
 * Clears currently showing message
 */
function clearMessage() {
  $("#jack-feedback").jackfeedback('clear');
}
