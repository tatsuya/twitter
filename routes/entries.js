var express = require('express');
var router = express.Router();

var validate = require('../lib/middleware/validate');

var Entry = require('../lib/entry');

router.get('/', function(req, res, next) {
  Entry.getRange(0, -1, function(err, entries) {
    if (err) {
      return next(err);
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
      res.redirect('/');
    });
  }
);

module.exports = router;