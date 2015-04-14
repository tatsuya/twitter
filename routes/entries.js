'use strict';

var express = require('express');
var router = express.Router();

var validate = require('../lib/middleware/validate');
var page = require('../lib/middleware/page');

var Entry = require('../lib/entry');

router.get('/', page(Entry.count, 5), function(req, res, next) {
  var page = req.page;
  Entry.getRange(page.from, page.to, function(err, entries) {
    if (err) {
      return next(err);
    }
    if (req.remoteUser) {
      return res.json(entries);
    }
    res.render('entries', {
      title: 'Entries',
      entries: entries
    });
  });
});

router.post('/',
  validate.required('entry[title]'),
  validate.lengthAbove('entry[title]', 4),
  function(req, res, next) {
    var data = req.body.entry;

    var entry = new Entry({
      username: res.locals.user.name,
      title: data.title,
      body: data.body
    });

    entry.save(function(err) {
      if (err) {
        return next(err);
      }
      if (req.remoteUser) {
        res.json({ message: 'Entry added.' });
      } else {
        res.redirect('/');
      }
    });
  }
);

module.exports = router;