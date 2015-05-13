'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/user');
var Tweet = require('../lib/tweet');

var async = require('async');
var moment = require('moment');
var util = require('util');

router.get('/:name', function(req, res, next) {
  var me = res.locals.user;
  var name = req.params.name;

  var isMe = false;
  if (me && me.name === name) {
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

      async.parallel({
        followerIds: async.apply(User.getFollowers, id),
        followingIds: async.apply(User.getFollowings, id)
      }, function(err, results) {
        if (err) {
          return next(err);
        }

        var followerIds = results.followerIds;
        var followingIds = results.followingIds;

        // Check if the user is followed by the user who is currently logged in.
        var isFollowing = false;
        if (me && followerIds.indexOf(me.id) > -1) {
          isFollowing = true;
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

          res.render('users', {
            title: util.format('%s (@%s)', user.fullname, user.name),
            user: user,
            tweets: formattedTweets,
            tweets_count: tweets.length,
            followers_count: followerIds.length,
            followings_count: followingIds.length,
            is_me: isMe,
            is_following: isFollowing
          });
        });
      });
    });
  });
});

module.exports = router;