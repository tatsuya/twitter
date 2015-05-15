var User = require('../lib/model/user');

User.getByName('Tobi', function(err, user) {
  if (err) {
    throw err;
  }
  console.log(user);
  process.exit(0);
});