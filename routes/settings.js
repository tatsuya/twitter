'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  if (!res.locals.user) {
    return res.redirect('/login');
  }
  req.flash();
  res.render('settings', { title: 'Settings' });
});

router.post('/', function(req, res, next) {
  var user = req.user;
  var data = req.body.user;

  if (!data.name) {
    req.flash('error', 'Username can\'t be blank');
    return res.redirect('back');
  }
  if (!data.fullname) {
    req.flash('error', 'Full name can\'t be blank');
    return res.redirect('back');
  }

  user.name = data.name;
  user.fullname = data.fullname;

  user.save(function(err) {
    if (err) {
      return next(err);
    }
    req.flash('info', 'Thanks, your settings have been saved.');
    res.redirect('back');
  });
});

module.exports = router;