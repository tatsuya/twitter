'use strict';

var moment = require('moment');

/**
 * Convert unix time to relative time on a specified field.
 *
 * @param  {String} field
 * @return {Function}
 */
exports.relativeTime = function(field) {
  return function(obj) {
    // String 'x' represents unix ms timestamp format.
    var time = moment(obj[field], 'x');
    // Make it relative
    obj[field] = time.fromNow(true);
    return obj;
  };
};