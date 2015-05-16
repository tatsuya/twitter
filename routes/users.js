'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');
var Tweet = require('../lib/model/tweet');

var util = require('util');
var async = require('async');
var moment = require('moment');

/**
 * Express middleware to check if given param name is same as the user name who
 * is currently logged in. If the name is same, then set res.locals.isMe to
 * true.
 */
function isMe() {
  return function(req, res, next) {
    res.locals.isMe = false;
    var me = res.locals.loginUser;
    if (me && me.name === req.params.name) {
       res.locals.isMe = true;
    }
    next();
  };
}

function formatTweets(tweets) {
  return tweets.map(function timeCreatedAtFromNow(tweet) {
    // Pass true to get the value without the suffix.
    //
    // Examples:
    //   moment([2007, 0, 29]).fromNow();     // 4 years ago
    //   moment([2007, 0, 29]).fromNow(true); // 4 years
    tweet.created_at = moment(tweet.created_at).fromNow(true);
    return tweet;
  });
}

router.get('/:name', isMe(), function(req, res, next) {
  var loginUser = res.locals.loginUser;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      followerIds: function(fn) {
        User.getFollowerIds(user.id, fn);
      },
      followingIds: function(fn) {
        User.getFollowingIds(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!loginUser) {
          return fn(null, false);
        }
        User.isFollowing(user.id, loginUser.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followerIds = results.followerIds;
      var followingIds = results.followingIds;
      var isFollowing = results.isFollowing;

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
        }

        res.render('users', {
          title: util.format('%s (@%s)', user.fullname, user.name),
          user: user,
          tweets: formatTweets(tweets),
          tweetsCount: tweets.length,
          followersCount: followerIds.length,
          followingsCount: followingIds.length,
          isFollowing: isFollowing
        });
      });
    });
  });
});

router.get('/:name/followers', isMe(), function(req, res, next) {
  var loginUser = res.locals.loginUser;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      followers: function(fn) {
        User.getFollowers(user.id, fn);
      },
      followingIds: function(fn) {
        User.getFollowingIds(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!loginUser) {
          return fn(null, false);
        }
        User.isFollowing(user.id, loginUser.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followers = results.followers;
      var followingIds = results.followingIds;
      var isFollowing = results.isFollowing;

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
        }

        res.render('followers', {
          title: util.format('People following %s', user.fullname),
          view: 'followers',
          user: user,
          tweets: formatTweets(tweets),
          tweetsCount: tweets.length,
          followers: followers,
          followersCount: followers.length,
          followingsCount: followingIds.length,
          isFollowing: isFollowing
        });
      });
    });
  });
});

router.get('/:name/followings', isMe(), function(req, res, next) {
  var loginUser = res.locals.loginUser;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      followerIds: function(fn) {
        User.getFollowerIds(user.id, fn);
      },
      followings: function(fn) {
        User.getFollowings(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!loginUser) {
          return fn(null, false);
        }
        User.isFollowing(user.id, loginUser.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followerIds = results.followerIds;
      var followings = results.followings;
      var isFollowing = results.isFollowing;

      Tweet.filter(function filterByUsername(tweet) {
        if (!tweet.user) {
          return false;
        }
        return tweet.user.id === user.id;
      }, function(err, tweets) {
        if (err) {
          return next(err);
        }

        res.render('followings', {
          title: util.format('People followed by %s', user.fullname),
          view: 'followings',
          user: user,
          followersCount: followerIds.length,
          followings: followings,
          followingsCount: followings.length,
          isFollowing: isFollowing,
          tweets: formatTweets(tweets),
          tweetsCount: tweets.length
        });
      });
    });
  });
});

module.exports = router;