'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');

var validate = require('../lib/middleware/validate');
var page = require('../lib/middleware/page');

var Tweet = require('../lib/tweet');

router.get('/', page(Tweet.count, 5), function(req, res, next) {
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
    res.render('tweets', {
      title: 'Tweets',
      tweets: tweets,
      count: count
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

    var tweet = new Tweet({
      text: data.text,
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

module.exports = router;