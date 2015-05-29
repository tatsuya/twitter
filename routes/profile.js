'use strict';

var express = require('express');
var router = express.Router();

var util = require('util');
var async = require('async');

var Tweet = require('../lib/model/tweet');
var User = require('../lib/model/user');

var stats = require('../lib/helper/stats');
var paginate = require('../lib/helper/paginate');
var join = require('../lib/helper/join');
var timestamp = require('../lib/helper/timestamp');

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

router.get('/:name(@[a-zA-Z_0-9]+)', function(req, res, next) {
  var loginUser = req.loginUser;
  var name = req.params.name.split('@')[1];

  res.locals.me = loginUser && loginUser.name === name;

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
        Tweet.countUserTimeline(user.id, function(err, count) {
          if (err) {
            return next(err);
          }

          var page = res.locals.page = paginate(req.query.page, 50, count);

          Tweet.getUserTimeline(user.id, page.from, page.to, function(err, tweets) {
            if (err) {
              return fn(err);
            }
            async.map(tweets, join, function(err, tweets) {
              if (err) {
                return fn(err);
              }
              return fn(null, tweets.map(timestamp.toRelativeTime('created_at')));
            });
          });
        });
      }
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      res.render('profile', {
        title: util.format('%s (@%s)', user.fullname, user.name),
        user: results.user,
        stats: results.stats,
        tweets: results.tweets
      });
    });
  });
});

router.get('/:name(@[a-zA-Z_0-9]+)/followers', function(req, res, next) {
  var loginUser = req.loginUser;
  var name = req.params.name.split('@')[1];

  res.locals.me = loginUser && loginUser.name === name;

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

router.get('/:name(@[a-zA-Z_0-9]+)/followings', function(req, res, next) {
  var loginUser = req.loginUser;
  var name = req.params.name.split('@')[1];

  res.locals.me = loginUser && loginUser.name === name;

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
