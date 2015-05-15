'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');

router.post('/:name', function(req, res, next) {
  if (!res.locals.user) {
    return res.redirect('/login');
  }

  var me = res.locals.user;
  var name = req.params.name;

  User.getId(name, function(err, id) {
    if (err) {
      return next(err);
    }

    if (req.body._method === 'delete') {
      User.unfollow(id, me.id, function(err) {
        if (err) {
          return next(err);
        }
        res.redirect('back');
      });
    } else {
      User.follow(id, me.id, function(err) {
        if (err) {
          return next(err);
        }
        res.redirect('back');
      });
    }
  });
});

module.exports = router;