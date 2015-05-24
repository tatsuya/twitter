'use strict';

var express = require('express');
var router = express.Router();

var User = require('../lib/model/user');
var Tweet = require('../lib/model/tweet');

var stats = require('../lib/helper/stats');

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

/**
 * Returns a function to check if the `user` is followed by the `loginUser`.
 *
 * @param  {Object} loginUser - The user currently logged in.
 * @return {Function}
 */
function checkRelationship(loginUser) {
  return function(user, fn) {
    if (!loginUser || !loginUser.id) {
      return fn(null, user);
    }
    User.isFollowing(user.id, loginUser.id, function(err, isFollowing) {
      if (err) {
        return fn(err);
      }
      user.following = isFollowing;
      fn(null, user);
    });
  };
}

function extractUserIds(tweets) {
  var userIds = [];
  tweets.forEach(function(tweet) {
    var userId = tweet.user_id;
    if (userIds.indexOf(userId) < 0) {
      userIds.push(userId);
    }
  });
  return userIds;
}

function createUserIndex(users) {
  var index = {};
  users.forEach(function(user) {
    var userId = user.id;
    if (!index.hasOwnProperty(userId)) {
      index[userId] = user;
    }
  });
  return index;
}

router.get('/:name', isMe(), function(req, res, next) {
  var loginUser = res.locals.loginUser;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      stats: function(fn) {
        stats(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!loginUser) {
          return fn(null, false);
        }
        User.isFollowing(user.id, loginUser.id, fn);
      },
      tweets: function(fn) {
        Tweet.getUserTimeline(user.id, fn);
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var tweets = results.tweets;
      var userIds = extractUserIds(tweets);

      async.map(userIds, User.get, function(err, users) {
        if (err) {
          return next(err);
        }

        var userIndex = createUserIndex(users);

        var formattedTweets = tweets
          .map(function addUserInfo(tweet) {
            tweet.user = userIndex[tweet.user_id];
            return tweet;
          })
          .map(function timeCreatedAtFromNow(tweet) {
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
          stats: results.stats,
          isFollowing: results.isFollowing
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
      stats: function(fn) {
        stats(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!loginUser) {
          return fn(null, false);
        }
        User.isFollowing(user.id, loginUser.id, fn);
      },
      followers: function(fn) {
        User.listFollowers(user.id, function(err, users) {
          if (err) {
            return fn(err);
          }
          async.map(users, checkRelationship(loginUser), fn);
        });
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      res.render('followers', {
        title: util.format('People following %s', user.fullname),
        view: 'followers',
        user: user,
        followers: results.followers,
        stats: results.stats,
        isFollowing: results.isFollowing
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
      stats: function(fn) {
        stats(user.id, fn);
      },
      isFollowing: function(fn) {
        // Check if the user is followed by the user who is currently logged in.
        if (!loginUser) {
          return fn(null, false);
        }
        User.isFollowing(user.id, loginUser.id, fn);
      },
      followings: function(fn) {
        User.listFollowings(user.id, function(err, users) {
          if (err) {
            return fn(err);
          }
          async.map(users, checkRelationship(loginUser), fn);
        });
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      res.render('followings', {
        title: util.format('People followed by %s', user.fullname),
        view: 'followings',
        user: user,
        followings: results.followings,
        stats: results.stats,
        isFollowing: results.isFollowing
      });
    });
  });
});

module.exports = router;