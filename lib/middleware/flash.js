'use strict';

module.exports = function() {
  return function(req, res, next) {
    var session = req.session;
    session.messages = session.messages || [];

    req.flash = function(type, message) {
      if (type && message) {
        session.messages.push({
          type: type,
          text: message
        });
      } else {
        res.locals.messages = session.messages;
        session.messages = [];
      }
    };

    next();
  };
};