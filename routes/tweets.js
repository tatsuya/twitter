'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');
var moment = require('moment');
var _ = require('underscore');

var validate = require('../lib/middleware/validate');
var page = require('../lib/middleware/page');

var Tweet = require('../lib/model/tweet');
var User = require('../lib/model/user');

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

router.get('/', page(Tweet.count, 5), function(req, res, next) {
  if (!res.locals.loginUser) {
    return res.render('index');
  }
  req.flash();

  var loginUser = res.locals.loginUser;
  var page = req.page;

  User.getTimeline(loginUser.id, function(err, tweetIds) {
    if (err) {
      return fn(err);
    }

    async.map(tweetIds, Tweet.get, function(err, tweets) {
      if (err) {
        return next(err);
      }

      async.map(extractUserIds(tweets), User.get, function(err, users) {
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

        if (req.remoteUser) {
          return res.json(tweets);
        }

        async.parallel({
          followerIds: async.apply(User.getFollowerIds, loginUser.id),
          followingIds: async.apply(User.getFollowingIds, loginUser.id),
          suggestions: async.apply(User.getSuggestions, loginUser.id)
        }, function(err, results) {
          if (err) {
            return next(err);
          }

          var followerIds = results.followerIds;
          var followingIds = results.followingIds;

          res.render('tweets', {
            title: 'Twitter',
            user: res.locals.loginUser,
            suggestions: results.suggestions,
            tweets: formattedTweets,
            tweetsCount: formattedTweets.length,
            followersCount: followerIds.length,
            followingsCount: followingIds.length
          });
        });
      });
    });
  });
});

router.post('/',
  validate.required('tweet[text]'),
  validate.lengthLessThanOrEqualTo('tweet[text]', 140),
  function(req, res, next) {
    if (!res.locals.loginUser) {
      return res.redirect('login');
    }

    var loginUser = res.locals.loginUser;
    var data = req.body.tweet;

    var date = new Date();

    var tweet = new Tweet({
      text: data.text,
      created_at: date.toISOString(),
      user_id: loginUser.id
    });

    tweet.save(function(err, tweet) {
      if (err) {
        return next(err);
      }

      User.addTweet(loginUser.id, tweet.id, date, function(err) {
        if (err) {
          return next(err);
        }

        User.getFollowerIds(loginUser.id, function(err, followerIds) {
          if (err) {
            return next(err);
          }

          followerIds.push(loginUser.id);
          async.map(followerIds, function(followerId, fn) {
            User.addTweetToTimeline(followerId, tweet.id, date, fn);
          }, function(err, results) {
            if (err) {
              return next(err);
            }

            if (req.remoteUser) {
              res.json({ message: 'Tweet added.' });
            } else {
              res.redirect('/');
            }
          });
        });
      });
    });
  }
);

router.post('/:id', function(req, res, next) {
  if (!res.locals.loginUser) {
    return res.redirect('/login');
  }

  if (req.body._method !== 'delete') {
    console.log('Unsupported HTTP method: ' + req.body._method);
    return res.redirect('/login');
  }
  var id = parseInt(req.params.id, 10);

  Tweet.filter(function filterById(tweet) {
    return tweet.id === id;
  }, function(err, tweets) {
    if (err) {
      return next(err);
    }

    async.each(tweets, function(obj, fn) {
      var tweet = new Tweet(obj);
      tweet.delete(fn);
    }, function(err) {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });
});

module.exports = router;