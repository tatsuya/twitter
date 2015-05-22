'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');
var Tweet = require('../lib/model/tweet');

router.get('/', function(req, res, next) {
  if (!req.loginUser) {
    req.flash();
    return res.render('index', {
      title: 'Welcome to Twitter - Login or Sign up'
    });
  }

  var user = req.loginUser;

  async.parallel({
    tweets: function(fn) {
      Tweet.getHomeTimeline(user.id, fn);
    },
    tweetsCount: function(fn) {
      Tweet.countUserTimeline(user.id, fn);
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
