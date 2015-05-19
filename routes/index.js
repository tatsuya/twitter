'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  if (res.locals.loginUser) {
    return res.redirect('/tweets');
  }
  req.flash();
  res.render('index', {
    title: 'Welcome to Twitter - Login or Sign up'
  });
});

module.exports = router;
