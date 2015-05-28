'use strict';

var moment = require('moment');

/**
 * Create a timestamp.
 *
 * @return {Number} timestamp
 */
exports.create = function() {
  var date = new Date();
  return date.getTime();
};

/**
 * Returns a function to convert unix time to relative time on a specified
 * field.
 *
 * @param  {String} field - Object field name to convert timestamp on
 * @return {Function}
 */
exports.toRelativeTime = function(field) {
  return function(obj) {
    // String 'x' represents unix ms timestamp format.
    var time = moment(obj[field], 'x');
    // Make it relative
    obj[field] = time.fromNow(true);
    return obj;
  };
};