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
 * Tweet model.
 *
 * @param {Object} obj - Tweet
 * @class
 */
function Tweet(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

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
      tweet.update(fn);
    });
  }
};

Tweet.prototype.update = function(fn) {
  var tweet = this;
  client.hmset('tweet:' + tweet.id, tweet, function(err) {
    if (err) {
      return fn(err);
    }
    var json = tweet.serialize();
    client.lpush('tweets', json, function(err) {
      if (err) {
        return fn(err);
      }
      fn(null, tweet);
    });
  });
};

/**
 * Delete tweet.
 *
 * @param  {Function} fn
 */
Tweet.prototype.delete = function(fn) {
  var tweet = this;
  client.del('tweet:' + tweet.id, function(err) {
    if (err) {
      return fn(err);
    }
    var json = tweet.serialize();
    client.lrem('tweets', 1, json, fn);
  });
};

/**
 * Serialize tweet. First serialize child user object, then serialize parenet
 * object.
 *
 * @return {String} Serialized object
 */
Tweet.prototype.serialize = function() {
  // Stringify nested user object
  this.user = JSON.stringify(this.user);
  return JSON.stringify(this);
};

/**
 * Retrieve the specified tweets. The offsets from and to are zero-based
 * indexes, with 0 being the first element of the list (the head of the list),
 * 1 being the next element and so on.
 *
 * @param  {Integer} from
 * @param  {Integer} to
 * @param  {Function} fn
 * @public
 */
Tweet.getRange = function(from, to, fn) {
  client.lrange('tweets', from, to, function(err, elems) {
    if (err) {
      return fn(err);
    }
    var tweets = elems.map(Tweet.deserialize);
    fn(null, tweets);
  });
};

Tweet.get = function(id, fn) {
  client.hgetall('tweet:' + id, function(err, tweet) {
    if (err) {
      return fn(err);
    }
    console.log(tweet);
    fn(null, Tweet.deserialize(tweet));
  });
};

Tweet.deserialize = function(json) {
  var tweet;
  try {
    tweet = JSON.parse(json);
  } catch (err) {
    console.log('Unable to parse tweet JSON: ' + json);
  }
  try {
    tweet.user = JSON.parse(tweet.user);
  } catch (err) {
    console.log('Unable to parse tweet\'s user JSON: ' + tweet.user);
  }
  return tweet;
};

/**
 * Get the list's cardinality (the number of elements)
 *
 * @param  {Function} fn
 * @public
 */
Tweet.count = function(fn) {
  client.llen('tweets', fn);
};

/**
 * Retrieve all tweets.
 *
 * @param  {Function} fn - Callback function
 * @private
 */
Tweet.list = function(fn) {
  Tweet.getRange(0, -1, fn);
};

/**
 * Apply the given filter to the list of tweets and return filtered result.
 *
 * @param  {Function} filter - Function to be applied as a filter
 * @param  {Function} fn
 * @public
 */
Tweet.filter = function(filter, fn) {
  Tweet.list(function(err, tweets) {
    if (err) {
      return fn(err);
    }
    fn(null, tweets.filter(filter));
  });
};

module.exports = Tweet;