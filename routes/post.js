'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');

var validate = require('../lib/middleware/validate');

var Tweet = require('../lib/model/tweet');
var User = require('../lib/model/user');

var timestamp = require('../lib/helper/timestamp');

router.get('/', function(req, res) {
  if (!req.loginUser) {
    return res.redirect('/login');
  }
  req.flash();
  res.render('post', { title: 'Tweet' });
});

router.post('/',
  validate.required('tweet[text]'),
  validate.lengthLessThanOrEqualTo('tweet[text]', 140),
  function(req, res, next) {
    var loginUser = req.loginUser;
    if (!loginUser) {
      return res.redirect('login');
    }

    var tweet = new Tweet({
      text: req.body.tweet.text,
      created_at: timestamp.create(),
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
          Tweet.addToHomeTimeline(tweet.id, followerId, tweet.created_at, fn);
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
  var loginUser = req.loginUser;
  if (!loginUser) {
    return res.redirect('/login');
  }

  if (req.body._method !== 'delete') {
    return res.redirect('/login');
  }

  var tweetId = req.params.id;

  async.parallel([
    function(fn) {
      Tweet.removeFromGlobalTimeline(tweetId, fn);
    },
    function(fn) {
      Tweet.removeFromUserTimeline(tweetId, loginUser.id, fn);
    },
    function(fn) {
      Tweet.removeFromHomeTimeline(tweetId, loginUser.id, fn);
    },
    function(fn) {
      User.listFollowerIds(loginUser.id, function(err, followerIds) {
        if (err) {
          return fn(err);
        }
        async.each(followerIds, function(followerId, fn2) {
          Tweet.removeFromHomeTimeline(tweetId, followerId, fn2);
        }, fn);
      });
    },
    function(fn) {
      Tweet.delete(tweetId, fn);
    }
  ], function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

module.exports = router;
