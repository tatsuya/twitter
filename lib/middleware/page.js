'use strict';

module.exports = function(fn, perpage) {
  perpage = perpage || 10;
  return function(req, res, next) {
    var page = Math.max(
      // parseInt(req.params.page || '1', 10),
      parseInt(req.query.page || '1', 10),
      1
    ) - 1;

    // Invoke the function passed.
    fn(function(err, total) {
      if (err) {
        return next(err);
      }

      req.page = res.locals.page = {
        number: page, // Page number
        perpage: perpage, // Number of items per page
        from: page * perpage, // Current items from
        to: page * perpage + perpage - 1, // Current items to
        total: total, // Total number of items
        count: Math.ceil(total / perpage) // Total number of pages
      };

      next();
    });
  };
};