var User = require('../lib/model/user');

User.authenticate('Tobi', 'im not a ferret', function(err, user) {
  if (err) {
    throw err;
  }
  console.log(user);
  process.exit(0);
});