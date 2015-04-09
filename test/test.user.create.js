var User = require('../lib/user');

var tobi = new User({
  name: 'Tobi',
  pass: 'im a ferret',
  age: '2'
});

tobi.save(function(err) {
  if (err) {
    throw err;
  }
  console.log(tobi);
  process.exit(0);
});
