'use strict';

var async = require('async');
var url = require('url');
var redis = require('redis');
var client;
if (process.env.REDISTOGO_URL) {
  var rtg = url.parse(process.env.REDISTOGO_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]);
} else {
  client = redis.createClient();
}

/**
 * Tweet model. Each tweet entity should have the following fields:
 *
 * - id: unique tweet ID
 * - text: tweet body
 * - created_at: time created
 * - user_id: user ID
 *
 * @param {Object} obj - Tweet object
 * @class
 */
function Tweet(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

/**
 * Create or update the tweet.
 *
 * @param {Function} fn - Callback gets two arguments `(err, tweet)` where
 * tweet is a Tweet object created or updated.
 * @public
 */
Tweet.prototype.save = function(fn) {
  var tweet = this;
  if (tweet.id) {
    // Tweet already exists
    tweet.update(fn);
  } else {
    // Generate unique tweet ID
    client.incr('tweet:ids', function(err, id) {
      if (err) {
        return fn(err);
      }
      tweet.id = id;
      tweet.update(function(err) {
        if (err) {
          return fn(err);
        }
        fn(null, tweet);
      });
    });
  }
};

/**
 * Store tweet object to redis database.
 *
 * @param  {Function} fn - Callback
 * @private
 */
Tweet.prototype.update = function(fn) {
  var tweet = this;
  Tweet.set(tweet, function(err) {
    if (err) {
      return fn(err);
    }
    Tweet.addToUserTimeline(tweet.id, tweet.user_id, tweet.created_at, function(err) {
      if (err) {
        return fn(err);
      }
      Tweet.addToHomeTimeline(tweet.id, tweet.user_id, tweet.created_at, function(err) {
        if (err) {
          return fn(err);
        }
        Tweet.addToGlobalTimeline(tweet.id, tweet.created_at, fn);
      });
    });
  });
};

/**
 * Serialize object. If .toJSON() exists on an object, it will be used by
 * JSON.strinfigy calls to get the JSON format.
 *
 * @return {String} json
 */
Tweet.prototype.toJSON = function() {
  return {
    id: this.id,
    text: this.text,
    created_at: this.created_at,
    user_id: this.user_id
  };
};

/**
 * Fetch plain object hash and convert it to an Tweet object.
 *
 * @param  {String}   tweetId - Tweet ID
 * @param  {Function} fn - Callback gets two arguments `(err, tweet)` where
 * tweet is a Tweet object.
 * @public
 */
Tweet.get = function(tweetId, fn) {
  client.hgetall('tweet:' + tweetId, function(err, tweet) {
    if (err) {
      return fn(err);
    }
    fn(null, new Tweet(tweet));
  });
};

/**
 * Save tweet object to redis hash store.
 *
 * @param {Tweet} tweet - Tweet object.
 * @param {Function} fn - Callback function that is invoked with a possible
 * error argument.
 */
Tweet.set = function(tweet, fn) {
  client.hmset('tweet:' + tweet.id, tweet, fn);
};

/**
 * Delete a tweet.
 *
 * @param  {String} tweetId - Tweet ID
 * @param  {Function} fn - Callback function that is invoked with a possible
 * error argument.
 */
Tweet.delete = function(tweetId, fn) {
  client.del('tweet:' + tweetId, fn);
};

// TODO: docs
Tweet.addToGlobalTimeline = function(tweetId, time, fn) {
  client.zadd('global_timeline', time, tweetId, fn);
};

/**
 * Retrieve a collection of the most recent tweets posted by everybody.
 *
 * @param {Function} fn - Callback gets two arguments `(err, tweets)` where
 * `tweets` is a list of tweets.
 */
Tweet.getGlobalTimeline = function(fn) {
  client.zrevrange('global_timeline', 0, -1, function(err, tweetIds) {
    if (err) {
      return fn(err);
    }
    async.map(tweetIds, Tweet.get, fn);
  });
};

/**
 * Get the cardinality of the tweets in global timeline
 *
 * @param {Function} fn - Callback gets two arguments `(err, cardinality)`
 * where `cardinality` is the number of tweets in global timeline
 */
Tweet.countGlobalTimeline = function(fn) {
  client.zcard('global_timeline', fn);
};

// TODO: docs
Tweet.removeFromGlobalTimeline = function(tweetId, fn) {
  client.zrem('global_timeline', tweetId, fn);
};

// TODO: docs
Tweet.addToUserTimeline = function(tweetId, userId, time, fn) {
  client.zadd('user:' + userId + ':user_timeline', time, tweetId, fn);
};

/**
 * Retrieve a collection of the most recent tweets posted by the user.
 *
 * @param {String} userId - User ID
 * @param {Function} fn - Callback gets two arguments `(err, tweets)` where
 * `tweets` is a list of tweets.
 */
Tweet.getUserTimeline = function(userId, fn) {
  client.zrevrange('user:' + userId + ':user_timeline', 0, -1, function(err, tweetIds) {
    if (err) {
      return fn(err);
    }
    async.map(tweetIds, Tweet.get, fn);
  });
};

/**
 * Get the cardinality of the tweets in user's timeline
 *
 * @param {String} userId - User ID
 * @param {Function} fn - Callback gets two arguments `(err, cardinality)`
 * where `cardinality` is the number of tweets in user's timeline
 */
Tweet.countUserTimeline = function(userId, fn) {
  client.zcard('user:' + userId + ':user_timeline', fn);
};

// TODO: docs
Tweet.removeFromUserTimeline = function(tweetId, userId, fn) {
  client.zrem('user:' + userId + ':user_timeline', tweetId, fn);
};

// TODO: docs
Tweet.addToHomeTimeline = function(tweetId, userId, time, fn) {
  client.zadd('user:' + userId + ':home_timeline', time, tweetId, fn);
};

/**
 * Retrieve a collection of the most recent tweets posted by the authenticating
 * user and the users they follow.
 *
 * @param  {String} userId - User ID
 * @param  {Function} fn - Callback gets two arguments `(err, tweets)` where
 * `tweets` is a list of tweets.
 */
Tweet.getHomeTimeline = function(userId, fn) {
  client.zrevrange('user:' + userId + ':home_timeline', 0, -1, function(err, tweetIds) {
    if (err) {
      return fn(err);
    }
    async.map(tweetIds, Tweet.get, fn);
  });
};

/**
 * Get the cardinality of the tweets in user's home timeline
 *
 * @param {String} userId - User ID
 * @param {Function} fn - Callback gets two arguments `(err, cardinality)`
 * where `cardinality` is the number of tweets in user's home timeline
 */
Tweet.countHomeTimeline = function(userId, fn) {
  client.zcard('user:' + userId + ':home_timeline', fn);
};

// TODO: docs
Tweet.removeFromHomeTimeline = function(tweetId, userId, fn) {
  client.zrem('user:' + userId + ':home_timeline', tweetId, fn);
};

module.exports = Tweet;