'use strict';

var url = require('url');
var redis = require('redis');
var client;
if (process.env.REDISTOGO_URL) {
  var rtg = url.parse(process.env.REDISTOGO_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  client = redis.createClient();
}

function Tweet(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

Tweet.prototype.save = function(fn) {
  var json = JSON.stringify(this);
  client.lpush('entries', json, fn);
};

/**
 * Retrieve the specified tweets. The offsets from and to are zero-based
 * indexes, with 0 being the first element of the list (the head of the list),
 * 1 being the next element and so on.
 *
 * @param  {Integer} from
 * @param  {Integer} to
 * @param  {Function} fn
 */
Tweet.getRange = function(from, to, fn) {
  client.lrange('entries', from, to, function(err, items) {
    if (err) {
      return fn(err);
    }
    var tweets = [];
    items.forEach(function(item) {
      tweets.push(JSON.parse(item));
    });
    fn(null, tweets);
  });
};

/**
 * Get the list's cardinality (the number of elements)
 *
 * @param  {Function} fn
 * @public
 */
Tweet.count = function(fn) {
  client.llen('entries', fn);
};

module.exports = Tweet;
