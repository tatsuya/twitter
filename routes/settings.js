'use strict';

var express = require('express');
var router = express.Router();

var validate = require('../lib/middleware/validate');
var User = require('../lib/model/user');

router.get('/', function(req, res) {
  if (!res.locals.loginUser) {
    return res.redirect('/login');
  }
  req.flash();
  res.render('settings', {
    title: 'Settings',
    user: res.locals.loginUser
  });
});

router.post('/',
  // Validate username
  validate.required('user[name]'),
  validate.lengthLessThanOrEqualTo('user[name]', 15),
  validate.username('user[name]'),
  // Validate fullname
  validate.required('user[fullname]'),
  validate.lengthLessThanOrEqualTo('user[fullname]', 20),
  function(req, res, next) {
    var user = req.loginUser;
    var data = req.body.user;

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
  }
);

router.get('/deactivate', function(req, res) {
  if (!res.locals.loginUser) {
    return res.redirect('/login');
  }
  res.render('deactivate', {
    title: 'Settings',
    user: res.locals.loginUser
  });
});

router.post('/deactivate', function(req, res, next) {
  var user = req.loginUser;

  User.deleteId(user.name, function(err) {
    if (err) {
      return next(err);
    }
    User.delete(user.id, function(err) {
      if (err) {
        return next(err);
      }
      req.session.destroy(function(err) {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
});

module.exports = router;
