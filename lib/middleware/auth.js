'use strict';

var auth = require('basic-auth');

module.exports = function(req, res, next) {
  var credentials = auth(req);

  if (!credentials || credentials.name !== 'john' || credentials.pass !== 'secret') {
    res.writeHead(401, {
      'WWW-Authenticate': 'Basic realm="example"'
    });
    return res.end();
  }

  next();
};
