const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifies customer JWTs. Kept as a separate file from her middleware/auth.js
// (which checks admin tokens) so neither file overwrites the other.
function verifyCustomerToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.customer = decoded; // { user_id, email }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = verifyCustomerToken;
