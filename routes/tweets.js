'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');

var validate = require('../lib/middleware/validate');
var page = require('../lib/middleware/page');

var Tweet = require('../lib/model/tweet');
var User = require('../lib/model/user');

var stats = require('../lib/helper/stats');
var format = require('../lib/helper/format');

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

router.get('/', page(Tweet.countHomeTimeline, 5), function(req, res, next) {
  if (!res.locals.loginUser) {
    return res.redirect('/login');
  }

  var loginUser = res.locals.loginUser;
  var page = req.page;

  async.parallel({
    stats: function(fn) {
      stats(loginUser.id, fn);
    },
    tweets: function(fn) {
      Tweet.getHomeTimeline(loginUser.id, function(err, tweets) {
        if (err) {
          return fn(err);
        }
        async.map(extractUserIds(tweets), User.get, function(err, users) {
          if (err) {
            return fn(err);
          }
          var userIndex = createUserIndex(users);
          var formattedTweets = tweets
            .map(function addUserInfo(tweet) {
              tweet.user = userIndex[tweet.user_id];
              return tweet;
            })
            .map(format.relativeTime('created_at'));
          return fn(null, formattedTweets);
        });
      });
    },
    suggestions: async.apply(User.getSuggestions, loginUser.id)
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.remoteUser) {
      return res.json(results.tweets);
    }

    res.render('tweets', {
      title: 'Twitter',
      user: loginUser,
      stats: results.stats,
      tweets: results.tweets,
      suggestions: results.suggestions
    });
  });
});

router.post('/',
  validate.required('tweet[text]'),
  validate.lengthLessThanOrEqualTo('tweet[text]', 140),
  function(req, res, next) {
    var loginUser = res.locals.loginUser;
    if (!loginUser) {
      return res.redirect('login');
    }

    var data = req.body.tweet;

    var date = new Date();

    var tweet = new Tweet({
      text: data.text,
      created_at: date.getTime(),
      user_id: loginUser.id
    });

    tweet.save(function(err, tweet) {
      if (err) {
        return next(err);
      }

      User.listFollowerIds(loginUser.id, function(err, followerIds) {
        if (err) {
          return next(err);
        }
        async.each(followerIds, function(followerId, fn) {
          Tweet.addToHomeTimeline(tweet.id, followerId, date.getTime(), fn);
        }, function(err) {
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
  }
);

router.post('/:id', function(req, res, next) {
  var loginUser = res.locals.loginUser;
  if (!loginUser) {
    return res.redirect('/login');
  }

  if (req.body._method !== 'delete') {
    console.log('Unsupported HTTP method: ' + req.body._method);
    return res.redirect('/login');
  }

  var tweetId = req.params.id;

  Tweet.removeFromGlobalTimeline(tweetId, function(err) {
    if (err) {
      return next(err);
    }

    Tweet.removeFromUserTimeline(tweetId, loginUser.id, function(err) {
      if (err) {
        return next(err);
      }

      Tweet.removeFromHomeTimeline(tweetId, loginUser.id, function(err) {
        if (err) {
          return next(err);
        }

        User.listFollowerIds(loginUser.id, function(err, followerIds) {
          if (err) {
            return next(err);
          }

          async.each(followerIds, function(followerId, fn) {
            Tweet.removeFromHomeTimeline(tweetId, followerId, fn);
          }, function(err) {
            if (err) {
              return next(err);
            }

            Tweet.delete(tweetId, function(err) {
              if (err) {
                return next(err);
              }

              res.redirect('/');
            });
          });
        });
      });
    });
  });
});

module.exports = router;