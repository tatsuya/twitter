var express = require('express');
var router = express.Router();

var User = require('../lib/user');

router.get('/', function(req, res) {
  res.render('register', { title: 'Register' });
});

router.post('/', function(req, res, next) {
  console.log(req.body);
  var data = req.body.user;
  User.getByName(data.name, function(err, user) {
    if (err) {
      return next(err);
    }

    if (user.id) {
      // A back redirection redirects the request back to the referer,
      // defaulting to / when the referer is missing.
      return res.redirect('back');
    }

    user = new User({
      name: data.name,
      pass: data.pass
    });

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.session.uid = user.id;
      res.redirect('/');
    });
  });
});

module.exports = router;