'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');

router.post('/:name', function(req, res) {
  if (!res.locals.user) {
    return res.redirect('/login');
  }

  var me = res.locals.user;
  var name = req.params.name;

  if (req.body._method === 'delete') {
    console.log(req.body._method);
  }

  User.getId(name, function(err, id) {
    if (err) {
      return next(err);
    }
    User.follow(id, me.id, function(err) {
      if (err) {
        return next(err);
      }
      res.redirect('back');
    });
  });
});

module.exports = router;