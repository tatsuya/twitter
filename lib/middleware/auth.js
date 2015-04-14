'use strict';

var auth = require('basic-auth');

/**
 * Basic authentication middleware.
 *
 * Asynchronous callback verification, invoking `callback(user, pass, callback)`.
 *
 *   app.use(auth(function(user, pass, fn) {
 *     User.authenticate({ user: user, pass: pass }, fn);
 *   }));
 *
 * @param  {Function} callback
 * @param  {String} realm
 * @public
 */
module.exports = function(callback, realm) {
  realm = realm || 'Authorization Required';

  return function(req, res, next) {
    var credentials = auth(req);
    if (!credentials) {
      return unauthorized(res, realm);
    }
    callback(credentials.name, credentials.pass, function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return unauthorized(res, realm);
      }
      req.user = req.remoteUser = user;
      next();
    });
  };
};

/**
 * Respond with 401 "Unauthorized"
 *
 * @param  {Response} res
 * @param {String} realm
 * @private
 */
function unauthorized(res, realm) {
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="' + realm + '"');
  res.end('Unauthorized');
}
