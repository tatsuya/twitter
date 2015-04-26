'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');
var Tweet = require('../lib/tweet');

router.get('/', function(req, res, next) {
  if (!res.locals.user) {
    console.log('Cannot retrieve users info');
    return res.redirect('/');
  }

  Tweet.filter(function filterByUsername(tweet) {
    return tweet.username === res.locals.user.name;
  }, function(err, tweets) {
    if (err) {
      return next(err);
    }
    if (req.remoteUser) {
      return res.json(tweets);
    }
    res.render('users', {
      title: 'Users',
      tweets: tweets,
      count: tweets.length
    });
  });
});

module.exports = router;