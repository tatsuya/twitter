'use strict';

var User = require('../model/user');

module.exports = function(tweet, fn) {
  User.get(tweet.user_id, function(err, user) {
    if (err) {
      return fn(err);
    }
    tweet.user = user;
    return fn(null, tweet);
  });
};