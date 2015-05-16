'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');

router.get('/', function(req, res) {
  req.flash();
  res.render('login', { title: 'Login' });
});

router.post('/', function(req, res, next) {
  var data = req.body.user;
  User.authenticate(data.name, data.pass, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', 'Sorry! invalid credentials.');
      return res.redirect('back');
    }
    req.session.uid = user.id;
    res.redirect('/');
  });
});

module.exports = router;