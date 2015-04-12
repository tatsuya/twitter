var express = require('express');
var router = express.Router();

var Entry = require('../lib/entry');

router.get('/', function(req, res) {
  res.render('post', { title: 'Post' });
});

router.post('/', function(req, res, next) {
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
});

module.exports = router;