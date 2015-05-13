'use strict';

var express = require('express');
var router = express.Router();

router.post('/:name', function(req, res) {
  if (!res.locals.user) {
    return res.redirect('/login');
  }

  console.log(req.params.name);

  if (req.body._method === 'delete') {
    console.log(req.body._method);
  }

  res.redirect('back');
});

module.exports = router;