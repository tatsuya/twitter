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

function lengthMoreThanOrEqualTo(field, len) {
  field = parseField(field);
  return function(req, res, next) {
    if (getField(req, field).length >= len) {
      return next();
    }
    req.flash('error', field.join(' ') + ' must be at least ' + len + ' characters');
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

function regexp(field, re, message) {
  field = parseField(field);
  return function(req, res, next) {
    if (re.test(getField(req, field))) {
      return next();
    }
    req.flash('error', field.join(' ') + ' ' + message);
    res.redirect('back');
  };
}

function username(field) {
  var re = /^[a-z0-9]+$/i;
  var message = 'can only contain alphanumeric characters (letters A-Z, numbers 0-9) or underscores';
  return regexp(field, re, message);
}

function password(field) {
  var re = /^[ -~]+$/;
  var message = 'can only contain ASCII chracters';
  return regexp(field, re, message);
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
 * Expose #lengthMoreThanOrEqualTo().
 * @public
 */
exports.lengthMoreThanOrEqualTo = lengthMoreThanOrEqualTo;

/**
 * Expose #lengthLessThanOrEqualTo().
 * @public
 */
exports.lengthLessThanOrEqualTo = lengthLessThanOrEqualTo;

/**
 * Expose #regexp().
 * @private
 */
exports.regexp = regexp;

/**
 * Expose #username().
 * @public
 */
exports.username = username;

/**
 * Expose #username().
 * @public
 */
exports.password = password;
