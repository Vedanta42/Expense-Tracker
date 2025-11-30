const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';  // Match authController

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // Expect 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.userId = decoded.userId;  // Attach decoded userId to req
    next();
  });
};

module.exports = authenticateToken;