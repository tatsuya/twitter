'use strict';

var url = require('url');
var redis = require('redis');
var client;
if (process.env.REDISTOGO_URL) {
  var rtg = url.parse(process.env.REDISTOGO_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  client = redis.createClient();
}

function Entry(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

Entry.prototype.save = function(fn) {
  var json = JSON.stringify(this);
  client.lpush('entries', json, fn);
};

/**
 * Retrieve the specified entries. The offsets from and to are zero-based
 * indexes, with 0 being the first element of the list (the head of the list),
 * 1 being the next element and so on.
 *
 * @param  {Integer} from
 * @param  {Integer} to
 * @param  {Function} fn
 */
Entry.getRange = function(from, to, fn) {
  client.lrange('entries', from, to, function(err, items) {
    if (err) {
      return fn(err);
    }
    var entries = [];
    items.forEach(function(item) {
      entries.push(JSON.parse(item));
    });
    fn(null, entries);
  });
};

/**
 * Get the list's cardinality (the number of elements)
 *
 * @param  {Function} fn
 * @public
 */
Entry.count = function(fn) {
  client.llen('entries', fn);
};

module.exports = Entry;