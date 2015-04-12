'use strict';

var redis = require('redis');
var client = redis.createClient();

function Entry(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

Entry.prototype.save = function(fn) {
  var json = JSON.stringify(this);
  client.lpush('entries', json, fn);
};

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

module.exports = Entry;