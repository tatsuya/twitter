'use strict';

var async = require('async');

var Tweet = require('../model/tweet');
var User = require('../model/user');

module.exports = function(userId, fn) {
  async.parallel({
    tweets: async.apply(Tweet.countUserTimeline, userId),
    followings: async.apply(User.countFollowings, userId),
    followers: async.apply(User.countFollowers, userId)
  }, fn);
};