'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');
var moment = require('moment');

var validate = require('../lib/middleware/validate');
var page = require('../lib/middleware/page');

var Tweet = require('../lib/model/tweet');
var User = require('../lib/model/user');

router.get('/', page(Tweet.count, 5), function(req, res, next) {
  if (!res.locals.user) {
    return res.render('index');
  }
  var user = res.locals.user;
  var page = req.page;
  async.parallel({
    tweets: function(callback) {
      Tweet.getRange(page.from, page.to, callback);
    },
    count: Tweet.count
  }, function(err, results) {
    if (err) {
      return next(err);
    }
    var tweets = results.tweets;
    var count = results.count;

    if (req.remoteUser) {
      return res.json(tweets);
    }

    async.parallel({
      followerIds: async.apply(User.getFollowerIds, user.id),
      followingIds: async.apply(User.getFollowingIds, user.id)
    }, function(err, results) {
      if (err) {
        return next(err);
      }

      var followerIds = results.followerIds;
      var followingIds = results.followingIds;

      var formattedTweets = tweets.map(function timeCreatedAtFromNow(tweet) {
        // Pass true to get the value without the suffix.
        //
        // Examples:
        //   moment([2007, 0, 29]).fromNow();     // 4 years ago
        //   moment([2007, 0, 29]).fromNow(true); // 4 years
        tweet.created_at = moment(tweet.created_at).fromNow(true);
        return tweet;
      });

      res.render('tweets', {
        title: 'Twitter',
        tweets: formattedTweets,
        tweets_count: count,
        followers_count: followerIds.length,
        followings_count: followingIds.length
      });
    });
  });
});

router.post('/',
  validate.required('tweet[text]'),
  validate.lengthLessThanOrEqualTo('tweet[text]', 140),
  function(req, res, next) {
    if (!res.locals.user) {
      return next(new Error('Cannot retrieve user info'));
    }

    var user = res.locals.user;
    var data = req.body.tweet;

    var date = new Date();

    var tweet = new Tweet({
      text: data.text,
      created_at: date.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        fullname: user.fullname
      }
    });

    tweet.save(function(err) {
      if (err) {
        return next(err);
      }
      if (req.remoteUser) {
        res.json({ message: 'Tweet added.' });
      } else {
        res.redirect('/');
      }
    });
  }
);

router.post('/:id', function(req, res, next) {
  if (!res.locals.user) {
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