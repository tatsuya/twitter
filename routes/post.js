var express = require('express');
var router = express.Router();

var validate = require('../lib/middleware/validate');

var Entry = require('../lib/entry');

router.get('/', function(req, res) {
  req.flash();
  res.render('post', { title: 'Post' });
});

module.exports = router;