'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');
var Entry = require('../lib/entry');

router.get('/', function(req, res, next) {
  if (!res.locals.user) {
    console.log('Cannot retrieve users info');
    return res.redirect('/');
  }

  Entry.getRange(0, -1, function(err, entries) {
    if (err) {
      return next(err);
    }
    var filteredEntries = entries.filter(function(entry) {
      return entry.username === res.locals.user.name;
    });
    if (req.remoteUser) {
      return res.json(filteredEntries);
    }
    res.render('users', {
      title: 'Users',
      entries: filteredEntries,
      count: filteredEntries.length
    });
  });
});

module.exports = router;