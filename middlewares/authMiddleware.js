const passport = require('passport');
const tokenModel = require('../models/tokenModel');

// Middleware to ensure authentication using JWT
const verifyToken = async(req, res, next) => {
  // Extract Bearer Token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  passport.authenticate('jwt', { session: false },async (err, userId, info) => {
    if (err) return res.status(500).json({ message: 'Internal server error', error: err });
    if (!userId) return res.status(401).json({ message: 'Unauthorized', error: info });

    console.log('Token:', token);
    console.log('Token:', userId);
    // Check if token exists and is not blacklisted
    const tokenInDB = await tokenModel.findOne({
      user: userId, // 'sub' is standard for subject (userId)
      blacklisted: false,
      token: token
    }).populate('user', 'username email role'); // Populate userId with name, email, and role
    console.log(tokenInDB)
    if (!tokenInDB) {
      return res.status(401).json({ message: 'Token expired or invalid. Please login again.' });
    }

    req.user = tokenInDB.user; // Attach user object to request
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
