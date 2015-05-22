'use strict';

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
        return fn(null, tweet);
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
    Tweet.addToGlobalTimeline(tweet.id, tweet.created_at, fn);
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
 * @param  {String}   id - User ID
 * @param  {Function} fn - Callback gets two arguments `(err, tweet)` where
 * tweet is a Tweet object.
 * @public
 */
Tweet.get = function(id, fn) {
  client.hgetall('tweet:' + id, function(err, tweet) {
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
 * @param  {String} id - Tweet ID
 * @param  {Function} fn - Callback function that is invoked with a possible
 * error argument.
 */
Tweet.delete = function(id, fn) {
  client.del('tweet:' + id, fn);
};

// TODO: docs
Tweet.addToGlobalTimeline = function(id, time, fn) {
  client.zadd('global_timeline', time, id, fn);
};

// TODO: docs
Tweet.getGlobalTimeline = function(fn) {
  client.zrevrange('global_timeline', 0, -1, fn);
};

// TODO: docs
Tweet.removeFromGlobalTimeline = function(id, fn) {
  client.zrem('global_timeline', id, fn);
};

module.exports = Tweet;