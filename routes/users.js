'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');
var Entry = require('../lib/entry');

router.get('/', function(req, res, next) {
  Entry.getRange(0, -1, function(err, entries) {
    if (err) {
      return next(err);
    }
    if (req.remoteUser) {
      return res.json(entries);
    }
    res.render('users', {
      title: 'Users',
      entries: entries
    });
  });
});

module.exports = router;