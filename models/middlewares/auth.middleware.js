const passport = require('passport');

// Middleware to ensure authentication using JWT
const verifyToken = (req, res, next) => {
  // Extract Bearer Token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return res.status(500).json({ message: 'Internal server error', error: err });
    if (!user) return res.status(401).json({ message: 'Unauthorized', error: info });

    req.user = user; // Attach user object to request
    next();
  })(req, res, next);
};

// Middleware to check if user is an admin
const ensureAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admin access required' });
};

module.exports = { verifyToken, ensureAdmin };
