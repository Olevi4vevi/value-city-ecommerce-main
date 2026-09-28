const bcrypt = require('bcrypt');

const plainPassword = 'vc';

bcrypt.hash(plainPassword, 10).then(hash => {
  console.log(hash);
});