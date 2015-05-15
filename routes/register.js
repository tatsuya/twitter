'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');

router.get('/', function(req, res) {
  req.flash();
  res.render('register', { title: 'Register' });
});

router.post('/', function(req, res, next) {
  var data = req.body.user;
  User.getByName(data.name, function(err, user) {
    if (err) {
      return next(err);
    }

    if (user.id) {
      req.flash('error', 'Username already taken!');
      // A back redirection redirects the request back to the referer,
      // defaulting to / when the referer is missing.
      return res.redirect('back');
    }

    user = new User({
      name: data.name,
      pass: data.pass,
      fullname: data.fullname
    });

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.session.uid = user.id;
      res.redirect('/');
    });
  });
});

module.exports = router;