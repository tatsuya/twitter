'use strict';

/**
 * Parse obj[key] notation.
 *
 * @param  {String} field
 * @return {Array}
 */
function parseField(field) {
  return field
    .split(/\[|\]/)
    .filter(function(s) {
      return s;
    });
}

/**
 * Look up property based on parseField() results.
 *
 * @param  {Object} req - Express' req object
 * @param  {Array} field
 */
function getField(req, field) {
  var val = req.body;
  field.forEach(function(prop) {
    val = val[prop];
  });
  return val;
}

function required(field) {
  field = parseField(field);
  return function(req, res, next) {
    if (getField(req, field)) {
      return next();
    }
    req.flash('error', field.join(' ') + ' is required');
    res.redirect('back');
  };
}

function lengthAbove(field, len) {
  field = parseField(field);
  return function(req, res, next) {
    if (getField(req, field).length > len) {
      return next();
    }
    req.flash('error', field.join(' ') + ' must be more than ' + len + ' characters');
    res.redirect('back');
  };
}

function lengthLessThanOrEqualTo(field, len) {
  field = parseField(field);
  return function(req, res, next) {
    if (getField(req, field).length <= len) {
      return next();
    }
    req.flash('error', field.join(' ') + ' must be less than or equal to ' + len + ' characters');
    res.redirect('back');
  };
}

/**
 * Expose #parseField(). Visible for testing.
 * @private
 */
exports.parseField = parseField;

/**
 * Expose #getField(). Visible for testing.
 * @private
 */
exports.getField = getField;

/**
 * Expose #required().
 * @public
 */
exports.required = required;

/**
 * Expose #lengthAbove().
 * @public
 */
exports.lengthAbove = lengthAbove;

/**
 * Expose #lengthLessThanOrEqual().
 * @public
 */
exports.lengthLessThanOrEqualTo = lengthLessThanOrEqualTo;
