var express = require('express');
var router = express.Router();

var page = require('../lib/middleware/page');
var User = require('../lib/user');
var Entry = require('../lib/entry');

/**
 * Fetch the user by ID. If the user exists, the user data will be passed to
 * res.send() to be serialized. If the user doesn't exist, it responds with a
 * 404 Not Found code.
 */
router.get('/user/:id', function(req, res, next) {
  User.get(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user.id) {
      return res.send(404);
    }
    res.json(user);
  });
});

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
