'use strict';

var express = require('express');
var router = express.Router();

var util = require('util');
var async = require('async');

var page = require('../lib/middleware/page');

var Tweet = require('../lib/model/tweet');
var User = require('../lib/model/user');

var stats = require('../lib/helper/stats');
var join = require('../lib/helper/join');
var format = require('../lib/helper/format');

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
 * Returns a function which checks if the given `user` is followed by the
 * `loginUser`.
 *
 * @param  {Object} loginUser - The user currently logged in.
 * @return {Function}
 */
function checkRelationship(loginUser) {
  return function(user, fn) {
    if (!loginUser || !loginUser.id) {
      return fn(null, user);
    }
    User.listFollowerIds(user.id, function(err, followerIds) {
      if (err) {
        return fn(err);
      }
      user.following = followerIds.indexOf(loginUser.id) > -1;
      return fn(null, user);
    });
  };
}

router.get('/:name', isMe(), function(req, res, next) {
  var loginUser = req.loginUser;
  var page = req.page;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      user: function(fn) {
        checkRelationship(loginUser)(user, fn);
      },
      stats: function(fn) {
        stats(user.id, fn);
      },
      tweets: function(fn) {
        Tweet.getUserTimeline(user.id, 0, -1, function(err, tweets) {
          if (err) {
            return fn(err);
          }
          async.map(tweets, join, function(err, tweets) {
            if (err) {
              return fn(err);
            }
            return fn(null, tweets.map(format.relativeTime('created_at')));
          });
        });
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      res.render('users', {
        title: util.format('%s (@%s)', user.fullname, user.name),
        user: results.user,
        stats: results.stats,
        tweets: results.tweets
      });
    });
  });
});

router.get('/:name/followers', isMe(), function(req, res, next) {
  var loginUser = req.loginUser;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }
    async.parallel({
      user: function(fn) {
        checkRelationship(loginUser)(user, fn);
      },
      stats: function(fn) {
        stats(user.id, fn);
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
        user: results.user,
        stats: results.stats,
        followers: results.followers
      });
    });
  });
});

router.get('/:name/followings', isMe(), function(req, res, next) {
  var loginUser = req.loginUser;
  var name = req.params.name;

  User.getByName(name, function(err, user) {
    if (err) {
      return next(err);
    }

    async.parallel({
      user: function(fn) {
        checkRelationship(loginUser)(user, fn);
      },
      stats: function(fn) {
        stats(user.id, fn);
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
        user: results.user,
        stats: results.stats,
        followings: results.followings
      });
    });
  });
});

module.exports = router;