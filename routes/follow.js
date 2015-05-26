'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');

var User = require('../lib/model/user');
var Tweet = require('../lib/model/tweet');

router.post('/:name', function(req, res, next) {
  var loginUser = req.loginUser;
  if (!loginUser) {
    return res.redirect('/login');
  }

  var name = req.params.name;
  User.getId(name, function(err, userId) {
    if (err) {
      return next(err);
    }

    if (req.body._method !== 'delete') {
      var date = new Date();
      var timestamp = date.getTime();
      User.follow(userId, loginUser.id, timestamp, function(err) {
        if (err) {
          return next(err);
        }

        Tweet.getUserTimeline(userId, 0, -1, function(err, tweets) {
          if (err) {
            return next(err);
          }

          async.each(tweets, function(tweet, fn) {
            Tweet.addToHomeTimeline(tweet.id, loginUser.id, tweet.created_at, fn);
          }, function(err) {
            if (err) {
              return next(err);
            }

            res.redirect('back');
          });
        });
      });
    } else {
      User.unfollow(userId, loginUser.id, function(err) {
        if (err) {
          return next(err);
        }

        Tweet.getUserTimeline(userId, 0, -1, function(err, tweets) {
          if (err) {
            return next(err);
          }

          async.each(tweets, function(tweet, fn) {
            Tweet.removeFromHomeTimeline(tweet.id, loginUser.id, fn);
          }, function(err) {
            if (err) {
              return next(err);
            }

            res.redirect('back');
          });
        });
      });
    }
  });
});

module.exports = router;