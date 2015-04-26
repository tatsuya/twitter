'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  if (!res.locals.user) {
    return res.redirect('/login');
  }
  req.flash();
  res.render('post', { title: 'Tweet' });
});

module.exports = router;