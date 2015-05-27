'use strict';

var express = require('express');
var router = express.Router();

var async = require('async');

var Tweet = require('../lib/model/tweet');

var stats = require('../lib/helper/stats');
var paginate = require('../lib/helper/paginate');
var join = require('../lib/helper/join');
var format = require('../lib/helper/format');

router.get('/', function(req, res, next) {
  if (!req.loginUser) {
    req.flash();
    return res.render('index', {
      title: 'Welcome to Twitter - Login or Sign up'
    });
  }

  var user = req.loginUser;

  async.parallel({
    stats: function(fn) {
      stats(user.id, fn);
    },
    tweets: function(fn) {
      Tweet.countHomeTimeline(user.id, function(err, count) {
        if (err) {
          return fn(err);
        }
        var page = res.locals.page = paginate(req.query.page, 50, count);
        Tweet.getHomeTimeline(user.id, page.from, page.to, function(err, tweets) {
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
      });
    }
  }, function(err, results) {
    if (err) {
      return next(err);
    }
    console.log(results);
    res.redirect('/tweets');
  });
});

module.exports = router;
