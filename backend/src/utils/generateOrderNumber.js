const crypto = require('crypto');

function generateOrderNumber() {
  const random = crypto.randomInt(100000, 999999);
  return `ZD-${random}`;
}

module.exports = generateOrderNumber;
