'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');

router.get('/', function(req, res, next) {
  var loginUser = req.loginUser;
  if (!loginUser) {
    return res.redirect('/login');
  }
  User.getSuggestions(loginUser.id, null, function(err, suggestions) {
    if (err) {
      return next(err);
    }
    res.render('suggestions', {
      title: 'Who to follow',
      suggestions: suggestions
    });
  });
});

module.exports = router;
