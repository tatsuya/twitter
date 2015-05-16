'use strict';

var User = require('../model/user');

module.exports = function() {
  return function(req, res, next) {
    // auth.js middleware stores user data in a property of the request object:
    // req.remoteUser. Adding a check for this here makes the user-loading work
    // with the API.
    if (req.remoteUser) {
      res.locals.loginUser = req.remoteUser;
    }
    var uid = req.session.uid;
    if (!uid) {
      return next();
    }
    User.get(uid, function(err, user) {
      if (err) {
        return next();
      }
      req.loginUser = res.locals.loginUser = user;
      next();
    });
  };
};