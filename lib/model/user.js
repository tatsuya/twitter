'use strict';

var _ = require('underscore');
var async = require('async');
var bcrypt = require('bcrypt');
var url = require('url');
var redis = require('redis');
var client;
if (process.env.REDISTOGO_URL) {
  var rtg = url.parse(process.env.REDISTOGO_URL);
  client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(':')[1]);
} else {
  client = redis.createClient({host: 'redis'});
}

/**
 * User model. Each user entity should have the following fields:
 *
 * - id: unique user ID
 * - name: user name
 * - pass: user password
 * - fullname: user's full name
 *
 * @param {Object} obj - User object
 * @class
 */
function User(obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
}

/**
 * Create or update the user.
 *
 * @param {Function} fn - Callback function that is invoked with a possible
 * error argument
 * @public
 */
User.prototype.save = function(fn) {
  if (this.id) {
    // User already exists
    return this.update(fn);
  }
  var user = this;
  client.incr('user:ids', function(err, id) {
    if (err) {
      return fn(err);
    }
    user.id = id;
    user.hashPassword(function(err) {
      if (err) {
        return fn(err);
      }
      user.update(fn);
    });
  });
};

User.prototype.update = function(fn) {
  var user = this;
  User.setId(user.name, user.id, function(err) {
    if (err) {
      return fn(err);
    }
    User.set(user, fn);
  });
};

/**
 * Generate a hash and replace password with it.
 *
 * @param  {Function} fn - Callback function
 */
User.prototype.hashPassword = function(fn) {
  var user = this;
  // Generate a 12-character salt
  bcrypt.genSalt(12, function(err, salt) {
    if (err) {
      return fn(err);
    }
    user.salt = salt;
    bcrypt.hash(user.pass, salt, function(err, hash) {
      if (err) {
        return fn(err);
      }
      // Set hash so it'll be saved
      user.pass = hash;
      fn();
    });
  });
};

/**
 * Serialize object. If .toJSON() exists on an object, it will be used by
 * JSON.stringify calls to get the JSON format.
 *
 * @return {String} json
 */
User.prototype.toJSON = function() {
  return {
    id: this.id,
    name: this.name,
    fullname: this.fullname
  };
};

/**
 * Authenticate with a user name and password.
 *
 * The authentication logic begins by fetching the user by name. If the user
 * isn't found, the callback function is immediately invoked. Otherwise, the
 * user's stored salt and the password are hashed to produce what should be
 * identical to the stored hash.
 *
 * @param  {String} name - User name
 * @param  {String} pass - User's password
 * @param  {Function} fn - Callback function
 * @public
 */
User.authenticate = function(name, pass, fn) {
  User.getByName(name, function(err, user) {
    if (err) {
      return fn(err);
    }
    // When looking up a key that doesn't exist, Redis will give us an empty
    // hash, which is why the check for !user.id is used instead of !user.
    if (!user.id) {
      return fn();
    }
    // Hash the given password
    bcrypt.hash(pass, user.salt, function(err, hash) {
      if (err) {
        return fn(err);
      }
      if (hash === user.pass) {
        // Match found
        return fn(null, user);
      }
      // Invalid password
      fn();
    });
  });
};

/**
 * Look up user by name.
 *
 * @param  {String} name - User name
 * @param  {Function} fn - Callback function
 * @public
 */
User.getByName = function(name, fn) {
  User.getId(name, function(err, id) {
    if (err) {
      return fn(err);
    }
    User.get(id, fn);
  });
};

/**
 * Get ID indexed by name.
 *
 * @param  {String} name - User name
 * @param  {Function} fn - Callback function
 * @public
 */
User.getId = function(name, fn) {
  client.hget('users', name, fn);
};

/**
 * Index user ID by name.
 *
 * @param {String} name - User name
 * @param {String} id - User ID
 * @param {Function} fn - Callback function
 * @private
 */
User.setId = function(name, id, fn) {
  client.hset('users', name, id, fn);
};

/**
 * List user IDs.
 *
 * @param  {Function} fn - Callback gets two arguments `(err, userIds)`.
 * @private
 */
User.listIds = function(fn) {
  client.hvals('users', fn);
};

/**
 * Remove an index by name.
 *
 * @param  {String} name - User name
 * @param  {Function} fn
 * @public
 */
User.deleteId = function(name, fn) {
  client.hdel('users', name, fn);
};

/**
 * Fetch plain object hash and convert it to an User object.
 *
 * @param  {String} id - User ID
 * @param  {Function} fn - Callback function
 * @private
 */
User.get = function(id, fn) {
  client.hgetall('user:' + id, function(err, user) {
    if (err) {
      return fn(err);
    }
    fn(null, new User(user));
  });
};

/**
 * Save User object to redis hash store.
 *
 * @param {User} user - User object.
 * @param {Function} fn - Callback function
 * @private
 */
User.set = function(user, fn) {
  client.hmset('user:' + user.id, user, fn);
};

/**
 * Delete a user.
 *
 * @param  {String} id - User ID
 * @param  {Function} fn
 * @public
 */
User.delete = function(id, fn) {
  client.del('user:' + id, fn);
};

/**
 * Returns a list of suggested users.
 *
 * @param {String} id - User ID
 * @param {Number} limit - Maximum number of users to return.
 * @param {Function} fn - Callback gets two arguments `(err, users)` where
 * `users` is a list of suggested users.
 * @public
 */
User.getSuggestions = function(id, limit, fn) {
  User.listIds(function(err, ids) {
    if (err) {
      return fn(err);
    }
    User.listFollowingIds(id, function(err, followingIds) {
      if (err) {
        return fn(err);
      }
      followingIds.push(id);

      var suggestedIds = ids.filter(function(id) {
        return followingIds.indexOf(id) < 0;
      });
      if (limit) {
        suggestedIds = _.sample(suggestedIds, limit);
      } else {
        suggestedIds = _.shuffle(suggestedIds);
      }

      async.map(suggestedIds, User.get, fn);
    });
  });
};

/**
 * Follow an user.
 *
 * @param  {String} id - User ID
 * @param  {String} followerId - Follower's user ID
 * @param  {Function} fn - Callback
 * @public
 */
User.follow = function(id, followerId, timestamp, fn) {
  client.zadd('user:' + id + ':followers', timestamp, followerId, function(err) {
    if (err) {
      return fn(err);
    }
    client.zadd('user:' + followerId + ':followings', timestamp, id, fn);
  });
};

/**
 * Unfollow an user.
 *
 * @param  {String} id - User ID
 * @param  {String} followerId - Follower's user ID
 * @public
 */
User.unfollow = function(id, followerId, fn) {
  client.zrem('user:' + id + ':followers', followerId, function(err) {
    if (err) {
      return fn(err);
    }
    client.zrem('user:' + followerId + ':followings', id, fn);
  });
};

/**
 * List user's follower ids. If key does not exist then it returns empty array.
 *
 * @param  {String} id - User ID
 * @param  {Function} fn - Callback
 * @public
 */
User.listFollowerIds = function(id, fn) {
  client.zrange('user:' + id + ':followers', 0, -1, fn);
};

/**
 * List user's followers. If key does not exits then it returns empty array.
 *
 * @param  {String} id - User ID
 * @param  {Function} fn - Callback
 * @public
 */
User.listFollowers = function(id, fn) {
  User.listFollowerIds(id, function(err, ids) {
    if (err) {
      return fn(err);
    }
    async.map(ids, User.get, fn);
  });
};

// TODO: docs
User.countFollowers = function(id, fn) {
  client.zcard('user:' + id + ':followers', fn);
};

/**
 * List user's following ids. If key does not exist then it returns empty array.
 *
 * @param  {String} id - User ID
 * @param  {Function} fn - Callback
 * @private
 */
User.listFollowingIds = function(id, fn) {
  client.zrange('user:' + id + ':followings', 0, -1, fn);
};

/**
 * List user's followings. If key does not exist then it returns empty array.
 *
 * @param  {String} id - User ID
 * @param  {Function} fn - Callback
 * @public
 */
User.listFollowings = function(id, fn) {
  User.listFollowingIds(id, function(err, ids) {
    if (err) {
      return fn(err);
    }
    async.map(ids, User.get, fn);
  });
};

// TODO: docs
User.countFollowings = function(id, fn) {
  client.zcard('user:' + id + ':followings', fn);
};

module.exports = User;
