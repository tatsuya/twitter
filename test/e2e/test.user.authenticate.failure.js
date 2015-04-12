var User = require('../lib/user');

User.authenticate('Tobi', 'im not a ferret', function(err, user) {
  if (err) {
    throw err;
  }
  console.log(user);
  process.exit(0);
});