'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  if (!res.locals.loginUser) {
    return res.redirect('/login');
  }
  req.flash();
  res.render('post', { title: 'Tweet' });
});

module.exports = router;