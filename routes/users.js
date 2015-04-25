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

  Tweet.getRange(0, -1, function(err, tweets) {
    if (err) {
      return next(err);
    }
    var filteredTweets = tweets.filter(function(tweet) {
      return tweet.username === res.locals.user.name;
    });
    if (req.remoteUser) {
      return res.json(filteredTweets);
    }
    res.render('users', {
      title: 'Users',
      tweets: filteredTweets,
      count: filteredTweets.length
    });
  });
});

module.exports = router;