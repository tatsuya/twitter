'use strict';

var util = require('util');

// Code extracted from joyent/node
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

// Code extracted from joyent/node
function extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) {
    return origin;
  }

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

var utils = extend({}, util);

utils.extend = extend;

module.exports = utils;
