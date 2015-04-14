'use strict';

var auth = require('basic-auth');
var User = require('../user');

module.exports = function(req, res, next) {
  var credentials = auth(req);
  if (!credentials) {
    return unauthorized(res);
  }
  User.authenticate(credentials.name, credentials.pass, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return unauthorized(res);
    }
    req.user = req.remoteUser = user;
    next();
  });
};

/**
 * Respond with 401 "Unauthorized"
 *
 * @param  {Response} res
 * @private
 */
function unauthorized(res) {
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="shoutbox"');
  res.end('Unauthorized');
}
