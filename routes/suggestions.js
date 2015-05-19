'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');

router.get('/', function(req, res, next) {
  if (!res.locals.loginUser) {
    return res.redirect('/login');
  }
  User.getSuggestions(res.locals.loginUser.id, function(err, suggestions) {
    if (err) {
      return next(err);
    }
    res.render('suggestions', {
      title: 'Suggestions',
      suggestions: suggestions
    });
  });
});

module.exports = router;
