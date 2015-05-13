'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');
var Tweet = require('../lib/tweet');

var moment = require('moment');
var util = require('util');

router.get('/:name', function(req, res, next) {
  var isLoggedIn = false;
  if (res.locals.user) {
    isLoggedIn = true;
  }

  var name = req.params.name;

  var isMe = false;
  if (isLoggedIn && name === res.locals.user.name) {
    isMe = true;
  }

  User.getId(name, function(err, id) {
    if (err) {
      return next(err);
    }
    User.get(id, function(err, user) {
      if (err) {
        return next(err);
      }

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
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

        var title = util.format('%s (@%s)', user.fullname, user.name);

        res.render('users', {
          title: title,
          user: user,
          tweets: formattedTweets,
          count: tweets.length,
          isLoggedIn: isLoggedIn,
          isMe: isMe
        });
      });
    });
  });
});

module.exports = router;