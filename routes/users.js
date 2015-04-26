'use strict';

var express = require('express');
var router = express.Router();

var moment = require('moment');

var Tweet = require('../lib/tweet');

router.get('/', function(req, res, next) {
  if (!res.locals.user) {
    console.log('Cannot retrieve users info');
    return res.redirect('/');
  }

  Tweet.filter(function filterByUsername(tweet) {
    if (!tweet.user) {
      return false;
    }
    return tweet.user.id === res.locals.user.id;
  }, function(err, tweets) {
    if (err) {
      return next(err);
    }
    if (req.remoteUser) {
      return res.json(tweets);
    }

    var formattedTweets = tweets.map(function timeCreatedAtFromNow(tweet) {
      // Pass true to get the value without the suffix.
      //
      // Examples:
      //   moment([2007, 0, 29]).fromNow();     // 4 years ago
      //   moment([2007, 0, 29]).fromNow(true); // 4 years
      tweet.created_at = moment(tweet.created_at).fromNow(true);
      return tweet;
    });

    res.render('users', {
      title: 'Users',
      tweets: formattedTweets,
      count: tweets.length
    });
  });
});

module.exports = router;