'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');

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

  if (user.name !== data.name) {
    // If username is changed make sure new username is not already taken.
    User.getByName(data.name, function(err, existingUser) {
      if (err) {
        return next(err);
      }
      if (existingUser.id) {
        req.flash('error', 'Username already taken!');
        return res.redirect('back');
      }

      // Delete old ID index
      User.deleteId(user.name, function(err) {
        if (err) {
          return next(err);
        }

        user.name = data.name
        user.fullname = data.fullname;

        user.save(function(err) {
          if (err) {
            return next(err);
          }
          req.flash('info', 'Thanks, your settings have been saved.');
          res.redirect('back');
        });
      });
    });
  } else {
    // Otherwise, update user's full name.
    user.fullname = data.fullname;

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('info', 'Thanks, your settings have been saved.');
      res.redirect('back');
    });
  }
});

module.exports = router;
