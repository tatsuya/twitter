'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');

var Tweet = require('../lib/model/tweet');

var stats = require('../lib/helper/stats');

router.get('/', function(req, res, next) {
  if (!req.loginUser) {
    req.flash();
    return res.render('index', {
      title: 'Welcome to Twitter - Login or Sign up'
    });
  }

  var user = req.loginUser;

  async.parallel({
    stats: function(fn) {
      stats(user.id, fn);
    },
    tweets: function(fn) {
      Tweet.getHomeTimeline(user.id, fn);
    }
  }, function(err, results) {
    if (err) {
      return next(err);
    }
    console.log(results);
    res.redirect('/tweets');
  });
});

module.exports = router;
