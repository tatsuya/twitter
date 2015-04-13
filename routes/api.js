var express = require('express');
var router = express.Router();

var page = require('../lib/middleware/page');
var Entry = require('../lib/entry');

router.get('/entries/:page?', page(Entry.count, 5), function(req, res, next) {
  var page = req.page;
  Entry.getRange(page.from, page.to, function(err, entries) {
    if (err) {
      return next(err);
    }
    res.json(entries);
  });
});

module.exports = router;
