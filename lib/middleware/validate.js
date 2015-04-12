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
  }
};

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
