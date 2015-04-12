function parseField(field) {
  return field
    .split(/\[|\]/)
    .filter(function(s) {
      return s;
    });
}

function getField(req, field) {
  var val = req.body;
  field.forEach(function(prop) {
    val = val[prop];
  });
  return val;
}

exports.required = function required(field) {
  field = parseField(field);
  return function(req, res, next) {
    if (getField(req, field)) {
      return next();
    }
    req.flash('error', field.join(' ') + ' is required');
    res.redirect('back');
  }
};
